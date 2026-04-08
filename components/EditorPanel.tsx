import React, { useMemo } from 'react';
import { DiffLine, DiffType, Match, FoldableRange } from '../types';
import { findFoldableRanges } from '../utils/editor';

declare const Prism: any;

interface EditorPanelProps {
  id: string;
  title: string;
  onTitleChange: (newTitle: string) => void;
  text: string;
  onTextChange: (newText: string) => void;
  diffResult: DiffLine[] | null;
  scrollRef: (element: HTMLDivElement | null) => void;
  onScroll: (id: string, scrollTop: number, scrollLeft: number) => void;
  className?: string;
  matches: Match[];
  activeMatch?: Match;
  foldedLines: Set<number>;
  onToggleFold: (line: number) => void;
}

const getLineClass = (type: DiffType): string => {
  switch (type) {
    case DiffType.Added:
      return 'diff-added';
    case DiffType.Removed:
      return 'diff-removed';
    default:
      return '';
  }
};

const getLineSymbolClass = (type: DiffType): string => {
  switch (type) {
    case DiffType.Added:
      return 'text-[var(--color-diff-add-text)]';
    case DiffType.Removed:
      return 'text-[var(--color-diff-remove-text)]';
    default:
      return 'text-transparent';
  }
}

const getLanguageFromTitle = (title: string): string => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.endsWith('.tsx')) return 'tsx';
    if (lowerTitle.endsWith('.ts')) return 'typescript';
    if (lowerTitle.endsWith('.jsx')) return 'jsx';
    if (lowerTitle.endsWith('.js') || lowerTitle.endsWith('.mjs')) return 'javascript';
    if (lowerTitle.endsWith('.css')) return 'css';
    if (lowerTitle.endsWith('.html') || lowerTitle.endsWith('.xml') || lowerTitle.endsWith('.svg')) return 'markup';
    if (lowerTitle.endsWith('.json')) return 'json';
    return 'javascript'; // Default language
};

const HighlightOverlay: React.FC<{ 
    visibleLines: { line: DiffLine, originalIndex: number }[],
    lineStartOffsets: number[],
    matches: Match[], 
    activeMatch?: Match,
    diffToTextLineMap: Map<number, number>
}> = ({ visibleLines, lineStartOffsets, matches, activeMatch, diffToTextLineMap }) => {
    
    const matchesByTextLine = useMemo(() => {
        const map = new Map<number, Match[]>();
        if (matches.length === 0 || lineStartOffsets.length === 0) return map;

        const sortedMatches = [...matches].sort((a, b) => a.start - b.start);
        
        let lineIndex = 0;
        for (const match of sortedMatches) {
            while (lineIndex < lineStartOffsets.length - 1 && match.start >= lineStartOffsets[lineIndex + 1]) {
                lineIndex++;
            }
            if (!map.has(lineIndex)) {
                map.set(lineIndex, []);
            }
            map.get(lineIndex)!.push(match);
        }
        return map;
    }, [matches, lineStartOffsets]);

    return (
        <>
            {visibleLines.map(({ line, originalIndex }) => {
                const textLineIndex = diffToTextLineMap.get(originalIndex);
                if (textLineIndex === undefined) {
                    return <div key={originalIndex} className="h-6">&nbsp;</div>;
                }

                const lineMatches = matchesByTextLine.get(textLineIndex);
                if (!lineMatches || lineMatches.length === 0) {
                    return <div key={originalIndex} className="h-6">&nbsp;</div>;
                }
                
                const lineText = line.text;
                const lineStartOffset = lineStartOffsets[textLineIndex];
                const parts: React.ReactNode[] = [];
                let lastIndexInLine = 0;

                lineMatches.forEach((match, i) => {
                    const matchStartInLine = match.start - lineStartOffset;
                    const matchEndInLine = match.end - lineStartOffset;
                    
                    if (matchStartInLine > lastIndexInLine) {
                        parts.push(lineText.substring(lastIndexInLine, matchStartInLine));
                    }
                    
                    const isMatchActive = activeMatch?.start === match.start && activeMatch?.end === match.end;
                    parts.push(
                        <mark key={`${originalIndex}-${i}`} style={{
                            backgroundColor: isMatchActive ? 'var(--color-find-active-match-bg)' : 'var(--color-find-match-bg)',
                            borderRadius: '2px',
                        }}>
                            {lineText.substring(matchStartInLine, matchEndInLine)}
                        </mark>
                    );
                    lastIndexInLine = matchEndInLine;
                });

                if (lastIndexInLine < lineText.length) {
                    parts.push(lineText.substring(lastIndexInLine));
                }
                
                if (parts.length === 0 && lineText.length === 0) {
                    return <div key={originalIndex} className="h-6">&nbsp;</div>
                }

                return <div key={originalIndex} className="h-6">{parts}</div>;
            })}
        </>
    );
};

export const EditorPanel: React.FC<EditorPanelProps> = ({ 
  id,
  title, 
  onTitleChange, 
  text, 
  onTextChange, 
  diffResult, 
  scrollRef, 
  onScroll,
  className = '',
  matches,
  activeMatch,
  foldedLines,
  onToggleFold,
}) => {
  const language = getLanguageFromTitle(title);
  const isBasePanel = !diffResult;

  const foldableRanges = useMemo(() => findFoldableRanges(text), [text]);
  const foldableRangesByLine = useMemo(() => {
    const map = new Map<number, FoldableRange>();
    foldableRanges.forEach(range => map.set(range.startLine, range));
    return map;
  }, [foldableRanges]);
  
  const allLines = useMemo(() => diffResult || text.split('\n').map(line => ({ type: DiffType.Unchanged, text: line })), [diffResult, text]);
  
  const visibleLines = useMemo(() => {
    const visible: {line: DiffLine, originalIndex: number}[] = [];
    let i = 0;
    while (i < allLines.length) {
      const lineIndex = i + 1;
      visible.push({ line: allLines[i], originalIndex: i });
      if (foldedLines.has(lineIndex)) {
        const range = foldableRangesByLine.get(lineIndex);
        if (range) {
          i = range.endLine - 1;
        }
      }
      i++;
    }
    return visible;
  }, [allLines, foldedLines, foldableRangesByLine]);

  const lineNumbers = useMemo(() => {
    const baseNumbers: (number | null)[] = [];
    const currentNumbers: (number | null)[] = [];
    let baseLineNum = 0;
    let currentLineNum = 0;

    for (const line of allLines) {
        if (isBasePanel) {
            baseLineNum++;
            baseNumbers.push(baseLineNum);
            currentNumbers.push(null);
            continue;
        }
        const isAdded = line.type === DiffType.Added;
        const isRemoved = line.type === DiffType.Removed;
        const isUnchanged = line.type === DiffType.Unchanged;

        let nextBaseNum = null;
        let nextCurrentNum = null;
        if (isUnchanged || isRemoved) {
            baseLineNum++;
            nextBaseNum = baseLineNum;
        }
        if (isUnchanged || isAdded) {
            currentLineNum++;
            nextCurrentNum = currentLineNum;
        }
        baseNumbers.push(nextBaseNum);
        currentNumbers.push(nextCurrentNum);
    }
    return { baseNumbers, currentNumbers };
  }, [allLines, isBasePanel]);
  
  const diffToTextLineMap = useMemo(() => {
    const map = new Map<number, number>();
    if (isBasePanel) {
        allLines.forEach((_, i) => map.set(i, i));
    } else {
        let textLineIndex = 0;
        allLines.forEach((line, diffLineIndex) => {
            if (line.type !== DiffType.Removed) {
                map.set(diffLineIndex, textLineIndex);
                textLineIndex++;
            }
        });
    }
    return map;
  }, [allLines, isBasePanel]);
  
  const lineStartOffsets = useMemo(() => {
    const lines = text.split('\n');
    const offsets: number[] = [0];
    for (let i = 0; i < lines.length - 1; i++) {
      offsets.push(offsets[i] + lines[i].length + 1);
    }
    return offsets;
  }, [text]);

  const grammar = useMemo(() => (
    typeof Prism !== 'undefined' ? Prism.languages[language] : null
  ), [language]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    onScroll(id, e.currentTarget.scrollTop, e.currentTarget.scrollLeft);
  };

  const renderGutter = () => {
    return visibleLines.map(({line, originalIndex}) => {
      const lineNum = originalIndex + 1;
      const isFoldable = foldableRangesByLine.has(lineNum);
      const isFolded = foldedLines.has(lineNum);
      const symbol = line.type === DiffType.Added ? '+' : line.type === DiffType.Removed ? '-' : ' ';
      
      const baseNum = lineNumbers.baseNumbers[originalIndex];
      const currentNum = lineNumbers.currentNumbers[originalIndex];

      const range = foldableRangesByLine.get(lineNum);
      const foldedLineCount = range ? range.endLine - range.startLine - 1 : 0;

      return (
        <div key={originalIndex} className="flex h-6 text-right text-[var(--color-text-muted)] select-none">
          <div className="w-5 mr-2">
            {isFoldable ? (
              <button type="button" onClick={() => onToggleFold(lineNum)} className="w-full text-center hover:text-[var(--color-text-primary)]">
                {isFolded ? '▸' : '▾'}
              </button>
            ) : ' '}
          </div>
          <span className="w-8">{isBasePanel ? baseNum : (baseNum ?? '')}</span>
          <span className="w-8 ml-2">{isBasePanel ? '' : (currentNum ?? '')}</span>
          <span className={`w-4 ml-2 text-center ${isBasePanel ? 'text-transparent' : getLineSymbolClass(line.type)}`}>{isBasePanel ? ' ' : symbol}</span>
           {isFolded && (
             <div className="absolute left-5 right-0 mt-6 -ml-px">
                <button
                  type="button"
                  className="inline-block border rounded-full px-2 text-xs bg-[var(--color-bg-tertiary)] border-[var(--color-border)] cursor-pointer"
                  onClick={() => onToggleFold(lineNum)}
                  aria-label={`Expand ${foldedLineCount} folded lines`}
                >
                  ... {foldedLineCount} lines
                </button>
             </div>
           )}
        </div>
      );
    });
  }

  return (
    <div className={`relative flex flex-col bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg overflow-hidden h-full min-h-0 ${className}`}>
      <div className="bg-[var(--color-bg-tertiary)] px-4 py-2 text-[var(--color-text-primary)] flex-shrink-0 border-b border-[var(--color-border)]">
        <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-transparent font-semibold text-[var(--color-text-primary)] w-full border-none outline-none focus:ring-1 focus:ring-[var(--color-accent)] rounded-sm px-1 -mx-1"
            aria-label="Panel Title"
        />
      </div>
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto code-font text-sm leading-6"
      >
        <div className="relative grid grid-cols-[auto_1fr]">
          <div className="col-start-1 row-start-1 sticky left-0 z-30 p-2 pr-4 bg-[var(--color-bg-secondary)]">
            {renderGutter()}
          </div>

          <div className="col-start-2 row-start-1 grid">
            <textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              spellCheck="false"
              className="col-start-1 row-start-1 z-20 p-2 pb-24 bg-transparent text-transparent caret-[var(--color-caret)] resize-none border-none outline-none whitespace-pre"
              wrap="off"
              title="Editor text area"
              placeholder="Enter code here"
            />
          
            <div
              className="col-start-1 row-start-1 p-2 pb-24 whitespace-pre pointer-events-none"
              aria-hidden="true"
            >
              {visibleLines.map(({ line, originalIndex }) => {
                 let lineHtml: string;
                 if (line.type === DiffType.Removed) {
                   lineHtml = line.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                 } else if (grammar) {
                   lineHtml = Prism.highlight(line.text, grammar, language);
                 } else {
                   lineHtml = line.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                 }

                return (
                  <div key={originalIndex} className={`h-6 ${getLineClass(line.type)}`}>
                    <span dangerouslySetInnerHTML={{ __html: lineHtml || '&nbsp;' }} />
                  </div>
                );
              })}
            </div>
            
            <div
              className="col-start-1 row-start-1 z-10 p-2 pb-24 whitespace-pre pointer-events-none text-transparent"
              aria-hidden="true"
            >
              <HighlightOverlay 
                visibleLines={visibleLines}
                lineStartOffsets={lineStartOffsets}
                matches={matches} 
                activeMatch={activeMatch} 
                diffToTextLineMap={diffToTextLineMap}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
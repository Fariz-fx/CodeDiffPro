import React from 'react';
import { DiffLine, DiffType } from '../types';

declare const Prism: any;

interface EditorPanelProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  text: string;
  onTextChange: (newText: string) => void;
  diffResult: DiffLine[] | null;
  scrollRef: (element: HTMLDivElement | null) => void;
  onScroll: (scrollTop: number) => void;
  className?: string;
}

const getLineClass = (type: DiffType): string => {
  switch (type) {
    case DiffType.Added:
      return 'bg-green-500 bg-opacity-20';
    case DiffType.Removed:
      return 'bg-red-500 bg-opacity-20';
    default:
      return '';
  }
};

const getLineSymbolClass = (type: DiffType): string => {
  switch (type) {
    case DiffType.Added:
      return 'text-green-400';
    case DiffType.Removed:
      return 'text-red-400';
    default:
      return 'text-gray-600';
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

export const EditorPanel: React.FC<EditorPanelProps> = ({ 
  title, 
  onTitleChange, 
  text, 
  onTextChange, 
  diffResult, 
  scrollRef, 
  onScroll,
  className = ''
}) => {
  const language = getLanguageFromTitle(title);
  const isBasePanel = !diffResult;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    onScroll(e.currentTarget.scrollTop);
  };

  const renderContent = () => {
    const lines = diffResult || text.split('\n').map(line => ({ type: DiffType.Unchanged, text: line }));
    const grammar = typeof Prism !== 'undefined' ? Prism.languages[language] : null;

    let baseLineNum = 0;
    let currentLineNum = 0;

    return lines.map((line, i) => {
        const lineContent = line.text.length > 0 ? line.text : ' ';
        
        let highlightedHtml = lineContent.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (grammar) {
            highlightedHtml = Prism.highlight(lineContent, grammar, language);
        }

        const isAdded = line.type === DiffType.Added;
        const isRemoved = line.type === DiffType.Removed;
        const isUnchanged = line.type === DiffType.Unchanged;

        if (isBasePanel) {
            baseLineNum++;
        } else {
            if (isUnchanged || isRemoved) baseLineNum++;
            if (isUnchanged || isAdded) currentLineNum++;
        }
        
        const symbol = isAdded ? '+' : isRemoved ? '-' : ' ';

        return (
            <div key={i} className={`flex items-start min-h-[24px] ${getLineClass(line.type)}`}>
                <div className="flex-shrink-0 flex pr-4 text-gray-500 select-none">
                    <span className="w-8 text-right">
                        {isBasePanel ? baseLineNum : (isUnchanged || isRemoved ? baseLineNum : '')}
                    </span>
                    <span className="w-8 ml-2 text-right">
                        {isBasePanel ? '' : (isUnchanged || isAdded ? currentLineNum : '')}
                    </span>
                </div>
                <span className={`w-4 flex-shrink-0 text-center select-none ${isBasePanel ? 'text-gray-500' : getLineSymbolClass(line.type)}`}>
                    {isBasePanel ? '' : symbol}
                </span>
                <pre className="flex-grow m-0 p-0 bg-transparent" aria-hidden="true">
                    <code 
                        className={`language-${language}`} 
                        dangerouslySetInnerHTML={{ __html: highlightedHtml }} 
                    />
                </pre>
            </div>
        );
    });
  };

  return (
    <div className={`flex flex-col bg-gray-800 border border-gray-700 rounded-lg overflow-hidden h-full min-h-0 ${className}`}>
      <div className="bg-gray-700 px-4 py-2 text-white flex-shrink-0">
        <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-transparent font-semibold text-white w-full border-none outline-none focus:ring-1 focus:ring-cyan-500 rounded-sm px-1 -mx-1"
            aria-label="Panel Title"
        />
      </div>
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 code-font text-sm leading-6 overflow-auto"
      >
        <div className="absolute top-0 left-0 p-2 pl-4 w-full whitespace-pre pointer-events-none">
          {renderContent()}
        </div>
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          spellCheck="false"
          className="absolute top-0 left-0 block w-full h-full p-2 pr-2 pl-[8.5rem] bg-transparent text-transparent caret-white resize-none border-none outline-none code-font text-sm leading-6 whitespace-pre"
        />
      </div>
    </div>
  );
};
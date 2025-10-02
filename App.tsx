
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PanelData, DiffLine, ThreePanelLayout } from './types';
import { calculateDiff } from './utils/diff';
import { summarizeDifferences } from './services/geminiService';
import { Header } from './components/Header';
import { EditorPanel } from './components/EditorPanel';

const initialPanels: PanelData[] = [
    { id: crypto.randomUUID(), text: 'const Greeter = (name) => {\n  console.log("Hello, " + name);\n};\n\nGreeter("World");', title: 'Original JavaScript' },
    { id: crypto.randomUUID(), text: 'function Greeter(name) {\n  // A friendly greeting\n  console.log(`Hello, ${name}!`);\n}\n\nGreeter("Universe");\n', title: 'Refactored TypeScript' }
];

const App: React.FC = () => {
    const [panels, setPanels] = useState<PanelData[]>(initialPanels);
    const [diffResults, setDiffResults] = useState<(DiffLine[] | null)[]>([]);
    const [summary, setSummary] = useState<string>('');
    const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
    const [threePanelLayout, setThreePanelLayout] = useState<ThreePanelLayout>('stacked');

    const panelScrollRefs = useRef<(HTMLDivElement | null)[]>([]);
    const isSyncingScroll = useRef(false);

    useEffect(() => {
        if (panels.length < 2) {
            setDiffResults(panels.map(() => null));
            return;
        }
        const baseText = panels[0].text;
        const newDiffs = panels.map((panel, index) => {
            if (index === 0) return null; // Base panel has no diff against itself
            return calculateDiff(baseText, panel.text);
        });
        setDiffResults([null, ...newDiffs.slice(1)]);
    }, [panels]);

    const addPanel = () => {
        if (panels.length < 4) {
            const newPanel: PanelData = { 
                id: crypto.randomUUID(), 
                text: '', 
                title: `Comparison ${panels.length}` 
            };
            setPanels(prev => [...prev, newPanel]);
        }
    };

    const removePanel = () => {
        if (panels.length > 2) {
            setPanels(prev => prev.slice(0, -1));
            panelScrollRefs.current = panelScrollRefs.current.slice(0, -1);
        }
    };

    const updatePanelText = (id: string, newText: string) => {
        setPanels(prev => prev.map(p => (p.id === id ? { ...p, text: newText } : p)));
    };
    
    const updatePanelTitle = (id: string, newTitle: string) => {
        setPanels(prev => prev.map(p => (p.id === id ? { ...p, title: newTitle } : p)));
    };

    const handleSummarize = async () => {
        setIsSummarizing(true);
        setSummary('');
        const result = await summarizeDifferences(panels);
        setSummary(result);
        setIsSummarizing(false);
    };

    const handleScroll = useCallback((scrolledPanelIndex: number, scrollTop: number) => {
        if (isSyncingScroll.current) return;
        isSyncingScroll.current = true;
        
        panelScrollRefs.current.forEach((ref, index) => {
            if (ref && index !== scrolledPanelIndex) {
                ref.scrollTop = scrollTop;
            }
        });
        
        requestAnimationFrame(() => {
            isSyncingScroll.current = false;
        });
    }, []);

    const getGridClasses = (): string => {
        const count = panels.length;
        if (count <= 2) {
            return `grid grid-cols-1 md:grid-cols-${count} gap-4`;
        }
        if (count === 3) {
            return threePanelLayout === 'side-by-side' 
                ? 'grid grid-cols-1 md:grid-cols-3 gap-4' 
                : 'grid grid-cols-1 md:grid-cols-2 gap-4';
        }
        return 'grid grid-cols-1 md:grid-cols-2 gap-4';
    };

    const getPanelClasses = (index: number): string => {
        if (panels.length === 3 && threePanelLayout === 'stacked' && index === 2) {
            return 'md:col-span-2';
        }
        return '';
    };

    return (
        <div className="flex flex-col h-screen max-h-screen p-4 gap-4">
            <Header
                panelCount={panels.length}
                onAddPanel={addPanel}
                onRemovePanel={removePanel}
                onSummarize={handleSummarize}
                isSummarizing={isSummarizing}
                threePanelLayout={threePanelLayout}
                onToggleLayout={() => setThreePanelLayout(p => p === 'stacked' ? 'side-by-side' : 'stacked')}
            />
            <main className={`flex-1 ${getGridClasses()} min-h-0`}>
                {panels.map((panel, index) => (
                    <EditorPanel
                        key={panel.id}
                        className={getPanelClasses(index)}
                        title={panel.title}
                        onTitleChange={(newTitle) => updatePanelTitle(panel.id, newTitle)}
                        text={panel.text}
                        onTextChange={(newText) => updatePanelText(panel.id, newText)}
                        diffResult={diffResults[index] || null}
                        scrollRef={el => panelScrollRefs.current[index] = el}
                        onScroll={(scrollTop) => handleScroll(index, scrollTop)}
                    />
                ))}
            </main>
            {(isSummarizing || summary) && (
                <div className="flex-shrink-0 bg-gray-800 border border-gray-700 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-2 text-cyan-400">AI Summary of Differences</h3>
                    {isSummarizing ? (
                        <div className="flex items-center gap-2 text-gray-400">
                           <div className="w-4 h-4 border-2 border-t-transparent border-cyan-400 rounded-full animate-spin"></div>
                           <span>Analyzing changes...</span>
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-sm text-gray-300 whitespace-pre-wrap">{summary}</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default App;


import React, { useEffect } from 'react';

interface Shortcut {
  keys: string[];
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: ['?', '⌘ /'], description: 'Toggle this help menu' },
  { keys: ['⌘ F'], description: 'Toggle Find & Replace' },
  { keys: ['⌘ ⇧ S'], description: 'Trigger AI Summary' },
  { keys: ['⌘ ⌥ N'], description: 'Add a new panel' },
  { keys: ['⌘ ⌥ W'], description: 'Remove the last panel' },
];

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="px-2 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md">
    {children}
  </kbd>
);

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const getPlatformKeys = (keys: string[]) => {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    return keys.map(key => isMac ? key : key.replace('⌘', 'Ctrl').replace('⌥', 'Alt').replace('⇧', 'Shift'));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div 
        className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl w-full max-w-md p-6 border border-[var(--color-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="help-modal-title" className="text-xl font-bold text-[var(--color-text-primary)]">Keyboard Shortcuts</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <li key={index} className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {getPlatformKeys(shortcut.keys).map((key, i) => (
                  <React.Fragment key={i}>
                    <Kbd>{key}</Kbd>
                    {i < shortcut.keys.length - 1 && <span className="text-xs text-[var(--color-text-muted)]">or</span>}
                  </React.Fragment>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

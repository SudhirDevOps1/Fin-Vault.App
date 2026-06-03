import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') target.blur();
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowHelp(prev => !prev);
      }

      if (e.key === 'Escape') setShowHelp(false);

      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key.toLowerCase() === 'g') {
          const nextKeyHandler = (e2: KeyboardEvent) => {
            switch (e2.key.toLowerCase()) {
              case 'd': navigate('/'); break;
              case 't': navigate('/transactions'); break;
              case 'r': navigate('/reports'); break;
              case 's': navigate('/settings'); break;
              case 'm': navigate('/more'); break;
            }
            window.removeEventListener('keydown', nextKeyHandler);
          };
          window.addEventListener('keydown', nextKeyHandler, { once: true });
          setTimeout(() => window.removeEventListener('keydown', nextKeyHandler), 1000);
        }
        if (e.key.toLowerCase() === 'n') {
          window.dispatchEvent(new CustomEvent('shortcut:new-transaction'));
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('shortcut:search'));
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  return { showHelp, setShowHelp };
}

export function KeyboardShortcutsHelp({ show, onClose }: { show: boolean; onClose: () => void }) {
  if (!show) return null;

  const shortcuts = [
    { keys: ['G', 'D'], desc: 'Go to Dashboard' },
    { keys: ['G', 'T'], desc: 'Go to Transactions' },
    { keys: ['G', 'R'], desc: 'Go to Reports' },
    { keys: ['G', 'M'], desc: 'Go to More' },
    { keys: ['G', 'S'], desc: 'Go to Settings' },
    { keys: ['N'], desc: 'New Transaction' },
    { keys: ['Ctrl', 'K'], desc: 'Open Search' },
    { keys: ['?'], desc: 'Show this help' },
    { keys: ['Esc'], desc: 'Close modals' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <span className="text-xl">⌨️</span>
          </div>
          <div>
            <h2 className="font-bold text-lg">Keyboard Shortcuts</h2>
            <p className="text-xs text-zinc-500">Navigate faster</p>
          </div>
        </div>
        <div className="space-y-2">
          {shortcuts.map(s => (
            <div key={s.desc} className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <span className="text-sm">{s.desc}</span>
              <div className="flex gap-1">
                {s.keys.map((k, i) => (
                  <kbd key={i} className="px-2 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500 text-center mt-4">Press ? anytime to show this</p>
      </div>
    </div>
  );
}

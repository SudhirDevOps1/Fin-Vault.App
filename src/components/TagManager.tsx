import { useState, useMemo } from 'react';
import { Hash, X, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useTransactions } from '@/hooks/useTransactions';

interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
}

const TAGS_KEY = 'finvault_tags';

function getTags(): Tag[] {
  const stored = localStorage.getItem(TAGS_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch { return []; }
}

function saveTags(tags: Tag[]) {
  localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
}

function generateId() {
  return `tag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6'];

export function TagManager() {
  const [tags, setTags] = useState<Tag[]>(getTags());
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const { transactions } = useTransactions();
  const { addToast } = useToast();

  // Auto-compute tag counts from transaction descriptions (using #hashtags)
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(tx => {
      const matches = tx.description.match(/#[\w\u0900-\u097F]+/g);
      if (matches) {
        matches.forEach(tag => {
          const cleanTag = tag.toLowerCase();
          counts[cleanTag] = (counts[cleanTag] || 0) + 1;
        });
      }
    });
    return counts;
  }, [transactions]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const name = newName.startsWith('#') ? newName : `#${newName}`;
    if (tags.find(t => t.name.toLowerCase() === name.toLowerCase())) {
      addToast('warning', 'Tag already exists');
      return;
    }
    const tag: Tag = { id: generateId(), name, color: newColor, count: 0 };
    const updated = [...tags, tag];
    setTags(updated);
    saveTags(updated);
    setNewName('');
    addToast('success', 'Tag added');
  };

  const handleEdit = (id: string) => {
    const tag = tags.find(t => t.id === id);
    if (!tag) return;
    setNewName(tag.name);
    setNewColor(tag.color);
    setEditingId(id);
  };

  const handleUpdate = () => {
    if (!editingId || !newName.trim()) return;
    const name = newName.startsWith('#') ? newName : `#${newName}`;
    const updated = tags.map(t => t.id === editingId ? { ...t, name, color: newColor } : t);
    setTags(updated);
    saveTags(updated);
    setEditingId(null);
    setNewName('');
    addToast('success', 'Tag updated');
  };

  const handleDelete = (id: string) => {
    setTags(prev => prev.filter(t => t.id !== id));
    saveTags(tags.filter(t => t.id !== id));
    addToast('success', 'Tag deleted');
  };

  const autoTags = Object.entries(tagCounts).map(([name, count]) => ({
    id: `auto-${name}`,
    name,
    color: '#64748b',
    count,
  }));

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      >
        <div className="flex items-center gap-3">
          <Hash className="w-5 h-5 text-violet-600" />
          <div className="text-left">
            <p className="font-bold">Tags & Hashtags</p>
            <p className="text-xs text-zinc-500">{tags.length} custom • {autoTags.length} auto-detected</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {expanded && (
        <>
          {/* Add/Edit Form */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (editingId ? handleUpdate() : handleAdd())}
                placeholder="Tag name (e.g., vacation)"
                className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
              />
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700"
              >
                {editingId ? 'Update' : 'Add'}
              </button>
              {editingId && (
                <button onClick={() => { setEditingId(null); setNewName(''); }} className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-7 h-7 rounded-lg transition-all ${newColor === c ? 'ring-2 ring-offset-2 ring-zinc-900 dark:ring-white' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <p className="text-xs text-zinc-500">💡 Tip: Use #hashtags in your transaction descriptions to auto-categorize</p>
          </div>

          {/* Custom Tags */}
          {tags.length > 0 && (
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <h4 className="text-sm font-bold mb-3">Custom Tags</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <div
                    key={tag.id}
                    className="group flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    <Hash className="w-3 h-3" />
                    {tag.name}
                    <div className="flex items-center gap-0.5 ml-1">
                      <button onClick={() => handleEdit(tag.id)} className="p-0.5 rounded hover:bg-white/20">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDelete(tag.id)} className="p-0.5 rounded hover:bg-white/20">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auto-Detected Tags */}
          {autoTags.length > 0 && (
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <h4 className="text-sm font-bold mb-3">Auto-Detected from Descriptions</h4>
              <div className="flex flex-wrap gap-2">
                {autoTags.map(tag => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-1.5 pl-2.5 pr-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    <Hash className="w-3 h-3" />
                    {tag.name}
                    <span className="ml-1 text-[10px] text-zinc-500">{tag.count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

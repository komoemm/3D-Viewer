import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'W', desc: 'Activate Move / Translate Gizmo' },
    { key: 'E', desc: 'Activate Rotate Gizmo' },
    { key: 'R', desc: 'Activate Scale Gizmo' },
    { key: 'X', desc: 'Toggle World / Local Transform Space' },
    { key: 'Q / Esc', desc: 'Deselect active model / Hide gizmo' },
    { key: 'F', desc: 'Focus camera on selected model' },
    { key: 'Left Click', desc: 'Click any object in 3D scene to select it' },
    { key: 'Left Drag', desc: 'Orbit / Rotate 3D camera' },
    { key: 'Right Drag', desc: 'Pan / Translate 3D camera' },
    { key: 'Scroll Wheel', desc: 'Zoom in / out' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl p-5 border border-slate-700/80 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Keyboard className="w-4 h-4 text-blue-400" />
            <span>Keyboard & Mouse Shortcuts</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
            >
              <span className="text-slate-300">{item.desc}</span>
              <kbd className="px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-[11px] font-bold text-blue-400 shadow-sm shrink-0 ml-2">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Move, RotateCw, Maximize2, XCircle, Globe, Box } from 'lucide-react';
import { GizmoMode, TransformSpace } from '../types';

interface TransformHUDProps {
  mode: GizmoMode;
  space: TransformSpace;
  hasSelection: boolean;
  selectedModelName?: string;
  onSetMode: (mode: GizmoMode) => void;
  onToggleSpace: () => void;
  onDeselect: () => void;
}

export const TransformHUD: React.FC<TransformHUDProps> = ({
  mode,
  space,
  hasSelection,
  selectedModelName,
  onSetMode,
  onToggleSpace,
  onDeselect,
}) => {
  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-auto select-none">
      {/* Selected Model Tag (if selected) */}
      {hasSelection && selectedModelName && (
        <div className="px-3 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[11px] font-medium backdrop-blur-md shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
          <span className="truncate max-w-[220px]">{selectedModelName}</span>
        </div>
      )}

      {/* Main HUD Toolbar */}
      <div className="glass-panel p-1 rounded-2xl flex items-center gap-1 shadow-2xl border border-slate-700/80">
        {/* Deselect / Select Mode */}
        <button
          type="button"
          onClick={onDeselect}
          title="Deselect / Hide Gizmo (Esc / Q)"
          className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all ${
            !hasSelection || mode === null
              ? 'bg-slate-800 text-slate-300 border border-slate-600/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">None</span>
          <kbd className="px-1 py-0.5 text-[9px] bg-slate-950 rounded border border-slate-800 font-mono text-slate-400">
            Esc
          </kbd>
        </button>

        <div className="h-4 w-px bg-slate-700/80 mx-0.5" />

        {/* Translate / Move */}
        <button
          type="button"
          onClick={() => onSetMode('translate')}
          title="Translate / Move (W)"
          className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all ${
            hasSelection && mode === 'translate'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Move className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Move</span>
          <kbd className="px-1 py-0.5 text-[9px] bg-slate-950 rounded border border-slate-800 font-mono text-slate-400">
            W
          </kbd>
        </button>

        {/* Rotate */}
        <button
          type="button"
          onClick={() => onSetMode('rotate')}
          title="Rotate (E)"
          className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all ${
            hasSelection && mode === 'rotate'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Rotate</span>
          <kbd className="px-1 py-0.5 text-[9px] bg-slate-950 rounded border border-slate-800 font-mono text-slate-400">
            E
          </kbd>
        </button>

        {/* Scale */}
        <button
          type="button"
          onClick={() => onSetMode('scale')}
          title="Scale (R)"
          className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all ${
            hasSelection && mode === 'scale'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Scale</span>
          <kbd className="px-1 py-0.5 text-[9px] bg-slate-950 rounded border border-slate-800 font-mono text-slate-400">
            R
          </kbd>
        </button>

        <div className="h-4 w-px bg-slate-700/80 mx-0.5" />

        {/* Space Toggle: World / Local */}
        <button
          type="button"
          onClick={onToggleSpace}
          title={`Transform Space: ${space.toUpperCase()} (X to toggle)`}
          className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
        >
          {space === 'world' ? (
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Box className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="uppercase text-[11px] font-bold">{space}</span>
          <kbd className="px-1 py-0.5 text-[9px] bg-slate-950 rounded border border-slate-800 font-mono text-slate-400">
            X
          </kbd>
        </button>
      </div>
    </div>
  );
};

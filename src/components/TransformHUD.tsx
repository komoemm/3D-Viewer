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
    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-auto select-none">
      {/* Selected Model Tag (if selected) */}
      {hasSelection && selectedModelName && (
        <div className="px-3 py-0.5 rounded-full bg-[#ea7600]/20 border border-[#ea7600]/40 text-[#ffaa44] text-[11px] font-medium backdrop-blur-md shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ea7600] animate-ping"></span>
          <span className="truncate max-w-[220px]">{selectedModelName}</span>
        </div>
      )}

      {/* Main HUD Toolbar */}
      <div className="bg-[#242424]/95 p-1 rounded-xl flex items-center gap-1 shadow-2xl border border-[#383838] backdrop-blur-xl">
        {/* Deselect / Select Mode */}
        <button
          type="button"
          onClick={onDeselect}
          title="Select / Deselect (Q / Esc)"
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all ${
            !hasSelection || mode === null
              ? 'bg-[#333333] text-[#f0f0f0] border border-[#484848]'
              : 'text-[#a0a0a0] hover:text-[#ffffff] hover:bg-[#333333]'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Select</span>
          <kbd className="px-1 py-0.2 text-[9px] bg-[#1a1a1a] rounded border border-[#383838] font-mono text-[#888888]">
            Q
          </kbd>
        </button>

        <div className="h-4 w-px bg-[#383838] mx-0.5" />

        {/* Translate / Move */}
        <button
          type="button"
          onClick={() => onSetMode('translate')}
          title="Translate / Move (W)"
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all ${
            hasSelection && mode === 'translate'
              ? 'bg-[#ea7600] text-white shadow-md shadow-[#ea7600]/30 font-semibold'
              : 'text-[#c8c8c8] hover:text-white hover:bg-[#333333]'
          }`}
        >
          <Move className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Move</span>
          <kbd className="px-1 py-0.2 text-[9px] bg-[#1a1a1a] rounded border border-[#383838] font-mono text-[#888888]">
            W
          </kbd>
        </button>

        {/* Rotate */}
        <button
          type="button"
          onClick={() => onSetMode('rotate')}
          title="Rotate (E)"
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all ${
            hasSelection && mode === 'rotate'
              ? 'bg-[#ea7600] text-white shadow-md shadow-[#ea7600]/30 font-semibold'
              : 'text-[#c8c8c8] hover:text-white hover:bg-[#333333]'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Rotate</span>
          <kbd className="px-1 py-0.2 text-[9px] bg-[#1a1a1a] rounded border border-[#383838] font-mono text-[#888888]">
            E
          </kbd>
        </button>

        {/* Scale */}
        <button
          type="button"
          onClick={() => onSetMode('scale')}
          title="Scale (R)"
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all ${
            hasSelection && mode === 'scale'
              ? 'bg-[#ea7600] text-white shadow-md shadow-[#ea7600]/30 font-semibold'
              : 'text-[#c8c8c8] hover:text-white hover:bg-[#333333]'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Scale</span>
          <kbd className="px-1 py-0.2 text-[9px] bg-[#1a1a1a] rounded border border-[#383838] font-mono text-[#888888]">
            R
          </kbd>
        </button>

        <div className="h-4 w-px bg-[#383838] mx-0.5" />

        {/* Space Toggle: World / Local */}
        <button
          type="button"
          onClick={onToggleSpace}
          title={`Transform Space: ${space.toUpperCase()} (X to toggle)`}
          className="px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium text-[#c8c8c8] hover:text-white hover:bg-[#333333] transition-all"
        >
          {space === 'world' ? (
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Box className="w-3.5 h-3.5 text-[#ea7600]" />
          )}
          <span className="uppercase text-[11px] font-semibold">{space}</span>
          <kbd className="px-1 py-0.2 text-[9px] bg-[#1a1a1a] rounded border border-[#383838] font-mono text-[#888888]">
            X
          </kbd>
        </button>
      </div>
    </div>
  );
};

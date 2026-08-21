import React from 'react';
import { Camera, Focus } from 'lucide-react';
import { CameraView } from '../types';

interface CameraToolbarProps {
  onSetCameraView: (view: CameraView) => void;
  onFocusAll: () => void;
}

export const CameraToolbar: React.FC<CameraToolbarProps> = ({
  onSetCameraView,
  onFocusAll,
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 glass-panel rounded-2xl px-3 py-2 flex items-center gap-1.5 border border-slate-800 shadow-2xl pointer-events-auto">
      <span className="text-[11px] font-semibold text-slate-400 px-1 hidden md:flex items-center gap-1">
        <Camera className="w-3.5 h-3.5 text-blue-400" />
        <span>Camera:</span>
      </span>

      <button
        type="button"
        onClick={() => onSetCameraView('front')}
        className="glass-button text-xs px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white font-medium transition"
        title="Front View"
      >
        Front
      </button>

      <button
        type="button"
        onClick={() => onSetCameraView('back')}
        className="glass-button text-xs px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white font-medium transition"
        title="Back View"
      >
        Back
      </button>

      <button
        type="button"
        onClick={() => onSetCameraView('top')}
        className="glass-button text-xs px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white font-medium transition"
        title="Top View"
      >
        Top
      </button>

      <button
        type="button"
        onClick={() => onSetCameraView('isometric')}
        className="glass-button text-xs px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white font-medium transition"
        title="Isometric Angle"
      >
        Isometric
      </button>

      <div className="h-4 w-px bg-slate-700 mx-1" />

      <button
        type="button"
        onClick={onFocusAll}
        className="glass-button text-xs px-3 py-1.5 rounded-xl text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 transition"
        title="Frame / Focus All Scene Objects"
      >
        <Focus className="w-3.5 h-3.5" />
        <span>Focus All</span>
      </button>
    </div>
  );
};

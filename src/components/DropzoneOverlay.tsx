import React from 'react';
import { UploadCloud, FileCode2, Box } from 'lucide-react';

interface DropzoneOverlayProps {
  isDragging: boolean;
  modelCount: number;
  onOpenFileInput: () => void;
  onLoadDemo: () => void;
}

export const DropzoneOverlay: React.FC<DropzoneOverlayProps> = ({
  isDragging,
  modelCount,
  onOpenFileInput,
  onLoadDemo,
}) => {
  return (
    <>
      {/* Drag & Drop Visual Overlay */}
      <div
        className={`absolute inset-0 bg-slate-950/85 backdrop-blur-md z-40 flex flex-col items-center justify-center border-4 border-dashed border-blue-500/60 m-6 rounded-3xl transition-all duration-200 pointer-events-none ${
          isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="w-20 h-20 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 text-3xl animate-bounce border border-blue-500/40">
          <UploadCloud className="w-10 h-10" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center">
          Drop 3D Models Here (Multi-File Supported)
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mb-4 text-center">
          Compatible with .GLB, .GLTF, .FBX, .PLY, .SPZ, .OBJ, and .STL
        </p>
        <div className="flex flex-wrap gap-2 justify-center max-w-md">
          {['.GLB', '.GLTF', '.FBX', '.PLY', '.SPZ (Gaussian/Points)', '.OBJ', '.STL'].map(
            (fmt) => (
              <span
                key={fmt}
                className="px-2.5 py-1 bg-slate-900/90 border border-slate-700/80 rounded-lg text-xs text-blue-400 font-mono"
              >
                {fmt}
              </span>
            )
          )}
        </div>
      </div>

      {/* Empty State Banner (shown when 0 models in scene) */}
      {modelCount === 0 && !isDragging && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-6 text-center">
          <div className="glass-panel p-8 rounded-3xl max-w-md pointer-events-auto border border-slate-700/60 shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto text-2xl border border-blue-500/30 shadow-inner">
              <Box className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold text-white">No 3D Model Loaded</h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Drag and drop your 3D files anywhere on the screen, or choose a file from your computer.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={onOpenFileInput}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <FileCode2 className="w-4 h-4" />
                <span>Select 3D Files</span>
              </button>
              <button
                type="button"
                onClick={onLoadDemo}
                className="glass-button text-slate-200 hover:text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Box className="w-4 h-4 text-amber-400" />
                <span>Load Sample Object</span>
              </button>
            </div>

            <div className="pt-2 text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1.5 flex-wrap">
              <span>Supports:</span>
              <span className="text-blue-400">GLB</span>
              <span>•</span>
              <span className="text-blue-400">GLTF</span>
              <span>•</span>
              <span className="text-indigo-400">FBX</span>
              <span>•</span>
              <span className="text-emerald-400">PLY</span>
              <span>•</span>
              <span className="text-amber-400">SPZ</span>
              <span>•</span>
              <span className="text-cyan-400">OBJ</span>
              <span>•</span>
              <span className="text-purple-400">STL</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

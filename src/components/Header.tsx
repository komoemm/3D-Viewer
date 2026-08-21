import React, { useRef } from 'react';
import { Box, Upload, Sparkles, Camera, Maximize, Minimize, Keyboard } from 'lucide-react';

interface HeaderProps {
  onFilesSelected: (files: FileList | File[]) => void;
  onGenerateDemo: () => void;
  onTakeScreenshot: () => void;
  onToggleShortcuts: () => void;
  modelCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onFilesSelected,
  onGenerateDemo,
  onTakeScreenshot,
  onToggleShortcuts,
  modelCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset input value so same files can be re-opened if desired
      e.target.value = '';
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 glass-panel border-b border-slate-800/80">
      {/* Brand / Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/20">
          <Box className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm sm:text-base tracking-wide text-white">3D Studio Viewer</h1>
            {modelCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {modelCount} {modelCount === 1 ? 'Model' : 'Models'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Multi-Format 3D Web Inspector & Transform Studio
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf,.fbx,.ply,.spz,.obj,.stl"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="glass-button px-3.5 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 hover:border-blue-500 hover:text-blue-400 cursor-pointer shadow-sm"
          title="Open .glb, .gltf, .fbx, .ply, .spz, .obj, .stl files"
        >
          <Upload className="w-3.5 h-3.5 text-blue-400" />
          <span>Open 3D File(s)</span>
        </button>

        {/* Generate Demo Object */}
        <button
          type="button"
          onClick={onGenerateDemo}
          className="glass-button px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5"
          title="Generate Procedural Demo 3D Object"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Demo Object</span>
        </button>

        {/* Take Screenshot */}
        <button
          type="button"
          onClick={onTakeScreenshot}
          className="glass-button px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5"
          title="Capture High-Res PNG Screenshot"
        >
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Capture</span>
        </button>

        {/* Shortcuts Guide Button */}
        <button
          type="button"
          onClick={onToggleShortcuts}
          className="glass-button w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white"
          title="Keyboard Shortcuts Guide"
        >
          <Keyboard className="w-4 h-4 text-slate-400 hover:text-blue-400" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={handleFullscreen}
          className="glass-button w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Code2,
  Upload,
  Play,
  ArrowRightLeft,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Loader2,
  FileCode,
  CheckCircle2,
} from 'lucide-react';
import {
  SAMURAI_THREE_LIVE_EXAMPLE,
  TORUS_KNOT_THREE_LIVE_EXAMPLE,
} from '../utils/threeLiveLoader';

interface ThreeLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadThreeLive: (
    code: string,
    filename: string,
    convertToGLBAfter?: boolean
  ) => Promise<boolean>;
  onAddToast?: (message: string, type: 'info' | 'success' | 'error') => void;
}

export const ThreeLiveModal: React.FC<ThreeLiveModalProps> = ({
  isOpen,
  onClose,
  onLoadThreeLive,
  onAddToast,
}) => {
  const [code, setCode] = useState<string>(SAMURAI_THREE_LIVE_EXAMPLE);
  const [filename, setFilename] = useState<string>('samurai.html');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus textarea when modal opens & reset error state
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle file upload (.html, .txt, .js, .ts)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCode(text);
        if (onAddToast) {
          onAddToast(`Loaded file content from ${file.name}`, 'info');
        }
      }
    };
    reader.onerror = () => {
      setErrorMessage(`Failed to read file: ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Execution handler
  const handleExecute = async (convertToGLBAfter = false) => {
    if (!code.trim()) {
      setErrorMessage('Please paste or upload Three-Live code first.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const success = await onLoadThreeLive(code, filename, convertToGLBAfter);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to execute Three-Live code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="three-live-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl backdrop-blur-xl bg-neutral-900/95 border border-neutral-700/70 shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.txt,.js,.ts,text/html,text/plain,text/javascript,application/typescript"
          aria-label="Upload Three-Live code file"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 border border-white/20">
              <Code2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="three-live-modal-title" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Three-Live Code Runner</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  v1.3.2 Sandbox
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Run Google Three-Live scripts with globals <code className="text-blue-300 font-mono">THREE</code> and <code className="text-amber-300 font-mono">scene</code>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Three-Live modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Top Quick Actions Bar: Upload & Load Examples */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-750 text-slate-200 hover:text-white border border-neutral-700/80 flex items-center gap-1.5 transition active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                <span>Upload .html / .txt / .js / .ts</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCode(SAMURAI_THREE_LIVE_EXAMPLE);
                  setFilename('samurai-three-live.html');
                  setErrorMessage(null);
                  if (onAddToast) onAddToast('Loaded Samurai Three-Live Example', 'info');
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Load Example: Samurai</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCode(TORUS_KNOT_THREE_LIVE_EXAMPLE);
                  setFilename('torus-knot-three-live.html');
                  setErrorMessage(null);
                  if (onAddToast) onAddToast('Loaded Torus Knot Three-Live Example', 'info');
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 transition active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Load Example: Torus Knot</span>
              </button>
            </div>

            {/* External Playground Link */}
            <a
              href="https://google.github.io/three-live"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Three-Live Playground on GitHub (opens in new tab)"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 underline underline-offset-2 transition"
            >
              <span>Open Three-Live Playground</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>

          {/* Large Code Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <label htmlFor="three-live-code-textarea" className="font-semibold flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                <span>Three-Live Script / HTML Code</span>
                <span className="text-[11px] font-mono text-slate-500">({filename})</span>
              </label>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-400" aria-hidden="true" />
                  <span>Only paste code you trust.</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">{code.length} chars</span>
              </div>
            </div>

            <textarea
              id="three-live-code-textarea"
              ref={textareaRef}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Paste Three-Live code here... (<three-live> HTML or pure Three.js script with THREE and scene)"
              rows={14}
              spellCheck={false}
              aria-invalid={!!errorMessage}
              className="w-full font-mono text-xs p-3.5 rounded-2xl bg-neutral-950/90 border border-neutral-700/80 text-emerald-300 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-relaxed transition resize-y min-h-[240px] sm:min-h-[300px]"
            />
          </div>

          {/* Error Panel (friendly error message + line info) */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3.5 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-150"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1 flex-1">
                <div className="font-bold text-red-300">Three-Live Execution Failed</div>
                <div className="font-mono text-[11px] whitespace-pre-wrap break-all leading-normal bg-red-900/40 p-2 rounded-lg border border-red-500/30">
                  {errorMessage}
                </div>
                <div className="text-[11px] text-red-300/80">
                  Tip: Ensure code uses <code className="text-white">scene.add(mesh)</code>, avoids DOM/network APIs, and assigns animations to <code className="text-white">scene.userData.animate = (t) =&gt; &#123; ... &#125;</code>.
                </div>
              </div>
            </div>
          )}

          {/* Feature Highlights Note */}
          <div className="p-3 rounded-2xl bg-neutral-800/40 border border-neutral-800 text-[11px] text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>
              Supports <strong className="text-slate-200">&lt;three-live&gt;</strong> tags, pure Three.js statements, and dynamic animations via <code className="text-blue-300">scene.userData.animate(t)</code>.
            </span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 px-5 sm:px-6 py-4 border-t border-neutral-800 bg-neutral-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-neutral-800 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Cancel
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
            {/* Secondary Action: Load & Convert to GLB */}
            <button
              type="button"
              disabled={isLoading || !code.trim()}
              onClick={() => handleExecute(true)}
              aria-label="Validate, load into viewer, and open GLB converter"
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-amber-200 hover:text-amber-100 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>Load & Convert to GLB</span>
            </button>

            {/* Primary Action: Validate & Load into Viewer */}
            <button
              type="button"
              disabled={isLoading || !code.trim()}
              onClick={() => handleExecute(false)}
              aria-label="Validate and load Three-Live model into 3D viewer"
              className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>Validating & Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  <span>Validate & Load into Viewer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

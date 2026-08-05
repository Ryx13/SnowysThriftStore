import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { X, ZoomIn, Check } from 'lucide-react';

const PREVIEW_SIZE = 320;
const OUTPUT_SIZE = 900;

interface Props {
  file: File;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}

export default function ImageCropModal({ file, onCancel, onCropped }: Props) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleImgLoad() {
    if (!imgRef.current) return;
    setNaturalSize({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  const baseScale = naturalSize ? Math.max(PREVIEW_SIZE / naturalSize.w, PREVIEW_SIZE / naturalSize.h) : 1;
  const displayScale = baseScale * zoom;
  const displayW = naturalSize ? naturalSize.w * displayScale : 0;
  const displayH = naturalSize ? naturalSize.h * displayScale : 0;

  function clampPan(x: number, y: number, dW = displayW, dH = displayH) {
    const minX = Math.min(0, PREVIEW_SIZE - dW);
    const minY = Math.min(0, PREVIEW_SIZE - dH);
    return { x: Math.max(minX, Math.min(0, x)), y: Math.max(minY, Math.min(0, y)) };
  }

  function handlePointerDown(e: PointerEvent) {
    draggingRef.current = true;
    lastPointRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastPointRef.current.x;
    const dy = e.clientY - lastPointRef.current.y;
    lastPointRef.current = { x: e.clientX, y: e.clientY };
    setPan((prev) => clampPan(prev.x + dx, prev.y + dy));
  }

  function handlePointerUp() {
    draggingRef.current = false;
  }

  function handleZoomChange(newZoom: number) {
    setZoom(newZoom);
    setPan((prev) => {
      const newDisplayScale = baseScale * newZoom;
      const newDW = naturalSize ? naturalSize.w * newDisplayScale : 0;
      const newDH = naturalSize ? naturalSize.h * newDisplayScale : 0;
      return clampPan(prev.x, prev.y, newDW, newDH);
    });
  }

  function handleConfirm() {
    if (!naturalSize || !imgRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sourceX = -pan.x / displayScale;
    const sourceY = -pan.y / displayScale;
    const sourceSize = PREVIEW_SIZE / displayScale;

    ctx.drawImage(imgRef.current, sourceX, sourceY, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    canvas.toBlob((blob) => { if (blob) onCropped(blob); }, 'image/jpeg', 0.9);
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-sm">Adjust Photo</h3>
          <button onClick={onCancel}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          <div
            className="relative mx-auto overflow-hidden rounded-lg bg-gray-100 touch-none cursor-move select-none"
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {imgUrl && (
              <img
                ref={imgRef}
                src={imgUrl}
                onLoad={handleImgLoad}
                alt="crop preview"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: pan.x,
                  top: pan.y,
                  width: displayW || undefined,
                  height: displayH || undefined,
                  maxWidth: 'none',
                }}
              />
            )}
            <div className="absolute inset-0 border-2 border-white/70 pointer-events-none rounded-lg" />
          </div>

          <div className="flex items-center gap-3 mt-4">
            <ZoomIn className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="w-full accent-black"
            />
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-2">Drag to reposition · Slide to zoom</p>

          <div className="flex gap-2 mt-4">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-lg font-medium text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Skip Photo
            </button>
            <button
              onClick={handleConfirm}
              disabled={!naturalSize}
              className="flex-1 py-2.5 rounded-lg font-medium text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Use This Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
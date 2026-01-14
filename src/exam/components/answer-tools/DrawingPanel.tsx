/**
 * Drawing Panel (Inline)
 * Canvas-based drawing tool for exam diagrams
 *
 * TOOLS:
 * - Pen: Freehand drawing
 * - Eraser: Erase strokes
 * - Line: Straight line
 * - Arrow: Line with arrowhead
 * - Rectangle: Draw rectangles
 * - Circle: Draw circles/ellipses
 * - Text: Add text labels
 *
 * FEATURES:
 * - Multiple colors and brush sizes
 * - Undo/Redo
 * - Insert into Answer
 * - Download as PNG
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ChevronUp, ChevronDown, Pencil, Eraser, RotateCcw,
  Undo, Redo, Trash2, Download, Keyboard, FileInput,
  Minus, Square, Circle, ArrowRight, Type, MoveRight
} from 'lucide-react';

interface DrawingPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  initialData?: string;
  onDataChange: (data: string) => void;
  onInsertIntoAnswer?: (html: string) => void;
  width?: number;
  height?: number;
}

interface Point {
  x: number;
  y: number;
}

type Tool = 'pen' | 'eraser' | 'line' | 'arrow' | 'rectangle' | 'circle' | 'text';

const COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Orange', value: '#f97316' },
];

const BRUSH_SIZES = [
  { name: 'Fine', value: 2 },
  { name: 'Medium', value: 3 },
  { name: 'Thick', value: 5 },
  { name: 'Bold', value: 8 },
];

const DrawingPanel: React.FC<DrawingPanelProps> = ({
  isOpen,
  onToggle,
  initialData,
  onDataChange,
  onInsertIntoAnswer,
  width = 800,
  height = 400
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [canvasSize, setCanvasSize] = useState({ width, height });
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<Point | null>(null);

  const lastPoint = useRef<Point | null>(null);
  const startPoint = useRef<Point | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        saveToHistory();
      };
      img.src = initialData;
    } else {
      saveToHistory();
    }
  }, []);

  // Resize canvas
  useEffect(() => {
    if (!containerRef.current || !isOpen) return;

    const containerWidth = containerRef.current.clientWidth - 32;
    const newWidth = Math.min(containerWidth, width);
    const newHeight = Math.round((newWidth / width) * height);

    if (newWidth > 0 && newHeight > 0) {
      setCanvasSize({ width: newWidth, height: newHeight });
    }
  }, [isOpen, width, height]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(imageData);
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const exportData = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onDataChange(dataUrl);
  }, [onDataChange]);

  const handleStrokeEnd = useCallback(() => {
    saveToHistory();
    exportData();
  }, [saveToHistory, exportData]);

  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, []);

  // Draw freehand line
  const drawLine = useCallback((from: Point, to: Point, ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? brushSize * 4 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [color, brushSize, tool]);

  // Draw arrow
  const drawArrow = useCallback((from: Point, to: Point, ctx: CanvasRenderingContext2D) => {
    const headLength = 15;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.stroke();

    // Arrow head
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLength * Math.cos(angle - Math.PI / 6), to.y - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLength * Math.cos(angle + Math.PI / 6), to.y - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }, [color, brushSize]);

  // Draw rectangle
  const drawRectangle = useCallback((from: Point, to: Point, ctx: CanvasRenderingContext2D, fill: boolean = false) => {
    const w = to.x - from.x;
    const h = to.y - from.y;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    if (fill) {
      ctx.fillStyle = color + '20';
      ctx.fillRect(from.x, from.y, w, h);
    }
    ctx.strokeRect(from.x, from.y, w, h);
  }, [color, brushSize]);

  // Draw circle/ellipse
  const drawCircle = useCallback((from: Point, to: Point, ctx: CanvasRenderingContext2D) => {
    const radiusX = Math.abs(to.x - from.x) / 2;
    const radiusY = Math.abs(to.y - from.y) / 2;
    const centerX = from.x + (to.x - from.x) / 2;
    const centerY = from.y + (to.y - from.y) / 2;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.stroke();
  }, [color, brushSize]);

  // Draw preview shape
  const drawPreview = useCallback((from: Point, to: Point) => {
    const preview = previewCanvasRef.current;
    if (!preview) return;

    const ctx = preview.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, preview.width, preview.height);

    if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.stroke();
    } else if (tool === 'arrow') {
      drawArrow(from, to, ctx);
    } else if (tool === 'rectangle') {
      drawRectangle(from, to, ctx);
    } else if (tool === 'circle') {
      drawCircle(from, to, ctx);
    }
  }, [tool, color, brushSize, drawArrow, drawRectangle, drawCircle]);

  // Clear preview
  const clearPreview = useCallback(() => {
    const preview = previewCanvasRef.current;
    if (!preview) return;
    const ctx = preview.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, preview.width, preview.height);
  }, []);

  // Handle drawing start
  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getPoint(e);

    if (tool === 'text') {
      setTextPosition(point);
      return;
    }

    setIsDrawing(true);
    lastPoint.current = point;
    startPoint.current = point;
  }, [getPoint, tool]);

  // Handle drawing move
  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const currentPoint = getPoint(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pen' || tool === 'eraser') {
      if (lastPoint.current) {
        drawLine(lastPoint.current, currentPoint, ctx);
      }
      lastPoint.current = currentPoint;
    } else if (['line', 'arrow', 'rectangle', 'circle'].includes(tool)) {
      if (startPoint.current) {
        drawPreview(startPoint.current, currentPoint);
      }
    }
  }, [isDrawing, getPoint, tool, drawLine, drawPreview]);

  // Handle drawing end
  const handleEnd = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If it's a shape tool, draw the final shape
    if (['line', 'arrow', 'rectangle', 'circle'].includes(tool) && startPoint.current && e) {
      const endPoint = getPoint(e);
      clearPreview();

      if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPoint.current.x, startPoint.current.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.stroke();
      } else if (tool === 'arrow') {
        drawArrow(startPoint.current, endPoint, ctx);
      } else if (tool === 'rectangle') {
        drawRectangle(startPoint.current, endPoint, ctx);
      } else if (tool === 'circle') {
        drawCircle(startPoint.current, endPoint, ctx);
      }
    }

    setIsDrawing(false);
    lastPoint.current = null;
    startPoint.current = null;
    handleStrokeEnd();
  }, [isDrawing, tool, color, brushSize, getPoint, clearPreview, drawArrow, drawRectangle, drawCircle, handleStrokeEnd]);

  // Add text to canvas
  const handleAddText = useCallback(() => {
    if (!textPosition || !textInput.trim()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = `${brushSize * 5}px Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(textInput, textPosition.x, textPosition.y);

    setTextInput('');
    setTextPosition(null);
    handleStrokeEnd();
  }, [textPosition, textInput, color, brushSize, handleStrokeEnd]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const newIndex = historyIndex - 1;
      ctx.putImageData(history[newIndex], 0, 0);
      setHistoryIndex(newIndex);
      exportData();
    }
  }, [historyIndex, history, exportData]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const newIndex = historyIndex + 1;
      ctx.putImageData(history[newIndex], 0, 0);
      setHistoryIndex(newIndex);
      exportData();
    }
  }, [historyIndex, history, exportData]);

  // Clear canvas
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    handleStrokeEnd();
  }, [handleStrokeEnd]);

  // Download
  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  // Insert into answer
  const handleInsertIntoAnswer = useCallback(() => {
    if (!onInsertIntoAnswer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const html = `<img src="${dataUrl}" alt="Drawing" style="max-width: 100%; height: auto; margin: 8px 0; border: 1px solid #ccc; border-radius: 4px;" />`;
    onInsertIntoAnswer(html);
  }, [onInsertIntoAnswer]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (textPosition) return; // Don't handle shortcuts while typing text

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      } else {
        switch (e.key.toLowerCase()) {
          case 'p': setTool('pen'); break;
          case 'e': setTool('eraser'); break;
          case 'l': setTool('line'); break;
          case 'a': setTool('arrow'); break;
          case 'r': setTool('rectangle'); break;
          case 'c': setTool('circle'); break;
          case 't': setTool('text'); break;
        }
        if (e.key >= '1' && e.key <= '4') {
          setBrushSize(BRUSH_SIZES[parseInt(e.key) - 1]?.value || 3);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleUndo, handleRedo, textPosition]);

  const TOOLS: { key: Tool; icon: React.ElementType; label: string; shortcut: string }[] = [
    { key: 'pen', icon: Pencil, label: 'Pen', shortcut: 'P' },
    { key: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
    { key: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
    { key: 'arrow', icon: MoveRight, label: 'Arrow', shortcut: 'A' },
    { key: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
    { key: 'circle', icon: Circle, label: 'Circle', shortcut: 'C' },
    { key: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  ];

  return (
    <div className="border border-sky-200 dark:border-sky-800 rounded-xl overflow-hidden bg-sky-50/50 dark:bg-sky-900/10">
      {/* Toggle Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-sky-100/50 dark:hover:bg-sky-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="text-sky-600 dark:text-sky-400 text-sm font-medium">Drawing Canvas</span>
          <span className="text-xs px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">Shapes</span>
          {isOpen && <span className="text-xs text-sky-600/70 dark:text-sky-400/70 flex items-center gap-1"><Keyboard className="w-3 h-3" /> P/E/L/A/R/C/T</span>}
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-sky-600 dark:text-sky-400" /> : <ChevronDown className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
      </button>

      {isOpen && (
        <div ref={containerRef} className="p-4 bg-white dark:bg-gray-800 border-t border-sky-200 dark:border-sky-800">
          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {/* Tools */}
            <div className="flex items-center gap-1 border-r border-sky-200 dark:border-sky-700 pr-2">
              {TOOLS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTool(t.key)}
                  className={`p-1.5 rounded transition-colors ${tool === t.key ? 'bg-sky-500 text-white' : 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900/50'}`}
                  title={`${t.label} (${t.shortcut})`}
                >
                  <t.icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Colors */}
            {tool !== 'eraser' && (
              <div className="flex items-center gap-1 border-r border-sky-200 dark:border-sky-700 pr-2">
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${color === c.value ? 'scale-110 border-sky-500' : 'border-gray-300 dark:border-gray-600'}`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            )}

            {/* Brush Size */}
            <div className="flex items-center gap-1 border-r border-sky-200 dark:border-sky-700 pr-2">
              {BRUSH_SIZES.map((size, idx) => (
                <button
                  key={size.value}
                  onClick={() => setBrushSize(size.value)}
                  className={`w-7 h-7 rounded flex items-center justify-center ${brushSize === size.value ? 'bg-sky-500 text-white' : 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'}`}
                  title={`${size.name} (${idx + 1})`}
                >
                  <div className="rounded-full bg-current" style={{ width: size.value + 2, height: size.value + 2 }} />
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40" title="Undo (Ctrl+Z)"><Undo className="w-4 h-4" /></button>
              <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40" title="Redo"><Redo className="w-4 h-4" /></button>
              <button onClick={handleClear} className="p-1.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" title="Clear"><Trash2 className="w-4 h-4" /></button>
              <button onClick={handleDownload} className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300" title="Download"><Download className="w-4 h-4" /></button>
            </div>

            {/* Insert into Answer */}
            {onInsertIntoAnswer && (
              <button onClick={handleInsertIntoAnswer} className="flex items-center gap-1 px-2 py-1.5 text-xs rounded bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 ml-auto">
                <FileInput className="w-3 h-3" /> Insert into Answer
              </button>
            )}
          </div>

          {/* Text Input */}
          {textPosition && (
            <div className="mb-3 flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <Type className="w-4 h-4 text-yellow-600" />
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text..."
                className="flex-1 px-2 py-1 text-sm border border-yellow-300 dark:border-yellow-700 rounded bg-white dark:bg-gray-800"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddText(); if (e.key === 'Escape') setTextPosition(null); }}
              />
              <button onClick={handleAddText} className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600">Add</button>
              <button onClick={() => setTextPosition(null)} className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400">Cancel</button>
            </div>
          )}

          {/* Canvas */}
          <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className={`touch-none ${tool === 'text' ? 'cursor-text' : 'cursor-crosshair'}`}
              style={{ width: '100%', height: 'auto' }}
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={() => { if (isDrawing) handleEnd(); clearPreview(); }}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
            />
            {/* Preview canvas for shapes */}
            <canvas
              ref={previewCanvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>

          {/* Instructions */}
          <div className="mt-3 text-center">
            <p className="text-xs text-sky-600/70 dark:text-sky-400/70">
              Keys: P=Pen, E=Eraser, L=Line, A=Arrow, R=Rectangle, C=Circle, T=Text • Ctrl+Z=Undo
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawingPanel;

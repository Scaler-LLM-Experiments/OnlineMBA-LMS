/**
 * Rough Work Panel
 * Dedicated scratch work area for exam questions
 * Features: Drawing canvas, notepad, mini calculator
 * This is separate from the actual answer - just for rough calculations/sketches
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ChevronUp, ChevronDown, Pencil, Eraser, RotateCcw,
  Undo, Redo, Trash2, Calculator, FileText, Keyboard
} from 'lucide-react';

interface RoughWorkPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface Point {
  x: number;
  y: number;
}

const COLORS = [
  '#000000', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316'
];

const RoughWorkPanel: React.FC<RoughWorkPanelProps> = ({
  isOpen,
  onToggle
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<'draw' | 'notes' | 'calc'>('draw');

  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [drawHistory, setDrawHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const lastPoint = useRef<Point | null>(null);

  // Notes state
  const [notes, setNotes] = useState('');

  // Calculator state
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrev, setCalcPrev] = useState<string | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [calcReset, setCalcReset] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Only initialize if empty
    if (drawHistory.length === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setDrawHistory([imageData]);
      setHistoryIndex(0);
    }
  }, [isOpen]);

  // Drawing functions
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

  const drawLine = useCallback((from: Point, to: Point) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? brushSize * 4 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [color, brushSize, tool]);

  const saveDrawHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(imageData);
      return newHistory.slice(-30); // Keep last 30 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 29));
  }, [historyIndex]);

  const handleDrawStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPoint.current = getPoint(e);
  }, [getPoint]);

  const handleDrawMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const currentPoint = getPoint(e);
    if (lastPoint.current) {
      drawLine(lastPoint.current, currentPoint);
    }
    lastPoint.current = currentPoint;
  }, [isDrawing, getPoint, drawLine]);

  const handleDrawEnd = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPoint.current = null;
      saveDrawHistory();
    }
  }, [isDrawing, saveDrawHistory]);

  const handleDrawUndo = useCallback(() => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const newIndex = historyIndex - 1;
      ctx.putImageData(drawHistory[newIndex], 0, 0);
      setHistoryIndex(newIndex);
    }
  }, [historyIndex, drawHistory]);

  const handleDrawRedo = useCallback(() => {
    if (historyIndex < drawHistory.length - 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const newIndex = historyIndex + 1;
      ctx.putImageData(drawHistory[newIndex], 0, 0);
      setHistoryIndex(newIndex);
    }
  }, [historyIndex, drawHistory]);

  const handleDrawClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveDrawHistory();
  }, [saveDrawHistory]);

  // Calculator functions
  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleCalcNumber = useCallback((num: string) => {
    if (calcReset) {
      setCalcDisplay(num);
      setCalcReset(false);
    } else {
      setCalcDisplay(prev => prev === '0' ? num : prev + num);
    }
  }, [calcReset]);

  const handleCalcOp = useCallback((op: string) => {
    if (calcPrev && calcOp && !calcReset) {
      const result = calculate(parseFloat(calcPrev), parseFloat(calcDisplay), calcOp);
      setCalcDisplay(String(parseFloat(result.toPrecision(10))));
      setCalcPrev(String(result));
    } else {
      setCalcPrev(calcDisplay);
    }
    setCalcOp(op);
    setCalcReset(true);
  }, [calcDisplay, calcPrev, calcOp, calcReset]);

  const handleCalcEquals = useCallback(() => {
    if (calcPrev && calcOp) {
      const result = calculate(parseFloat(calcPrev), parseFloat(calcDisplay), calcOp);
      setCalcDisplay(String(parseFloat(result.toPrecision(10))));
      setCalcPrev(null);
      setCalcOp(null);
      setCalcReset(true);
    }
  }, [calcDisplay, calcPrev, calcOp]);

  const handleCalcClear = useCallback(() => {
    setCalcDisplay('0');
    setCalcPrev(null);
    setCalcOp(null);
    setCalcReset(false);
  }, []);

  const handleCalcDecimal = useCallback(() => {
    if (calcReset) {
      setCalcDisplay('0.');
      setCalcReset(false);
    } else if (!calcDisplay.includes('.')) {
      setCalcDisplay(prev => prev + '.');
    }
  }, [calcDisplay, calcReset]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab === 'draw') {
        if (e.key === 'p' || e.key === 'P') setTool('pen');
        else if (e.key === 'e' || e.key === 'E') setTool('eraser');
        else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) handleDrawRedo();
          else handleDrawUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, handleDrawUndo, handleDrawRedo]);

  return (
    <div className="border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden bg-amber-50/50 dark:bg-amber-900/10">
      {/* Toggle Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">
            Rough Work
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            Not part of answer
          </span>
          {isOpen && (
            <span className="text-xs text-amber-600/70 dark:text-amber-400/70 flex items-center gap-1">
              <Keyboard className="w-3 h-3" /> For scratch work only
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        )}
      </button>

      {/* Content */}
      {isOpen && (
        <div className="border-t border-amber-200 dark:border-amber-800">
          {/* Tabs */}
          <div className="flex border-b border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-800">
            <button
              onClick={() => setActiveTab('draw')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'draw'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-b-2 border-amber-500'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/10'
              }`}
            >
              <Pencil className="w-4 h-4" /> Draw
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'notes'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-b-2 border-amber-500'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/10'
              }`}
            >
              <FileText className="w-4 h-4" /> Notes
            </button>
            <button
              onClick={() => setActiveTab('calc')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'calc'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-b-2 border-amber-500'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/10'
              }`}
            >
              <Calculator className="w-4 h-4" /> Calc
            </button>
          </div>

          {/* Drawing Tab */}
          {activeTab === 'draw' && (
            <div className="p-3 bg-white dark:bg-gray-800">
              {/* Drawing Toolbar */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <button
                  onClick={() => setTool('pen')}
                  className={`p-1.5 rounded transition-colors ${
                    tool === 'pen'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  }`}
                  title="Pen (P)"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTool('eraser')}
                  className={`p-1.5 rounded transition-colors ${
                    tool === 'eraser'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  }`}
                  title="Eraser (E)"
                >
                  <Eraser className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-amber-200 dark:bg-amber-700 mx-1" />
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 rounded-full border-2 ${
                      color === c ? 'border-amber-500 scale-110' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <div className="w-px h-6 bg-amber-200 dark:bg-amber-700 mx-1" />
                <button
                  onClick={handleDrawUndo}
                  disabled={historyIndex <= 0}
                  className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDrawRedo}
                  disabled={historyIndex >= drawHistory.length - 1}
                  className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40"
                  title="Redo"
                >
                  <Redo className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDrawClear}
                  className="p-1.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  title="Clear"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Canvas */}
              <div className="border border-gray-300 dark:border-gray-600 rounded bg-white">
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={250}
                  className="cursor-crosshair touch-none w-full"
                  style={{ height: 'auto' }}
                  onMouseDown={handleDrawStart}
                  onMouseMove={handleDrawMove}
                  onMouseUp={handleDrawEnd}
                  onMouseLeave={handleDrawEnd}
                  onTouchStart={handleDrawStart}
                  onTouchMove={handleDrawMove}
                  onTouchEnd={handleDrawEnd}
                />
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="p-3 bg-white dark:bg-gray-800">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type your rough notes here... (not saved with answer)"
                className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {/* Calculator Tab */}
          {activeTab === 'calc' && (
            <div className="p-3 bg-white dark:bg-gray-800">
              {/* Display */}
              <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                {calcPrev && calcOp && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                    {calcPrev} {calcOp}
                  </div>
                )}
                <div className="text-2xl font-mono font-bold text-right text-gray-900 dark:text-white truncate">
                  {calcDisplay}
                </div>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {['C', '±', '%', '÷'].map(btn => (
                  <button
                    key={btn}
                    onClick={() => {
                      if (btn === 'C') handleCalcClear();
                      else if (btn === '±') setCalcDisplay(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
                      else if (btn === '%') setCalcDisplay(prev => String(parseFloat(prev) / 100));
                      else handleCalcOp(btn);
                    }}
                    className={`h-10 rounded-lg font-medium text-sm transition-colors ${
                      btn === 'C' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                      btn === '÷' ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200' :
                      'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {btn}
                  </button>
                ))}
                {['7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+'].map(btn => (
                  <button
                    key={btn}
                    onClick={() => {
                      if ('0123456789'.includes(btn)) handleCalcNumber(btn);
                      else handleCalcOp(btn);
                    }}
                    className={`h-10 rounded-lg font-medium text-sm transition-colors ${
                      '+-×'.includes(btn) ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {btn}
                  </button>
                ))}
                <button
                  onClick={() => handleCalcNumber('0')}
                  className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  0
                </button>
                <button
                  onClick={handleCalcDecimal}
                  className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  .
                </button>
                <button
                  onClick={() => setCalcDisplay(prev => prev.slice(0, -1) || '0')}
                  className="h-10 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm"
                >
                  ⌫
                </button>
                <button
                  onClick={handleCalcEquals}
                  className="h-10 rounded-lg bg-green-500 text-white font-medium text-sm hover:bg-green-600"
                >
                  =
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 text-center">
              This is scratch work only - not submitted with your answer
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoughWorkPanel;

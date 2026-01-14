/**
 * Scientific Calculator Panel (Side Panel)
 * Advanced calculator that appears on the right side
 * Features: Basic arithmetic + sin, cos, tan, log, ln, sqrt, powers, factorial, etc.
 * Keyboard support: 0-9, +, -, *, /, =, Enter, Escape, Backspace, C, s(sin), o(cos), t(tan), l(log), q(sqrt)
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, Delete, Keyboard } from 'lucide-react';

interface ScientificCalculatorPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScientificCalculatorPanel: React.FC<ScientificCalculatorPanelProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);
  const [isRadians, setIsRadians] = useState(true);
  const [memory, setMemory] = useState<number>(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleNumber = useCallback((num: string) => {
    if (shouldResetDisplay) {
      setDisplay(num);
      setShouldResetDisplay(false);
    } else {
      setDisplay(prev => prev === '0' ? num : prev + num);
    }
  }, [shouldResetDisplay]);

  const handleDecimal = useCallback(() => {
    if (shouldResetDisplay) {
      setDisplay('0.');
      setShouldResetDisplay(false);
    } else if (!display.includes('.')) {
      setDisplay(prev => prev + '.');
    }
  }, [display, shouldResetDisplay]);

  const handleOperation = useCallback((op: string) => {
    if (previousValue && operation && !shouldResetDisplay) {
      const result = calculate(parseFloat(previousValue), parseFloat(display), operation);
      setDisplay(String(result));
      setPreviousValue(String(result));
    } else {
      setPreviousValue(display);
    }
    setOperation(op);
    setShouldResetDisplay(true);
  }, [display, previousValue, operation, shouldResetDisplay]);

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : 0;
      case '%': return a % b;
      case '^': return Math.pow(a, b);
      default: return b;
    }
  };

  const handleEquals = useCallback(() => {
    if (previousValue && operation) {
      const result = calculate(parseFloat(previousValue), parseFloat(display), operation);
      const formattedResult = parseFloat(result.toPrecision(12));
      setDisplay(String(formattedResult));
      setPreviousValue(null);
      setOperation(null);
      setShouldResetDisplay(true);
    }
  }, [display, previousValue, operation]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setShouldResetDisplay(false);
  }, []);

  const handleBackspace = useCallback(() => {
    if (display.length === 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
    } else {
      setDisplay(prev => prev.slice(0, -1));
    }
  }, [display]);

  const handlePlusMinus = useCallback(() => {
    setDisplay(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
  }, []);

  // Scientific functions
  const toRadians = (deg: number) => isRadians ? deg : (deg * Math.PI / 180);
  const fromRadians = (rad: number) => isRadians ? rad : (rad * 180 / Math.PI);

  const handleScientific = useCallback((func: string) => {
    const value = parseFloat(display);
    let result: number;

    switch (func) {
      case 'sin':
        result = Math.sin(toRadians(value));
        break;
      case 'cos':
        result = Math.cos(toRadians(value));
        break;
      case 'tan':
        result = Math.tan(toRadians(value));
        break;
      case 'asin':
        result = fromRadians(Math.asin(value));
        break;
      case 'acos':
        result = fromRadians(Math.acos(value));
        break;
      case 'atan':
        result = fromRadians(Math.atan(value));
        break;
      case 'log':
        result = Math.log10(value);
        break;
      case 'ln':
        result = Math.log(value);
        break;
      case 'sqrt':
        result = Math.sqrt(value);
        break;
      case 'cbrt':
        result = Math.cbrt(value);
        break;
      case 'square':
        result = value * value;
        break;
      case 'cube':
        result = value * value * value;
        break;
      case '1/x':
        result = 1 / value;
        break;
      case 'exp':
        result = Math.exp(value);
        break;
      case 'abs':
        result = Math.abs(value);
        break;
      case '!':
        result = factorial(Math.floor(value));
        break;
      case 'pi':
        result = Math.PI;
        break;
      case 'e':
        result = Math.E;
        break;
      default:
        result = value;
    }

    const formattedResult = parseFloat(result.toPrecision(12));
    setDisplay(isNaN(formattedResult) || !isFinite(formattedResult) ? 'Error' : String(formattedResult));
    setShouldResetDisplay(true);
  }, [display, isRadians]);

  const factorial = (n: number): number => {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  };

  // Memory functions
  const handleMemory = useCallback((action: string) => {
    const value = parseFloat(display);
    switch (action) {
      case 'MC':
        setMemory(0);
        break;
      case 'MR':
        setDisplay(String(memory));
        setShouldResetDisplay(true);
        break;
      case 'M+':
        setMemory(prev => prev + value);
        setShouldResetDisplay(true);
        break;
      case 'M-':
        setMemory(prev => prev - value);
        setShouldResetDisplay(true);
        break;
    }
  }, [display, memory]);

  // Keyboard event handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for calculator keys
      const calcKeys = /^[0-9+\-*/.=%^]$/;
      const funcKeys = ['s', 'o', 't', 'l', 'n', 'q', 'p', 'e', 'r'];

      if (calcKeys.test(e.key) || e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Escape' ||
          e.key === 'c' || e.key === 'C' || funcKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      // Numbers
      if (/^[0-9]$/.test(e.key)) handleNumber(e.key);
      // Operators
      else if (e.key === '+') handleOperation('+');
      else if (e.key === '-') handleOperation('-');
      else if (e.key === '*') handleOperation('*');
      else if (e.key === '/') handleOperation('/');
      else if (e.key === '%') handleOperation('%');
      else if (e.key === '^') handleOperation('^');
      // Equals
      else if (e.key === '=' || e.key === 'Enter') handleEquals();
      // Decimal
      else if (e.key === '.') handleDecimal();
      // Clear
      else if (e.key === 'c' || e.key === 'C') handleClear();
      // Backspace
      else if (e.key === 'Backspace') handleBackspace();
      // Scientific functions
      else if (e.key === 's') handleScientific('sin');
      else if (e.key === 'o') handleScientific('cos');
      else if (e.key === 't') handleScientific('tan');
      else if (e.key === 'l') handleScientific('log');
      else if (e.key === 'n') handleScientific('ln');
      else if (e.key === 'q') handleScientific('sqrt');
      else if (e.key === 'p') handleScientific('pi');
      else if (e.key === 'r') setIsRadians(prev => !prev);
      // Escape to close
      else if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNumber, handleOperation, handleEquals, handleDecimal, handleClear, handleBackspace, handleScientific, onClose]);

  // Focus panel when opened
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const Button: React.FC<{
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
    title?: string;
    shortcut?: string;
  }> = ({ onClick, className = '', children, title, shortcut }) => (
    <button
      onClick={onClick}
      title={shortcut ? `${title || ''} (${shortcut})` : title}
      className={`w-full h-10 rounded-lg font-medium text-sm transition-all active:scale-95 ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-[100] flex flex-col border-l border-gray-200 dark:border-gray-700"
      style={{ animation: 'slideInRight 0.2s ease-out' }}
    >
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Scientific Calculator</h3>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Keyboard className="w-3 h-3" />
              <span>Keyboard enabled</span>
            </div>
          </div>
          <button
            onClick={() => setIsRadians(!isRadians)}
            className={`text-xs px-2 py-1 rounded ${
              isRadians
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
            }`}
            title="Toggle Radians/Degrees (R)"
          >
            {isRadians ? 'RAD' : 'DEG'}
          </button>
          {memory !== 0 && (
            <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              M
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Close (Esc)"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Display */}
      <div className="p-3 bg-gray-50 dark:bg-gray-900">
        <div className="text-right">
          {previousValue && operation && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {previousValue} {operation === '^' ? '^' : operation}
            </div>
          )}
          <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white truncate">
            {display}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="p-2 space-y-1.5 flex-1 overflow-y-auto">
        {/* Memory Row */}
        <div className="grid grid-cols-5 gap-1">
          <Button onClick={() => handleMemory('MC')} className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30" title="Memory Clear">MC</Button>
          <Button onClick={() => handleMemory('MR')} className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30" title="Memory Recall">MR</Button>
          <Button onClick={() => handleMemory('M+')} className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30" title="Memory Add">M+</Button>
          <Button onClick={() => handleMemory('M-')} className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30" title="Memory Subtract">M-</Button>
          <Button onClick={handleClear} className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50" shortcut="C">C</Button>
        </div>

        {/* Scientific Functions Row 1 */}
        <div className="grid grid-cols-5 gap-1">
          <Button onClick={() => handleScientific('sin')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Sine" shortcut="S">sin</Button>
          <Button onClick={() => handleScientific('cos')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Cosine" shortcut="O">cos</Button>
          <Button onClick={() => handleScientific('tan')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Tangent" shortcut="T">tan</Button>
          <Button onClick={() => handleScientific('log')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Log base 10" shortcut="L">log</Button>
          <Button onClick={() => handleScientific('ln')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Natural log" shortcut="N">ln</Button>
        </div>

        {/* Scientific Functions Row 2 */}
        <div className="grid grid-cols-5 gap-1">
          <Button onClick={() => handleScientific('asin')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Arc Sine">sin⁻¹</Button>
          <Button onClick={() => handleScientific('acos')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Arc Cosine">cos⁻¹</Button>
          <Button onClick={() => handleScientific('atan')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Arc Tangent">tan⁻¹</Button>
          <Button onClick={() => handleScientific('sqrt')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Square Root" shortcut="Q">√</Button>
          <Button onClick={() => handleScientific('cbrt')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Cube Root">∛</Button>
        </div>

        {/* Scientific Functions Row 3 */}
        <div className="grid grid-cols-5 gap-1">
          <Button onClick={() => handleScientific('square')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Square">x²</Button>
          <Button onClick={() => handleScientific('cube')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Cube">x³</Button>
          <Button onClick={() => handleOperation('^')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Power" shortcut="^">xʸ</Button>
          <Button onClick={() => handleScientific('exp')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="e to the power">eˣ</Button>
          <Button onClick={() => handleScientific('!')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Factorial">n!</Button>
        </div>

        {/* Constants & Basic Row */}
        <div className="grid grid-cols-5 gap-1">
          <Button onClick={() => handleScientific('pi')} className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30" title="Pi" shortcut="P">π</Button>
          <Button onClick={() => handleScientific('e')} className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30" title="Euler's number" shortcut="E">e</Button>
          <Button onClick={() => handleScientific('1/x')} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600" title="Reciprocal">1/x</Button>
          <Button onClick={() => handleScientific('abs')} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600" title="Absolute value">|x|</Button>
          <Button onClick={handleBackspace} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600" shortcut="Backspace">
            <Delete className="w-4 h-4 mx-auto" />
          </Button>
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-5 gap-1">
          <Button onClick={() => handleNumber('7')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="7">7</Button>
          <Button onClick={() => handleNumber('8')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="8">8</Button>
          <Button onClick={() => handleNumber('9')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="9">9</Button>
          <Button onClick={() => handleOperation('/')} className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50" shortcut="/">÷</Button>
          <Button onClick={() => handleOperation('%')} className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50" shortcut="%">%</Button>

          <Button onClick={() => handleNumber('4')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="4">4</Button>
          <Button onClick={() => handleNumber('5')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="5">5</Button>
          <Button onClick={() => handleNumber('6')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="6">6</Button>
          <Button onClick={() => handleOperation('*')} className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50" shortcut="*">×</Button>
          <Button onClick={() => handleOperation('-')} className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50" shortcut="-">−</Button>

          <Button onClick={() => handleNumber('1')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="1">1</Button>
          <Button onClick={() => handleNumber('2')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="2">2</Button>
          <Button onClick={() => handleNumber('3')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="3">3</Button>
          <Button onClick={() => handleOperation('+')} className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50" shortcut="+">+</Button>
          <Button onClick={handleEquals} className="row-span-2 bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-700 h-[calc(2*2.5rem+0.375rem)]" shortcut="Enter / =">=</Button>

          <Button onClick={() => handleNumber('0')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="0">0</Button>
          <Button onClick={handleDecimal} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut=".">.</Button>
          <Button onClick={handlePlusMinus} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">+/-</Button>
          <Button onClick={() => handleNumber('00')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">00</Button>
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="p-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Keys: 0-9, +-*/%, s(sin), o(cos), t(tan), l(log), q(sqrt), p(pi), r(rad/deg)
        </p>
      </div>
    </div>
  );
};

export default ScientificCalculatorPanel;

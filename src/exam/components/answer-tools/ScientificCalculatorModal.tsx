/**
 * Scientific Calculator Modal
 * Advanced calculator for exam use
 * Features: Basic arithmetic + sin, cos, tan, log, ln, sqrt, powers, factorial, etc.
 */

import React, { useState, useCallback } from 'react';
import { X, Delete } from 'lucide-react';

interface ScientificCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScientificCalculatorModal: React.FC<ScientificCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);
  const [isRadians, setIsRadians] = useState(true);
  const [memory, setMemory] = useState<number>(0);

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

  if (!isOpen) return null;

  const Button: React.FC<{
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
    title?: string;
  }> = ({ onClick, className = '', children, title }) => (
    <button
      onClick={onClick}
      title={title}
      className={`w-full h-11 rounded-lg font-medium text-sm transition-all active:scale-95 ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Scientific Calculator</h3>
            <button
              onClick={() => setIsRadians(!isRadians)}
              className={`text-xs px-2 py-1 rounded ${
                isRadians
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              }`}
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
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Display */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-right">
            {previousValue && operation && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {previousValue} {operation === '^' ? '^' : operation}
              </div>
            )}
            <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white truncate">
              {display}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-3 space-y-2">
          {/* Memory Row */}
          <div className="grid grid-cols-5 gap-1.5">
            <Button onClick={() => handleMemory('MC')} className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30" title="Memory Clear">MC</Button>
            <Button onClick={() => handleMemory('MR')} className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30" title="Memory Recall">MR</Button>
            <Button onClick={() => handleMemory('M+')} className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30" title="Memory Add">M+</Button>
            <Button onClick={() => handleMemory('M-')} className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30" title="Memory Subtract">M-</Button>
            <Button onClick={handleClear} className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50">C</Button>
          </div>

          {/* Scientific Functions Row 1 */}
          <div className="grid grid-cols-5 gap-1.5">
            <Button onClick={() => handleScientific('sin')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">sin</Button>
            <Button onClick={() => handleScientific('cos')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">cos</Button>
            <Button onClick={() => handleScientific('tan')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">tan</Button>
            <Button onClick={() => handleScientific('log')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">log</Button>
            <Button onClick={() => handleScientific('ln')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">ln</Button>
          </div>

          {/* Scientific Functions Row 2 */}
          <div className="grid grid-cols-5 gap-1.5">
            <Button onClick={() => handleScientific('asin')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Arc Sine">sin⁻¹</Button>
            <Button onClick={() => handleScientific('acos')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Arc Cosine">cos⁻¹</Button>
            <Button onClick={() => handleScientific('atan')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Arc Tangent">tan⁻¹</Button>
            <Button onClick={() => handleScientific('sqrt')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">√</Button>
            <Button onClick={() => handleScientific('cbrt')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">∛</Button>
          </div>

          {/* Scientific Functions Row 3 */}
          <div className="grid grid-cols-5 gap-1.5">
            <Button onClick={() => handleScientific('square')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">x²</Button>
            <Button onClick={() => handleScientific('cube')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">x³</Button>
            <Button onClick={() => handleOperation('^')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">xʸ</Button>
            <Button onClick={() => handleScientific('exp')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">eˣ</Button>
            <Button onClick={() => handleScientific('!')} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">n!</Button>
          </div>

          {/* Constants & Basic Row */}
          <div className="grid grid-cols-5 gap-1.5">
            <Button onClick={() => handleScientific('pi')} className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30">π</Button>
            <Button onClick={() => handleScientific('e')} className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30">e</Button>
            <Button onClick={() => handleScientific('1/x')} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">1/x</Button>
            <Button onClick={() => handleScientific('abs')} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">|x|</Button>
            <Button onClick={handleBackspace} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
              <Delete className="w-4 h-4 mx-auto" />
            </Button>
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-5 gap-1.5">
            <Button onClick={() => handleNumber('7')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">7</Button>
            <Button onClick={() => handleNumber('8')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">8</Button>
            <Button onClick={() => handleNumber('9')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">9</Button>
            <Button onClick={() => handleOperation('/')} className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50">÷</Button>
            <Button onClick={() => handleOperation('%')} className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50">%</Button>

            <Button onClick={() => handleNumber('4')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">4</Button>
            <Button onClick={() => handleNumber('5')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">5</Button>
            <Button onClick={() => handleNumber('6')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">6</Button>
            <Button onClick={() => handleOperation('*')} className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50">×</Button>
            <Button onClick={() => handleOperation('-')} className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50">−</Button>

            <Button onClick={() => handleNumber('1')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">1</Button>
            <Button onClick={() => handleNumber('2')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">2</Button>
            <Button onClick={() => handleNumber('3')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">3</Button>
            <Button onClick={() => handleOperation('+')} className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50">+</Button>
            <Button onClick={handleEquals} className="row-span-2 bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-700 h-[calc(2*2.75rem+0.375rem)]">=</Button>

            <Button onClick={() => handleNumber('0')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">0</Button>
            <Button onClick={handleDecimal} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">.</Button>
            <Button onClick={handlePlusMinus} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">+/-</Button>
            <Button onClick={() => handleNumber('00')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">00</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScientificCalculatorModal;

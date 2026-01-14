/**
 * Basic Calculator Modal
 * Standard arithmetic calculator for exam use
 * Features: +, -, *, /, %, decimal, clear, backspace
 */

import React, { useState, useCallback } from 'react';
import { X, Delete } from 'lucide-react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

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
      // Chain operations
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
      default: return b;
    }
  };

  const handleEquals = useCallback(() => {
    if (previousValue && operation) {
      const result = calculate(parseFloat(previousValue), parseFloat(display), operation);
      // Format result to avoid floating point issues
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

  if (!isOpen) return null;

  const Button: React.FC<{
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
  }> = ({ onClick, className = '', children }) => (
    <button
      onClick={onClick}
      className={`w-full h-14 rounded-xl font-medium text-lg transition-all active:scale-95 ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Calculator</h3>
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
                {previousValue} {operation}
              </div>
            )}
            <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white truncate">
              {display}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-3 grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <Button
            onClick={handleClear}
            className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
          >
            C
          </Button>
          <Button
            onClick={handlePlusMinus}
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            +/-
          </Button>
          <Button
            onClick={() => handleOperation('%')}
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            %
          </Button>
          <Button
            onClick={() => handleOperation('/')}
            className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
          >
            ÷
          </Button>

          {/* Row 2 */}
          <Button onClick={() => handleNumber('7')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">7</Button>
          <Button onClick={() => handleNumber('8')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">8</Button>
          <Button onClick={() => handleNumber('9')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">9</Button>
          <Button
            onClick={() => handleOperation('*')}
            className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
          >
            ×
          </Button>

          {/* Row 3 */}
          <Button onClick={() => handleNumber('4')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">4</Button>
          <Button onClick={() => handleNumber('5')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">5</Button>
          <Button onClick={() => handleNumber('6')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">6</Button>
          <Button
            onClick={() => handleOperation('-')}
            className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
          >
            −
          </Button>

          {/* Row 4 */}
          <Button onClick={() => handleNumber('1')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">1</Button>
          <Button onClick={() => handleNumber('2')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">2</Button>
          <Button onClick={() => handleNumber('3')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">3</Button>
          <Button
            onClick={() => handleOperation('+')}
            className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
          >
            +
          </Button>

          {/* Row 5 */}
          <Button onClick={() => handleNumber('0')} className="col-span-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">0</Button>
          <Button onClick={handleDecimal} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">.</Button>
          <Button
            onClick={handleBackspace}
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <Delete className="w-5 h-5 mx-auto" />
          </Button>
          <Button
            onClick={handleEquals}
            className="bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-700"
          >
            =
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;

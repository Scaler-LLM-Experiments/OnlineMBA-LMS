/**
 * Calculator Panel (Side Panel)
 * Standard arithmetic calculator that appears on the right side
 * Features: +, -, *, /, %, decimal, clear, backspace
 * Keyboard support: 0-9, +, -, *, /, =, Enter, Escape, Backspace, C
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, Delete, Keyboard } from 'lucide-react';

interface CalculatorPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalculatorPanel: React.FC<CalculatorPanelProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);
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

  // Keyboard event handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for calculator keys to avoid conflicts
      if (/^[0-9+\-*/.=%]$/.test(e.key) || e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
      }

      // Numbers
      if (/^[0-9]$/.test(e.key)) {
        handleNumber(e.key);
      }
      // Operators
      else if (e.key === '+') handleOperation('+');
      else if (e.key === '-') handleOperation('-');
      else if (e.key === '*') handleOperation('*');
      else if (e.key === '/') handleOperation('/');
      else if (e.key === '%') handleOperation('%');
      // Equals
      else if (e.key === '=' || e.key === 'Enter') handleEquals();
      // Decimal
      else if (e.key === '.') handleDecimal();
      // Clear
      else if (e.key === 'c' || e.key === 'C') handleClear();
      // Backspace
      else if (e.key === 'Backspace') handleBackspace();
      // Escape to close
      else if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNumber, handleOperation, handleEquals, handleDecimal, handleClear, handleBackspace, onClose]);

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
    shortcut?: string;
  }> = ({ onClick, className = '', children, shortcut }) => (
    <button
      onClick={onClick}
      title={shortcut ? `Keyboard: ${shortcut}` : undefined}
      className={`w-full h-12 rounded-xl font-medium text-base transition-all active:scale-95 ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-[100] flex flex-col border-l border-gray-200 dark:border-gray-700 animate-slide-in-right"
      style={{ animation: 'slideInRight 0.2s ease-out' }}
    >
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Calculator</h3>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <Keyboard className="w-3 h-3" />
            <span>Keyboard enabled</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Close (Esc)"
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
      <div className="p-3 grid grid-cols-4 gap-2 flex-1">
        {/* Row 1 */}
        <Button
          onClick={handleClear}
          className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
          shortcut="C"
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
          shortcut="%"
        >
          %
        </Button>
        <Button
          onClick={() => handleOperation('/')}
          className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
          shortcut="/"
        >
          ÷
        </Button>

        {/* Row 2 */}
        <Button onClick={() => handleNumber('7')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="7">7</Button>
        <Button onClick={() => handleNumber('8')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="8">8</Button>
        <Button onClick={() => handleNumber('9')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="9">9</Button>
        <Button
          onClick={() => handleOperation('*')}
          className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
          shortcut="*"
        >
          ×
        </Button>

        {/* Row 3 */}
        <Button onClick={() => handleNumber('4')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="4">4</Button>
        <Button onClick={() => handleNumber('5')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="5">5</Button>
        <Button onClick={() => handleNumber('6')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="6">6</Button>
        <Button
          onClick={() => handleOperation('-')}
          className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
          shortcut="-"
        >
          −
        </Button>

        {/* Row 4 */}
        <Button onClick={() => handleNumber('1')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="1">1</Button>
        <Button onClick={() => handleNumber('2')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="2">2</Button>
        <Button onClick={() => handleNumber('3')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="3">3</Button>
        <Button
          onClick={() => handleOperation('+')}
          className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
          shortcut="+"
        >
          +
        </Button>

        {/* Row 5 */}
        <Button onClick={() => handleNumber('0')} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut="0">0</Button>
        <Button onClick={handleDecimal} className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" shortcut=".">.</Button>
        <Button
          onClick={handleBackspace}
          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          shortcut="Backspace"
        >
          <Delete className="w-5 h-5 mx-auto" />
        </Button>
        <Button
          onClick={handleEquals}
          className="bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-700"
          shortcut="Enter / ="
        >
          =
        </Button>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Use keyboard: 0-9, +, -, *, /, =, Enter, C, Esc
        </p>
      </div>
    </div>
  );
};

export default CalculatorPanel;

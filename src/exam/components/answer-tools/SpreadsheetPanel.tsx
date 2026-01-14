/**
 * Spreadsheet Panel (Inline)
 * Excel-like spreadsheet with comprehensive formula support
 *
 * FORMULAS SUPPORTED:
 * Basic: =A1+B1, =SUM(), =AVERAGE(), =MIN(), =MAX(), =COUNT()
 * Statistical: =STDEV(), =VAR(), =MEDIAN()
 * Financial: =NPV(), =PV(), =FV(), =PMT(), =CAGR()
 * Math: =ABS(), =ROUND(), =POWER(), =SQRT(), =LOG(), =LN()
 * Logical: =IF()
 *
 * Keyboard: Arrow keys to navigate, Enter to edit, Tab to move, = to start formula
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Plus, Minus, RotateCcw, ChevronUp, ChevronDown, Keyboard, FileInput, HelpCircle } from 'lucide-react';

interface SpreadsheetPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  initialData?: (string | number | null)[][];
  onDataChange: (data: (string | number | null)[][]) => void;
  onInsertIntoAnswer?: (html: string) => void;
  rows?: number;
  cols?: number;
}

// Cell reference regex
const CELL_REF_REGEX = /\$?([A-Z]+)\$?(\d+)/gi;

const colLetterToIndex = (letters: string): number => {
  let index = 0;
  for (let i = 0; i < letters.length; i++) {
    index = index * 26 + (letters.charCodeAt(i) - 64);
  }
  return index - 1;
};

const parseCellRef = (ref: string): { row: number; col: number } | null => {
  const match = ref.match(/^\$?([A-Z]+)\$?(\d+)$/i);
  if (!match) return null;
  return {
    col: colLetterToIndex(match[1].toUpperCase()),
    row: parseInt(match[2], 10) - 1
  };
};

const parseRange = (range: string): { row: number; col: number }[] => {
  const [start, end] = range.split(':');
  const startCell = parseCellRef(start);
  const endCell = parseCellRef(end);
  if (!startCell || !endCell) return [];

  const cells: { row: number; col: number }[] = [];
  for (let r = Math.min(startCell.row, endCell.row); r <= Math.max(startCell.row, endCell.row); r++) {
    for (let c = Math.min(startCell.col, endCell.col); c <= Math.max(startCell.col, endCell.col); c++) {
      cells.push({ row: r, col: c });
    }
  }
  return cells;
};

const getNumericValue = (value: string | number | null): number => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// Helper function to get values from a range
const getRangeValues = (
  range: string,
  data: (string | number | null)[][],
  evaluateFormula: (f: string, d: (string | number | null)[][], v: Set<string>) => number | string,
  visited: Set<string>,
  cellKey: string
): number[] => {
  const cells = parseRange(range);
  return cells.map(cell => {
    const val = data[cell.row]?.[cell.col];
    if (typeof val === 'string' && val.startsWith('=')) {
      const evaluated = evaluateFormula(val, data, new Set(visited).add(cellKey));
      return typeof evaluated === 'number' ? evaluated : 0;
    }
    return getNumericValue(val);
  });
};

const SpreadsheetPanel: React.FC<SpreadsheetPanelProps> = ({
  isOpen,
  onToggle,
  initialData,
  onDataChange,
  onInsertIntoAnswer,
  rows = 10,
  cols = 6
}) => {
  const [rawData, setRawData] = useState<(string | number | null)[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setRawData(initialData);
    } else {
      const emptyData: (string | number | null)[][] = [];
      for (let i = 0; i < rows; i++) {
        emptyData.push(new Array(cols).fill(null));
      }
      setRawData(emptyData);
    }
  }, [initialData, rows, cols]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Comprehensive formula evaluation
  const evaluateFormula = useCallback((formula: string, data: (string | number | null)[][], visited: Set<string> = new Set()): number | string => {
    if (!formula.startsWith('=')) {
      const num = parseFloat(formula);
      return isNaN(num) ? formula : num;
    }

    const expr = formula.slice(1).toUpperCase();
    const cellKey = `${editingCell?.row},${editingCell?.col}`;
    if (visited.has(cellKey)) return '#CIRC!';

    try {
      // ===== BASIC FUNCTIONS =====

      // SUM
      const sumMatch = expr.match(/^SUM\(([A-Z]+\d+:[A-Z]+\d+)\)$/i);
      if (sumMatch) {
        const values = getRangeValues(sumMatch[1], data, evaluateFormula, visited, cellKey);
        return values.reduce((a, b) => a + b, 0);
      }

      // AVERAGE
      const avgMatch = expr.match(/^AVERAGE\(([A-Z]+\d+:[A-Z]+\d+)\)$/i);
      if (avgMatch) {
        const values = getRangeValues(avgMatch[1], data, evaluateFormula, visited, cellKey);
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      }

      // MIN
      const minMatch = expr.match(/^MIN\(([A-Z]+\d+:[A-Z]+\d+)\)$/i);
      if (minMatch) {
        const values = getRangeValues(minMatch[1], data, evaluateFormula, visited, cellKey);
        return values.length > 0 ? Math.min(...values) : 0;
      }

      // MAX
      const maxMatch = expr.match(/^MAX\(([A-Z]+\d+:[A-Z]+\d+)\)$/i);
      if (maxMatch) {
        const values = getRangeValues(maxMatch[1], data, evaluateFormula, visited, cellKey);
        return values.length > 0 ? Math.max(...values) : 0;
      }

      // COUNT
      const countMatch = expr.match(/^COUNT\(([A-Z]+\d+:[A-Z]+\d+)\)$/i);
      if (countMatch) {
        const cells = parseRange(countMatch[1]);
        return cells.filter(cell => {
          const val = data[cell.row]?.[cell.col];
          return val !== null && val !== undefined && val !== '';
        }).length;
      }

      // ===== STATISTICAL FUNCTIONS =====

      // STDEV (Standard Deviation)
      const stdevMatch = expr.match(/^STDEV\(([A-Z]+\d+:[A-Z]+\d+)\)$/i);
      if (stdevMatch) {
        const values = getRangeValues(stdevMatch[1], data, evaluateFormula, visited, cellKey);
        if (values.length < 2) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
      }

      // VAR (Variance)
      const varMatch = expr.match(/^VAR\(([A-Z]+\d+:[A-Z]+\d+)\)$/i);
      if (varMatch) {
        const values = getRangeValues(varMatch[1], data, evaluateFormula, visited, cellKey);
        if (values.length < 2) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
      }

      // MEDIAN
      const medianMatch = expr.match(/^MEDIAN\(([A-Z]+\d+:[A-Z]+\d+)\)$/i);
      if (medianMatch) {
        const values = getRangeValues(medianMatch[1], data, evaluateFormula, visited, cellKey).sort((a, b) => a - b);
        if (values.length === 0) return 0;
        const mid = Math.floor(values.length / 2);
        return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
      }

      // ===== FINANCIAL FUNCTIONS =====

      // NPV (Net Present Value) - =NPV(rate, A1:A5)
      const npvMatch = expr.match(/^NPV\(([^,]+),\s*([A-Z]+\d+:[A-Z]+\d+)\)$/i);
      if (npvMatch) {
        const rate = getNumericValue(npvMatch[1]);
        const cashFlows = getRangeValues(npvMatch[2], data, evaluateFormula, visited, cellKey);
        return cashFlows.reduce((npv, cf, i) => npv + cf / Math.pow(1 + rate, i + 1), 0);
      }

      // PV (Present Value) - =PV(rate, nper, pmt)
      const pvMatch = expr.match(/^PV\(([^,]+),\s*([^,]+),\s*([^)]+)\)$/i);
      if (pvMatch) {
        const rate = getNumericValue(pvMatch[1]);
        const nper = getNumericValue(pvMatch[2]);
        const pmt = getNumericValue(pvMatch[3]);
        if (rate === 0) return -pmt * nper;
        return -pmt * ((1 - Math.pow(1 + rate, -nper)) / rate);
      }

      // FV (Future Value) - =FV(rate, nper, pmt)
      const fvMatch = expr.match(/^FV\(([^,]+),\s*([^,]+),\s*([^)]+)\)$/i);
      if (fvMatch) {
        const rate = getNumericValue(fvMatch[1]);
        const nper = getNumericValue(fvMatch[2]);
        const pmt = getNumericValue(fvMatch[3]);
        if (rate === 0) return -pmt * nper;
        return -pmt * ((Math.pow(1 + rate, nper) - 1) / rate);
      }

      // PMT (Payment) - =PMT(rate, nper, pv)
      const pmtMatch = expr.match(/^PMT\(([^,]+),\s*([^,]+),\s*([^)]+)\)$/i);
      if (pmtMatch) {
        const rate = getNumericValue(pmtMatch[1]);
        const nper = getNumericValue(pmtMatch[2]);
        const pv = getNumericValue(pmtMatch[3]);
        if (rate === 0) return -pv / nper;
        return -(pv * rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
      }

      // CAGR (Compound Annual Growth Rate) - =CAGR(start, end, years)
      const cagrMatch = expr.match(/^CAGR\(([^,]+),\s*([^,]+),\s*([^)]+)\)$/i);
      if (cagrMatch) {
        const startVal = getNumericValue(cagrMatch[1]);
        const endVal = getNumericValue(cagrMatch[2]);
        const years = getNumericValue(cagrMatch[3]);
        if (startVal <= 0 || years <= 0) return '#ERROR!';
        return Math.pow(endVal / startVal, 1 / years) - 1;
      }

      // IRR (Internal Rate of Return) - =IRR(A1:A5) - uses Newton-Raphson
      const irrMatch = expr.match(/^IRR\(([A-Z]+\d+:[A-Z]+\d+)\)$/i);
      if (irrMatch) {
        const cashFlows = getRangeValues(irrMatch[1], data, evaluateFormula, visited, cellKey);
        let rate = 0.1; // Initial guess
        for (let iter = 0; iter < 100; iter++) {
          let npv = 0, dnpv = 0;
          for (let i = 0; i < cashFlows.length; i++) {
            npv += cashFlows[i] / Math.pow(1 + rate, i);
            dnpv -= i * cashFlows[i] / Math.pow(1 + rate, i + 1);
          }
          if (Math.abs(npv) < 0.0001) return rate;
          rate = rate - npv / dnpv;
        }
        return '#ERROR!'; // Did not converge
      }

      // ===== MATH FUNCTIONS =====

      // ABS
      const absMatch = expr.match(/^ABS\(([^)]+)\)$/i);
      if (absMatch) {
        const val = getNumericValue(absMatch[1]);
        return Math.abs(val);
      }

      // ROUND - =ROUND(value, decimals)
      const roundMatch = expr.match(/^ROUND\(([^,]+),\s*([^)]+)\)$/i);
      if (roundMatch) {
        const val = getNumericValue(roundMatch[1]);
        const decimals = Math.floor(getNumericValue(roundMatch[2]));
        return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
      }

      // POWER - =POWER(base, exponent)
      const powerMatch = expr.match(/^POWER\(([^,]+),\s*([^)]+)\)$/i);
      if (powerMatch) {
        const base = getNumericValue(powerMatch[1]);
        const exp = getNumericValue(powerMatch[2]);
        return Math.pow(base, exp);
      }

      // SQRT
      const sqrtMatch = expr.match(/^SQRT\(([^)]+)\)$/i);
      if (sqrtMatch) {
        const val = getNumericValue(sqrtMatch[1]);
        return val >= 0 ? Math.sqrt(val) : '#ERROR!';
      }

      // LOG (base 10)
      const logMatch = expr.match(/^LOG\(([^)]+)\)$/i);
      if (logMatch) {
        const val = getNumericValue(logMatch[1]);
        return val > 0 ? Math.log10(val) : '#ERROR!';
      }

      // LN (natural log)
      const lnMatch = expr.match(/^LN\(([^)]+)\)$/i);
      if (lnMatch) {
        const val = getNumericValue(lnMatch[1]);
        return val > 0 ? Math.log(val) : '#ERROR!';
      }

      // ===== LOGICAL FUNCTIONS =====

      // IF - =IF(condition, true_value, false_value)
      const ifMatch = expr.match(/^IF\(([^,]+),\s*([^,]+),\s*([^)]+)\)$/i);
      if (ifMatch) {
        // Parse condition (supports >, <, >=, <=, =, <>)
        const condStr = ifMatch[1];
        const trueVal = getNumericValue(ifMatch[2]);
        const falseVal = getNumericValue(ifMatch[3]);

        // Replace cell refs in condition
        let evalCond = condStr.replace(CELL_REF_REGEX, (match) => {
          const cellRef = parseCellRef(match);
          if (!cellRef) return '0';
          const val = data[cellRef.row]?.[cellRef.col];
          if (typeof val === 'string' && val.startsWith('=')) {
            const evaluated = evaluateFormula(val, data, new Set(visited).add(cellKey));
            return typeof evaluated === 'number' ? String(evaluated) : '0';
          }
          return String(getNumericValue(val));
        });

        // Evaluate condition
        let result = false;
        if (evalCond.includes('>=')) {
          const [left, right] = evalCond.split('>=');
          result = getNumericValue(left) >= getNumericValue(right);
        } else if (evalCond.includes('<=')) {
          const [left, right] = evalCond.split('<=');
          result = getNumericValue(left) <= getNumericValue(right);
        } else if (evalCond.includes('<>')) {
          const [left, right] = evalCond.split('<>');
          result = getNumericValue(left) !== getNumericValue(right);
        } else if (evalCond.includes('>')) {
          const [left, right] = evalCond.split('>');
          result = getNumericValue(left) > getNumericValue(right);
        } else if (evalCond.includes('<')) {
          const [left, right] = evalCond.split('<');
          result = getNumericValue(left) < getNumericValue(right);
        } else if (evalCond.includes('=')) {
          const [left, right] = evalCond.split('=');
          result = getNumericValue(left) === getNumericValue(right);
        }

        return result ? trueVal : falseVal;
      }

      // ===== BASIC ARITHMETIC WITH CELL REFS =====
      let evalExpr = expr;
      evalExpr = evalExpr.replace(CELL_REF_REGEX, (match) => {
        const cellRef = parseCellRef(match);
        if (!cellRef) return '0';
        const val = data[cellRef.row]?.[cellRef.col];
        if (typeof val === 'string' && val.startsWith('=')) {
          const evaluated = evaluateFormula(val, data, new Set(visited).add(cellKey));
          return typeof evaluated === 'number' ? String(evaluated) : '0';
        }
        return String(getNumericValue(val));
      });

      if (!/^[\d\s+\-*/().]+$/.test(evalExpr)) return '#ERROR!';
      const result = new Function(`return (${evalExpr})`)();
      return typeof result === 'number' && isFinite(result) ? result : '#ERROR!';
    } catch {
      return '#ERROR!';
    }
  }, [editingCell]);

  const computedData = useMemo(() => {
    return rawData.map((row) =>
      row.map((cell) => {
        if (typeof cell === 'string' && cell.startsWith('=')) {
          return evaluateFormula(cell, rawData);
        }
        return cell;
      })
    );
  }, [rawData, evaluateFormula]);

  useEffect(() => {
    if (rawData.length > 0) {
      onDataChange(rawData);
    }
  }, [rawData, onDataChange]);

  const handleCellClick = useCallback((rowIndex: number, colIndex: number) => {
    setSelectedCell({ row: rowIndex, col: colIndex });
  }, []);

  const handleCellDoubleClick = useCallback((rowIndex: number, colIndex: number) => {
    setEditingCell({ row: rowIndex, col: colIndex });
    const currentValue = rawData[rowIndex]?.[colIndex];
    setEditValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : '');
  }, [rawData]);

  const handleCellChange = useCallback((value: string) => {
    setEditValue(value);
  }, []);

  const commitCellValue = useCallback(() => {
    if (editingCell) {
      setRawData(prev => {
        const newData = prev.map(row => [...row]);
        if (editValue.startsWith('=')) {
          newData[editingCell.row][editingCell.col] = editValue;
        } else {
          const numValue = parseFloat(editValue);
          newData[editingCell.row][editingCell.col] = !isNaN(numValue) && editValue.trim() !== '' ? numValue : (editValue || null);
        }
        return newData;
      });
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, editValue]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitCellValue();
        if (editingCell.row < rawData.length - 1) {
          setSelectedCell({ row: editingCell.row + 1, col: editingCell.col });
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitCellValue();
        const nextCol = editingCell.col < (rawData[0]?.length || 0) - 1 ? editingCell.col + 1 : 0;
        const nextRow = editingCell.col < (rawData[0]?.length || 0) - 1 ? editingCell.row : Math.min(editingCell.row + 1, rawData.length - 1);
        setSelectedCell({ row: nextRow, col: nextCol });
      } else if (e.key === 'Escape') {
        setEditingCell(null);
        setEditValue('');
      }
    } else if (selectedCell) {
      const { row, col } = selectedCell;
      if (e.key === 'ArrowUp' && row > 0) { e.preventDefault(); setSelectedCell({ row: row - 1, col }); }
      else if (e.key === 'ArrowDown' && row < rawData.length - 1) { e.preventDefault(); setSelectedCell({ row: row + 1, col }); }
      else if (e.key === 'ArrowLeft' && col > 0) { e.preventDefault(); setSelectedCell({ row, col: col - 1 }); }
      else if (e.key === 'ArrowRight' && col < (rawData[0]?.length || 0) - 1) { e.preventDefault(); setSelectedCell({ row, col: col + 1 }); }
      else if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); handleCellDoubleClick(row, col); }
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        setRawData(prev => { const newData = prev.map(r => [...r]); newData[row][col] = null; return newData; });
      } else if (e.key === '=' || /^[0-9.\-]$/.test(e.key) || /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        setEditingCell({ row, col });
        setEditValue(e.key);
      }
    }
  }, [editingCell, selectedCell, rawData, commitCellValue, handleCellDoubleClick]);

  const addRow = useCallback(() => { setRawData(prev => [...prev, new Array(prev[0]?.length || cols).fill(null)]); }, [cols]);
  const addColumn = useCallback(() => { setRawData(prev => prev.map(row => [...row, null])); }, []);
  const removeRow = useCallback(() => { if (rawData.length > 1) setRawData(prev => prev.slice(0, -1)); }, [rawData.length]);
  const removeColumn = useCallback(() => { if ((rawData[0]?.length || 0) > 1) setRawData(prev => prev.map(row => row.slice(0, -1))); }, [rawData]);
  const clearAll = useCallback(() => { setRawData(prev => prev.map(row => row.map(() => null))); }, []);

  const getColumnHeader = (index: number): string => {
    let header = '';
    let n = index;
    while (n >= 0) {
      header = String.fromCharCode(65 + (n % 26)) + header;
      n = Math.floor(n / 26) - 1;
    }
    return header;
  };

  const formatCellValue = (value: string | number | null): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      if (!isFinite(value)) return '#ERROR!';
      return Number.isInteger(value) ? String(value) : value.toFixed(2);
    }
    return String(value);
  };

  const isFormula = (row: number, col: number): boolean => {
    const val = rawData[row]?.[col];
    return typeof val === 'string' && val.startsWith('=');
  };

  // Insert spreadsheet as HTML table into answer
  const handleInsertIntoAnswer = useCallback(() => {
    if (!onInsertIntoAnswer) return;

    let html = '<table style="border-collapse: collapse; margin: 8px 0;">';
    // Header row
    html += '<tr>';
    html += '<th style="border: 1px solid #ccc; padding: 4px 8px; background: #f5f5f5;"></th>';
    for (let c = 0; c < (rawData[0]?.length || 0); c++) {
      html += `<th style="border: 1px solid #ccc; padding: 4px 8px; background: #f5f5f5; font-weight: bold;">${getColumnHeader(c)}</th>`;
    }
    html += '</tr>';
    // Data rows
    computedData.forEach((row, rowIndex) => {
      html += '<tr>';
      html += `<td style="border: 1px solid #ccc; padding: 4px 8px; background: #f5f5f5; font-weight: bold;">${rowIndex + 1}</td>`;
      row.forEach(cell => {
        const displayVal = formatCellValue(cell);
        const isNum = typeof cell === 'number';
        html += `<td style="border: 1px solid #ccc; padding: 4px 8px; ${isNum ? 'text-align: right; font-family: monospace;' : ''}">${displayVal}</td>`;
      });
      html += '</tr>';
    });
    html += '</table>';

    onInsertIntoAnswer(html);
  }, [rawData, computedData, onInsertIntoAnswer]);

  const selectedCellRaw = selectedCell ? rawData[selectedCell.row]?.[selectedCell.col] : null;
  const selectedCellHasFormula = selectedCell && isFormula(selectedCell.row, selectedCell.col);
  const numCols = rawData[0]?.length || cols;
  const numRows = rawData.length;

  return (
    <div className="border border-emerald-200 dark:border-emerald-800 rounded-xl overflow-hidden bg-emerald-50/50 dark:bg-emerald-900/10">
      {/* Toggle Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Spreadsheet</span>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">{numRows} × {numCols}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">Formulas</span>
          {isOpen && <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 flex items-center gap-1"><Keyboard className="w-3 h-3" /> Keyboard</span>}
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <ChevronDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
      </button>

      {isOpen && (
        <div ref={tableRef} tabIndex={0} onKeyDown={handleKeyDown} className="focus:outline-none">
          {/* Formula Bar */}
          {selectedCell && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900 border-t border-emerald-200 dark:border-emerald-800">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 w-8">{getColumnHeader(selectedCell.col)}{selectedCell.row + 1}</span>
              <div className="flex-1 flex items-center gap-2">
                {selectedCellHasFormula && <span className="text-xs font-bold text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-1 rounded">fx</span>}
                <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{selectedCellRaw !== null && selectedCellRaw !== undefined ? String(selectedCellRaw) : ''}</span>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border-t border-emerald-200 dark:border-emerald-800 flex-wrap">
            <div className="flex items-center gap-1 border-r border-emerald-200 dark:border-emerald-700 pr-2">
              <button onClick={addRow} className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"><Plus className="w-3 h-3" /> Row</button>
              <button onClick={removeRow} disabled={numRows <= 1} className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 disabled:opacity-40"><Minus className="w-3 h-3" /> Row</button>
            </div>
            <div className="flex items-center gap-1 border-r border-emerald-200 dark:border-emerald-700 pr-2">
              <button onClick={addColumn} className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"><Plus className="w-3 h-3" /> Col</button>
              <button onClick={removeColumn} disabled={numCols <= 1} className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 disabled:opacity-40"><Minus className="w-3 h-3" /> Col</button>
            </div>
            <button onClick={clearAll} className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"><RotateCcw className="w-3 h-3" /> Clear</button>
            <button onClick={() => setShowHelp(!showHelp)} className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"><HelpCircle className="w-3 h-3" /> Formulas</button>
            {onInsertIntoAnswer && (
              <button onClick={handleInsertIntoAnswer} className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 ml-auto">
                <FileInput className="w-3 h-3" /> Insert into Answer
              </button>
            )}
          </div>

          {/* Formula Help */}
          {showHelp && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 text-xs space-y-1">
              <p className="font-bold text-blue-700 dark:text-blue-300">Available Formulas:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-blue-600 dark:text-blue-400">
                <span><b>Basic:</b> =SUM(A1:A5), =AVERAGE(), =MIN(), =MAX(), =COUNT()</span>
                <span><b>Stats:</b> =STDEV(), =VAR(), =MEDIAN()</span>
                <span><b>Finance:</b> =NPV(rate,A1:A5), =IRR(), =PV(), =FV(), =PMT(), =CAGR()</span>
                <span><b>Math:</b> =ABS(), =ROUND(val,2), =POWER(), =SQRT(), =LOG(), =LN()</span>
                <span><b>Logic:</b> =IF(A1&gt;0,B1,C1)</span>
                <span><b>Arithmetic:</b> =A1+B1*C1, =(A1+A2)/2</span>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="w-10 min-w-[40px] p-1.5 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-600 dark:text-emerald-400 font-medium">#</th>
                  {rawData[0]?.map((_, colIndex) => (
                    <th key={colIndex} className="min-w-[80px] p-1.5 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-700 dark:text-emerald-300">{getColumnHeader(colIndex)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">{rowIndex + 1}</td>
                    {row.map((_, colIndex) => {
                      const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                      const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                      const displayValue = computedData[rowIndex]?.[colIndex];
                      const hasFormula = isFormula(rowIndex, colIndex);
                      const isNumber = typeof displayValue === 'number';
                      const isError = typeof displayValue === 'string' && displayValue.startsWith('#');

                      return (
                        <td key={colIndex} className={`p-0 border border-emerald-200 dark:border-emerald-800 relative ${hasFormula ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-800'} ${isSelected ? 'ring-2 ring-emerald-500 ring-inset z-10' : ''}`}
                          onClick={() => handleCellClick(rowIndex, colIndex)} onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}>
                          {isEditing ? (
                            <input ref={inputRef} type="text" value={editValue} onChange={(e) => handleCellChange(e.target.value)} onBlur={commitCellValue}
                              className="w-full h-full px-1.5 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none" />
                          ) : (
                            <div className={`px-1.5 py-1 min-h-[28px] cursor-cell ${isNumber ? 'text-right font-mono' : 'text-left'} ${isError ? 'text-red-500 font-bold' : displayValue === null || displayValue === '' ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                              {formatCellValue(displayValue)}
                              {hasFormula && !isEditing && <span className="absolute top-0 left-0 border-l-4 border-t-4 border-l-blue-500 border-t-transparent" style={{ width: 0, height: 0, borderTopColor: 'transparent' }} />}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-200 dark:border-emerald-800">
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 text-center">Type = to start a formula • Click "Formulas" for help</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpreadsheetPanel;

/**
 * Spreadsheet Editor (Excel-like)
 * Advanced spreadsheet for accounting answers
 * Features: Excel-like cells, formulas, numeric validation
 *
 * Note: Requires handsontable package installation:
 * npm install handsontable @handsontable/react
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, Save, RotateCcw, Plus, Minus, Download } from 'lucide-react';

interface SpreadsheetEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: (string | number | null)[][];
  onSave: (data: (string | number | null)[][]) => void;
  rows?: number;
  cols?: number;
}

// Simple spreadsheet implementation (fallback when Handsontable is not available)
const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  rows = 15,
  cols = 8
}) => {
  const [data, setData] = useState<(string | number | null)[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize data
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setData(initialData);
    } else {
      // Create empty grid
      const emptyData: (string | number | null)[][] = [];
      for (let i = 0; i < rows; i++) {
        emptyData.push(new Array(cols).fill(null));
      }
      setData(emptyData);
    }
  }, [initialData, isOpen, rows, cols]);

  // Focus input when editing
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const handleCellClick = useCallback((rowIndex: number, colIndex: number) => {
    setSelectedCell({ row: rowIndex, col: colIndex });
  }, []);

  const handleCellDoubleClick = useCallback((rowIndex: number, colIndex: number) => {
    setEditingCell({ row: rowIndex, col: colIndex });
    const currentValue = data[rowIndex]?.[colIndex];
    setEditValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : '');
  }, [data]);

  const handleCellChange = useCallback((value: string) => {
    setEditValue(value);
  }, []);

  const handleCellBlur = useCallback(() => {
    if (editingCell) {
      setData(prev => {
        const newData = prev.map(row => [...row]);
        // Try to parse as number
        const numValue = parseFloat(editValue);
        newData[editingCell.row][editingCell.col] = !isNaN(numValue) ? numValue : (editValue || null);
        return newData;
      });
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, editValue]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
      // Move to next row
      if (editingCell && editingCell.row < data.length - 1) {
        setSelectedCell({ row: editingCell.row + 1, col: editingCell.col });
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellBlur();
      // Move to next column
      if (editingCell) {
        const nextCol = editingCell.col < (data[0]?.length || 0) - 1 ? editingCell.col + 1 : 0;
        const nextRow = editingCell.col < (data[0]?.length || 0) - 1 ? editingCell.row : editingCell.row + 1;
        if (nextRow < data.length) {
          setSelectedCell({ row: nextRow, col: nextCol });
        }
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, data, handleCellBlur]);

  const addRow = useCallback(() => {
    setData(prev => [...prev, new Array(prev[0]?.length || cols).fill(null)]);
  }, [cols]);

  const addColumn = useCallback(() => {
    setData(prev => prev.map(row => [...row, null]));
  }, []);

  const removeRow = useCallback(() => {
    if (data.length > 1) {
      setData(prev => prev.slice(0, -1));
    }
  }, [data.length]);

  const removeColumn = useCallback(() => {
    if ((data[0]?.length || 0) > 1) {
      setData(prev => prev.map(row => row.slice(0, -1)));
    }
  }, [data]);

  const clearAll = useCallback(() => {
    setData(prev => prev.map(row => row.map(() => null)));
  }, []);

  const handleSave = useCallback(() => {
    onSave(data);
    onClose();
  }, [data, onSave, onClose]);

  // Calculate sum for selected column
  const calculateColumnSum = useCallback((colIndex: number) => {
    return data.reduce((sum, row) => {
      const value = row[colIndex];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }, [data]);

  // Get column header (A, B, C, ...)
  const getColumnHeader = (index: number): string => {
    let header = '';
    let n = index;
    while (n >= 0) {
      header = String.fromCharCode(65 + (n % 26)) + header;
      n = Math.floor(n / 26) - 1;
    }
    return header;
  };

  // Format cell value for display
  const formatCellValue = (value: string | number | null): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      // Format numbers with up to 2 decimal places
      return Number.isInteger(value) ? String(value) : value.toFixed(2);
    }
    return String(value);
  };

  if (!isOpen) return null;

  const numCols = data[0]?.length || cols;
  const numRows = data.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Spreadsheet</h3>
            <span className="text-xs px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              Excel-like
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {numRows} rows × {numCols} columns
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-wrap">
          <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-3">
            <button
              onClick={addRow}
              className="flex items-center gap-1 px-2 py-1.5 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              title="Add Row"
            >
              <Plus className="w-3 h-3" /> Row
            </button>
            <button
              onClick={removeRow}
              disabled={numRows <= 1}
              className="flex items-center gap-1 px-2 py-1.5 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40"
              title="Remove Row"
            >
              <Minus className="w-3 h-3" /> Row
            </button>
          </div>

          <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-3">
            <button
              onClick={addColumn}
              className="flex items-center gap-1 px-2 py-1.5 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              title="Add Column"
            >
              <Plus className="w-3 h-3" /> Column
            </button>
            <button
              onClick={removeColumn}
              disabled={numCols <= 1}
              className="flex items-center gap-1 px-2 py-1.5 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40"
              title="Remove Column"
            >
              <Minus className="w-3 h-3" /> Column
            </button>
          </div>

          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-2 py-1.5 text-xs rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
            title="Clear All"
          >
            <RotateCcw className="w-3 h-3" /> Clear
          </button>

          {/* Cell info */}
          {selectedCell && (
            <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
              Cell: {getColumnHeader(selectedCell.col)}{selectedCell.row + 1}
              {typeof data[selectedCell.row]?.[selectedCell.col] === 'number' && (
                <span className="ml-2">
                  Column Sum: {calculateColumnSum(selectedCell.col).toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Spreadsheet */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="w-12 min-w-[48px] p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-400 font-medium">
                  #
                </th>
                {data[0]?.map((_, colIndex) => (
                  <th
                    key={colIndex}
                    className="min-w-[100px] p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    {getColumnHeader(colIndex)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="p-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-center text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {rowIndex + 1}
                  </td>
                  {row.map((cell, colIndex) => {
                    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                    const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                    const isNumber = typeof cell === 'number';

                    return (
                      <td
                        key={colIndex}
                        className={`p-0 border border-gray-300 dark:border-gray-600 relative ${
                          isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''
                        }`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => handleCellChange(e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyDown={handleKeyDown}
                            className="w-full h-full px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none"
                          />
                        ) : (
                          <div
                            className={`px-2 py-1.5 min-h-[32px] cursor-cell ${
                              isNumber ? 'text-right font-mono' : 'text-left'
                            } ${
                              cell === null || cell === '' ? 'text-gray-400' : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {formatCellValue(cell)}
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
        <div className="flex items-center justify-between gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Double-click to edit cell. Tab to move to next cell. Enter to confirm.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Spreadsheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetEditor;

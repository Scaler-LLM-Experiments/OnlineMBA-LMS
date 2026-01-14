/**
 * Simple Table Editor
 * Basic editable table for exam use
 * Features: Add/remove rows/columns, edit cells, basic structure
 */

import React, { useState, useCallback, useEffect } from 'react';
import { X, Plus, Minus, Trash2, RotateCcw } from 'lucide-react';

interface TableEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: string[][];
  onSave: (data: string[][]) => void;
  maxRows?: number;
  maxCols?: number;
}

const TableEditor: React.FC<TableEditorProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  maxRows = 20,
  maxCols = 10
}) => {
  const [data, setData] = useState<string[][]>([
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ]);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setData(initialData);
    } else {
      setData([
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
      ]);
    }
  }, [initialData, isOpen]);

  const handleCellChange = useCallback((rowIndex: number, colIndex: number, value: string) => {
    setData(prev => {
      const newData = prev.map(row => [...row]);
      newData[rowIndex][colIndex] = value;
      return newData;
    });
  }, []);

  const addRow = useCallback(() => {
    if (data.length >= maxRows) return;
    setData(prev => [...prev, new Array(prev[0]?.length || 3).fill('')]);
  }, [data.length, maxRows]);

  const removeRow = useCallback((index: number) => {
    if (data.length <= 1) return;
    setData(prev => prev.filter((_, i) => i !== index));
  }, [data.length]);

  const addColumn = useCallback(() => {
    if ((data[0]?.length || 0) >= maxCols) return;
    setData(prev => prev.map(row => [...row, '']));
  }, [data, maxCols]);

  const removeColumn = useCallback((index: number) => {
    if ((data[0]?.length || 0) <= 1) return;
    setData(prev => prev.map(row => row.filter((_, i) => i !== index)));
  }, [data]);

  const clearTable = useCallback(() => {
    setData(prev => prev.map(row => row.map(() => '')));
  }, []);

  const resetTable = useCallback(() => {
    setData([
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ]);
  }, []);

  const handleSave = useCallback(() => {
    onSave(data);
    onClose();
  }, [data, onSave, onClose]);

  // Generate column headers (A, B, C, ...)
  const getColumnHeader = (index: number): string => {
    let header = '';
    let n = index;
    while (n >= 0) {
      header = String.fromCharCode(65 + (n % 26)) + header;
      n = Math.floor(n / 26) - 1;
    }
    return header;
  };

  if (!isOpen) return null;

  const numCols = data[0]?.length || 0;
  const numRows = data.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Table Editor</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {numRows} rows × {numCols} columns
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearTable}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Clear all cells"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={resetTable}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Reset to 3×3"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Rows:</span>
            <button
              onClick={() => removeRow(data.length - 1)}
              disabled={numRows <= 1}
              className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-center">{numRows}</span>
            <button
              onClick={addRow}
              disabled={numRows >= maxRows}
              className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Columns:</span>
            <button
              onClick={() => removeColumn(numCols - 1)}
              disabled={numCols <= 1}
              className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-center">{numCols}</span>
            <button
              onClick={addColumn}
              disabled={numCols >= maxCols}
              className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-12 p-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
                  #
                </th>
                {data[0]?.map((_, colIndex) => (
                  <th
                    key={colIndex}
                    className="min-w-[100px] p-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {getColumnHeader(colIndex)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-center text-sm text-gray-500 dark:text-gray-400">
                    {rowIndex + 1}
                  </td>
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      className="p-0 border border-gray-200 dark:border-gray-600"
                    >
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        className="w-full h-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                        placeholder=""
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Save Table
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableEditor;

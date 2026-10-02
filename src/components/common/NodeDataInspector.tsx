import React, { useState, useMemo } from 'react';
import {
  Table as TableIcon,
  FileCode,
  Layers,
  Copy,
  Check,
  Search,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';

interface NodeDataInspectorProps {
  outputData?: any;
  data?: any;
  inputData?: any;
  initialDirection?: string;
  error?: string | null;
  mode?: 'table' | 'json' | 'schema';
  onModeChange?: (mode: 'table' | 'json' | 'schema') => void;
  className?: string;
}

export const NodeDataInspector: React.FC<NodeDataInspectorProps> = ({
  outputData,
  data,
  inputData,
  error,
  mode,
  onModeChange,
  className = '',
}) => {
  const [internalViewMode, setInternalViewMode] = useState<'table' | 'json' | 'schema'>('table');
  const viewMode = mode || internalViewMode;

  const handleSetViewMode = (newMode: 'table' | 'json' | 'schema') => {
    setInternalViewMode(newMode);
    onModeChange?.(newMode);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Active data to inspect
  const activeData = outputData !== undefined ? outputData : (data !== undefined ? data : inputData);

  // Normalize data into array of rows for Table view
  const rows = useMemo(() => {
    if (!activeData) return [];
    if (Array.isArray(activeData)) {
      return activeData.map((item, idx) => {
        if (typeof item === 'object' && item !== null) return { _index: idx + 1, ...item };
        return { _index: idx + 1, value: item };
      });
    }
    if (typeof activeData === 'object' && activeData !== null) {
      // If object has an items or rows array, prefer that
      if (Array.isArray(activeData.rows)) {
        return activeData.rows.map((r: any, idx: number) => ({ _index: idx + 1, ...(typeof r === 'object' ? r : { value: r }) }));
      }
      if (Array.isArray(activeData.items)) {
        return activeData.items.map((r: any, idx: number) => ({ _index: idx + 1, ...(typeof r === 'object' ? r : { value: r }) }));
      }
      return [{ _index: 1, ...activeData }];
    }
    return [{ _index: 1, value: activeData }];
  }, [activeData]);

  // Extract all unique columns for Table view
  const columns = useMemo(() => {
    if (rows.length === 0) return [];
    const colSet = new Set<string>();
    rows.forEach((r: any) => {
      Object.keys(r).forEach((k) => {
        if (k !== '_index') colSet.add(k);
      });
    });
    return Array.from(colSet);
  }, [rows]);

  // Filtered rows for Table view
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((row: any) => {
      return Object.entries(row).some(([_, val]) => {
        return String(val).toLowerCase().includes(q);
      });
    });
  }, [rows, searchQuery]);

  // Schema analysis: extract fields and types
  const schemaFields = useMemo(() => {
    if (!activeData || typeof activeData !== 'object') {
      return [{ key: 'value', type: typeof activeData as string, sample: String(activeData) }];
    }

    const targetObj: Record<string, any> = Array.isArray(activeData) ? (activeData[0] || {}) : activeData;
    return Object.entries(targetObj).map(([key, val]) => {
      let typeStr: string = typeof val;
      if (val === null) typeStr = 'null';
      else if (Array.isArray(val)) typeStr = `array [${val.length}]`;
      else if (typeStr === 'object' && val !== null) typeStr = `object (${Object.keys(val).length} keys)`;

      let sampleStr = '';
      if (typeof val === 'object' && val !== null) {
        sampleStr = JSON.stringify(val).slice(0, 50);
      } else {
        sampleStr = String(val);
      }

      return {
        key,
        type: typeStr,
        sample: sampleStr,
      };
    });
  }, [activeData]);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(activeData || {}, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col h-full bg-slate-950/80 border border-slate-800/80 rounded-xl overflow-hidden ${className}`}>
      {/* Top Controls: Mode Switcher (Table/JSON/Schema) + Search + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">Data Inspector</span>
          {rows.length > 0 && (
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {rows.length} {rows.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {/* View Mode Switcher: Table | JSON | Schema */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => handleSetViewMode('table')}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
              viewMode === 'table'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Table View"
          >
            <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Table</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetViewMode('json')}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
              viewMode === 'json'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="JSON View"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetViewMode('schema')}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
              viewMode === 'schema'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Schema View"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Schema</span>
          </button>
        </div>

        {/* Quick Copy / Action */}
        <button
          type="button"
          onClick={handleCopyJson}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer"
          title="Copy raw JSON"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy JSON'}</span>
        </button>
      </div>

      {/* Error banner if present */}
      {error && (
        <div className="p-2.5 mx-3 mt-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono">
          <strong>Error: </strong> {error}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-auto p-2 sm:p-3">
        {!activeData || (typeof activeData === 'object' && Object.keys(activeData).length === 0) ? (
          <div className="py-12 text-center text-slate-500">
            <Info className="w-7 h-7 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-xs text-slate-400">No output data captured for this step yet.</p>
            <p className="text-[11px] text-slate-600 mt-1">Execute or test the step to see outgoing payloads.</p>
          </div>
        ) : (
          <>
            {/* 1. TABLE VIEW */}
            {viewMode === 'table' && (
              <div className="space-y-2">
                {/* Search / stats bar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter records..."
                      className="w-full pl-7 pr-3 py-1 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 shrink-0">
                    {filteredRows.length} item{filteredRows.length !== 1 ? 's' : ''} • {columns.length} columns
                  </span>
                </div>

                {/* Table Container */}
                <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-900/60 max-h-[340px]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950/90 text-slate-400 text-[10px] uppercase tracking-wider sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2 w-10 text-center font-bold text-slate-600">#</th>
                        {columns.map((col) => (
                          <th key={col} className="px-3 py-2 font-semibold text-slate-300">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {filteredRows.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-cyan-500/5 transition-colors">
                          <td className="px-3 py-2 text-center text-slate-500 font-medium">
                            {row._index}
                          </td>
                          {columns.map((col) => {
                            const val = row[col];
                            let displayVal = '';
                            let isObj = false;
                            if (val === null || val === undefined) displayVal = 'null';
                            else if (typeof val === 'object') {
                              isObj = true;
                              displayVal = JSON.stringify(val);
                            } else {
                              displayVal = String(val);
                            }

                            return (
                              <td key={col} className="px-3 py-2 max-w-[240px] truncate" title={displayVal}>
                                {isObj ? (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 font-mono">
                                    {displayVal.slice(0, 30)}{displayVal.length > 30 ? '...' : ''}
                                  </span>
                                ) : (
                                  <span>{displayVal}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. JSON VIEW */}
            {viewMode === 'json' && (
              <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed select-text max-h-[380px]">
                {JSON.stringify(activeData, null, 2)}
              </pre>
            )}

            {/* 3. SCHEMA VIEW */}
            {viewMode === 'schema' && (
              <div className="space-y-2">
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/90 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Field Name</th>
                        <th className="px-3 py-2 font-semibold">Data Type</th>
                        <th className="px-3 py-2 font-semibold">Sample Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                      {schemaFields.map((field) => (
                        <tr key={field.key} className="hover:bg-slate-850/50">
                          <td className="px-3 py-2 font-semibold text-cyan-300">
                            {field.key}
                          </td>
                          <td className="px-3 py-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-950/80 text-purple-300 border border-purple-800/50">
                              {field.type}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-400 truncate max-w-[260px]" title={field.sample}>
                            {field.sample}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

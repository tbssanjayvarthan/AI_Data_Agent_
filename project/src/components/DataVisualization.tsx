import { BarChart3, Table as TableIcon, PieChart, TrendingUp } from 'lucide-react';

interface DataVisualizationProps {
  data: Record<string, unknown>;
}

export function DataVisualization({ data }: DataVisualizationProps) {
  const chartType = data.type as string;
  const chartData = data.data as Record<string, unknown>[] | undefined;
  const tableData = data.table as Record<string, unknown>[] | undefined;

  if (tableData && Array.isArray(tableData) && tableData.length > 0) {
    const columns = Object.keys(tableData[0]);

    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
          <TableIcon className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Data Table</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tableData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-3 text-sm text-slate-900">
                      {String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (chartType === 'bar' && chartData && Array.isArray(chartData)) {
    const maxValue = Math.max(...chartData.map((d) => Number(d.value) || 0));

    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Bar Chart</span>
        </div>
        <div className="space-y-3">
          {chartData.map((item, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-700">{String(item.label)}</span>
                <span className="text-sm font-medium text-slate-900">{String(item.value)}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(Number(item.value) / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (chartType === 'line' && chartData && Array.isArray(chartData)) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Trend Analysis</span>
        </div>
        <div className="space-y-2">
          {chartData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-sm text-slate-700">{String(item.label)}</span>
              <span className="text-sm font-medium text-slate-900">{String(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
import React, { useMemo, useState } from 'react';
import { Table, BarChart3, Filter, Search, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

interface DataAnalysisProps {
  data: any[];
}

const DataAnalysis: React.FC<DataAnalysisProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    Object.keys(data[0])
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const rowsPerPage = 10;

  const statistics = useMemo(() => {
    const numericColumns = Object.keys(data[0]).filter(key => 
      typeof data[0][key] === 'number'
    );

    return numericColumns.reduce((acc, column) => {
      const values = data.map(row => row[column]).filter(val => !isNaN(val));
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;
      const sortedValues = [...values].sort((a, b) => a - b);
      const median = sortedValues[Math.floor(sortedValues.length / 2)];
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      const variance = values.reduce((acc, val) => 
        acc + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
      const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];

      acc[column] = {
        mean: mean.toFixed(2),
        median: median.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        count: values.length,
        stdDev: stdDev.toFixed(2),
        q1: q1.toFixed(2),
        q3: q3.toFixed(2)
      };

      return acc;
    }, {} as any);
  }, [data]);

  const correlationMatrix = useMemo(() => {
    const numericColumns = Object.keys(data[0]).filter(key => 
      typeof data[0][key] === 'number'
    );

    return numericColumns.map(col1 => {
      const correlations: { [key: string]: number } = {};
      numericColumns.forEach(col2 => {
        const values1 = data.map(row => row[col1]);
        const values2 = data.map(row => row[col2]);
        
        const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
        const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
        
        const variance1 = values1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0);
        const variance2 = values2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0);
        
        const covariance = values1.reduce((a, b, i) => 
          a + (b - mean1) * (values2[i] - mean2), 0
        );
        
        correlations[col2] = covariance / Math.sqrt(variance1 * variance2);
      });
      return { column: col1, correlations };
    });
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    let processedData = [...data];

    // Apply search filter
    if (searchTerm) {
      processedData = processedData.filter(row =>
        Object.entries(row).some(([key, value]) =>
          selectedColumns.includes(key) &&
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortConfig) {
      processedData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return processedData;
  }, [data, searchTerm, sortConfig, selectedColumns]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedData, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const toggleColumn = (column: string) => {
    setSelectedColumns(current =>
      current.includes(column)
        ? current.filter(col => col !== column)
        : [...current, column]
    );
  };

  const toggleAllColumns = () => {
    setSelectedColumns(current =>
      current.length === Object.keys(data[0]).length ? [] : Object.keys(data[0])
    );
  };

  // Close column filter when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.column-filter')) {
        setShowColumnFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-8">
      {/* Summary Statistics */}
      <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold">Summary Statistics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Column
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Mean
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Median
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Std Dev
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Q1
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Q3
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Min
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Max
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Count
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {Object.entries(statistics).map(([column, stats]) => (
                <tr key={column}>
                  <td className="px-6 py-4 whitespace-nowrap">{column}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{stats.mean}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{stats.median}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{stats.stdDev}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{stats.q1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{stats.q3}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{stats.min}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{stats.max}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{stats.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Correlation Matrix */}
      <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center space-x-2 mb-4">
          <Table className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold">Correlation Matrix</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Column
                </th>
                {correlationMatrix.map(({ column }) => (
                  <th
                    key={column}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {correlationMatrix.map(({ column, correlations }) => (
                <tr key={column}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {column}
                  </td>
                  {correlationMatrix.map(({ column: col2 }) => (
                    <td
                      key={col2}
                      className="px-6 py-4 whitespace-nowrap"
                      style={{
                        backgroundColor: `rgba(59, 130, 246, ${
                          Math.abs(correlations[col2])
                        })`
                      }}
                    >
                      {correlations[col2].toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Raw Data Preview */}
      <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Table className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold">Data Preview</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Column Filter */}
            <div className="relative column-filter">
              <button
                onClick={() => setShowColumnFilter(!showColumnFilter)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Columns</span>
                {showColumnFilter ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {showColumnFilter && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg p-2 z-10">
                  <div className="px-3 py-2 border-b border-gray-600">
                    <label className="flex items-center space-x-2 hover:bg-gray-600 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedColumns.length === Object.keys(data[0]).length}
                        onChange={toggleAllColumns}
                        className="rounded border-gray-400 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="font-medium">Toggle All</span>
                    </label>
                  </div>
                  {Object.keys(data[0]).map(column => (
                    <label
                      key={column}
                      className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-600 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(column)}
                        onChange={() => toggleColumn(column)}
                        className="rounded border-gray-400 text-blue-500 focus:ring-blue-500"
                      />
                      <span>{column}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="pl-9 pr-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                {Object.keys(data[0])
                  .filter(key => selectedColumns.includes(key))
                  .map(header => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort(header)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{header}</span>
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {paginatedData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-700/50">
                  {Object.entries(row)
                    .filter(([key]) => selectedColumns.includes(key))
                    .map(([key, value], i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 rounded bg-gray-700">
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DataAnalysis;
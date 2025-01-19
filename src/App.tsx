import React, { useState, useCallback } from 'react';
import { FileUp, Table, BarChart3, GitGraph, Github, Linkedin, Download, Trash2, AlertCircle } from 'lucide-react';
import DataAnalysis from './components/DataAnalysis';

function App() {
  const [data, setData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLoading(true);
      setError('');
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const rows = text.split('\n').map(row => row.split(','));
          const headers = rows[0];
          
          // Validate headers
          if (headers.length === 0) {
            throw new Error('CSV file appears to be empty');
          }
          
          // Process data rows
          const dataRows = rows.slice(1)
            .filter(row => row.length === headers.length && row.some(cell => cell.trim() !== ''))
            .map(row => {
              const obj: { [key: string]: string | number } = {};
              headers.forEach((header, index) => {
                const value = row[index]?.trim();
                obj[header] = isNaN(Number(value)) ? value : Number(value);
              });
              return obj;
            });

          if (dataRows.length === 0) {
            throw new Error('No valid data rows found in the CSV file');
          }

          setData(dataRows);
          setError('');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error processing file');
          setData([]);
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError('Error reading file');
        setLoading(false);
      };
      reader.readAsText(file);
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed_${fileName || 'data'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [data, fileName]);

  const handleClearData = useCallback(() => {
    setData([]);
    setFileName('');
    setError('');
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 p-4 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <GitGraph className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">Data Analysis System</h1>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/aryan1112003"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:text-blue-400 transition-colors"
            >
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </a>
            <a
              href="https://www.linkedin.com/in/aryan-acharya-9b939b316/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:text-blue-400 transition-colors"
            >
              <Linkedin className="w-5 h-5" />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-8">
        {/* Actions Bar */}
        <div className="flex justify-end space-x-4 mb-8">
          {data.length > 0 && (
            <>
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleClearData}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Data</span>
              </button>
            </>
          )}
        </div>

        {/* File Upload Section */}
        <div className="mb-8">
          <div className="max-w-xl mx-auto">
            <label
              className={`flex flex-col items-center px-4 py-6 bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700 transition-colors ${
                loading ? 'opacity-50 cursor-wait' : ''
              }`}
            >
              <FileUp className="w-12 h-12 text-blue-400 mb-2" />
              <span className="text-lg font-medium">Upload CSV File</span>
              <span className="text-sm text-gray-400 mt-1">
                {loading ? 'Processing...' : fileName || 'Select a file to analyze'}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={loading}
              />
            </label>

            {error && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-200">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Section */}
        {data.length > 0 && <DataAnalysis data={data} />}

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-400">
          <p>© 2025 Aryan Acharya. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import Papa from 'papaparse';

// Register Chart.js components
Chart.register(...registerables);

// CORS Proxy URL
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const API_URL = 'http://4.227.155.222:8080/process-dataset/';

const ChartVisualizer2 = () => {
  const [file, setFile] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [parsedCsvData, setParsedCsvData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for chart canvases
  const chartRefs = {
    salesbyproductline: useRef(null),
    monthlysales: useRef(null),
    salesbycountry: useRef(null),
    quantityvssales: useRef(null),
    dealsizedistribution: useRef(null)
  };

  const chartInstances = useRef([]);

  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error('CSV parsing errors occurred'));
          } else if (results.data.length === 0) {
            reject(new Error('No data found in the CSV file'));
          } else {
            resolve(results.data);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = useCallback(async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setChartData(null);
    setParsedCsvData(null);
    setError(null);
    setIsLoading(true);

    try {
      // Parse CSV file
      const csvData = await parseCSV(file);
      setParsedCsvData(csvData);

      const formData = new FormData();
      formData.append('file', file);

      // Try with CORS proxy
      const response = await fetch(CORS_PROXY + API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Origin': window.location.origin,
          // Remove any content-type header to let the browser set it with the boundary
        },
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.analysis || !result.analysis.visualizations) {
        throw new Error('Invalid response format from server');
      }

      setChartData(result.analysis.visualizations);
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Error: ${err.message}. Please try again or contact support.`);
      setChartData(null);
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  // Rest of the component remains the same...
  // (Previous useEffect hooks for chart rendering)

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Data Visualization Dashboard</h1>
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-2/3">
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
            />
          </div>
          
          <button 
            onClick={handleUpload}
            disabled={!file || isLoading}
            className={`w-full md:w-1/3 px-6 py-2.5 rounded-lg transition-colors duration-200 ${
              file && !isLoading 
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : 'Upload and Process'}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts grid remains the same */}
    </div>
  );
};

export default ChartVisualizer2;
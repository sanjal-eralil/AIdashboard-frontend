import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import Papa from 'papaparse';

// Register Chart.js components
Chart.register(...registerables);

const ChartVisualizer1 = () => {
  // State management
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

  // Chart instances to manage
  const chartInstances = useRef([]);

  // Parse CSV file
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

  // Handle file input change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  // Upload and process file
  const handleUpload = useCallback(async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    // Reset previous state
    setChartData(null);
    setParsedCsvData(null);
    setError(null);
    setIsLoading(true);

    try {
      // Parse CSV file
      const csvData = await parseCSV(file);
      setParsedCsvData(csvData);

      // Fetch visualization configurations from backend
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://4.227.155.222:8080/process-dataset/', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      
      // Validate backend response
      if (!result.analysis || !result.analysis.visualizations) {
        throw new Error('Invalid response from server');
      }

      setChartData(result.analysis.visualizations);
      setIsLoading(false);
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Error processing file: ${err.message}`);
      setIsLoading(false);
      setChartData(null);
    }
  }, [file]);

  // Render charts when data is received
  useEffect(() => {
    // Destroy existing charts
    chartInstances.current.forEach(chart => chart.destroy());
    chartInstances.current = [];

    if (chartData && parsedCsvData) {
      const chartTypeToId = {
        'Bar Chart': 'salesbyproductline',
        'Line Chart': 'monthlysales',
        'Pie Chart': 'salesbycountry',
        'Scatter Plot': 'quantityvssales',
        'Doughnut Chart': 'dealsizedistribution'
      };

      console.log('Chart Data:', chartData);
      console.log('Parsed CSV Data:', parsedCsvData);

      chartData.forEach((viz, index) => {
        const chartId = chartTypeToId[viz.type];
        const canvasRef = chartRefs[chartId];
        
        console.log(`Processing ${viz.type}:`, {
          chartId,
          canvasRef: canvasRef?.current,
          vizCode: viz.code
        });

        if (canvasRef && canvasRef.current) {
          try {
            // Directly use Chart.js to create the chart
            const ctx = canvasRef.current.getContext('2d');
            
            if (!ctx) {
              console.error(`Cannot get 2D context for ${viz.type}`);
              return;
            }

            // Prepare data for the specific chart type
            let chartConfig;
            switch(viz.type) {
              case 'Bar Chart':
                chartConfig = {
                  type: 'bar',
                  data: {
                    labels: Array.from(new Set(parsedCsvData.map(row => row.PRODUCTLINE))),
                    datasets: [{
                      label: 'Total Sales by Product Line',
                      data: Array.from(new Set(parsedCsvData.map(row => row.PRODUCTLINE)))
                        .map(productLine => 
                          parsedCsvData
                            .filter(row => row.PRODUCTLINE === productLine)
                            .reduce((sum, row) => sum + (parseFloat(row.SALES) || 0), 0)
                        ),
                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
                      borderColor: 'rgba(75, 192, 192, 1)',
                      borderWidth: 1
                    }]
                  },
                  options: { scales: { y: { beginAtZero: true } } }
                };
                break;
              case 'Line Chart':
                chartConfig = {
                  type: 'line',
                  data: {
                    labels: Array.from(new Set(parsedCsvData.map(row => row.MONTH_ID))).sort((a, b) => a - b),
                    datasets: [{
                      label: 'Monthly Sales',
                      data: Array.from(new Set(parsedCsvData.map(row => row.MONTH_ID)))
                        .sort((a, b) => a - b)
                        .map(month => 
                          parsedCsvData
                            .filter(row => row.MONTH_ID === month)
                            .reduce((sum, row) => sum + (parseFloat(row.SALES) || 0), 0)
                        ),
                      fill: false,
                      borderColor: 'rgb(75, 192, 192)',
                      tension: 0.1
                    }]
                  },
                  options: { scales: { y: { beginAtZero: true } } }
                };
                break;
              case 'Pie Chart':
                chartConfig = {
                  type: 'pie',
                  data: {
                    labels: Array.from(new Set(parsedCsvData.map(row => row.COUNTRY))),
                    datasets: [{
                      label: 'Sales by Country',
                      data: Array.from(new Set(parsedCsvData.map(row => row.COUNTRY)))
                        .map(country => 
                          parsedCsvData
                            .filter(row => row.COUNTRY === country)
                            .reduce((sum, row) => sum + (parseFloat(row.SALES) || 0), 0)
                        ),
                      backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)'
                      ],
                      borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                      ],
                      borderWidth: 1
                    }]
                  },
                  options: { responsive: true }
                };
                break;
              case 'Scatter Plot':
                chartConfig = {
                  type: 'scatter',
                  data: {
                    datasets: [{
                      label: 'Quantity Ordered vs Sales',
                      data: parsedCsvData
                        .filter(row => row.QUANTITYORDERED !== null && row.SALES !== null)
                        .map(row => ({
                          x: parseFloat(row.QUANTITYORDERED),
                          y: parseFloat(row.SALES)
                        })),
                      backgroundColor: 'rgba(255, 99, 132, 0.2)',
                      borderColor: 'rgba(255, 99, 132, 1)',
                      borderWidth: 1
                    }]
                  },
                  options: { 
                    scales: { 
                      x: { 
                        type: 'linear', 
                        position: 'bottom' 
                      } 
                    } 
                  }
                };
                break;
              case 'Doughnut Chart':
                chartConfig = {
                  type: 'doughnut',
                  data: {
                    labels: Array.from(new Set(parsedCsvData.map(row => row.DEALSIZE))),
                    datasets: [{
                      label: 'Deal Size Distribution',
                      data: Array.from(new Set(parsedCsvData.map(row => row.DEALSIZE)))
                        .map(dealSize => 
                          parsedCsvData
                            .filter(row => row.DEALSIZE === dealSize)
                            .length
                        ),
                      backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)'
                      ],
                      borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)'
                      ],
                      borderWidth: 1
                    }]
                  },
                  options: { responsive: true }
                };
                break;
              default:
                console.error(`Unsupported chart type: ${viz.type}`);
                return;
            }

            // Create the chart
            const chartInstance = new Chart(ctx, chartConfig);
            
            // Store chart instance for later destruction
            chartInstances.current.push(chartInstance);
          } catch (err) {
            console.error(`Error creating ${viz.type} chart:`, err);
          }
        } else {
          console.error(`No canvas ref found for ${viz.type}`);
        }
      });
    }
  }, [chartData, parsedCsvData]);

  // Cleanup chart instances on component unmount
  useEffect(() => {
    return () => {
      chartInstances.current.forEach(chart => chart.destroy());
    };
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <input 
          type="file" 
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        <button 
          onClick={handleUpload}
          disabled={!file || isLoading}
          className={`px-4 py-2 rounded ${
            file && !isLoading 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Processing...' : 'Upload and Process'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Processing your data...</span>
        </div>
      )}

      {chartData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chartData.map((chart, index) => {
            const chartTypeToId = {
              'Bar Chart': 'salesbyproductline',
              'Line Chart': 'monthlysales',
              'Pie Chart': 'salesbycountry',
              'Scatter Plot': 'quantityvssales',
              'Doughnut Chart': 'dealsizedistribution'
            };

            const chartId = chartTypeToId[chart.type];
            
            return (
              <div key={index} className="border p-2 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-2 text-center">{chart.type}</h2>
                <canvas 
                  ref={chartRefs[chartId]} 
                  id={chartId}
                  className="max-w-full h-48"  // Changed from h-64 to h-48
                ></canvas>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChartVisualizer1;




// ChartVisualizer2.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import Papa from 'papaparse';
import './ChartVisualizer.css';
import APIForm from './APIForm';

// Register Chart.js components
Chart.register(...registerables);

const ChartVisualizer2 = () => {
  const [file, setFile] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [parsedCsvData, setParsedCsvData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const chartRefs = {
    salesbyproductline: useRef(null),
    monthlysales: useRef(null),
    salesbycountry: useRef(null),
    quantityvssales: useRef(null),
    dealsizedistribution: useRef(null)
  };

  const chartInstances = useRef([]);

  // Rest of your existing JavaScript logic remains the same until the return statement

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
      const csvData = await parseCSV(file);
      setParsedCsvData(csvData);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://394e-4-227-155-222.ngrok-free.app/process-dataset/', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      
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

  useEffect(() => {
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

      chartData.forEach((viz) => {
        const chartId = chartTypeToId[viz.type];
        const canvasRef = chartRefs[chartId];
        
        if (canvasRef?.current) {
          try {
            const ctx = canvasRef.current.getContext('2d');
            
            if (!ctx) {
              console.error(`Cannot get 2D context for ${viz.type}`);
              return;
            }

            


            let chartConfig;
            const commonDimensionOptions = {
              responsive: true,
              maintainAspectRatio: true,
              aspectRatio: 1.5,  // Reduced from 2 to 1.5 for more compact charts
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    boxWidth: 12,  // Smaller legend items
                    padding: 8     // Reduced padding
                  }
                }
              },
              layout: {
                padding: {
                  left: '15%',    // 15% padding on left
                  right: '15%',   // 15% padding on right
                  top: 10,
                  bottom: 20
                }
              }
            };

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
                      borderWidth: 1,
                      barPercentage: 0.7  // Make bars slightly thinner
                    }]
                  },
                  options: { 
                    ...commonDimensionOptions,
                    scales: { y: { beginAtZero: true } } 
                  }
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
                  options: { 
                    ...commonDimensionOptions,
                    scales: { y: { beginAtZero: true } } 
                  }
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
                  options: { 
                    ...commonDimensionOptions
                  }
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
                    ...commonDimensionOptions,
                    scales: { 
                      x: { 
                        type: 'linear', 
                        position: 'bottom' 
                      },
                      y: {
                        beginAtZero: true
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
                  options: { 
                    ...commonDimensionOptions
                  }
                };
                break;
              default:
                console.error(`Unsupported chart type: ${viz.type}`);
                return;
            }

            const chartInstance = new Chart(ctx, chartConfig);
            chartInstances.current.push(chartInstance);
          } catch (err) {
            console.error(`Error creating ${viz.type} chart:`, err);
          }
        }
      });
    }
  }, [chartData, parsedCsvData]);

  useEffect(() => {
    return () => {
      chartInstances.current.forEach(chart => chart.destroy());
    };
  }, []);
  return (
    <div className="chart-container">
      <div className="upload-container">
        <div className="upload-section">
          <label className="file-label">
            Upload your CSV file
          </label>
          <input 
            type="file" 
            accept=".csv"
            onChange={handleFileChange}
            className="file-input"
          />
          <div className="button-container">
            <button 
              onClick={handleUpload}
              disabled={!file || isLoading}
              className={`upload-button ${(!file || isLoading) ? 'disabled' : ''}`}
            >
              {isLoading ? 'Processing...' : 'Generate Visuals'}
            </button>
          </div>
        </div>
        <APIForm/>
      </div>

      {error && (
        <div className="error-container">
          <div className="error-message">
            <p className="error-title">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="loading-container">
          <div className="spinner-container">
            <div className="spinner"></div>
            <div className="spinner spinner-delayed"></div>
          </div>
          <span className="loading-text">Processing your data...</span>
        </div>
      )}

      {chartData && (
        <div className="charts-grid">
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
              <div key={index} className="chart-card">
                <h2 className="chart-title">{chart.type}</h2>
                <div className="chart-wrapper">
                  <div className="canvas-container">
                    <canvas 
                      ref={chartRefs[chartId]} 
                      id={chartId}
                      className="chart-canvas"
                    ></canvas>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChartVisualizer2;
import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
Chart.register(...registerables);

const ChartVisualizer = () => {
  const [file, setFile] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [error, setError] = useState(null);

  // Refs for chart canvases
  const salesByMonthRef = useRef(null);
  const salesOverTimeRef = useRef(null);
  const salesByCountryRef = useRef(null);
  const quantityVsSalesRef = useRef(null);
  const salesByProductLineRef = useRef(null);

  // Chart instances to manage
  const chartInstances = useRef([]);

  // Handle file input change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  // Upload and process file
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    // Clear any existing charts
    chartInstances.current.forEach(chart => chart.destroy());
    chartInstances.current = [];

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/process-dataset/', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      setChartData(result.analysis.visualizations);
      setRawData(result);
      setError(null);
    } catch (err) {
      setError('Error uploading file: ' + err.message);
      setChartData(null);
    }
  };

  // Render charts when data is received
  useEffect(() => {
    // Destroy existing charts
    chartInstances.current.forEach(chart => chart.destroy());
    chartInstances.current = [];

    if (chartData) {
      chartData.forEach((viz, index) => {
        let canvasRef, canvasId;
        switch(viz.type) {
          case 'Bar Chart':
            canvasRef = salesByMonthRef;
            canvasId = 'salesByMonth';
            break;
          case 'Line Chart':
            canvasRef = salesOverTimeRef;
            canvasId = 'salesOverTime';
            break;
          case 'Pie Chart':
            canvasRef = salesByCountryRef;
            canvasId = 'salesByCountry';
            break;
          case 'Scatter Plot':
            canvasRef = quantityVsSalesRef;
            canvasId = 'quantityVsSales';
            break;
          case 'Doughnut Chart':
            canvasRef = salesByProductLineRef;
            canvasId = 'salesByProductLine';
            break;
          default:
            return;
        }

        if (canvasRef.current) {
          try {
            // Create a function to execute the chart code
            // eslint-disable-next-line no-new-func
            const chartFunction = new Function('data', 'Chart', viz.code);
            
            // Get the canvas context
            const ctx = canvasRef.current.getContext('2d');
            
            // Create the chart with the actual data from the backend
            chartFunction(rawData?.analysis?.datasets || [], Chart);
          } catch (err) {
            console.error(`Error creating ${viz.type}:`, err);
          }
        }
      });
    }
  }, [chartData, rawData]);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
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
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Upload and Process
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          {error}
        </div>
      )}

      {chartData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border p-2">
            <h2 className="text-xl font-bold mb-2">Sales by Month</h2>
            <canvas 
              ref={salesByMonthRef} 
              id="salesByMonth" 
              className="max-w-full h-64"
            ></canvas>
          </div>
          <div className="border p-2">
            <h2 className="text-xl font-bold mb-2">Sales Over Time</h2>
            <canvas 
              ref={salesOverTimeRef} 
              id="salesOverTime" 
              className="max-w-full h-64"
            ></canvas>
          </div>
          <div className="border p-2">
            <h2 className="text-xl font-bold mb-2">Sales by Country</h2>
            <canvas 
              ref={salesByCountryRef} 
              id="salesByCountry" 
              className="max-w-full h-64"
            ></canvas>
          </div>
          <div className="border p-2">
            <h2 className="text-xl font-bold mb-2">Quantity vs Sales</h2>
            <canvas 
              ref={quantityVsSalesRef} 
              id="quantityVsSales" 
              className="max-w-full h-64"
            ></canvas>
          </div>
          <div className="border p-2">
            <h2 className="text-xl font-bold mb-2">Sales by Product Line</h2>
            <canvas 
              ref={salesByProductLineRef} 
              id="salesByProductLine" 
              className="max-w-full h-64"
            ></canvas>
          </div>
        </div>
      )}

      {/* Debug information */}
      {rawData && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Debug Information</h3>
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ChartVisualizer;


import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'chart.js/auto';
import './MonthlySummary.css';

const chartData = [
  {
    month: 'January 2025',
    barColor: '#7ed957',
    pieColors: ['#7ed957', '#ffd600', '#ff6b6b', '#4bc0c0'],
    values: [5000, 6500, 4500, 2500], // Total liters per fuel type
  },
  {
    month: 'December 2024',
    barColor: '#ffd600',
    pieColors: ['#ffd600', '#7ed957', '#ff6b6b', '#4bc0c0'],
    values: [7000, 6500, 3000, 1800],
  },
];

const fuelTypes = [
  'Lanka Petrol 92 Octane',
  'Lanka Petrol 95 Octane',
  'Lanka Auto Diesel',
  'Lanka Super Diesel',
];

const MonthlySummary = ({ onClose }) => {
  const barChartRefs = useRef(chartData.map(() => React.createRef()));
  const pieChartRefs = useRef(chartData.map(() => React.createRef()));

  useEffect(() => {
    chartData.forEach((data, idx) => {
      // Bar Chart
      const barCtx = barChartRefs.current[idx].current.getContext('2d');
      const existingBarChart = Chart.getChart(barCtx);
      if (existingBarChart) existingBarChart.destroy();

      new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: fuelTypes,
          datasets: [{
            data: data.values,
            backgroundColor: data.barColor,
            borderColor: '#222',
            borderWidth: 2,
            barThickness: 40,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#333', titleFont: { size: 14 }, bodyFont: { size: 12 }, padding: 10 },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Liters (ℓ)', font: { size: 16, weight: 'bold' } },
              grid: { color: '#444' },
              ticks: { color: '#222' },
            },
            x: {
              title: { display: true, text: 'Fuel Type', font: { size: 13 } },
              grid: { display: false },
              ticks: {
                color: '#222',
                callback: function(value) { return fuelTypes[value].split(' ').join('\n'); },
              },
            },
          },
        },
      });

      // Pie Chart
      const pieCtx = pieChartRefs.current[idx].current.getContext('2d');
      const existingPieChart = Chart.getChart(pieCtx);
      if (existingPieChart) existingPieChart.destroy();

      new Chart(pieCtx, {
        type: 'pie',
        data: {
          labels: fuelTypes,
          datasets: [{
            data: data.values,
            backgroundColor: data.pieColors,
            borderColor: '#222',
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { font: { size: 12 }, color: '#222' } },
            tooltip: { backgroundColor: '#333', titleFont: { size: 14 }, bodyFont: { size: 12 }, padding: 10 },
          },
        },
      });
    });

    return () => {
      barChartRefs.current.forEach((ref) => { const chart = Chart.getChart(ref.current); if (chart) chart.destroy(); });
      pieChartRefs.current.forEach((ref) => { const chart = Chart.getChart(ref.current); if (chart) chart.destroy(); });
    };
  }, []);

  return (
    <div className="monthly-summary-container">
      <div className="summary-header-bar">
        <span>Sri Lanka Ceypetco Fuel Station</span>
        <Link to="/Summary"><button className="close-btn" onClick={onClose}>x</button></Link>
      </div>
      <div className="summary-title">Monthly Summary</div>
      {chartData.map((data, idx) => (
        <div className="summary-chart-section" key={data.month}>
          <div className="summary-chart-row">
            <div className="chart-container">
              <h3>Bar Chart - {data.month}</h3>
              <canvas ref={barChartRefs.current[idx]} />
            </div>
            <div className="chart-container">
              <h3>Pie Chart - {data.month}</h3>
              <canvas ref={pieChartRefs.current[idx]} />
            </div>
          </div>
          <div className="summary-chart-date">{data.month}</div>
        </div>
      ))}
    </div>
  );
};

export default MonthlySummary;
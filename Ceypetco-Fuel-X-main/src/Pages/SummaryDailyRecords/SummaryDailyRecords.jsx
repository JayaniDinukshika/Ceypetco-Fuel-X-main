import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { Link } from 'react-router-dom';
import './SummaryDailyRecords.css';

const chartData = [
  {
    date: '20/01/2025',
    barColor: '#7ed957',
    pieColors: ['#7ed957', '#ffd600', '#ff6b6b', '#4bc0c0'],
    bars: [50, 65, 45, 25],
  },
  {
    date: '19/01/2025',
    barColor: '#ffd600',
    pieColors: ['#ffd600', '#7ed957', '#ff6b6b', '#4bc0c0'],
    bars: [70, 65, 30, 18],
  },
];

const fuelTypes = [
  'Lanka Petrol 92 Octane',
  'Lanka Petrol 95 Octane',
  'Lanka Auto Diesel',
  'Lanka Super Diesel',
];

const SummaryDailyRecords = ({ onClose }) => {
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
            data: data.bars,
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
            tooltip: {
              backgroundColor: '#333',
              titleFont: { size: 14 },
              bodyFont: { size: 12 },
              padding: 10,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Liters (ℓ)',
                font: { size: 16, weight: 'bold' },
              },
              grid: { color: '#444' },
              ticks: { color: '#222' },
            },
            x: {
              title: {
                display: true,
                text: 'Fuel Type',
                font: { size: 13 },
              },
              grid: { display: false },
              ticks: {
                color: '#222',
                callback: function(value) {
                  return fuelTypes[value].split(' ').join('\n');
                },
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
            data: data.bars,
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
            tooltip: {
              backgroundColor: '#333',
              titleFont: { size: 14 },
              bodyFont: { size: 12 },
              padding: 10,
            },
          },
        },
      });
    });

    return () => {
      barChartRefs.current.forEach((ref) => {
        const chart = Chart.getChart(ref.current);
        if (chart) chart.destroy();
      });
      pieChartRefs.current.forEach((ref) => {
        const chart = Chart.getChart(ref.current);
        if (chart) chart.destroy();
      });
    };
  }, []);

  return (
    <div className="summary-records-container">
      <div className="summary-header-bar">
        <span>Sri Lanka Ceypetco Fuel Station</span>
        <Link to="/Summary">
          <button className="close-btn" onClick={onClose}>x</button>
        </Link>
      </div>
      <div className="summary-title">Daily Records</div>
      {chartData.map((data, idx) => (
        <div className="summary-chart-section" key={data.date}>
          <div className="summary-chart-row">
            <div className="chart-container">
              <h3>Bar Chart - {data.date}</h3>
              <canvas ref={barChartRefs.current[idx]} />
            </div>
            <div className="chart-container">
              <h3>Pie Chart - {data.date}</h3>
              <canvas ref={pieChartRefs.current[idx]} />
            </div>
          </div>
          <div className="summary-chart-date">{data.date}</div>
        </div>
      ))}
    </div>
  );
};

export default SummaryDailyRecords;
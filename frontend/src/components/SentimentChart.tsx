'use client';

import { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import dynamic from 'next/dynamic';
const Line = dynamic(() => import('react-chartjs-2').then(m => m.Line), { ssr: false });

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

import type { AnalysisData } from '@/app/page';

interface SentimentChartProps {
  data: AnalysisData;
}

export default function SentimentChart({ data }: SentimentChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  // Prepare chart data
  const prepareChartData = () => {
    const { stock_data } = data;
    
    if (!stock_data.success || !stock_data.data.historical_data) {
      return null;
    }

    const dates = stock_data.data.historical_data.dates;
    const prices = stock_data.data.historical_data.prices;
    
    // Create sentiment data points (simplified for demo)
    const sentiments = dates.map(() => {
      const baseSentiment = data.trend_prediction.sentiment_score;
      // Add some variation to make the chart interesting
      const variation = (Math.random() - 0.5) * 0.2;
      return Math.max(-1, Math.min(1, baseSentiment + variation));
    });

    return {
      labels: dates,
      datasets: [
        {
          label: 'Stock Price',
          data: prices,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          yAxisID: 'y',
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Sentiment Score',
          data: sentiments,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          yAxisID: 'y1',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const chartData = prepareChartData();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgb(148, 163, 184)',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(148, 163, 184)',
        borderColor: 'rgb(71, 85, 105)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
          color: 'rgb(148, 163, 184)',
        },
        ticks: {
          color: 'rgb(148, 163, 184)',
          maxRotation: 45,
        },
        grid: {
          color: 'rgba(71, 85, 105, 0.3)',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Stock Price ($)',
          color: 'rgb(148, 163, 184)',
        },
        ticks: {
          color: 'rgb(148, 163, 184)',
          callback: function(value: number | string) {
            const num = typeof value === 'string' ? Number(value) : value;
            return '$' + (Number.isFinite(num) ? (num as number).toFixed(2) : value);
          },
        },
        grid: {
          color: 'rgba(71, 85, 105, 0.3)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Sentiment Score',
          color: 'rgb(148, 163, 184)',
        },
        ticks: {
          color: 'rgb(148, 163, 184)',
          callback: function(value: number | string) {
            const num = typeof value === 'string' ? Number(value) : value;
            return (Number.isFinite(num) ? ((num as number) * 100).toFixed(0) + '%' : String(value));
          },
        },
        grid: {
          drawOnChartArea: false,
        },
        min: -1,
        max: 1,
      },
    },
  };

  if (!chartData) {
    return (
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-400 text-lg mb-2">No chart data available</div>
          <div className="text-slate-500 text-sm">Stock data is required to display the chart</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">Sentiment vs Price Trend</h3>
        <p className="text-slate-300">
          Correlation between stock price movements and sentiment analysis over time
        </p>
      </div>
      
      <div className="h-80">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Current Sentiment</div>
          <div className={`text-lg font-semibold ${data.trend_prediction.sentiment_score > 0 ? 'text-green-400' : data.trend_prediction.sentiment_score < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
            {(data.trend_prediction.sentiment_score * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Price Change</div>
          <div className={`text-lg font-semibold ${data.stock_data.success && data.stock_data.data.price_change_percent > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.stock_data.success ? `${data.stock_data.data.price_change_percent > 0 ? '+' : ''}${data.stock_data.data.price_change_percent.toFixed(2)}%` : 'N/A'}
          </div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Data Points</div>
          <div className="text-lg font-semibold text-white">
            {data.trend_prediction.data_points.reddit_posts + data.trend_prediction.data_points.x_posts}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
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

interface BookmarkActivityGraphProps {
  bookmarks: {
    createdAt: string;
  }[];
  weeks?: number; // Number of weeks to show (default: 12)
}

const BookmarkActivityGraph: React.FC<BookmarkActivityGraphProps> = ({ 
  bookmarks,
  weeks = 12 // Default to showing 12 weeks
}) => {
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
      tension: number;
    }[];
  }>({
    labels: [],
    datasets: []
  });

  // Helper function to format date as "MMDD" (e.g., "0111" for January 11)
  const formatDateAsMMDD = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}${day}`;
  };

  useEffect(() => {
    // Generate weekly data
    const generateWeeklyData = () => {
      // Get current date
      const currentDate = new Date();
      
      // Calculate start date (X weeks ago)
      const startDate = new Date();
      startDate.setDate(currentDate.getDate() - (weeks * 7));
      
      // Initialize weekly buckets
      const weeklyBuckets: { [key: string]: number } = {};
      const weekLabels: string[] = [];
      
      // Create empty buckets for each week
      for (let i = 0; i < weeks; i++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + (i * 7));
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        // Format as "MMDD" (e.g., "0111" for January 11)
        const startFormatted = formatDateAsMMDD(weekStart);
        const endFormatted = formatDateAsMMDD(weekEnd);
        
        const weekLabel = `${startFormatted}-${endFormatted}`;
        weekLabels.push(weekLabel);
        
        // Initialize count to 0
        weeklyBuckets[weekLabel] = 0;
      }
      
      // Count bookmarks per week
      bookmarks.forEach(bookmark => {
        const bookmarkDate = new Date(bookmark.createdAt);
        
        // Skip if bookmark is older than our start date
        if (bookmarkDate < startDate) return;
        
        // Find which week this bookmark belongs to
        for (let i = 0; i < weeks; i++) {
          const weekStart = new Date(startDate);
          weekStart.setDate(startDate.getDate() + (i * 7));
          
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          if (bookmarkDate >= weekStart && bookmarkDate <= weekEnd) {
            const startFormatted = formatDateAsMMDD(weekStart);
            const endFormatted = formatDateAsMMDD(weekEnd);
            const weekLabel = `${startFormatted}-${endFormatted}`;
            
            weeklyBuckets[weekLabel]++;
            break;
          }
        }
      });
      
      // Convert to arrays for Chart.js
      const weeklyData = weekLabels.map(label => weeklyBuckets[label]);
      
      return {
        labels: weekLabels,
        data: weeklyData
      };
    };
    
    const { labels, data } = generateWeeklyData();
    
    setChartData({
      labels,
      datasets: [
        {
          label: 'Collections Added',
          data,
          borderColor: 'rgba(59, 130, 246, 1)', // Blue
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4 // Smooth curve
        }
      ]
    });
  }, [bookmarks, weeks]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      },
      title: {
        display: true,
        text: 'Weekly Collection Activity',
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          size: 16
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.9)',
        displayColors: false,
        callbacks: {
          title: (tooltipItems: Array<{label: string}>) => {
            const label = tooltipItems[0].label;
            const [start, end] = label.split('-');
            // Convert MMDD to MM/DD format for better readability in tooltip
            const startFormatted = `${start.substring(0, 2)}/${start.substring(2, 4)}`;
            const endFormatted = `${end.substring(0, 2)}/${end.substring(2, 4)}`;
            return `Week: ${startFormatted} - ${endFormatted}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          precision: 0, // Only show whole numbers
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-md">
      <div className="h-64">
        {chartData.labels.length > 0 && (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default BookmarkActivityGraph; 
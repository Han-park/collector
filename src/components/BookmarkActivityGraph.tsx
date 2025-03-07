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
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [] as {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
      tension: number;
      pointRadius: number;
      pointHoverRadius: number;
      borderWidth: number;
    }[]
  });

  // Helper function to format date as "MMDD" (e.g., "0111" for January 11)
  const formatDateAsMMDD = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}${day}`;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server-side

    try {
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
        if (bookmarks && Array.isArray(bookmarks) && bookmarks.length > 0) {
          bookmarks.forEach(bookmark => {
            if (!bookmark || !bookmark.createdAt) return;
            
            try {
              const bookmarkDate = new Date(bookmark.createdAt);
              if (isNaN(bookmarkDate.getTime())) return; // Skip invalid dates
              
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
            } catch (err) {
              console.error('Error processing bookmark date:', err);
            }
          });
        }
        
        // Convert to arrays for Chart.js
        const weeklyData = weekLabels.map(label => weeklyBuckets[label] || 0);
        
        return {
          labels: weekLabels,
          data: weeklyData
        };
      };
      
      const { labels, data } = generateWeeklyData();
      
      // Only update chart data if we have valid labels and data
      if (labels && labels.length > 0) {
        // For line charts, we need special handling for sparse data
        // If we have only one data point, we'll duplicate it to avoid bezier curve issues
        let chartData = [...data];
        let chartLabels = [...labels];
        
        // If we have only one data point, duplicate it to avoid bezier curve issues
        if (data.length === 1) {
          chartData = [data[0], data[0]];
          chartLabels = [labels[0], labels[0]];
        }
        
        // If we have no data points, create dummy data
        if (data.length === 0) {
          chartData = [0, 0];
          chartLabels = ['No Data', 'No Data'];
        }
        
        setChartData({
          labels: chartLabels,
          datasets: [
            {
              label: 'Bookmarks Added',
              data: chartData,
              borderColor: 'rgba(59, 130, 246, 1)', // Blue
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.1, // Very low tension to avoid extreme curves
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error generating chart data:', error);
    }
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
        text: 'Weekly Bookmark Activity',
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
            if (!tooltipItems || !tooltipItems[0] || !tooltipItems[0].label) {
              return 'Unknown Week';
            }
            
            const label = tooltipItems[0].label;
            
            // Simple fallback approach without try/catch
            const parts = label.split('-');
            if (parts.length !== 2) {
              return 'Week: ' + label;
            }
            
            const [start, end] = parts;
            
            // Safely extract substrings with fallbacks
            const startMonth = start.length >= 2 ? start.substring(0, 2) : '??';
            const startDay = start.length >= 4 ? start.substring(2, 4) : '??';
            const endMonth = end.length >= 2 ? end.substring(0, 2) : '??';
            const endDay = end.length >= 4 ? end.substring(2, 4) : '??';
            
            return `Week: ${startMonth}/${startDay} - ${endMonth}/${endDay}`;
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
        {chartData.labels.length > 0 && chartData.datasets[0]?.data.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No bookmark activity data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarkActivityGraph; 
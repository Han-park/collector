'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components - using Bar chart instead of Line chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
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
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
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
        setChartData({
          labels,
          datasets: [
            {
              label: 'Bookmarks Added',
              data,
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1
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
            
            try {
              const label = tooltipItems[0].label;
              const [start, end] = label.split('-');
              // Convert MMDD to MM/DD format for better readability in tooltip
              const startFormatted = `${start.substring(0, 2)}/${start.substring(2, 4)}`;
              const endFormatted = `${end.substring(0, 2)}/${end.substring(2, 4)}`;
              return `Week: ${startFormatted} - ${endFormatted}`;
            } catch (err) {
              return 'Week: ' + tooltipItems[0].label;
            }
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
          <Bar data={chartData} options={options} />
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
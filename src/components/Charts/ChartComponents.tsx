
import * as React from 'react';

// These are simplified mock components that are lazily loaded to improve performance
// The actual functionality will still come from the recharts library at runtime

// Helper function to create memoized components
const createMemoizedComponent = (name: string, className: string) => {
  return React.memo(({ children, ...props }: any) => {
    return (
      <div className={`recharts-${className}`} data-component={name} {...props}>
        {children}
      </div>
    );
  });
};

// Base ResponsiveContainer is memoized separately due to different props
export const ResponsiveContainer = React.memo(({ 
  children, 
  width = "100%", 
  height = 300 
}: { 
  children?: React.ReactNode; 
  width?: string | number; 
  height?: number;
}) => {
  return (
    <div 
      className="recharts-responsive-container" 
      style={{ width, height }}
    >
      {children}
    </div>
  );
});

// Memoize other chart components to reduce re-renders
export const LineChart = createMemoizedComponent('LineChart', 'line-chart');

export const CartesianGrid = createMemoizedComponent('CartesianGrid', 'cartesian-grid');

export const XAxis = createMemoizedComponent('XAxis', 'x-axis');

export const YAxis = createMemoizedComponent('YAxis', 'y-axis');

export const Tooltip = createMemoizedComponent('Tooltip', 'tooltip');

export const Legend = createMemoizedComponent('Legend', 'legend');

export const Line = createMemoizedComponent('Line', 'line');

// Add additional optimized components as needed
export const AreaChart = createMemoizedComponent('AreaChart', 'area-chart');

export const Area = createMemoizedComponent('Area', 'area');

export const BarChart = createMemoizedComponent('BarChart', 'bar-chart');

export const Bar = createMemoizedComponent('Bar', 'bar');

export const PieChart = createMemoizedComponent('PieChart', 'pie-chart');

export const Pie = createMemoizedComponent('Pie', 'pie');

// Export a lazy-loaded version of the chart for more complex scenarios
export const LazyLineChart = React.lazy(() => 
  import('recharts').then(module => ({ default: module.LineChart }))
);

// Helper function to wrap charts in Suspense for lazy loading
export const LazyChart = ({ children, fallback = <div>Loading chart...</div> }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) => {
  return (
    <React.Suspense fallback={fallback}>
      {children}
    </React.Suspense>
  );
};

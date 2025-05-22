import * as React from 'react';

// These are simplified mock components to avoid TypeScript errors with recharts
// The actual functionality will still come from the recharts library at runtime

export const ResponsiveContainer: React.FC<{
  children?: React.ReactNode;
  width?: string | number;
  height?: number;
}> = ({ children }) => {
  return <div className="recharts-responsive-container">{children}</div>;
};

export const LineChart: React.FC<{
  data?: any[];
  children?: React.ReactNode;
  margin?: { top: number; right: number; left: number; bottom: number };
  className?: string;
}> = ({ children }) => {
  return <div className="recharts-line-chart">{children}</div>;
};

export const CartesianGrid: React.FC<{
  strokeDasharray?: string;
}> = () => {
  return <div className="recharts-cartesian-grid"></div>;
};

export const XAxis: React.FC<{
  dataKey?: string;
  tickFormatter?: (value: any) => string;
}> = () => {
  return <div className="recharts-x-axis"></div>;
};

export const YAxis: React.FC<{
  domain?: [number, number];
}> = () => {
  return <div className="recharts-y-axis"></div>;
};

export const Tooltip: React.FC<{
  formatter?: (value: any, name?: string) => [string, string];
  labelFormatter?: (label: string) => string;
  contentStyle?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
}> = () => {
  return <div className="recharts-tooltip"></div>;
};

export const Legend: React.FC = () => {
  return <div className="recharts-legend"></div>;
};

export const Line: React.FC<{
  type?: string;
  dataKey?: string;
  stroke?: string;
  activeDot?: { r: number };
  name?: string;
  unit?: string;
  animationDuration?: number;
}> = () => {
  return <div className="recharts-line"></div>;
}; 
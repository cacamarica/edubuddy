
import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white';
}

export const Spinner = ({
  size = 'md',
  color = 'primary',
  className,
  ...props
}: SpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };
  
  const colorClasses = {
    primary: 'border-eduPurple border-t-transparent',
    white: 'border-white border-t-transparent',
  };
  
  return (
    <div
      className={cn(
        "animate-spin rounded-full",
        sizeClasses[size], 
        colorClasses[color],
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

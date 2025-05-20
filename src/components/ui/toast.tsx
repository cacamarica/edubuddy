import React, { useEffect, useState } from 'react';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';

const toastVariants = cva(
  "fixed shadow-lg rounded-lg p-4 transition-all duration-300 flex items-start gap-3 max-w-md",
  {
    variants: {
      position: {
        topRight: "top-4 right-4",
        topLeft: "top-4 left-4",
        bottomRight: "bottom-4 right-4",
        bottomLeft: "bottom-4 left-4",
      },
      variant: {
        default: "bg-white border border-gray-200 text-gray-800",
        destructive: "bg-red-50 border border-red-200 text-red-900",
        success: "bg-green-50 border border-green-200 text-green-900",
      },
      visible: {
        true: "translate-y-0 opacity-100",
        false: "translate-y-4 opacity-0 pointer-events-none",
      },
    },
    defaultVariants: {
      position: "topRight",
      variant: "default",
      visible: true,
    },
  }
);

interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  position?: 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft';
  visible: boolean;
  onDismiss: (id: string) => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  variant = 'default',
  position = 'topRight',
  visible,
  onDismiss,
  duration = 5000,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (visible) {
      // Start the progress timer for auto-dismiss
      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(newProgress);
        
        if (newProgress <= 0) {
          clearInterval(timer);
        }
      }, 16);
      
      return () => clearInterval(timer);
    }
  }, [visible, duration]);

  return (
    <div
      className={toastVariants({ variant, position, visible })}
      style={{ zIndex: 9999 }}
      role="alert"
    >
      <div className="flex-1">
        <div className="font-medium mb-1">{title}</div>
        {description && <div className="text-sm opacity-90">{description}</div>}
        <div className="h-1 w-full bg-gray-200 mt-2 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${
              variant === 'destructive' ? 'bg-red-500' : 
              variant === 'success' ? 'bg-green-500' : 
              'bg-eduPurple'
            }`} 
            style={{ width: `${progress}%`, transition: 'width 0.1s linear' }} 
          />
        </div>
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="text-gray-500 hover:text-gray-700 flex-shrink-0 h-5 w-5 flex items-center justify-center rounded-full hover:bg-gray-100"
        aria-label="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
};

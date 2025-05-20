import React from 'react';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';

const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          visible={toast.visible}
          onDismiss={dismissToast}
          duration={toast.duration}
        />
      ))}
    </>
  );
};

export default ToastContainer; 
import { createContext, useContext, ReactNode } from 'react';

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const success = (message: string) => {
    console.log('Success:', message);
  };

  const error = (message: string) => {
    console.error('Error:', message);
  };

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};


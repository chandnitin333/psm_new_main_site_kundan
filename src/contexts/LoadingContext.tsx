import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import Loader from '../components/common/Loader';

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadingText: string;
  setLoadingText: (text: string) => void;
  showLoader: (text?: string) => void;
  hideLoader: () => void;
  loaderType: 'spinner' | 'dots' | 'pulse' | 'bars' | 'circle' | 'squares' | 'wave' | 'bounce' | 'ring' | 'dual-ring';
  loaderColor: string;
  setLoaderConfig: (type: string, color: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

// Helper function to get loader config from localStorage
const getLoaderConfig = () => {
  const config = localStorage.getItem('loaderConfig');
  if (config) {
    try {
      return JSON.parse(config);
    } catch (e) {
      console.error('Error parsing loader config:', e);
    }
  }
  return { type: 'dots', color: 'primary-600' }; // Default values
};

export const LoadingProvider = ({ children }: LoadingProviderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading');
  const [loaderType, setLoaderType] = useState<'spinner' | 'dots' | 'pulse' | 'bars' | 'circle' | 'squares' | 'wave' | 'bounce' | 'ring' | 'dual-ring'>('dots');
  const [loaderColor, setLoaderColor] = useState('primary-600');

  // Load loader configuration from localStorage on mount
  useEffect(() => {
    const config = getLoaderConfig();
    setLoaderType(config.type);
    setLoaderColor(config.color);
  }, []);

  const showLoader = (text: string = 'Loading') => {
    setLoadingText(text);
    setIsLoading(true);
  };

  const hideLoader = () => {
    setIsLoading(false);
  };

  // Function to update loader configuration and save to localStorage
  const setLoaderConfig = (type: string, color: string) => {
    const validType = type as 'spinner' | 'dots' | 'pulse' | 'bars' | 'circle' | 'squares' | 'wave' | 'bounce' | 'ring' | 'dual-ring';
    setLoaderType(validType);
    setLoaderColor(color);
    localStorage.setItem('loaderConfig', JSON.stringify({ type, color }));
  };

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        setIsLoading,
        loadingText,
        setLoadingText,
        showLoader,
        hideLoader,
        loaderType,
        loaderColor,
        setLoaderConfig,
      }}
    >
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <Loader type={loaderType} text={loadingText} size="large" color={loaderColor} />
        </div>
      )}
    </LoadingContext.Provider>
  );
};

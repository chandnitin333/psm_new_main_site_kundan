import { useEffect, useState } from 'react';

export interface LoaderProps {
  text?: string;
  type?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'circle' | 'squares' | 'wave' | 'bounce' | 'ring' | 'dual-ring';
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const Loader = ({
  text = 'Loading...',
  type = 'spinner',
  size = 'medium',
  color = 'primary-600'
}: LoaderProps) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const colorClass = `text-${color}`;

  const renderLoader = () => {
    const baseSize = sizeClasses[size];

    switch (type) {
      case 'spinner':
        return (
          <div className={`${baseSize} border-4 border-gray-200 dark:border-gray-700 border-t-4 border-t-${color} rounded-full animate-spin`}></div>
        );

      case 'dots':
        return (
          <div className="flex space-x-2">
            <div className={`w-3 h-3 bg-${color} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`w-3 h-3 bg-${color} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
            <div className={`w-3 h-3 bg-${color} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          </div>
        );

      case 'pulse':
        return (
          <div className={`${baseSize} bg-${color} rounded-full animate-pulse`}></div>
        );

      case 'bars':
        return (
          <div className="flex items-end space-x-1 h-12">
            <div className={`w-2 bg-${color} rounded animate-pulse`} style={{ height: '60%', animationDelay: '0ms' }}></div>
            <div className={`w-2 bg-${color} rounded animate-pulse`} style={{ height: '80%', animationDelay: '150ms' }}></div>
            <div className={`w-2 bg-${color} rounded animate-pulse`} style={{ height: '100%', animationDelay: '300ms' }}></div>
            <div className={`w-2 bg-${color} rounded animate-pulse`} style={{ height: '80%', animationDelay: '450ms' }}></div>
            <div className={`w-2 bg-${color} rounded animate-pulse`} style={{ height: '60%', animationDelay: '600ms' }}></div>
          </div>
        );

      case 'circle':
        return (
          <div className={`${baseSize} relative`}>
            <div className={`absolute inset-0 border-4 border-${color} opacity-25 rounded-full`}></div>
            <div className={`absolute inset-0 border-4 border-transparent border-t-${color} rounded-full animate-spin`}></div>
          </div>
        );

      case 'squares':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div className={`w-6 h-6 bg-${color} animate-pulse`} style={{ animationDelay: '0ms' }}></div>
            <div className={`w-6 h-6 bg-${color} animate-pulse`} style={{ animationDelay: '150ms' }}></div>
            <div className={`w-6 h-6 bg-${color} animate-pulse`} style={{ animationDelay: '300ms' }}></div>
            <div className={`w-6 h-6 bg-${color} animate-pulse`} style={{ animationDelay: '450ms' }}></div>
          </div>
        );

      case 'wave':
        return (
          <div className="flex items-center space-x-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-2 h-8 bg-${color} rounded-full animate-pulse`}
                style={{
                  animationDelay: `${i * 100}ms`,
                  animationDuration: '1s'
                }}
              ></div>
            ))}
          </div>
        );

      case 'bounce':
        return (
          <div className="flex space-x-2">
            <div className={`w-4 h-4 bg-${color} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`w-4 h-4 bg-${color} rounded-full animate-bounce`} style={{ animationDelay: '100ms' }}></div>
            <div className={`w-4 h-4 bg-${color} rounded-full animate-bounce`} style={{ animationDelay: '200ms' }}></div>
            <div className={`w-4 h-4 bg-${color} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          </div>
        );

      case 'ring':
        return (
          <div className={`${baseSize} relative`}>
            <div className={`absolute inset-0 border-4 border-${color} rounded-full animate-ping opacity-75`}></div>
            <div className={`absolute inset-0 border-4 border-${color} rounded-full`}></div>
          </div>
        );

      case 'dual-ring':
        return (
          <div className={`${baseSize} relative`}>
            <div className={`absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full`}></div>
            <div className={`absolute inset-0 border-4 border-transparent border-t-${color} border-l-${color} rounded-full animate-spin`}></div>
          </div>
        );

      default:
        return (
          <div className={`${baseSize} border-4 border-gray-200 dark:border-gray-700 border-t-4 border-t-${color} rounded-full animate-spin`}></div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {renderLoader()}
      {text && (
        <p className={`${textSizeClasses[size]} ${colorClass} font-medium dark:text-gray-200`}>
          {text}{dots}
        </p>
      )}
    </div>
  );
};

export default Loader;

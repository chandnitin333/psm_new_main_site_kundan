import { useEffect, useState } from 'react';

export interface LoaderProps {
  text?: string;
  type?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'circle' | 'squares' | 'wave' | 'bounce' | 'ring' | 'dual-ring';
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const LOADER_COLOR = '#F59C0C';

const Loader = ({
  text = 'Loading...',
  type = 'spinner',
  size = 'medium',
}: LoaderProps) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const sizeMap = { small: 32, medium: 48, large: 64 };
  const px = sizeMap[size];

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return (
          <div
            className="rounded-full animate-spin"
            style={{ width: px, height: px, border: '4px solid #e5e7eb', borderTopColor: LOADER_COLOR }}
          />
        );

      case 'dots':
        return (
          <div className="flex space-x-2">
            {[0, 150, 300].map((delay) => (
              <div
                key={delay}
                className="w-3 h-3 rounded-full animate-bounce"
                style={{ backgroundColor: LOADER_COLOR, animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div
            className="rounded-full animate-pulse"
            style={{ width: px, height: px, backgroundColor: LOADER_COLOR }}
          />
        );

      case 'bars':
        return (
          <div className="flex items-end space-x-1 h-12">
            {[60, 80, 100, 80, 60].map((h, i) => (
              <div
                key={i}
                className="w-2 rounded animate-pulse"
                style={{ height: `${h}%`, backgroundColor: LOADER_COLOR, animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        );

      case 'circle':
        return (
          <div className="relative" style={{ width: px, height: px }}>
            <div className="absolute inset-0 rounded-full opacity-25" style={{ border: `4px solid ${LOADER_COLOR}` }} />
            <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '4px solid transparent', borderTopColor: LOADER_COLOR }} />
          </div>
        );

      case 'squares':
        return (
          <div className="grid grid-cols-2 gap-2">
            {[0, 150, 300, 450].map((delay) => (
              <div
                key={delay}
                className="w-6 h-6 animate-pulse"
                style={{ backgroundColor: LOADER_COLOR, animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        );

      case 'wave':
        return (
          <div className="flex items-center space-x-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 h-8 rounded-full animate-pulse"
                style={{ backgroundColor: LOADER_COLOR, animationDelay: `${i * 100}ms`, animationDuration: '1s' }}
              />
            ))}
          </div>
        );

      case 'bounce':
        return (
          <div className="flex space-x-2">
            {[0, 100, 200, 300].map((delay) => (
              <div
                key={delay}
                className="w-4 h-4 rounded-full animate-bounce"
                style={{ backgroundColor: LOADER_COLOR, animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        );

      case 'ring':
        return (
          <div className="relative" style={{ width: px, height: px }}>
            <div className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ border: `4px solid ${LOADER_COLOR}` }} />
            <div className="absolute inset-0 rounded-full" style={{ border: `4px solid ${LOADER_COLOR}` }} />
          </div>
        );

      case 'dual-ring':
        return (
          <div className="relative" style={{ width: px, height: px }}>
            <div className="absolute inset-0 rounded-full" style={{ border: '4px solid #e5e7eb' }} />
            <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '4px solid transparent', borderTopColor: LOADER_COLOR, borderLeftColor: LOADER_COLOR }} />
          </div>
        );

      default:
        return (
          <div
            className="rounded-full animate-spin"
            style={{ width: px, height: px, border: '4px solid #e5e7eb', borderTopColor: LOADER_COLOR }}
          />
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {renderLoader()}
      {text && (
        <p className={`${textSizeClasses[size]} font-medium`} style={{ color: LOADER_COLOR }}>
          {text}{dots}
        </p>
      )}
    </div>
  );
};

export default Loader;

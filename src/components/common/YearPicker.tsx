import { useState, useRef, useEffect, forwardRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface YearPickerProps {
  value: string;
  onChange: (year: string) => void;
  placeholder?: string;
  className?: string;
  name?: string;
}

const YearPicker = forwardRef<HTMLInputElement, YearPickerProps>(
  ({ value, onChange, placeholder = 'वर्ष निवडा', className = '', name }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentDecade, setCurrentDecade] = useState(() => {
      const year = value ? parseInt(value) : new Date().getFullYear();
      return Math.floor(year / 10) * 10;
    });
    const [highlightedYear, setHighlightedYear] = useState(() => {
      return value ? parseInt(value) : new Date().getFullYear();
    });
    const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentYear = new Date().getFullYear();

  const handleYearSelect = (year: number) => {
    // Only allow selection of current year or past years
    if (year <= currentYear) {
      onChange(year.toString());
      setIsOpen(false);
    }
  };

  const goToPreviousDecade = () => {
    setCurrentDecade(prev => prev - 10);
  };

  const goToNextDecade = () => {
    // Only allow navigation if next decade has at least one valid year
    const nextDecade = currentDecade + 10;
    if (nextDecade <= currentYear) {
      setCurrentDecade(nextDecade);
    }
  };

  // Generate array of years for current decade (e.g., 2020-2029)
  const years = Array.from({ length: 10 }, (_, i) => currentDecade + i);

    // When dropdown opens, set highlighted year to current year or selected value
    useEffect(() => {
      if (isOpen) {
        const yearToHighlight = value ? parseInt(value) : new Date().getFullYear();
        setHighlightedYear(yearToHighlight);
        // Also update the decade to show the highlighted year
        setCurrentDecade(Math.floor(yearToHighlight / 10) * 10);
      }
    }, [isOpen, value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isOpen) {
          // Select the highlighted year only if it's not in the future
          if (highlightedYear <= currentYear) {
            onChange(highlightedYear.toString());
            setIsOpen(false);
          }
        } else {
          // Open dropdown
          setIsOpen(true);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'ArrowUp' && isOpen) {
        e.preventDefault();
        setHighlightedYear(prev => prev - 1);
      } else if (e.key === 'ArrowDown' && isOpen) {
        e.preventDefault();
        // Prevent navigating beyond current year
        setHighlightedYear(prev => prev < currentYear ? prev + 1 : prev);
      }
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <input
          type="text"
          name={name}
          ref={ref}
          value={value}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          readOnly
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer ${className}`}
          placeholder={placeholder}
        />

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
          {/* Header with navigation */}
          <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={goToPreviousDecade}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {currentDecade} - {currentDecade + 9}
            </span>
            <button
              type="button"
              onClick={goToNextDecade}
              disabled={currentDecade + 10 > currentYear}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Year grid */}
          <div className="grid grid-cols-2 gap-2 p-3 max-h-64 overflow-y-auto">
            {years.map((year) => {
              const isFutureYear = year > currentYear;
              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => handleYearSelect(year)}
                  disabled={isFutureYear}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isFutureYear
                      ? 'bg-gray-200 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : highlightedYear === year
                      ? 'bg-primary-600 text-white ring-2 ring-primary-400'
                      : value === year.toString()
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </div>
        )}
      </div>
    );
  }
);

YearPicker.displayName = 'YearPicker';

export default YearPicker;

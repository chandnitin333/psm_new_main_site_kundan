import { forwardRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY';

interface DatePickerProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  name?: string;
  min?: string;
  max?: string;
  format?: DateFormat;
  /** also pick a time — value is emitted as 'YYYY-MM-DD HH:mm:ss' */
  showTime?: boolean;
  /** with showTime: default time applied on the FIRST date pick (then user-editable). start=00:00, end=23:59 */
  defaultTime?: 'start' | 'end';
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      value,
      onChange,
      placeholder,
      required = false,
      disabled = false,
      error,
      className = '',
      name,
      min,
      max,
      format = 'DD/MM/YYYY',
      showTime = false,
      defaultTime,
    },
    ref
  ) => {
    // Convert format string to react-datepicker format
    const getDateFormat = (fmt: DateFormat): string => {
      const formatMap: Record<DateFormat, string> = {
        'DD/MM/YYYY': 'dd/MM/yyyy',
        'MM/DD/YYYY': 'MM/dd/yyyy',
        'YYYY-MM-DD': 'yyyy-MM-dd',
        'DD-MM-YYYY': 'dd-MM-yyyy',
        'MM-DD-YYYY': 'MM-dd-yyyy',
      };
      return formatMap[fmt] + (showTime ? ' HH:mm' : '');
    };

    // Convert ISO string to Date object
    const parseDate = (dateStr: string): Date | null => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    };

    // Convert Date object to ISO string (adds time when showTime is on)
    const formatDate = (date: Date | null): string => {
      if (!date) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      if (showTime) {
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hh}:${mm}:00`;
      }
      return `${year}-${month}-${day}`;
    };

    const handleChange = (date: Date | null) => {
      let d = date;
      // On the FIRST date pick (field was empty), snap to the default time.
      // Afterwards the value is set, so the user's chosen time is respected.
      if (showTime && d && defaultTime && !value) {
        d = new Date(d);
        if (defaultTime === 'start') d.setHours(0, 0, 0, 0);
        else d.setHours(23, 59, 0, 0);
      }
      onChange?.(formatDate(d));
    };

    const selectedDate = parseDate(value || '');
    const minDate = parseDate(min || '');
    const maxDate = parseDate(max || '');

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <ReactDatePicker
            ref={ref as any}
            selected={selectedDate}
            onChange={handleChange}
            dateFormat={getDateFormat(format)}
            placeholderText={placeholder || format}
            disabled={disabled}
            required={required}
            minDate={minDate ?? undefined}
            maxDate={maxDate ?? undefined}
            name={name}
            autoComplete="off"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            showTimeSelect={showTime}
            timeFormat="HH:mm"
            timeIntervals={15}
            popperPlacement="bottom-start"
            popperClassName="!z-[9999]"
            popperProps={{ strategy: 'fixed' }}
            className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
              error
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            calendarClassName="border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
            wrapperClassName="w-full"
          />
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;

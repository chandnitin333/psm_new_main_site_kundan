import { useRef, useCallback } from 'react';

/**
 * Custom hook for managing dropdown hover delays
 * @param delay - Delay in milliseconds before closing dropdown (default: 300ms)
 * @returns Object with mouseEnter and mouseLeave handlers and cleanup ref
 */
export const useDropdownDelay = (
  setIsOpen: (isOpen: boolean) => void,
  delay: number = 300
) => {
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = useCallback(() => {
    // Clear any pending close timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  }, [setIsOpen]);

  const handleMouseLeave = useCallback(() => {
    // Add a delay before closing the dropdown
    timeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, delay);
  }, [setIsOpen, delay]);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    handleMouseEnter,
    handleMouseLeave,
    cleanup,
    timeoutRef,
  };
};

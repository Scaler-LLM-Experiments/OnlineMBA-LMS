/**
 * Date Utility Functions for SSB Student Portal
 * Ensures consistent DD/MM/YYYY HH:MM formatting across the application
 * Handles multiple input formats and provides fallback error handling
 */

export type DateInput = string | Date | null | undefined;

/**
 * Parse various date formats into a JavaScript Date object
 * Handles:
 * - ISO strings (Backend API format)
 * - DD/MM/YYYY HH:MM:SS (Legacy format)
 * - YYYY-MM-DD HH:MM (Alternative format)  
 * - JavaScript Date objects
 */
export const parseDate = (dateInput: DateInput): Date | null => {
  if (!dateInput) return null;
  
  // If already a Date object, return as-is
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  
  const dateString = String(dateInput).trim();
  if (!dateString || dateString === 'undefined' || dateString === 'null') {
    return null;
  }
  
  try {
    // Handle Backend format: dd-Mon-yyyy hh:mm:ss (e.g., "03-Dec-2025 18:09:00")
    const backendPattern = /^(\d{2})-([A-Z][a-z]{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/;
    const backendMatch = dateString.match(backendPattern);

    if (backendMatch) {
      const [, day, monthStr, year, hours, minutes, seconds] = backendMatch;
      const monthMap: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      const month = monthMap[monthStr];
      if (month !== undefined) {
        const date = new Date(
          parseInt(year),
          month,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds)
        );
        return isNaN(date.getTime()) ? null : date;
      }
    }

    // Primary: Handle ISO strings (most common from backend)
    const fallbackDate = new Date(dateString);
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate;
    }

    // Fallback: Handle DD/MM/YYYY HH:MM:SS format (legacy)
    const ddmmyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/;
    const ddmmyyyyMatch = dateString.match(ddmmyyyyPattern);
    
    if (ddmmyyyyMatch) {
      const [, day, month, year, hours, minutes, seconds = '0'] = ddmmyyyyMatch;
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1, // Month is 0-indexed
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      );
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Fallback: Handle YYYY-MM-DD HH:MM format (alternative)
    const yyyymmddPattern = /^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/;
    const yyyymmddMatch = dateString.match(yyyymmddPattern);
    
    if (yyyymmddMatch) {
      const [, year, month, day, hours, minutes, seconds = '0'] = yyyymmddMatch;
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1, // Month is 0-indexed
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      );
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
    
  } catch (error) {
    console.warn('Date parsing error:', error, 'for input:', dateString);
    return null;
  }
};

/**
 * Format date as DD/MM/YYYY HH:MM
 * @param dateInput - Date input in various formats
 * @returns Formatted date string or fallback text for invalid dates
 */
export const formatDateTime = (dateInput: DateInput): string => {
  const date = parseDate(dateInput);

  if (!date) {
    return 'No date';
  }

  try {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.warn('Date formatting error:', error, 'for date:', date);
    return 'Invalid date';
  }
};

/**
 * Format date as dd-Mon-yyyy hh:mm:ss (Backend format)
 * Example: 03-Dec-2025 18:09:00
 * @param dateInput - Date input in various formats
 * @returns Formatted date string or fallback text for invalid dates
 */
export const formatDateTimeBackend = (dateInput: DateInput): string => {
  if (!dateInput) return '';

  try {
    // If already in the correct format, return as is
    const backendFormatPattern = /^\d{2}-[A-Z][a-z]{2}-\d{4} \d{2}:\d{2}:\d{2}$/;
    if (typeof dateInput === 'string' && backendFormatPattern.test(dateInput)) {
      return dateInput;
    }

    const date = parseDate(dateInput);
    if (!date) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.warn('Backend date formatting error:', error, 'for input:', dateInput);
    return '';
  }
};

/**
 * Format date as DD/MM/YYYY (without time)
 * @param dateInput - Date input in various formats
 * @returns Formatted date string or fallback text for invalid dates
 */
export const formatDate = (dateInput: DateInput): string => {
  const date = parseDate(dateInput);
  
  if (!date) {
    return 'No date';
  }
  
  try {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.warn('Date formatting error:', error, 'for date:', date);
    return 'Invalid date';
  }
};

/**
 * Format time as HH:MM
 * @param dateInput - Date input in various formats
 * @returns Formatted time string or fallback text for invalid dates
 */
export const formatTime = (dateInput: DateInput): string => {
  const date = parseDate(dateInput);
  
  if (!date) {
    return 'No time';
  }
  
  try {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  } catch (error) {
    console.warn('Time formatting error:', error, 'for date:', date);
    return 'Invalid time';
  }
};

/**
 * Get relative time description (e.g., "2 days ago", "in 3 hours")
 * @param dateInput - Date input in various formats
 * @returns Relative time string
 */
export const getRelativeTime = (dateInput: DateInput): string => {
  const date = parseDate(dateInput);
  
  if (!date) {
    return 'Unknown time';
  }
  
  try {
    const now = new Date();
    const diffInMilliseconds = date.getTime() - now.getTime();
    const diffInMinutes = Math.floor(Math.abs(diffInMilliseconds) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    const isPast = diffInMilliseconds < 0;
    const prefix = isPast ? '' : 'in ';
    const suffix = isPast ? ' ago' : '';
    
    if (diffInMinutes === 0) {
      return 'Now';
    } else if (diffInMinutes < 60) {
      return `${prefix}${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''}${suffix}`;
    } else if (diffInHours < 24) {
      return `${prefix}${diffInHours} hour${diffInHours !== 1 ? 's' : ''}${suffix}`;
    } else if (diffInDays === 1) {
      return isPast ? 'Yesterday' : 'Tomorrow';
    } else {
      return `${prefix}${diffInDays} day${diffInDays !== 1 ? 's' : ''}${suffix}`;
    }
  } catch (error) {
    console.warn('Relative time calculation error:', error, 'for date:', date);
    return 'Unknown time';
  }
};

/**
 * Check if a date is today
 * @param dateInput - Date input in various formats
 * @returns True if the date is today
 */
export const isToday = (dateInput: DateInput): boolean => {
  const date = parseDate(dateInput);
  if (!date) return false;
  
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Check if a date is in the past
 * @param dateInput - Date input in various formats
 * @returns True if the date is in the past
 */
export const isPast = (dateInput: DateInput): boolean => {
  const date = parseDate(dateInput);
  if (!date) return false;
  
  return date.getTime() < new Date().getTime();
};

/**
 * Check if a date is in the future
 * @param dateInput - Date input in various formats
 * @returns True if the date is in the future
 */
export const isFuture = (dateInput: DateInput): boolean => {
  const date = parseDate(dateInput);
  if (!date) return false;
  
  return date.getTime() > new Date().getTime();
};

/**
 * Sort dates in ascending order (earliest first)
 * @param dates - Array of date inputs
 * @returns Sorted array of dates
 */
export const sortDatesAscending = (dates: DateInput[]): Date[] => {
  return dates
    .map(parseDate)
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime());
};

/**
 * Sort dates in descending order (latest first)
 * @param dates - Array of date inputs
 * @returns Sorted array of dates
 */
export const sortDatesDescending = (dates: DateInput[]): Date[] => {
  return dates
    .map(parseDate)
    .filter((date): date is Date => date !== null)
    .sort((a, b) => b.getTime() - a.getTime());
};
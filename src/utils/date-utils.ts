/**
 * Date utility functions
 * Provides helper functions for date manipulation and range calculations
 */

/**
 * Gets the start and end date for a given ISO date string
 * @param isoDate - ISO date string (YYYY-MM-DD format)
 * @returns Object with startDate and endDate for the given day
 */
export function getDateRange(isoDate: string): { startDate: Date; endDate: Date } {
  const startDate = new Date(isoDate)
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(isoDate)
  endDate.setHours(23, 59, 59, 999)

  return { startDate, endDate }
}


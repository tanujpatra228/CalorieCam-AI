import { getDateRange } from './date-utils'

describe('getDateRange', () => {
	it('returns startDate at beginning of day', () => {
		const { startDate } = getDateRange('2024-06-15')
		expect(startDate.getHours()).toBe(0)
		expect(startDate.getMinutes()).toBe(0)
		expect(startDate.getSeconds()).toBe(0)
		expect(startDate.getMilliseconds()).toBe(0)
	})

	it('returns endDate at end of day', () => {
		const { endDate } = getDateRange('2024-06-15')
		expect(endDate.getHours()).toBe(23)
		expect(endDate.getMinutes()).toBe(59)
		expect(endDate.getSeconds()).toBe(59)
		expect(endDate.getMilliseconds()).toBe(999)
	})

	it('preserves the correct date', () => {
		const { startDate, endDate } = getDateRange('2024-01-01')
		expect(startDate.getFullYear()).toBe(2024)
		expect(startDate.getMonth()).toBe(0) // January is 0
		expect(startDate.getDate()).toBe(1)

		expect(endDate.getFullYear()).toBe(2024)
		expect(endDate.getMonth()).toBe(0)
		expect(endDate.getDate()).toBe(1)
	})

	it('startDate is before endDate', () => {
		const { startDate, endDate } = getDateRange('2024-03-20')
		expect(startDate.getTime()).toBeLessThan(endDate.getTime())
	})

	it('handles end of month dates', () => {
		const { startDate, endDate } = getDateRange('2024-02-29') // leap year
		expect(startDate.getDate()).toBe(29)
		expect(endDate.getDate()).toBe(29)
	})

	it('handles December 31', () => {
		const { startDate, endDate } = getDateRange('2024-12-31')
		expect(startDate.getMonth()).toBe(11)
		expect(startDate.getDate()).toBe(31)
		expect(endDate.getMonth()).toBe(11)
		expect(endDate.getDate()).toBe(31)
	})

	it('difference between start and end is 23:59:59.999', () => {
		const { startDate, endDate } = getDateRange('2024-07-04')
		const diffMs = endDate.getTime() - startDate.getTime()
		const expectedMs = (23 * 60 * 60 + 59 * 60 + 59) * 1000 + 999
		expect(diffMs).toBe(expectedMs)
	})
})

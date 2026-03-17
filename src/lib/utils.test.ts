import { cn, roundToTwoDecimals, toInteger, calculateTotalFat } from './utils'

describe('cn', () => {
	it('merges simple class names', () => {
		expect(cn('foo', 'bar')).toBe('foo bar')
	})

	it('handles conditional classes via clsx', () => {
		expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
	})

	it('deduplicates conflicting tailwind classes via twMerge', () => {
		expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
	})

	it('returns empty string with no arguments', () => {
		expect(cn()).toBe('')
	})

	it('handles arrays of class names', () => {
		expect(cn(['foo', 'bar'])).toBe('foo bar')
	})

	it('filters out undefined and null values', () => {
		expect(cn('a', undefined, null, 'b')).toBe('a b')
	})
})

describe('roundToTwoDecimals', () => {
	it('rounds to two decimal places', () => {
		expect(roundToTwoDecimals(1.555)).toBe(1.56)
		expect(roundToTwoDecimals(1.554)).toBe(1.55)
	})

	it('returns whole numbers unchanged', () => {
		expect(roundToTwoDecimals(5)).toBe(5)
	})

	it('returns 0 for NaN', () => {
		expect(roundToTwoDecimals(NaN)).toBe(0)
	})

	it('handles negative numbers', () => {
		expect(roundToTwoDecimals(-3.456)).toBe(-3.46)
	})

	it('handles zero', () => {
		expect(roundToTwoDecimals(0)).toBe(0)
	})

	it('handles very small numbers', () => {
		expect(roundToTwoDecimals(0.001)).toBe(0)
		expect(roundToTwoDecimals(0.005)).toBe(0.01)
	})

	it('handles numbers already at two decimals', () => {
		expect(roundToTwoDecimals(1.23)).toBe(1.23)
	})

	it('coerces string-like values via Number()', () => {
		// TypeScript would complain, but at runtime Number() coercion happens
		expect(roundToTwoDecimals('3.14159' as unknown as number)).toBe(3.14)
		expect(roundToTwoDecimals('' as unknown as number)).toBe(0)
		expect(roundToTwoDecimals('abc' as unknown as number)).toBe(0)
	})
})

describe('toInteger', () => {
	it('rounds to nearest integer', () => {
		expect(toInteger(3.4)).toBe(3)
		expect(toInteger(3.5)).toBe(4)
		expect(toInteger(3.6)).toBe(4)
	})

	it('returns 0 for NaN', () => {
		expect(toInteger(NaN)).toBe(0)
	})

	it('returns integers unchanged', () => {
		expect(toInteger(7)).toBe(7)
	})

	it('handles negative numbers', () => {
		expect(toInteger(-2.3)).toBe(-2)
		expect(toInteger(-2.7)).toBe(-3)
	})

	it('handles zero', () => {
		expect(toInteger(0)).toBe(0)
	})

	it('coerces string-like values via Number()', () => {
		expect(toInteger('42.6' as unknown as number)).toBe(43)
		expect(toInteger('not a number' as unknown as number)).toBe(0)
	})
})

describe('calculateTotalFat', () => {
	it('adds fat and saturated fat and rounds to 2 decimals', () => {
		expect(calculateTotalFat(10.123, 5.456)).toBe(15.58)
	})

	it('handles zero values', () => {
		expect(calculateTotalFat(0, 0)).toBe(0)
		expect(calculateTotalFat(5.5, 0)).toBe(5.5)
		expect(calculateTotalFat(0, 3.3)).toBe(3.3)
	})

	it('handles whole numbers', () => {
		expect(calculateTotalFat(10, 5)).toBe(15)
	})

	it('rounds the sum correctly', () => {
		expect(calculateTotalFat(0.1, 0.2)).toBe(0.3)
	})
})

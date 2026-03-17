import { z } from 'zod'
import { validateInput, validateFormData, sanitizeString, sanitizeEmail } from './validation'
import { ValidationError } from './errors'

describe('validateInput', () => {
	const schema = z.object({
		name: z.string().min(1, 'Name is required'),
		age: z.number().min(0, 'Age must be non-negative'),
	})

	it('returns parsed data for valid input', () => {
		const data = { name: 'Alice', age: 30 }
		expect(validateInput(schema, data)).toEqual(data)
	})

	it('throws ValidationError for invalid input', () => {
		expect(() => validateInput(schema, { name: '', age: 30 })).toThrow(ValidationError)
	})

	it('includes error message in the thrown ValidationError', () => {
		try {
			validateInput(schema, { name: '', age: 30 })
			expect.unreachable('should have thrown')
		} catch (error) {
			expect(error).toBeInstanceOf(ValidationError)
			expect((error as ValidationError).message).toContain('Name is required')
		}
	})

	it('throws for completely wrong type', () => {
		expect(() => validateInput(schema, 'not an object')).toThrow(ValidationError)
	})

	it('throws for null input', () => {
		expect(() => validateInput(schema, null)).toThrow(ValidationError)
	})

	it('works with a simple string schema', () => {
		const stringSchema = z.string().email('Invalid email')
		expect(validateInput(stringSchema, 'test@example.com')).toBe('test@example.com')
		expect(() => validateInput(stringSchema, 'not-an-email')).toThrow(ValidationError)
	})

	it('joins multiple error messages with commas when multiple fields are wrong type', () => {
		const strict = z.object({
			a: z.string({ required_error: 'A required' }),
			b: z.string({ required_error: 'B required' }),
		})
		try {
			validateInput(strict, { a: 123, b: 456 })
			expect.unreachable('should have thrown')
		} catch (error) {
			const msg = (error as ValidationError).message
			expect(msg).toContain('Expected string')
		}
	})
})

describe('validateFormData', () => {
	const schema = z.object({
		email: z.string().email('Invalid email'),
		name: z.string().min(1, 'Name required'),
	})

	it('parses valid FormData', () => {
		const formData = new FormData()
		formData.append('email', 'user@example.com')
		formData.append('name', 'Bob')

		const result = validateFormData(schema, formData)
		expect(result).toEqual({ email: 'user@example.com', name: 'Bob' })
	})

	it('throws ValidationError for invalid FormData', () => {
		const formData = new FormData()
		formData.append('email', 'invalid')
		formData.append('name', '')

		expect(() => validateFormData(schema, formData)).toThrow(ValidationError)
	})

	it('throws when required fields are missing from FormData', () => {
		const formData = new FormData()
		expect(() => validateFormData(schema, formData)).toThrow(ValidationError)
	})
})

describe('sanitizeString', () => {
	it('removes < and > characters', () => {
		expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
	})

	it('trims whitespace', () => {
		expect(sanitizeString('  hello  ')).toBe('hello')
	})

	it('handles both trimming and sanitization', () => {
		expect(sanitizeString('  <b>bold</b>  ')).toBe('bbold/b')
	})

	it('returns empty string for only angle brackets', () => {
		expect(sanitizeString('<>')).toBe('')
	})

	it('leaves normal strings unchanged', () => {
		expect(sanitizeString('hello world')).toBe('hello world')
	})

	it('handles empty string', () => {
		expect(sanitizeString('')).toBe('')
	})

	it('removes multiple angle brackets', () => {
		expect(sanitizeString('<<>>')).toBe('')
	})
})

describe('sanitizeEmail', () => {
	it('lowercases and trims email', () => {
		expect(sanitizeEmail('  User@Example.COM  ')).toBe('user@example.com')
	})

	it('handles already clean email', () => {
		expect(sanitizeEmail('test@test.com')).toBe('test@test.com')
	})

	it('handles empty string', () => {
		expect(sanitizeEmail('')).toBe('')
	})

	it('trims only leading/trailing whitespace', () => {
		expect(sanitizeEmail(' a@b.com ')).toBe('a@b.com')
	})
})

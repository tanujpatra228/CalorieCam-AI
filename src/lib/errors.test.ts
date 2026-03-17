import {
	AppError,
	AuthError,
	ValidationError,
	NotFoundError,
	AnalysisError,
	AIServiceError,
	DatabaseError,
	CloudinaryError,
	isAppError,
	getUserFriendlyErrorMessage,
	formatErrorForLogging,
} from './errors'

describe('AppError', () => {
	it('sets message, code, and statusCode', () => {
		const error = new AppError('something broke', 'ERR_001', 503)
		expect(error.message).toBe('something broke')
		expect(error.code).toBe('ERR_001')
		expect(error.statusCode).toBe(503)
	})

	it('sets name to the constructor name', () => {
		const error = new AppError('test')
		expect(error.name).toBe('AppError')
	})

	it('is an instance of Error', () => {
		const error = new AppError('test')
		expect(error).toBeInstanceOf(Error)
	})

	it('has a stack trace', () => {
		const error = new AppError('test')
		expect(error.stack).toBeDefined()
	})

	it('defaults code and statusCode to undefined when not provided', () => {
		const error = new AppError('msg')
		expect(error.code).toBeUndefined()
		expect(error.statusCode).toBeUndefined()
	})
})

describe('AuthError', () => {
	it('defaults message to "Not authenticated"', () => {
		const error = new AuthError()
		expect(error.message).toBe('Not authenticated')
	})

	it('uses custom message when provided', () => {
		const error = new AuthError('Session expired')
		expect(error.message).toBe('Session expired')
	})

	it('has statusCode 401', () => {
		const error = new AuthError()
		expect(error.statusCode).toBe(401)
	})

	it('sets name to AuthError', () => {
		expect(new AuthError().name).toBe('AuthError')
	})

	it('is an instance of AppError', () => {
		expect(new AuthError()).toBeInstanceOf(AppError)
	})
})

describe('ValidationError', () => {
	it('has statusCode 400', () => {
		const error = new ValidationError('Invalid email')
		expect(error.statusCode).toBe(400)
	})

	it('stores the message', () => {
		const error = new ValidationError('Field required')
		expect(error.message).toBe('Field required')
	})

	it('sets name to ValidationError', () => {
		expect(new ValidationError('x').name).toBe('ValidationError')
	})
})

describe('NotFoundError', () => {
	it('defaults message to "Resource not found"', () => {
		const error = new NotFoundError()
		expect(error.message).toBe('Resource not found')
	})

	it('has statusCode 404', () => {
		expect(new NotFoundError().statusCode).toBe(404)
	})

	it('accepts custom message', () => {
		const error = new NotFoundError('User not found')
		expect(error.message).toBe('User not found')
	})
})

describe('AnalysisError', () => {
	it('has statusCode 500', () => {
		const error = new AnalysisError('Analysis failed')
		expect(error.statusCode).toBe(500)
	})

	it('stores message', () => {
		const error = new AnalysisError('timeout')
		expect(error.message).toBe('timeout')
	})
})

describe('AIServiceError', () => {
	it('defaults message to "Failed to analyze image"', () => {
		const error = new AIServiceError()
		expect(error.message).toBe('Failed to analyze image')
	})

	it('has statusCode 500', () => {
		expect(new AIServiceError().statusCode).toBe(500)
	})

	it('accepts custom message', () => {
		const error = new AIServiceError('Model unavailable')
		expect(error.message).toBe('Model unavailable')
	})
})

describe('DatabaseError', () => {
	it('has statusCode 500', () => {
		const error = new DatabaseError('connection lost')
		expect(error.statusCode).toBe(500)
	})

	it('stores originalError', () => {
		const original = new Error('pg timeout')
		const error = new DatabaseError('connection lost', 'DB_ERR', original)
		expect(error.originalError).toBe(original)
	})

	it('originalError defaults to undefined', () => {
		const error = new DatabaseError('fail')
		expect(error.originalError).toBeUndefined()
	})
})

describe('CloudinaryError', () => {
	it('defaults message to "Failed to upload image to Cloudinary"', () => {
		const error = new CloudinaryError()
		expect(error.message).toBe('Failed to upload image to Cloudinary')
	})

	it('has statusCode 500', () => {
		expect(new CloudinaryError().statusCode).toBe(500)
	})

	it('stores originalError', () => {
		const original = new Error('network error')
		const error = new CloudinaryError('upload failed', 'CLD_ERR', original)
		expect(error.originalError).toBe(original)
	})

	it('accepts custom message', () => {
		const error = new CloudinaryError('rate limited')
		expect(error.message).toBe('rate limited')
	})
})

describe('isAppError', () => {
	it('returns true for AppError instances', () => {
		expect(isAppError(new AppError('test'))).toBe(true)
	})

	it('returns true for AppError subclasses', () => {
		expect(isAppError(new AuthError())).toBe(true)
		expect(isAppError(new ValidationError('x'))).toBe(true)
		expect(isAppError(new NotFoundError())).toBe(true)
		expect(isAppError(new DatabaseError('x'))).toBe(true)
		expect(isAppError(new CloudinaryError())).toBe(true)
	})

	it('returns false for plain Error', () => {
		expect(isAppError(new Error('test'))).toBe(false)
	})

	it('returns false for string', () => {
		expect(isAppError('some error')).toBe(false)
	})

	it('returns false for null and undefined', () => {
		expect(isAppError(null)).toBe(false)
		expect(isAppError(undefined)).toBe(false)
	})
})

describe('getUserFriendlyErrorMessage', () => {
	it('returns message for AppError', () => {
		expect(getUserFriendlyErrorMessage(new AuthError('Token expired'))).toBe('Token expired')
	})

	it('returns message for plain Error', () => {
		expect(getUserFriendlyErrorMessage(new Error('oops'))).toBe('oops')
	})

	it('returns the string itself for string errors', () => {
		expect(getUserFriendlyErrorMessage('something went wrong')).toBe('something went wrong')
	})

	it('returns default message for unknown types', () => {
		expect(getUserFriendlyErrorMessage(null)).toBe('An unexpected error occurred')
		expect(getUserFriendlyErrorMessage(42)).toBe('An unexpected error occurred')
		expect(getUserFriendlyErrorMessage(undefined)).toBe('An unexpected error occurred')
	})
})

describe('formatErrorForLogging', () => {
	it('formats AppError with code', () => {
		const error = new ValidationError('bad input', 'VAL_001')
		const result = formatErrorForLogging(error)
		expect(result).toBe('[ValidationError] bad input (code: VAL_001)')
	})

	it('formats AppError without code', () => {
		const error = new AuthError('denied')
		const result = formatErrorForLogging(error)
		expect(result).toBe('[AuthError] denied')
	})

	it('formats plain Error with stack', () => {
		const error = new Error('boom')
		const result = formatErrorForLogging(error)
		expect(result).toMatch(/^\[Error\] boom\n/)
		expect(result).toContain('Error: boom')
	})

	it('formats string errors', () => {
		expect(formatErrorForLogging('fail')).toBe('[Unknown Error] fail')
	})

	it('formats null', () => {
		expect(formatErrorForLogging(null)).toBe('[Unknown Error] null')
	})

	it('formats number', () => {
		expect(formatErrorForLogging(404)).toBe('[Unknown Error] 404')
	})
})

import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  isoDateSchema,
  analysisDataSchema,
  profileFormDataSchema,
  analyzeImageSchema,
  logAnalysisSchema,
  getAnalysisLogsByDateSchema,
} from './validation-schemas'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validMacros() {
  return {
    calories_kcal: 500,
    carbs_g: 50,
    sugars_g: 10,
    protein_g: 25,
    fat_g: 15,
    sat_fat_g: 5,
    fiber_g: 8,
  }
}

function validMicros() {
  return {
    sodium_mg: 200,
    vitaminC_mg: 30,
  }
}

function validAnalysisData() {
  return {
    dish_name: 'Grilled Chicken Salad',
    total_weight_g: 350,
    total_digestion_time_m: 120,
    total_calories_to_digest_kcal: 30,
    macros: validMacros(),
    micros: validMicros(),
    notes: ['High in protein'],
  }
}

// ---------------------------------------------------------------------------
// signUpSchema / signInSchema
// ---------------------------------------------------------------------------

describe.each([
  { name: 'signUpSchema', schema: signUpSchema },
  { name: 'signInSchema', schema: signInSchema },
])('$name', ({ schema }) => {
  it('accepts valid email and password', () => {
    const result = schema.safeParse({ email: 'user@example.com', password: 'secret123' })
    expect(result.success).toBe(true)
  })

  it('rejects email with whitespace', () => {
    expect(schema.safeParse({ email: '  user@example.com  ', password: 'secret123' }).success).toBe(false)
    expect(schema.safeParse({ email: 'user@example.com  ', password: 'secret123' }).success).toBe(false)
  })

  it('rejects missing email', () => {
    const result = schema.safeParse({ password: 'secret123' })
    expect(result.success).toBe(false)
  })

  it('rejects missing password', () => {
    const result = schema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email format', () => {
    const result = schema.safeParse({ email: 'not-an-email', password: 'secret123' })
    expect(result.success).toBe(false)
  })

  it('rejects empty email', () => {
    const result = schema.safeParse({ email: '', password: 'secret123' })
    expect(result.success).toBe(false)
  })

  it('rejects email longer than 255 characters', () => {
    const longEmail = 'a'.repeat(250) + '@b.com'
    const result = schema.safeParse({ email: longEmail, password: 'secret123' })
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 6 characters', () => {
    const result = schema.safeParse({ email: 'user@example.com', password: '12345' })
    expect(result.success).toBe(false)
  })

  it('accepts password of exactly 6 characters', () => {
    const result = schema.safeParse({ email: 'user@example.com', password: '123456' })
    expect(result.success).toBe(true)
  })

  it('rejects password longer than 128 characters', () => {
    const result = schema.safeParse({ email: 'user@example.com', password: 'a'.repeat(129) })
    expect(result.success).toBe(false)
  })

  it('accepts password of exactly 128 characters', () => {
    const result = schema.safeParse({ email: 'user@example.com', password: 'a'.repeat(128) })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// forgotPasswordSchema
// ---------------------------------------------------------------------------

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true)
  })

  it('rejects missing email', () => {
    expect(forgotPasswordSchema.safeParse({}).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'bad' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// resetPasswordSchema
// ---------------------------------------------------------------------------

describe('resetPasswordSchema', () => {
  it('accepts matching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpass123',
      confirmPassword: 'newpass123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpass123',
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Passwords do not match')
    }
  })

  it('rejects when confirmPassword is missing', () => {
    const result = resetPasswordSchema.safeParse({ password: 'newpass123' })
    expect(result.success).toBe(false)
  })

  it('rejects passwords shorter than 6 characters even if matching', () => {
    const result = resetPasswordSchema.safeParse({ password: '12345', confirmPassword: '12345' })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isoDateSchema
// ---------------------------------------------------------------------------

describe('isoDateSchema', () => {
  it('accepts valid YYYY-MM-DD date', () => {
    expect(isoDateSchema.safeParse('2024-06-15').success).toBe(true)
  })

  it('rejects wrong format (DD-MM-YYYY)', () => {
    expect(isoDateSchema.safeParse('15-06-2024').success).toBe(false)
  })

  it('rejects non-date string matching pattern', () => {
    expect(isoDateSchema.safeParse('2024-13-45').success).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isoDateSchema.safeParse('').success).toBe(false)
  })

  it('rejects date with time component', () => {
    expect(isoDateSchema.safeParse('2024-06-15T10:00:00').success).toBe(false)
  })

  it('accepts leap day', () => {
    expect(isoDateSchema.safeParse('2024-02-29').success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// analysisDataSchema
// ---------------------------------------------------------------------------

describe('analysisDataSchema', () => {
  it('accepts valid analysis data', () => {
    expect(analysisDataSchema.safeParse(validAnalysisData()).success).toBe(true)
  })

  it('accepts null for total_calories_to_digest_kcal', () => {
    const data = { ...validAnalysisData(), total_calories_to_digest_kcal: null }
    expect(analysisDataSchema.safeParse(data).success).toBe(true)
  })

  it('accepts null for micros fields', () => {
    const data = {
      ...validAnalysisData(),
      micros: { sodium_mg: null, vitaminC_mg: null },
    }
    expect(analysisDataSchema.safeParse(data).success).toBe(true)
  })

  it('rejects empty dish_name', () => {
    const data = { ...validAnalysisData(), dish_name: '' }
    expect(analysisDataSchema.safeParse(data).success).toBe(false)
  })

  it('rejects dish_name longer than 200 characters', () => {
    const data = { ...validAnalysisData(), dish_name: 'x'.repeat(201) }
    expect(analysisDataSchema.safeParse(data).success).toBe(false)
  })

  it('accepts dish_name of exactly 200 characters', () => {
    const data = { ...validAnalysisData(), dish_name: 'x'.repeat(200) }
    expect(analysisDataSchema.safeParse(data).success).toBe(true)
  })

  it('rejects total_weight_g of 0', () => {
    const data = { ...validAnalysisData(), total_weight_g: 0 }
    expect(analysisDataSchema.safeParse(data).success).toBe(false)
  })

  it('rejects total_weight_g exceeding 10000', () => {
    const data = { ...validAnalysisData(), total_weight_g: 10001 }
    expect(analysisDataSchema.safeParse(data).success).toBe(false)
  })

  it('accepts total_weight_g at boundary (1 and 10000)', () => {
    expect(analysisDataSchema.safeParse({ ...validAnalysisData(), total_weight_g: 1 }).success).toBe(true)
    expect(analysisDataSchema.safeParse({ ...validAnalysisData(), total_weight_g: 10000 }).success).toBe(true)
  })

  it('rejects total_digestion_time_m below 0', () => {
    const data = { ...validAnalysisData(), total_digestion_time_m: -1 }
    expect(analysisDataSchema.safeParse(data).success).toBe(false)
  })

  it('rejects total_digestion_time_m exceeding 1440', () => {
    const data = { ...validAnalysisData(), total_digestion_time_m: 1441 }
    expect(analysisDataSchema.safeParse(data).success).toBe(false)
  })

  it('rejects total_calories_to_digest_kcal exceeding 5000', () => {
    const data = { ...validAnalysisData(), total_calories_to_digest_kcal: 5001 }
    expect(analysisDataSchema.safeParse(data).success).toBe(false)
  })

  it('rejects more than 20 notes', () => {
    const data = { ...validAnalysisData(), notes: Array(21).fill('note') }
    expect(analysisDataSchema.safeParse(data).success).toBe(false)
  })

  it('accepts exactly 20 notes', () => {
    const data = { ...validAnalysisData(), notes: Array(20).fill('note') }
    expect(analysisDataSchema.safeParse(data).success).toBe(true)
  })

  it('rejects a note longer than 500 characters', () => {
    const data = { ...validAnalysisData(), notes: ['x'.repeat(501)] }
    expect(analysisDataSchema.safeParse(data).success).toBe(false)
  })

  it('accepts empty notes array', () => {
    const data = { ...validAnalysisData(), notes: [] }
    expect(analysisDataSchema.safeParse(data).success).toBe(true)
  })

  it('rejects missing macros', () => {
    const { macros: _, ...rest } = validAnalysisData()
    expect(analysisDataSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects macro values out of range', () => {
    const data = {
      ...validAnalysisData(),
      macros: { ...validMacros(), calories_kcal: -1 },
    }
    expect(analysisDataSchema.safeParse(data).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// profileFormDataSchema
// ---------------------------------------------------------------------------

describe('profileFormDataSchema', () => {
  it('accepts empty object (all optional)', () => {
    expect(profileFormDataSchema.safeParse({}).success).toBe(true)
  })

  it('accepts full valid profile data', () => {
    const data = {
      height_cm: 175,
      weight_kg: 70,
      activity_level: 'moderate' as const,
      goal: 'maintain' as const,
      daily_calories_budget: 2000,
      daily_protein_target_g: 120,
    }
    expect(profileFormDataSchema.safeParse(data).success).toBe(true)
  })

  it('rejects height_cm below 100', () => {
    expect(profileFormDataSchema.safeParse({ height_cm: 99 }).success).toBe(false)
  })

  it('rejects height_cm above 250', () => {
    expect(profileFormDataSchema.safeParse({ height_cm: 251 }).success).toBe(false)
  })

  it('accepts height_cm at boundaries (100 and 250)', () => {
    expect(profileFormDataSchema.safeParse({ height_cm: 100 }).success).toBe(true)
    expect(profileFormDataSchema.safeParse({ height_cm: 250 }).success).toBe(true)
  })

  it('rejects weight_kg below 30', () => {
    expect(profileFormDataSchema.safeParse({ weight_kg: 29 }).success).toBe(false)
  })

  it('rejects weight_kg above 300', () => {
    expect(profileFormDataSchema.safeParse({ weight_kg: 301 }).success).toBe(false)
  })

  it('rejects invalid activity_level', () => {
    expect(profileFormDataSchema.safeParse({ activity_level: 'extreme' }).success).toBe(false)
  })

  it('accepts all valid activity levels', () => {
    for (const level of ['sedentary', 'light', 'moderate', 'active', 'very_active']) {
      expect(profileFormDataSchema.safeParse({ activity_level: level }).success).toBe(true)
    }
  })

  it('rejects invalid goal', () => {
    expect(profileFormDataSchema.safeParse({ goal: 'bulk' }).success).toBe(false)
  })

  it('accepts all valid goals', () => {
    for (const goal of ['lose_weight', 'maintain', 'gain_muscle']) {
      expect(profileFormDataSchema.safeParse({ goal }).success).toBe(true)
    }
  })

  it('rejects daily_calories_budget below 1000', () => {
    expect(profileFormDataSchema.safeParse({ daily_calories_budget: 999 }).success).toBe(false)
  })

  it('rejects daily_calories_budget above 5000', () => {
    expect(profileFormDataSchema.safeParse({ daily_calories_budget: 5001 }).success).toBe(false)
  })

  it('rejects daily_protein_target_g below 20', () => {
    expect(profileFormDataSchema.safeParse({ daily_protein_target_g: 19 }).success).toBe(false)
  })

  it('rejects daily_protein_target_g above 300', () => {
    expect(profileFormDataSchema.safeParse({ daily_protein_target_g: 301 }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// analyzeImageSchema
// ---------------------------------------------------------------------------

describe('analyzeImageSchema', () => {
  const validBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='

  it('accepts valid base64 image with no additional context', () => {
    expect(analyzeImageSchema.safeParse({ imageData: validBase64 }).success).toBe(true)
  })

  it('accepts valid base64 image with additional context', () => {
    const result = analyzeImageSchema.safeParse({
      imageData: validBase64,
      additionalContext: 'This is a lunch plate',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty imageData', () => {
    expect(analyzeImageSchema.safeParse({ imageData: '' }).success).toBe(false)
  })

  it('rejects invalid base64 characters', () => {
    expect(analyzeImageSchema.safeParse({ imageData: '!!!invalid!!!' }).success).toBe(false)
  })

  it('rejects additionalContext longer than 1000 characters', () => {
    const result = analyzeImageSchema.safeParse({
      imageData: validBase64,
      additionalContext: 'x'.repeat(1001),
    })
    expect(result.success).toBe(false)
  })

  it('accepts additionalContext of exactly 1000 characters', () => {
    const result = analyzeImageSchema.safeParse({
      imageData: validBase64,
      additionalContext: 'x'.repeat(1000),
    })
    expect(result.success).toBe(true)
  })

  it('accepts raw base64 without data URL prefix', () => {
    expect(analyzeImageSchema.safeParse({ imageData: 'SGVsbG8gV29ybGQ=' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// logAnalysisSchema
// ---------------------------------------------------------------------------

describe('logAnalysisSchema', () => {
  it('accepts valid analysis data with a URL', () => {
    const result = logAnalysisSchema.safeParse({
      analysisData: validAnalysisData(),
      imageUrl: 'https://example.com/image.jpg',
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid analysis data with a base64 data URL', () => {
    const result = logAnalysisSchema.safeParse({
      analysisData: validAnalysisData(),
      imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing imageUrl', () => {
    const result = logAnalysisSchema.safeParse({ analysisData: validAnalysisData() })
    expect(result.success).toBe(false)
  })

  it('rejects empty imageUrl', () => {
    const result = logAnalysisSchema.safeParse({
      analysisData: validAnalysisData(),
      imageUrl: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid imageUrl', () => {
    const result = logAnalysisSchema.safeParse({
      analysisData: validAnalysisData(),
      imageUrl: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('rejects regular URL longer than 2048 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2040)
    const result = logAnalysisSchema.safeParse({
      analysisData: validAnalysisData(),
      imageUrl: longUrl,
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getAnalysisLogsByDateSchema
// ---------------------------------------------------------------------------

describe('getAnalysisLogsByDateSchema', () => {
  it('accepts valid date', () => {
    expect(getAnalysisLogsByDateSchema.safeParse({ date: '2024-06-15' }).success).toBe(true)
  })

  it('rejects missing date', () => {
    expect(getAnalysisLogsByDateSchema.safeParse({}).success).toBe(false)
  })

  it('rejects invalid date format', () => {
    expect(getAnalysisLogsByDateSchema.safeParse({ date: '06/15/2024' }).success).toBe(false)
  })

  it('rejects invalid date value', () => {
    // 9999-99-99 matches the regex but is not a valid date
    expect(getAnalysisLogsByDateSchema.safeParse({ date: '9999-99-99' }).success).toBe(false)
  })
})

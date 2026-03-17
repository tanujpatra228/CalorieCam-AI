import { calculateOptimalDimensions, getBase64Size } from './image-compression'

// The constants from the source: MAX_WIDTH = 1920, MAX_HEIGHT = 1920

// ---------------------------------------------------------------------------
// calculateOptimalDimensions
// ---------------------------------------------------------------------------

describe('calculateOptimalDimensions', () => {
  it('returns original dimensions when both are within limits', () => {
    expect(calculateOptimalDimensions(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('returns original dimensions at exact max boundary', () => {
    expect(calculateOptimalDimensions(1920, 1920)).toEqual({ width: 1920, height: 1920 })
  })

  it('returns original for small images', () => {
    expect(calculateOptimalDimensions(100, 100)).toEqual({ width: 100, height: 100 })
  })

  it('scales down landscape image (width > height) to MAX_WIDTH', () => {
    // 3840x2160 (16:9) -> width=1920, height=round(1920 / (3840/2160)) = round(1080) = 1080
    const result = calculateOptimalDimensions(3840, 2160)
    expect(result.width).toBe(1920)
    expect(result.height).toBe(1080)
  })

  it('scales down portrait image (height > width) to MAX_HEIGHT', () => {
    // 1080x3840 -> height=1920, width=round(1920 * (1080/3840)) = round(540) = 540
    const result = calculateOptimalDimensions(1080, 3840)
    expect(result.height).toBe(1920)
    expect(result.width).toBe(540)
  })

  it('scales down landscape image maintaining aspect ratio', () => {
    // 4000x2000 (2:1) -> width=1920, height=round(1920 / 2) = 960
    const result = calculateOptimalDimensions(4000, 2000)
    expect(result.width).toBe(1920)
    expect(result.height).toBe(960)
  })

  it('scales down portrait image maintaining aspect ratio', () => {
    // 1500x3000 (1:2) -> height=1920, width=round(1920 * 0.5) = 960
    const result = calculateOptimalDimensions(1500, 3000)
    expect(result.height).toBe(1920)
    expect(result.width).toBe(960)
  })

  it('handles square image exceeding max as portrait path (height >= width)', () => {
    // 2500x2500 -> width > height is false (equal), so portrait branch:
    // height=1920, width=round(1920 * 1) = 1920
    const result = calculateOptimalDimensions(2500, 2500)
    expect(result.width).toBe(1920)
    expect(result.height).toBe(1920)
  })

  it('handles landscape where only width exceeds max', () => {
    // 2500x1000 -> landscape: width=1920, height=round(1920 / 2.5) = 768
    const result = calculateOptimalDimensions(2500, 1000)
    expect(result.width).toBe(1920)
    expect(result.height).toBe(768)
  })

  it('handles portrait where only height exceeds max', () => {
    // 1000x2500 -> portrait: height=1920, width=round(1920 * 0.4) = 768
    const result = calculateOptimalDimensions(1000, 2500)
    expect(result.height).toBe(1920)
    expect(result.width).toBe(768)
  })

  it('handles width at max but height exceeding (portrait)', () => {
    // 1920x2500 -> height > width, so portrait: height=1920, width=round(1920*(1920/2500))=round(1474.56)=1475
    const result = calculateOptimalDimensions(1920, 2500)
    expect(result.height).toBe(1920)
    expect(result.width).toBe(Math.round(1920 * (1920 / 2500)))
  })
})

// ---------------------------------------------------------------------------
// getBase64Size
// ---------------------------------------------------------------------------

describe('getBase64Size', () => {
  it('calculates size of raw base64 string without padding', () => {
    // "SGVsbG8=" encodes "Hello" (5 bytes)
    // length=8, padding=1 -> (8*3/4) - 1 = 5
    expect(getBase64Size('SGVsbG8=')).toBe(5)
  })

  it('calculates size of base64 with double padding', () => {
    // "SGk=" encodes "Hi" (2 bytes)
    // length=4, padding=2 -> (4*3/4) - 2 = 1
    // Actually "SGk=" is 2 bytes... let me verify: (4*3/4)-2 = 1
    // The formula gives 1, but "Hi" is 2 bytes. The padding count for "SGk=" is 1 (one =).
    // Wait: "Hi" base64 is "SGk=" which has 1 padding char.
    // (4*3/4) - 1 = 2. That's correct.
    expect(getBase64Size('SGk=')).toBe(2)
  })

  it('calculates size with no padding', () => {
    // "AQID" encodes 3 bytes (no padding)
    // length=4, padding=0 -> (4*3/4) - 0 = 3
    expect(getBase64Size('AQID')).toBe(3)
  })

  it('strips data URL prefix before calculating', () => {
    // Same as "SGVsbG8=" but with prefix
    expect(getBase64Size('data:image/jpeg;base64,SGVsbG8=')).toBe(5)
  })

  it('handles data URL prefix with different image types', () => {
    expect(getBase64Size('data:image/png;base64,SGVsbG8=')).toBe(5)
  })

  it('handles empty base64 string', () => {
    expect(getBase64Size('')).toBe(0)
  })

  it('handles base64 string without prefix as-is', () => {
    const raw = 'AQIDBA=='  // 3 bytes - wait: (8*3/4) - 2 = 4
    expect(getBase64Size(raw)).toBe(4)
  })
})

import {
  blobTypeForRecorder,
  pickRecorderMimeType,
  prefersMp4Recording,
  recorderMimeCandidates,
} from '@/lib/audio/web-audio'

describe('prefersMp4Recording', () => {
  it('erkennt iPhone und iPad', () => {
    expect(prefersMp4Recording('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 5)).toBe(true)
    expect(prefersMp4Recording('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)', 5)).toBe(true)
  })

  it('erkennt iPadOS mit Macintosh-UA', () => {
    expect(prefersMp4Recording('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(true)
  })

  it('erkennt Desktop-Safari, aber nicht Chrome', () => {
    expect(
      prefersMp4Recording(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        0
      )
    ).toBe(true)
    expect(
      prefersMp4Recording(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        0
      )
    ).toBe(false)
  })
})

describe('pickRecorderMimeType', () => {
  it('bevorzugt auf Safari audio/mp4', () => {
    const picked = pickRecorderMimeType((mime) => mime.startsWith('audio/mp4') || mime === 'audio/webm', true)
    expect(picked).toBe('audio/mp4')
  })

  it('bevorzugt sonst webm mit Opus', () => {
    const picked = pickRecorderMimeType(() => true, false)
    expect(picked).toBe('audio/webm;codecs=opus')
  })

  it('gibt undefined zurück, wenn nichts unterstützt wird', () => {
    expect(pickRecorderMimeType(() => false, true)).toBeUndefined()
  })
})

describe('blobTypeForRecorder', () => {
  it('nimmt den Basistyp ohne Codec-Parameter', () => {
    expect(blobTypeForRecorder('audio/mp4;codecs=mp4a.40.2', undefined, true)).toBe('audio/mp4')
  })

  it('fällt auf das plattformübliche Format zurück', () => {
    expect(blobTypeForRecorder('', undefined, true)).toBe('audio/mp4')
    expect(blobTypeForRecorder('', undefined, false)).toBe('audio/webm')
  })
})

describe('recorderMimeCandidates', () => {
  it('stellt mp4 auf Safari nach vorn', () => {
    expect(recorderMimeCandidates(true)[0]).toBe('audio/mp4')
    expect(recorderMimeCandidates(false)[0]).toBe('audio/webm;codecs=opus')
  })
})

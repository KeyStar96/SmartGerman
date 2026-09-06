import { analysePcmWindow, encodeMonoWav, mixDownToMono } from '@/lib/audio/wav'

describe('mixDownToMono', () => {
  it('gibt einen einzelnen Kanal unverändert zurück', () => {
    const mono = new Float32Array([0.2, -0.4])
    expect(mixDownToMono([mono])).toBe(mono)
  })

  it('mittelt zwei Kanäle', () => {
    const left = new Float32Array([1, 0])
    const right = new Float32Array([0, 1])
    expect(Array.from(mixDownToMono([left, right]))).toEqual([0.5, 0.5])
  })

  it('liefert ein leeres Array ohne Kanäle', () => {
    expect(mixDownToMono([]).length).toBe(0)
  })
})

describe('encodeMonoWav', () => {
  it('schreibt einen gültigen RIFF/WAVE-Kopf', () => {
    const samples = new Float32Array([0, 0.5, -0.5, 0])
    const bytes = new Uint8Array(encodeMonoWav(samples, 44100))
    const ascii = String.fromCharCode(...bytes.slice(0, 12))
    expect(ascii.startsWith('RIFF')).toBe(true)
    expect(ascii.includes('WAVE')).toBe(true)
    expect(bytes.length).toBe(44 + samples.length * 2)
  })
})

describe('analysePcmWindow', () => {
  it('meldet Stille als Pegel 0', () => {
    expect(analysePcmWindow(new Float32Array(64), 0, 16000).volume).toBe(0)
  })

  it('meldet volle Aussteuerung als hohen Pegel', () => {
    const loud = Float32Array.from({ length: 64 }, () => 1)
    expect(analysePcmWindow(loud, 0, 16000).volume).toBe(1)
  })

  it('gibt bei leeren Daten neutrale Werte zurück', () => {
    expect(analysePcmWindow([], 0, 16000)).toEqual({ volume: 0, tone: 0.5 })
  })
})

import { buildFillInBlankChips, buildSmartHint, scoreForAttempts } from '@/lib/exercise-chips'
import { parseFillInBlankContent, parseMultipleChoiceContent } from '@/lib/types/exercise'

describe('buildFillInBlankChips', () => {
  it('nutzt die von der Lehrkraft gepflegten Chips', () => {
    const chips = buildFillInBlankChips({
      exerciseId: 'exercise-1',
      correctAnswer: 'bin',
      authoredOptions: ['bin', 'bist', 'ist'],
    })

    expect(chips).toHaveLength(3)
    expect(chips.sort()).toEqual(['bin', 'bist', 'ist'])
  })

  it('erzeugt Distraktoren aus derselben Wortfamilie', () => {
    const chips = buildFillInBlankChips({ exerciseId: 'exercise-2', correctAnswer: 'bin' })

    expect(chips).toContain('bin')
    expect(chips.length).toBeGreaterThanOrEqual(3)
    chips.forEach(chip => expect(['bin', 'bist', 'ist', 'sind', 'seid']).toContain(chip))
  })

  it('enthält die Lösung immer genau einmal', () => {
    const chips = buildFillInBlankChips({
      exerciseId: 'exercise-3',
      correctAnswer: 'die',
      siblingAnswers: ['der', 'die', 'das'],
    })

    expect(chips.filter(chip => chip === 'die')).toHaveLength(1)
  })

  it('liefert für identische IDs eine stabile Reihenfolge', () => {
    const first = buildFillInBlankChips({ exerciseId: 'stable-id', correctAnswer: 'hat' })
    const second = buildFillInBlankChips({ exerciseId: 'stable-id', correctAnswer: 'hat' })

    expect(first).toEqual(second)
  })

  it('fällt bei unbekannten Wörtern auf Geschwister-Lösungen zurück', () => {
    const chips = buildFillInBlankChips({
      exerciseId: 'exercise-4',
      correctAnswer: 'Bahnhof',
      siblingAnswers: ['Flughafen', 'Bushaltestelle'],
    })

    expect(chips).toContain('Bahnhof')
    expect(chips).toContain('Flughafen')
  })

  it('gibt niemals ein leeres Array für eine gültige Lösung zurück', () => {
    const chips = buildFillInBlankChips({ exerciseId: 'exercise-5', correctAnswer: 'Xylophon' })

    expect(chips).toEqual(['Xylophon'])
  })

  it('behandelt eine leere Lösung als ungültig', () => {
    expect(buildFillInBlankChips({ exerciseId: 'exercise-6', correctAnswer: '   ' })).toEqual([])
  })

  it('passt die Groß-/Kleinschreibung der Distraktoren an die Lösung an', () => {
    const chips = buildFillInBlankChips({ exerciseId: 'exercise-7', correctAnswer: 'Der' })

    expect(chips).toContain('Der')
    expect(chips).toContain('Die')
  })
})

describe('buildSmartHint', () => {
  it('zeigt vor zwei Fehlversuchen keinen Hinweis', () => {
    expect(buildSmartHint({ correctAnswer: 'bin', failedAttempts: 0 })).toBeNull()
    expect(buildSmartHint({ correctAnswer: 'bin', failedAttempts: 1 })).toBeNull()
  })

  it('bevorzugt den im CMS gepflegten Hinweis', () => {
    expect(
      buildSmartHint({ correctAnswer: 'bin', failedAttempts: 2, customHint: 'Achte auf die 1. Person.' })
    ).toEqual({ kind: 'custom', text: 'Achte auf die 1. Person.' })
  })

  it('nennt bei einem Nomen das Genus aus der Vokabelbank', () => {
    expect(buildSmartHint({ correctAnswer: 'Tisch', failedAttempts: 2, article: 'der' })).toEqual({
      kind: 'gender',
      article: 'der',
    })
  })

  it('verrät den Artikel nicht, wenn die Lücke selbst ein Artikel ist', () => {
    const hint = buildSmartHint({ correctAnswer: 'das', failedAttempts: 2, article: 'das' })

    expect(hint).not.toEqual({ kind: 'gender', article: 'das' })
  })

  it('erkennt Verbformen', () => {
    expect(buildSmartHint({ correctAnswer: 'bin', failedAttempts: 2 })).toEqual({ kind: 'verb', length: 3 })
  })

  it('nennt ab drei Fehlversuchen den Anfangsbuchstaben', () => {
    expect(buildSmartHint({ correctAnswer: 'bin', failedAttempts: 3 })).toEqual({
      kind: 'first_letter',
      letter: 'B',
      length: 3,
    })
  })

  it('zählt Umlaute als einzelne Buchstaben', () => {
    expect(buildSmartHint({ correctAnswer: 'möchte', failedAttempts: 3 })).toEqual({
      kind: 'first_letter',
      letter: 'M',
      length: 6,
    })
  })
})

describe('scoreForAttempts', () => {
  it('staffelt die Punkte nach Versuchen', () => {
    expect(scoreForAttempts(1)).toBe(100)
    expect(scoreForAttempts(2)).toBe(80)
    expect(scoreForAttempts(3)).toBe(60)
    expect(scoreForAttempts(9)).toBe(40)
  })
})

describe('parseFillInBlankContent', () => {
  it('liest gültige Inhalte inklusive Chips', () => {
    expect(
      parseFillInBlankContent({
        text_before: 'Ich ',
        text_after: ' Nico.',
        correct_answer: 'bin',
        options: ['bin', 'bist'],
      })
    ).toEqual({
      text_before: 'Ich ',
      text_after: ' Nico.',
      correct_answer: 'bin',
      options: ['bin', 'bist'],
    })
  })

  it('ergänzt fehlende Textteile mit leeren Strings', () => {
    expect(parseFillInBlankContent({ correct_answer: 'bin' })).toEqual({
      text_before: '',
      text_after: '',
      correct_answer: 'bin',
    })
  })

  it('lehnt Inhalte ohne Lösung ab', () => {
    expect(parseFillInBlankContent({ text_before: 'Ich ' })).toBeNull()
    expect(parseFillInBlankContent({ correct_answer: '  ' })).toBeNull()
    expect(parseFillInBlankContent('kein Objekt')).toBeNull()
    expect(parseFillInBlankContent(null)).toBeNull()
  })

  it('ignoriert Chips mit ungültigen Einträgen', () => {
    const content = parseFillInBlankContent({ correct_answer: 'bin', options: ['bin', 42] })

    expect(content?.options).toBeUndefined()
  })
})

describe('parseMultipleChoiceContent', () => {
  it('liest gültige Inhalte', () => {
    expect(
      parseMultipleChoiceContent({
        question: 'Welcher Artikel passt?',
        options: ['der', 'die', 'das'],
        correct_answer: 'das',
      })
    ).toEqual({
      question: 'Welcher Artikel passt?',
      options: ['der', 'die', 'das'],
      correct_answer: 'das',
    })
  })

  it('lehnt Inhalte mit weniger als zwei Optionen ab', () => {
    expect(
      parseMultipleChoiceContent({ question: 'Frage', options: ['das'], correct_answer: 'das' })
    ).toBeNull()
  })
})

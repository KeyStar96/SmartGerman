import {
  addCustomVocabulary,
  loadCustomVocabulary,
  parseGermanHeadword,
  removeCustomVocabulary,
} from '@/lib/vocabulary-custom'

describe('parseGermanHeadword', () => {
  it('trennt der/die/das vom Wort', () => {
    expect(parseGermanHeadword('das Haus')).toEqual({ article: 'das', word_de: 'Haus' })
    expect(parseGermanHeadword('DIE Tür')).toEqual({ article: 'die', word_de: 'Tür' })
    expect(parseGermanHeadword('  der  Mann  ')).toEqual({ article: 'der', word_de: 'Mann' })
  })

  it('lässt Wörter ohne Artikel unverändert', () => {
    expect(parseGermanHeadword('laufen')).toEqual({ article: null, word_de: 'laufen' })
    expect(parseGermanHeadword('der')).toEqual({ article: null, word_de: 'der' })
  })
})

describe('custom vocabulary localStorage', () => {
  const level = 'A1.1'
  const lesson = 'Lektion 2'

  beforeEach(() => {
    window.localStorage.clear()
  })

  it('gibt ohne Eintrag ein leeres Array zurück', () => {
    expect(loadCustomVocabulary(level, lesson)).toEqual([])
  })

  it('speichert eine neue Vokabel in Phase 1 und liest sie nach einem Reload', () => {
    const added = addCustomVocabulary(level, lesson, 'das Haus', 'дом')
    expect(added).toHaveLength(1)
    expect(added[0]?.phase).toBe(1)
    expect(added[0]?.isLearned).toBe(false)
    expect(added[0]?.isCustom).toBe(true)
    expect(added[0]?.article).toBe('das')
    expect(added[0]?.word_de).toBe('Haus')
    expect(added[0]?.translation).toBe('дом')

    const reloaded = loadCustomVocabulary(level, lesson)
    expect(reloaded).toHaveLength(1)
    expect(reloaded[0]?.id).toBe(added[0]?.id)
    expect(reloaded[0]?.word_de).toBe('Haus')
    expect(reloaded[0]?.article).toBe('das')
  })

  it('legt eigene Vokabeln je Lektion getrennt ab', () => {
    addCustomVocabulary(level, 'Lektion 1', 'Hallo', 'привет')
    addCustomVocabulary(level, 'Lektion 2', 'Tschüss', 'пока')

    expect(loadCustomVocabulary(level, 'Lektion 1')).toHaveLength(1)
    expect(loadCustomVocabulary(level, 'Lektion 2')).toHaveLength(1)
    expect(loadCustomVocabulary(level, 'Lektion 1')[0]?.word_de).toBe('Hallo')
  })

  it('entfernt eine eigene Vokabel', () => {
    const added = addCustomVocabulary(level, lesson, 'Brot', 'хлеб')
    const id = added[0]?.id
    expect(id).toBeDefined()
    if (!id) return

    const remaining = removeCustomVocabulary(level, lesson, id)
    expect(remaining).toHaveLength(0)
    expect(loadCustomVocabulary(level, lesson)).toHaveLength(0)
  })

  it('ignoriert kaputte localStorage-Einträge', () => {
    window.localStorage.setItem('sitov_custom_vocab:A1.1:Lektion 2', '{not json')
    expect(loadCustomVocabulary(level, lesson)).toEqual([])
  })
})

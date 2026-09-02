import {
  GERMAN_ARTICLES,
  SMART_HINT_LETTER_THRESHOLD,
  SMART_HINT_THRESHOLD,
  type GermanArticle,
  type SmartHintDescriptor,
} from '@/lib/types/exercise'

/** Zielanzahl an Tipp-Chips: genug Auswahl, ohne die Zielgruppe zu überfordern. */
const TARGET_CHIP_COUNT = 4
const MAX_CHIP_COUNT = 6

/**
 * Wortfamilien für die automatische Chip-Generierung. Die Distraktoren stammen
 * bewusst aus derselben Formenreihe – dadurch wird die Auswahl zur echten
 * Grammatik-Entscheidung und nicht zum Ratespiel.
 * Reihenfolge ist relevant: Der erste Treffer gewinnt.
 */
const WORD_FAMILIES: readonly (readonly string[])[] = [
  ['bin', 'bist', 'ist', 'sind', 'seid'],
  ['habe', 'hast', 'hat', 'haben', 'habt'],
  ['werde', 'wirst', 'wird', 'werden', 'werdet'],
  ['kann', 'kannst', 'können', 'könnt'],
  ['muss', 'musst', 'müssen', 'müsst'],
  ['will', 'willst', 'wollen', 'wollt'],
  ['darf', 'darfst', 'dürfen', 'dürft'],
  ['soll', 'sollst', 'sollen', 'sollt'],
  ['möchte', 'möchtest', 'möchten', 'möchtet'],
  ['der', 'die', 'das'],
  ['den', 'dem', 'des'],
  ['ein', 'eine', 'einen', 'einem', 'einer'],
  ['kein', 'keine', 'keinen', 'keinem', 'keiner'],
  ['mein', 'meine', 'meinen', 'meinem', 'meiner'],
  ['dein', 'deine', 'deinen', 'deinem', 'deiner'],
  ['sein', 'seine', 'seinen', 'seinem', 'seiner'],
  ['ihr', 'ihre', 'ihren', 'ihrem', 'ihrer'],
  ['ich', 'du', 'er', 'sie', 'es', 'wir'],
  ['mich', 'dich', 'ihn', 'uns', 'euch'],
  ['mir', 'dir', 'ihm', 'ihnen'],
  ['in', 'an', 'auf', 'bei', 'zu', 'nach', 'mit'],
  ['am', 'im', 'um', 'vom', 'zum', 'zur'],
  ['gehe', 'gehst', 'geht', 'gehen'],
  ['fahre', 'fährst', 'fährt', 'fahren'],
  ['komme', 'kommst', 'kommt', 'kommen'],
  ['heiße', 'heißt', 'heißen'],
  ['wohne', 'wohnst', 'wohnt', 'wohnen'],
  ['spreche', 'sprichst', 'spricht', 'sprechen'],
]

/** Artikelformen inklusive Kasusvarianten – wichtig für die Hinweis-Auswahl. */
const ARTICLE_FORMS: readonly string[] = [
  'der', 'die', 'das', 'den', 'dem', 'des',
  'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  'kein', 'keine', 'keinen', 'keinem', 'keiner',
]

const VERB_FORMS: ReadonlySet<string> = new Set(
  WORD_FAMILIES.slice(0, 9).flatMap((family) => family)
)

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('de-DE')
}

/**
 * FNV-1a Hash: erzeugt aus der Übungs-ID einen stabilen Seed. Dadurch ist die
 * Chip-Reihenfolge auf Server und Client identisch (keine Hydration-Fehler) und
 * bleibt über Re-Renders hinweg gleich – Bewegung würde ältere Lernende irritieren.
 */
function hashToSeed(input: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function createRandom(seed: number): () => number {
  let state = seed || 1
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let result = Math.imul(state ^ (state >>> 15), 1 | state)
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleDeterministic<T>(items: readonly T[], seed: number): T[] {
  const random = createRandom(seed)
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    const swap = result[index]
    result[index] = result[target]
    result[target] = swap
  }
  return result
}

function findWordFamily(answer: string): readonly string[] | null {
  const normalized = normalize(answer)
  return WORD_FAMILIES.find((family) => family.includes(normalized)) ?? null
}

/**
 * Morphologische Notlösung: erzeugt aus einer Verbform verwandte Endungen,
 * falls das Wort in keiner Wortfamilie steht.
 */
function deriveMorphologicalVariants(answer: string): string[] {
  const normalized = normalize(answer)
  if (normalized.length < 3 || normalized !== answer.trim()) return []

  const suffixes = ['en', 'st', 'te', 'e', 't']
  const matched = suffixes.find((suffix) => normalized.endsWith(suffix))
  if (!matched) return []

  const stem = normalized.slice(0, normalized.length - matched.length)
  if (stem.length < 2) return []

  return ['e', 'st', 't', 'en']
    .map((suffix) => `${stem}${suffix}`)
    .filter((variant) => variant !== normalized)
}

function startsUppercase(value: string): boolean {
  const first = value.trim().charAt(0)
  return first.length > 0 && first === first.toLocaleUpperCase('de-DE') && first !== first.toLocaleLowerCase('de-DE')
}

export interface BuildChipsInput {
  /** Wird als Seed für die stabile Reihenfolge genutzt. */
  exerciseId: string
  correctAnswer: string
  /** Von der Lehrkraft im CMS gepflegte Chips (haben immer Vorrang). */
  authoredOptions?: readonly string[]
  /** Lösungen anderer Übungen desselben Themas als letzter Fallback. */
  siblingAnswers?: readonly string[]
}

/**
 * Baut die Auswahl-Chips für einen Lückentext. Das Ergebnis enthält garantiert
 * die richtige Lösung, ist frei von Duplikaten und stabil sortiert.
 *
 * Es wird bewusst niemals ein leeres Array zurückgegeben: Ohne Chips gäbe es
 * keine Eingabemöglichkeit, und eine freie Tastatureingabe ist für die
 * Zielgruppe ausgeschlossen.
 */
export function buildFillInBlankChips(input: BuildChipsInput): string[] {
  const correctAnswer = input.correctAnswer.trim()
  if (correctAnswer.length === 0) return []

  const seen = new Set<string>([normalize(correctAnswer)])
  const distractors: string[] = []

  const addCandidates = (candidates: readonly string[]): void => {
    for (const candidate of candidates) {
      if (distractors.length + 1 >= MAX_CHIP_COUNT) return
      const trimmed = candidate.trim()
      if (trimmed.length === 0) continue
      const key = normalize(trimmed)
      if (seen.has(key)) continue
      seen.add(key)
      distractors.push(trimmed)
    }
  }

  // 1. Von der Lehrkraft gepflegte Chips gewinnen immer.
  if (input.authoredOptions && input.authoredOptions.length > 0) {
    addCandidates(input.authoredOptions)
    return orderChips(correctAnswer, distractors, input.exerciseId)
  }

  // 2. Formen aus derselben Wortfamilie.
  const family = findWordFamily(correctAnswer)
  if (family) {
    const matchCasing = startsUppercase(correctAnswer)
      ? (word: string) => word.charAt(0).toLocaleUpperCase('de-DE') + word.slice(1)
      : (word: string) => word
    addCandidates(family.map(matchCasing))
  }

  // 3. Morphologisch verwandte Formen.
  if (distractors.length + 1 < TARGET_CHIP_COUNT && !startsUppercase(correctAnswer)) {
    addCandidates(deriveMorphologicalVariants(correctAnswer))
  }

  // 4. Lösungen benachbarter Übungen mit gleicher Groß-/Kleinschreibung.
  if (distractors.length + 1 < TARGET_CHIP_COUNT && input.siblingAnswers) {
    const sameCasing = input.siblingAnswers.filter(
      (answer) => startsUppercase(answer) === startsUppercase(correctAnswer)
    )
    addCandidates(sameCasing)
    if (distractors.length + 1 < TARGET_CHIP_COUNT) {
      addCandidates(input.siblingAnswers)
    }
  }

  return orderChips(correctAnswer, distractors.slice(0, MAX_CHIP_COUNT - 1), input.exerciseId)
}

function orderChips(correctAnswer: string, distractors: readonly string[], exerciseId: string): string[] {
  const limited = distractors.slice(0, MAX_CHIP_COUNT - 1)
  return shuffleDeterministic([correctAnswer, ...limited], hashToSeed(exerciseId))
}

function resolveBaseArticle(article: string | null): GermanArticle | null {
  if (!article) return null
  const normalized = normalize(article)
  return GERMAN_ARTICLES.find((candidate) => candidate === normalized) ?? null
}

export interface BuildSmartHintInput {
  correctAnswer: string
  /** Bisherige Fehlversuche in dieser Übung. */
  failedAttempts: number
  /** Im CMS gepflegter Hinweis (überschreibt die Automatik). */
  customHint?: string | null
  /** Artikel der Lösung, sofern sie als Vokabel bekannt ist. */
  article?: string | null
}

/**
 * Liefert einen dezenten Hinweis, sobald zweimal falsch geantwortet wurde.
 * Stufe 1 (2 Fehlversuche) nennt nur die Wortart bzw. das Geschlecht,
 * Stufe 2 (3 Fehlversuche) zusätzlich den Anfangsbuchstaben.
 *
 * Wichtig: Stufe 1 verrät die Lösung nie – ein Genus-Hinweis erscheint deshalb
 * nur, wenn die Lücke selbst kein Artikel ist.
 */
export function buildSmartHint(input: BuildSmartHintInput): SmartHintDescriptor | null {
  if (input.failedAttempts < SMART_HINT_THRESHOLD) return null

  const correctAnswer = input.correctAnswer.trim()
  if (correctAnswer.length === 0) return null

  const length = [...correctAnswer].length

  if (input.failedAttempts >= SMART_HINT_LETTER_THRESHOLD) {
    return {
      kind: 'first_letter',
      letter: [...correctAnswer][0].toLocaleUpperCase('de-DE'),
      length,
    }
  }

  const customHint = input.customHint?.trim()
  if (customHint) {
    return { kind: 'custom', text: customHint }
  }

  const isArticleAnswer = ARTICLE_FORMS.includes(normalize(correctAnswer))
  const baseArticle = resolveBaseArticle(input.article ?? null)

  if (!isArticleAnswer && baseArticle) {
    return { kind: 'gender', article: baseArticle }
  }

  if (VERB_FORMS.has(normalize(correctAnswer)) || (!isArticleAnswer && !startsUppercase(correctAnswer))) {
    return { kind: 'verb', length }
  }

  if (startsUppercase(correctAnswer)) {
    return { kind: 'noun', length }
  }

  return {
    kind: 'first_letter',
    letter: [...correctAnswer][0].toLocaleUpperCase('de-DE'),
    length,
  }
}

/**
 * Punkte je nach Anzahl der Versuche. Bewusst ohne Bestenlisten-Semantik –
 * der Wert dient nur der Fortschrittsanzeige und der Lehrkraft als Signal.
 */
export function scoreForAttempts(attempts: number): number {
  if (attempts <= 1) return 100
  if (attempts === 2) return 80
  if (attempts === 3) return 60
  return 40
}

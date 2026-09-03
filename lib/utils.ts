import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Viele "lesson"-Felder (Vokabeln, Videos, Übungen) werden von der Lehrkraft
 * bereits als "Lektion N" gepflegt. Die `lesson_label`-Übersetzungen fügen
 * aber selbst ein sprachabhängiges Präfix hinzu ("Lektion {lesson}" /
 * "Lesson {lesson}" / "Урок {lesson}" / …). Ohne Bereinigung entstünde eine
 * Dopplung wie "Lektion Lektion 2". Diese Funktion entfernt ein führendes
 * "Lektion" (case-insensitive, optionales Leerzeichen) aus dem Rohwert, bevor
 * er in die Übersetzung eingesetzt wird.
 */
export function stripLessonPrefix(lesson: string): string {
    const cleaned = lesson.replace(/^lektion\s*/i, '').trim()
    return cleaned || lesson
}

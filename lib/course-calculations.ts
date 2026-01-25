import { CourseConfig, Day, EXCEPTIONS } from "@/lib/course-config";

export const DAY_MAP: Record<Day, number> = {
    "So": 0, "Mo": 1, "Di": 2, "Mi": 3, "Do": 4, "Fr": 5, "Sa": 6
};

// Helper: Minuten berechnen
export const getDurationMinutes = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
};

export interface MonthlyStats {
    sessionCount: number;
    totalUnits: number;
    deductions: { amount: number, reason: string, date: string }[];
    monthName: string;
    targetYear: number;
    targetMonth: number;
}

// Berechnet Termine & Einheiten im NÄCHSTEN Monat (oder für ein spezifisches Datum)
export const calculateMonthlyStats = (
    course: CourseConfig,
    lang: string,
    baseDate: Date = new Date() // Dependency Injection for testing
): MonthlyStats => {
    // Wenn heute Jan 2026 -> Ziel: Feb 2026
    const targetYear = baseDate.getMonth() === 11 ? baseDate.getFullYear() + 1 : baseDate.getFullYear();
    const targetMonth = baseDate.getMonth() === 11 ? 0 : baseDate.getMonth() + 1;

    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    let sessionCount = 0;
    let totalUnits = 0;
    let deductions: { amount: number, reason: string, date: string }[] = [];

    // Map sessions map for easy lookup
    const sessionsByDay = new Map<number, typeof course.sessions>();
    course.sessions.forEach(s => {
        const dIndex = DAY_MAP[s.day];
        const existing = sessionsByDay.get(dIndex) || [];
        sessionsByDay.set(dIndex, [...existing, s]);
    });

    const localeMap: Record<string, string> = {
        'de': 'de-DE',
        'en': 'en-US',
        'ru': 'ru-RU',
        'uk': 'uk-UA',
        'tu': 'tr-TR'
    };
    const locale = localeMap[lang] || 'de-DE';

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(targetYear, targetMonth, d);
        // Warning: Local vs ISO/UTC handling.
        // Construction with (Y, M, D) creates local time.
        // YYYY-MM-DD generation needs to be careful.
        // padStart guarantees 2 digits.
        const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayOfWeek = date.getDay();

        const sessionsToday = sessionsByDay.get(dayOfWeek);
        if (sessionsToday) {
            sessionsToday.forEach(s => {
                const mins = getDurationMinutes(s.startTime, s.endTime);
                const units = mins / (course.unitDuration || 45);
                const cost = units * course.price;

                // Check for exception
                const exception = EXCEPTIONS.find(e =>
                    e.date === dateStr && (!e.courseIds || e.courseIds.includes(course.id))
                );

                if (exception) {
                    deductions.push({
                        amount: cost,
                        reason: exception.reason,
                        date: date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })
                    });
                } else {
                    sessionCount++;
                    totalUnits += units;
                }
            });
        }
    }

    let monthName = new Date(targetYear, targetMonth, 1).toLocaleString(locale, { month: 'long', year: 'numeric' });
    if (['ru', 'uk'].includes(lang)) {
        monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    }

    return {
        sessionCount,
        totalUnits,
        deductions,
        monthName,
        targetYear,
        targetMonth
    };
};

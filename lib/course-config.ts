
export type Day = "Mo" | "Di" | "Mi" | "Do" | "Fr" | "Sa" | "So";
export type CourseType = "presence" | "online";
export type InstructorKey = "standard" | "special";

export interface CourseSession {
    day: Day;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
}

export interface CourseConfig {
    id: string;
    translationKey: string;
    type: CourseType;
    price: number;
    highlight?: boolean;
    sessions: CourseSession[];
    instructor: InstructorKey; // For logic if needed, or specific name lookup
    level?: string;
    unitDuration: number;
}


export interface CourseException {
    date: string; // YYYY-MM-DD
    reason: string;
    courseIds?: string[]; // Optional: Specific Course IDs. If omitted, applies to ALL courses.
}

export const EXCEPTIONS: CourseException[] = [
    {
        date: "2026-02-02",
        reason: "Kursraum steht noch nicht zur Verfügung",
        // courseIds: [] // Omitted = applies to all. Use ["c_id"] to restrict.
    }
];

export const COURSES: CourseConfig[] = [
    // Präsenz-Kurse (Senioren / 50+)
    {
        id: "c_a1_1_50plus",
        translationKey: "a1_1_50plus",
        type: "presence",
        price: 2.50,
        unitDuration: 45,
        instructor: "standard",
        sessions: [
            { day: "Mo", startTime: "09:00", endTime: "10:30" },
            { day: "Di", startTime: "10:30", endTime: "12:00" }
        ]
    },
    {
        id: "c_a1_2_50plus",
        translationKey: "a1_2_50plus",
        type: "presence",
        price: 2.50,
        unitDuration: 45,
        instructor: "standard",
        sessions: [
            { day: "Di", startTime: "09:00", endTime: "10:30" },
            { day: "Mi", startTime: "10:30", endTime: "12:00" }
        ]
    },
    {
        id: "c_a2_50plus",
        translationKey: "a2_50plus",
        type: "presence",
        price: 2.50,
        unitDuration: 45,
        instructor: "standard",
        sessions: [
            { day: "Mo", startTime: "10:30", endTime: "12:00" },
            { day: "Mi", startTime: "09:00", endTime: "10:30" }
        ]
    },
    // Sprechtraining
    {
        id: "c_speech_a1_1",
        translationKey: "speech_a1_1",
        type: "presence",
        price: 3.50,
        unitDuration: 60,
        instructor: "standard",
        sessions: [
            { day: "Di", startTime: "12:00", endTime: "13:00" }
        ]
    },
    {
        id: "c_speech_a1_2",
        translationKey: "speech_a1_2",
        type: "presence",
        price: 3.50,
        unitDuration: 60,
        instructor: "standard",
        sessions: [
            { day: "Mi", startTime: "12:00", endTime: "13:00" }
        ]
    },
    {
        id: "c_speech_a2",
        translationKey: "speech_a2",
        type: "presence",
        price: 3.50,
        unitDuration: 60,
        instructor: "standard",
        sessions: [
            { day: "Mo", startTime: "12:00", endTime: "13:00" }
        ]
    },

    // Online-Kurse
    {
        id: "c_online_a1_1",
        translationKey: "online_a1_1",
        type: "online",
        price: 7.50,
        unitDuration: 45,
        instructor: "standard",
        sessions: [
            { day: "Do", startTime: "19:00", endTime: "20:30" },
            { day: "Fr", startTime: "19:00", endTime: "20:30" }
        ]
    },
    {
        id: "c_online_b1",
        translationKey: "online_b1",
        type: "online",
        price: 7.50,
        unitDuration: 45,
        instructor: "standard",
        sessions: [
            { day: "Mo", startTime: "14:30", endTime: "16:00" },
            { day: "Di", startTime: "14:30", endTime: "16:00" }
        ]
    },
    {
        id: "c_online_b2",
        translationKey: "online_b2",
        type: "online",
        price: 7.50,
        unitDuration: 45,
        instructor: "special",
        sessions: [
            { day: "Mo", startTime: "16:00", endTime: "17:30" },
            { day: "Mi", startTime: "16:00", endTime: "17:30" }
        ]
    }
];

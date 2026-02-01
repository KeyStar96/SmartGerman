
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

// Constants removed - Data is now in Supabase

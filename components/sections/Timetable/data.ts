export type CourseType = "Präsenz" | "Online";

export interface CourseData {
    id: string;
    day: "Mo" | "Di" | "Mi" | "Do" | "Fr";
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    title: string;
    type: CourseType;
    locationKey: "presence" | "online";
    instructorKey: "standard" | "special";
}

export const COURSE_DATA: CourseData[] = [
    // Montag
    { id: "mo-1", day: "Mo", startTime: "09:00", endTime: "10:30", title: "A1.1 50+", type: "Präsenz", locationKey: "presence", instructorKey: "standard" },
    { id: "mo-2", day: "Mo", startTime: "10:30", endTime: "12:00", title: "A2", type: "Präsenz", locationKey: "presence", instructorKey: "standard" },
    { id: "mo-3", day: "Mo", startTime: "12:00", endTime: "13:30", title: "Sprechtraining", type: "Präsenz", locationKey: "presence", instructorKey: "standard" },
    { id: "mo-4", day: "Mo", startTime: "14:30", endTime: "16:00", title: "Aufbaukurs B1", type: "Online", locationKey: "online", instructorKey: "standard" },
    { id: "mo-5", day: "Mo", startTime: "16:00", endTime: "17:30", title: "B2-Intensiv", type: "Online", locationKey: "online", instructorKey: "special" },

    // Dienstag
    { id: "di-1", day: "Di", startTime: "09:00", endTime: "10:30", title: "A1.2", type: "Präsenz", locationKey: "presence", instructorKey: "standard" },
    { id: "di-2", day: "Di", startTime: "12:00", endTime: "13:30", title: "Sprechtraining", type: "Präsenz", locationKey: "presence", instructorKey: "standard" },
    { id: "di-3", day: "Di", startTime: "14:30", endTime: "16:00", title: "Aufbaukurs B1", type: "Online", locationKey: "online", instructorKey: "standard" },

    // Mittwoch
    { id: "mi-1", day: "Mi", startTime: "09:00", endTime: "10:30", title: "50+ A2", type: "Präsenz", locationKey: "presence", instructorKey: "standard" },
    { id: "mi-2", day: "Mi", startTime: "10:30", endTime: "12:00", title: "A1.2", type: "Präsenz", locationKey: "presence", instructorKey: "standard" },
    { id: "mi-3", day: "Mi", startTime: "12:00", endTime: "13:30", title: "Sprechtraining", type: "Präsenz", locationKey: "presence", instructorKey: "standard" },
    { id: "mi-4", day: "Mi", startTime: "16:00", endTime: "17:30", title: "B2-Intensiv", type: "Online", locationKey: "online", instructorKey: "special" },

    // Donnerstag
    { id: "do-1", day: "Do", startTime: "19:00", endTime: "20:30", title: "A1.1 Erwachsene", type: "Online", locationKey: "online", instructorKey: "standard" },

    // Freitag
    { id: "fr-1", day: "Fr", startTime: "19:00", endTime: "20:30", title: "A1.1 Erwachsene", type: "Online", locationKey: "online", instructorKey: "standard" },
];

export const DAYS = ["Mo", "Di", "Mi", "Do", "Fr"] as const;

export const getDayCourses = (day: string) => COURSE_DATA.filter(c => c.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));

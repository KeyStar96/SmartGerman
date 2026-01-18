export function isOpenNow(): boolean {
    // Create a date object for the current time
    const now = new Date();

    // Convert to Berlin time
    const berlinTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));

    const day = berlinTime.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const hour = berlinTime.getHours();

    // Check if it's Monday (1) through Friday (5)
    if (day >= 1 && day <= 5) {
        // Check if it's between 09:00 and 18:00 (exclusive of 18:00 for closing)
        // "between 09:00 and 18:00" usually means 09:00 inclusive to just before 18:00.
        if (hour >= 9 && hour < 18) {
            return true;
        }
    }

    return false;
}

export function getCurrentDayName(): "Mo" | "Di" | "Mi" | "Do" | "Fr" | null {
    const now = new Date();
    const berlinTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
    const dayIndex = berlinTime.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    const DAYS = ["Mo", "Di", "Mi", "Do", "Fr"] as const;

    // specific mapping: 1=Mo (index 0), 5=Fr (index 4)
    if (dayIndex >= 1 && dayIndex <= 5) {
        return DAYS[dayIndex - 1];
    }
    // Return null on weekends
    return null;
}

export function isCourseLive(day: string, startTime: string, endTime: string): boolean {
    const currentDay = getCurrentDayName();
    if (!currentDay || currentDay !== day) return false;

    const now = new Date();
    const berlinTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));

    // Parse HH:MM
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    const currentH = berlinTime.getHours();
    const currentM = berlinTime.getMinutes();
    const currentTotal = currentH * 60 + currentM;

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    return currentTotal >= startTotal && currentTotal < endTotal;
}

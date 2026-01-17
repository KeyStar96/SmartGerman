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

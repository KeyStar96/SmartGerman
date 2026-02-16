export function getEarliestCancellationDate(referenceDate: Date = new Date()): Date {
    // Return today as the earliest possible date
    const today = new Date();
    // Reset time to midnight to avoid issues with same-day comparison if needed, 
    // but the original function returned a Date object. 
    // The previous logic returned `lastDayOfTargetMonth`.
    // We just want to allow ANY future date starting from today.
    return today;
}

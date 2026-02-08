export function getEarliestCancellationDate(referenceDate: Date = new Date()): Date {
    const currentDay = referenceDate.getDate();
    const currentMonth = referenceDate.getMonth();
    const currentYear = referenceDate.getFullYear();

    // If today is <= 25, earliest is end of current month.
    // If today > 25, earliest is end of NEXT month.
    let targetMonth = currentMonth;
    let targetYear = currentYear;

    if (currentDay > 25) {
        targetMonth = currentMonth + 1;
    }

    // Handle year overflow
    if (targetMonth > 11) {
        targetMonth = 0;
        targetYear++;
    }

    // Get last day of the target month
    // new Date(year, month + 1, 0) gives the last day of 'month'
    const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0);
    return lastDayOfTargetMonth;
}

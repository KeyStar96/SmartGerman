export function getEarliestCancellationDate(referenceDate: Date = new Date()): Date {
    const day = referenceDate.getDate();
    const month = referenceDate.getMonth();
    const year = referenceDate.getFullYear();

    // If today is <= 25th, early cancellation is end of THIS month
    if (day <= 25) {
        // Day 0 of next month gives the last day of current month
        return new Date(year, month + 1, 0);
    }

    // If today is > 25th, early cancellation is end of NEXT month
    return new Date(year, month + 2, 0);
}

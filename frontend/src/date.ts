export function danishDate(date: string): string {
    if (date === "i-dag") {
        return "i dag"
    }
    const d = new Date(date);

    const weekday = new Intl.DateTimeFormat('da-DK', {weekday: 'long'}).format(d);
    const day = d.getDate();
    const month = new Intl.DateTimeFormat('da-DK', {month: 'long'}).format(d);
    const year = d.getFullYear();

    const result = `${weekday} d. ${day}. ${month} ${year}`;

    return result.charAt(0).toUpperCase() + result.slice(1);
}

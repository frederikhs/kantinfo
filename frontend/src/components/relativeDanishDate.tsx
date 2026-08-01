import {useMemo} from "react";

function relativeDate(inputDate: string): string | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize time
    const target = new Date(inputDate);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    switch (diffDays) {
        case 0:
            return "i dag";
        case -1:
            return "i går";
        case -2:
            return "i forgårs";
        case 1:
            return "i morgen";
        case 2:
            return "i overmorgen";
        default:
            return null;
    }
}

export default function RelativeDanishDate({date}: { date: string }) {
    const relative = useMemo(() => {
        return relativeDate(date)
    }, [date])

    if (relative === null) {
        return
    }

    return <span> ({relative})</span>
}

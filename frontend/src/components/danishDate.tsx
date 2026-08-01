import {useMemo} from "react";
import {danishDate} from "../date.ts";
import RelativeDanishDate from "./relativeDanishDate.tsx";

export default function DanishDate({date, not_relative}: { date: string, not_relative?: boolean }) {
    const d = useMemo(() => {
        return danishDate(date)
    }, [date])

    if (not_relative) {
        return <span>{d}</span>
    }

    return <>
        <span>{d}</span><RelativeDanishDate date={date} />
    </>;
}

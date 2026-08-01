import {useEffect, useState} from "react";
import type {MenuDate} from "../type.ts";
import {getDates} from "../util.ts";
import {Link} from "react-router";
import DanishDate from "../components/danishDate.tsx";

export default function DatePage() {
    const [dates, setDates] = useState<MenuDate[]>()

    useEffect(() => {
        getDates().then((r) => {
            if (r.status !== 200) {
                return
            }

            setDates(r.response)
        })
    }, [])

    if (dates === undefined) {
        return <p>Loading</p>
    }

    return (
        <div className={"flex flex-col space-y-2 sm:space-y-0"}>
            {dates.map((d, i) => {
                return (
                    <Link className={`${d.is_future && "text-slate-400"} ${!d.is_today && !d.is_future && "text-slate-600"} link`} to={"/menu/" + d.date} key={i}>[<DanishDate date={d.date}/>]</Link>
                )
            })}
        </div>
    )
}

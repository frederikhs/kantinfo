import {useEffect, useState} from "react";
import type {MenuDate} from "../type.ts";
import {getDates} from "../util.ts";
import {Link} from "react-router";
import DanishDate from "../components/danishDate.tsx";
import {ArrowRightIcon} from "@heroicons/react/24/solid";

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
        <div className={"flex flex-col space-y-4"}>
            {dates.map((d, i) => {
                return (
                    <Link
                        className={`${d.is_future && "date-future"} ${!d.is_today && !d.is_future && "date-past"} link flex justify-beween space-x-2`}
                        to={"/menu/" + d.date}
                        key={i}
                    >
                        {d.is_today && <ArrowRightIcon className="size-6"/>}
                        <DanishDate date={d.date}/>
                    </Link>
                )
            })}

            <p className={"muted"}>Menuen opdateres én gang i timen og viser de oplysninger, som kantinen selv har offentliggjort.</p>
            <p className={"muted"}>Menuen kan ændre sig, hvis kantinen opdaterer sine oplysninger. Det er også normalt, at menuen bliver mere detaljeret, jo tættere vi kommer på den pågældende dag.</p>
            <p className={"muted flex items-center"}>Brug <Link className={"link mx-2"} to={"/menu/neaste/stor"} target={"_blank"}>link til storskærm</Link> for at vise menuen på storskærm i din afdeling</p>
        </div>
    )
}

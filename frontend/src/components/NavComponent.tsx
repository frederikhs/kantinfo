import {Link} from "react-router";
import type {CurrentOrNext, Navigation} from "../type.ts";
import DanishDate from "./danishDate.tsx";

export default function NavComponent({navigation, current_or_next}: {
    navigation: Navigation | undefined,
    current_or_next: CurrentOrNext | undefined
}) {
    return (
        <div className={"pt-4 mb-4 mx-2"}>
            <nav className={"flex justify-between items-center"}>
                <div className={"space-x-4"}>
                    <Link to={"/"} className={`group`}>
                        <h1 className={"flex items-center space-x-2 font-normal!"}>
                            <span>[KantInfo]</span>
                        </h1>
                    </Link>
                </div>
                <div className={"flex items-center space-x-4 h-px "}>
                    {navigation !== undefined && current_or_next !== undefined && (
                        <>
                    {navigation.previous_date !== null && (
                        <Link
                            className={"link hidden md:block"}
                            to={"/menu/" + navigation.previous_date}
                        >[<DanishDate date={navigation.previous_date} not_relative={true}/>]</Link>
                    )}
                        <br/>
                    {navigation.next_date !== null && (
                        <Link className={"link hidden md:block"} to={"/menu/" + navigation.next_date}>[<DanishDate
                            date={navigation.next_date}
                            not_relative={true}
                        />]</Link>
                    )}
                    {current_or_next.date !== navigation.current_date && (
                        <Link className={"link hidden md:block"} to={"/menu/" + current_or_next.date}>
                            [{current_or_next.is_future && "Gå til nærmeste"}
                            {!current_or_next.is_future && "Gå til i dag"}]
                        </Link>
                    )}
                        </>
                    )}
                    <Link className={"link"} to={"/datoer"}>[Alle dage]</Link>
                </div>
            </nav>
        </div>
    )
}

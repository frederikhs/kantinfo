import {Link} from "react-router";
import type {CurrentOrNext, Navigation} from "../type.ts";
import DanishDate from "./danishDate.tsx";
import {ArrowLeftIcon, ArrowRightIcon, ArrowTrendingUpIcon, ArrowTurnLeftDownIcon} from "@heroicons/react/24/solid";

export default function NavComponent({navigation, current_or_next}: {
    navigation: Navigation | undefined,
    current_or_next: CurrentOrNext | undefined
}) {
    return (
        <div className={"pt-4 mb-4 mx-2"}>
            <nav className={"flex justify-between items-center"}>
                <div className={"space-x-4"}>
                    <Link to={"/"} className={`text-2xl hover:bg-zinc-800 p-2 px-4 -ml-4 transition-all rounded-lg`}>
                        KantInfo
                    </Link>
                </div>
                <div className={"flex items-center space-x-4 h-px"}>
                    {navigation !== undefined && current_or_next !== undefined && (
                        <>
                            {current_or_next.date !== navigation.current_date && (
                                <Link className={"link hidden md:flex justify-beween space-x-2"} to={"/menu/" + current_or_next.date}>
                                    <span>
                                    {current_or_next.is_future && "Hop til nærmeste"}
                                        {!current_or_next.is_future && "Hop til i dag"}
                                        </span>
                                    <ArrowTrendingUpIcon className="size-6"/>
                                </Link>
                            )}
                            {navigation.previous_date !== null && (
                                <Link
                                    className={"link hidden md:flex justify-beween space-x-2"}
                                    to={"/menu/" + navigation.previous_date}
                                >
                                    <ArrowLeftIcon className="size-6"/>
                                    <DanishDate date={navigation.previous_date} not_relative={true}/>
                                </Link>
                            )}
                            <br/>
                            {navigation.next_date !== null && (
                                <Link className={"link hidden md:flex justify-beween space-x-2"} to={"/menu/" + navigation.next_date}>
                                    <DanishDate date={navigation.next_date} not_relative={true}/>
                                    <ArrowRightIcon className="size-6"/>
                                </Link>
                            )}
                        </>
                    )}
                    <Link className={"link hidden md:flex justify-beween space-x-2"} to={"/datoer"}>
                        <span>Vælg dato</span>
                        <ArrowTurnLeftDownIcon className="size-6"/>
                    </Link>
                </div>
            </nav>
        </div>
    )
}

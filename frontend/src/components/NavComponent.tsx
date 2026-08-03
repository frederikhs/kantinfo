import {Link} from "react-router";
import type {CurrentOrNext, Navigation} from "../type.ts";
import DanishDate from "./danishDate.tsx";
import {ArrowLeftIcon, ArrowRightIcon, ArrowTrendingUpIcon, ArrowTurnLeftDownIcon, MoonIcon, SunIcon} from "@heroicons/react/24/solid";
import {useTheme} from "../themeContext.ts";

export default function NavComponent({navigation, current_or_next}: {
    navigation: Navigation | undefined,
    current_or_next: CurrentOrNext | undefined
}) {
    const {theme, toggleTheme} = useTheme()

    return (
        <div className={"pt-4 mb-4 mx-2"}>
            <nav className={"flex justify-between items-center"}>
                <div className={"space-x-4"}>
                    <Link to={"/"} className={`logo-link text-2xl -ml-4`}>
                        KantInfo
                    </Link>
                </div>
                <div className={"flex items-center space-x-4"}>
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
                    <Link className={"link flex justify-beween space-x-2"} to={"/datoer"}>
                        <span>Vælg dato</span>
                        <ArrowTurnLeftDownIcon className="size-6"/>
                    </Link>
                    <button
                        className={"theme-toggle hover:cursor-pointer"}
                        onClick={toggleTheme}
                    >
                        {theme === "dark" ? <SunIcon className="size-6"/> : <MoonIcon className="size-6"/>}
                    </button>
                </div>
            </nav>
        </div>
    )
}

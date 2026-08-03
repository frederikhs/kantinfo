import {Outlet, useOutletContext, useParams} from "react-router";
import NavComponent from "./components/NavComponent.tsx";
import type {CurrentOrNext, MenuItem, Navigation} from "./type.ts";
import {useEffect, useMemo, useState} from "react";
import {getMenuItems} from "./util.ts";

export function useData() {
    return useOutletContext<{ navigation: Navigation, menuItems: MenuItem[], currentOrNext: CurrentOrNext }>();
}

export default function Frame() {
    const {date} = useParams();

    const dateV = useMemo(() => {
        if (date === undefined) {
            return "next"
        }

        return date
    }, [date])

    const [menuItems, setMenuItems] = useState<MenuItem[]>()
    const [navigation, setNavigation] = useState<Navigation>()
    const [currentOrNext, setCurrentOrNext] = useState<CurrentOrNext>()

    useEffect(() => {
        setMenuItems(undefined)
        setNavigation(undefined)
        setCurrentOrNext(undefined)
        getMenuItems(dateV).then((r) => {
            if (r.status !== 200) {
                return
            }

            setMenuItems(r.response.menu)
            setNavigation(r.response.navigation)
            setCurrentOrNext(r.response.current_or_next)
        })
    }, [dateV])

    return (
        <div>
            <div className={"sticky top-0 z-1 mb-4 bg-zinc-950"}>
                <div className={"max-w-5xl mx-auto"}>
                    <NavComponent navigation={navigation} current_or_next={currentOrNext}/>
                </div>
                <hr className={"mt-2 text-zinc-800 border-2"}/>
            </div>
            <div className={"max-w-5xl mx-auto px-2 pb-4"}>
                {menuItems !== undefined && currentOrNext !== undefined && navigation !== undefined && (
                    <Outlet context={{navigation, menuItems, currentOrNext}}/>
                )}
            </div>
        </div>
    )
}

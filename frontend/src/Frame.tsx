import {Link, Outlet, useParams} from "react-router";
import NavComponent from "./components/NavComponent.tsx";
import type {CurrentOrNext, MenuGroup, Navigation} from "./type.ts";
import {useEffect, useMemo, useState} from "react";
import {getMenuItems} from "./util.ts";

type FrameData = {
    date: string
    menuItems: MenuGroup[]
    navigation: Navigation
    currentOrNext: CurrentOrNext
}

export default function Frame({nav}: { nav: boolean }) {
    const {date} = useParams();

    const dateV = useMemo(() => {
        if (date === undefined) {
            return "next"
        }

        if (date === "neaste") {
            return "next"
        }

        return date
    }, [date])

    const [data, setData] = useState<FrameData>()
    const activeData = data?.date === dateV ? data : undefined

    useEffect(() => {
        let ignoreResponse = false

        getMenuItems(dateV).then((r) => {
            if (ignoreResponse) {
                return
            }

            if (r.status !== 200) {
                setData(undefined)
                return
            }

            setData({
                date: dateV,
                menuItems: r.response.menu,
                navigation: r.response.navigation,
                currentOrNext: r.response.current_or_next,
            })
        })

        return () => {
            ignoreResponse = true
        }
    }, [dateV])

    return (
        <div>
            {nav && (
                <div className={"app-header sticky top-0 z-1 mb-4"}>
                    <div className={"max-w-6xl mx-auto"}>
                        <NavComponent navigation={activeData?.navigation} current_or_next={activeData?.currentOrNext}/>
                    </div>
                    <hr className={"divider mt-2 border-2"}/>
                </div>
            )}
            <div className={"max-w-6xl mx-auto px-2 pb-4"}>
                {activeData !== undefined && (
                    <Outlet
                        context={{
                            navigation: activeData.navigation,
                            menuItems: activeData.menuItems,
                            currentOrNext: activeData.currentOrNext,
                        }}
                    />
                )}

                {!nav && (
                    <div className={"surface rounded-xl p-4 mt-4 mb-4 break-inside-avoid"}>
                        <h3 className={"text-green-500 dark:text-green-700 text-center"}>
                            <Link to={window.location.protocol + "//" + window.location.host}>{window.location.host}</Link>
                        </h3>
                    </div>
                )}
            </div>
        </div>
    )
}

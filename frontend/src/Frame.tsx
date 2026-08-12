import {Outlet, useParams} from "react-router";
import NavComponent from "./components/NavComponent.tsx";
import type {CurrentOrNext, MenuGroup, Navigation} from "./type.ts";
import {useEffect, useMemo, useState} from "react";
import {getMenuItems} from "./util.ts";
import {QRCodeSVG} from "qrcode.react";

type FrameData = {
    date: string
    menuItems: MenuGroup[]
    navigation: Navigation
    currentOrNext: CurrentOrNext
}

export default function Frame({nav}: { nav: boolean }) {
    const {date} = useParams();
    const browseMenuUrl = new URL("/datoer", window.location.origin).toString()

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
        <div className={!nav ? "min-h-dvh flex flex-col" : undefined}>
            {nav && (
                <div className={"app-header sticky top-0 z-1 mb-4"}>
                    <div className={"max-w-6xl mx-auto"}>
                        <NavComponent navigation={activeData?.navigation} current_or_next={activeData?.currentOrNext}/>
                    </div>
                    <hr className={"divider mt-2 border-2"}/>
                </div>
            )}
            <div className={`max-w-6xl mx-auto px-2 pb-4 ${!nav ? "w-full flex-1" : ""}`}>
                {activeData !== undefined && (
                    <Outlet
                        context={{
                            navigation: activeData.navigation,
                            menuItems: activeData.menuItems,
                            currentOrNext: activeData.currentOrNext,
                        }}
                    />
                )}
            </div>
            {!nav && (
                <footer className={"mx-auto flex w-full max-w-6xl items-center justify-center gap-5 px-4 py-6"}>
                    <QRCodeSVG
                        value={browseMenuUrl}
                        size={192}
                        level="H"
                        marginSize={4}
                        title="QR-kode til hele ugens menu"
                        className={"size-36 shrink-0 lg:size-48"}
                    />
                    <div>
                        <p className={"text-2xl font-semibold"}>Scan for at se hele ugens menu</p>
                        <p className={"mt-1 text-xl muted"}>{window.location.host}</p>
                    </div>
                </footer>
            )}
        </div>
    )
}

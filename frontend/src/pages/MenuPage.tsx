import {useData} from "../useData.ts";
import {useMemo} from "react";
import DanishDate from "../components/danishDate.tsx";

export default function MenuPage() {
    const {menuItems, navigation} = useData()

    const sortedMenuItems = useMemo(() => {

        const filterGroups = [
            "Dagens ret",
            "Dagens vegetariske ret",
            "Green corner",
        ]

        const priority = Object.fromEntries(
            filterGroups.map((group, index) => [group, index])
        )

        return menuItems
            .sort((a, b) => {
                const pa = priority[a.group] ?? Infinity
                const pb = priority[b.group] ?? Infinity
                return pa - pb
            })
    }, [menuItems])

    return (
        <div>
            <h2><DanishDate date={navigation.current_date}/></h2>

            <div className={"grid grid-cols-1 sm:grid-cols-2 gap-4"}>
                {sortedMenuItems.map((d, i) => {
                    return (
                        <div key={i} className={"surface rounded-xl p-4"}>
                            <h3>{d.group}</h3>
                            <ul className={"list-disc pl-5"}>
                                {d.items.map((item, itemIndex) => (
                                    <li key={itemIndex}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

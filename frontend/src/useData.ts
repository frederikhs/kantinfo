import {useOutletContext} from "react-router";
import type {CurrentOrNext, MenuGroup, Navigation} from "./type.ts";

export function useData() {
    return useOutletContext<{ navigation: Navigation, menuItems: MenuGroup[], currentOrNext: CurrentOrNext }>();
}

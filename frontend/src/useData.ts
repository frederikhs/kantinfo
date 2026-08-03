import {useOutletContext} from "react-router";
import type {CurrentOrNext, MenuItem, Navigation} from "./type.ts";

export function useData() {
    return useOutletContext<{ navigation: Navigation, menuItems: MenuItem[], currentOrNext: CurrentOrNext }>();
}

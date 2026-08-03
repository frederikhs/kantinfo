import {createContext, useContext} from "react";

export type Theme = "light" | "dark";

export type ThemeContextValue = {
    theme: Theme
    toggleTheme: () => void
}

export const themeStorageKey = "kantinfo-theme";
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function isTheme(value: string | null): value is Theme {
    return value === "light" || value === "dark"
}

export function useTheme() {
    const context = useContext(ThemeContext)

    if (context === undefined) {
        throw new Error("useTheme must be used within ThemeProvider")
    }

    return context
}

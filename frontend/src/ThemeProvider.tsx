import {useEffect, useMemo, useState, type ReactNode} from "react";
import {isTheme, ThemeContext, themeStorageKey, type Theme} from "./themeContext.ts";

function preferredTheme(): Theme {
    if (typeof window === "undefined") {
        return "dark"
    }

    const storedTheme = window.localStorage.getItem(themeStorageKey)
    if (isTheme(storedTheme)) {
        return storedTheme
    }

    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
}

export default function ThemeProvider({children}: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(preferredTheme)

    useEffect(() => {
        document.documentElement.dataset.theme = theme
        document.documentElement.style.colorScheme = theme
        window.localStorage.setItem(themeStorageKey, theme)
    }, [theme])

    const value = useMemo(() => {
        return {
            theme,
            toggleTheme: () => {
                setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark")
            },
        }
    }, [theme])

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

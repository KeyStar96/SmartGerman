"use client";

import { useEffect } from "react";

/**
 * Ensures that the theme stored in localStorage is applied
 * when the component mounts (e.g., after a language switch).
 */
export function ThemeInit() {
    useEffect(() => {
        try {
            const theme = localStorage.getItem("theme");
            // If explicit dark OR null (default), set dark
            if (theme === "dark" || theme === null) {
                document.documentElement.classList.add("dark");
            } else if (theme === "light") {
                document.documentElement.classList.remove("dark");
            }
        } catch (e) {
            // Ignore errors (e.g. valid localStorage access)
        }
    }, []);

    return null;
}

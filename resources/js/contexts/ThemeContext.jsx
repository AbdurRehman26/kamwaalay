import React, { createContext, useState, useEffect, useContext } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(false);

    const applyTheme = (dark) => {
        const root = document.documentElement;
        if (dark) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    };

    useEffect(() => {
        // Check localStorage for saved theme preference
        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        
        // Use saved theme, or system preference, or default to light
        const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);
        setIsDark(shouldBeDark);
        applyTheme(shouldBeDark);
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        localStorage.setItem("theme", newTheme ? "dark" : "light");
        applyTheme(newTheme);
    };

    const setTheme = (theme) => {
        const isDarkMode = theme === "dark";
        setIsDark(isDarkMode);
        localStorage.setItem("theme", theme);
        applyTheme(isDarkMode);
    };

    const value = {
        isDark,
        toggleTheme,
        setTheme,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};


import React from "react";
import { useAppContext } from "../context/AppContext";

const ThemeToggle = () => {
    const { theme, toggleTheme } = useAppContext();
    return <button type="button" onClick={toggleTheme} className="rounded-full border border-borderColor bg-white/60 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-light" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
    </button>;
};

export default ThemeToggle;

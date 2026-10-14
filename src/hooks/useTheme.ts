import { useState } from "react";
import type { ThemeControls } from "@/models";

const STORAGE_KEY = "jabali-theme";

/** Light / dark mode, applied as `data-theme` on <html> and remembered between visits. */
export function useTheme(): ThemeControls {
  const [dark, setDark] = useState(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    return attr ? attr === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* storage can be blocked; the toggle still works for this visit */
    }
  };

  return { dark, toggle };
}

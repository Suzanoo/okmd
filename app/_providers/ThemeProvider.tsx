"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/theme/store";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");

    localStorage.setItem("okmd_theme_mode", theme);
  }, [theme]);

  return <>{children}</>;
}

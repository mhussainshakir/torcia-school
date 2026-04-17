"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

/**
 * Theme provider component that manages light/dark mode.
 * Wraps the application to provide theme context.
 * 
 * @param props - Standard theme provider props (attribute, defaultTheme, enableSystem, disableTransitionOnChange, children)
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
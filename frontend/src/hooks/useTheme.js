import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'pw-bot-theme';

/**
 * Hook para gerenciar tema claro/escuro
 */
export const useTheme = () => {
    const [theme, setTheme] = useState(() => {
        // Tenta recuperar tema salvo, senão usa preferência do sistema
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) return saved;

        return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    });

    useEffect(() => {
        // Aplica tema no document
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    const setDarkTheme = useCallback(() => setTheme('dark'), []);
    const setLightTheme = useCallback(() => setTheme('light'), []);

    return {
        theme,
        isDark: theme === 'dark',
        isLight: theme === 'light',
        toggleTheme,
        setDarkTheme,
        setLightTheme
    };
};

export default useTheme;

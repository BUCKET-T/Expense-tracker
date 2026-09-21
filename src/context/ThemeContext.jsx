import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
    });

    useEffect(() => {
    // 1. Save to local storage
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    
    if (isDarkTheme) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    }, [isDarkTheme]);

    const toggleTheme = () => setIsDarkTheme(!isDarkTheme);

    return (
    <ThemeContext.Provider value={{ isDarkTheme, toggleTheme }}>
        {children}
    </ThemeContext.Provider>
    );
};
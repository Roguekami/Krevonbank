import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Default to dark mode if no saved preference
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('krevon_theme');
    return savedTheme ? savedTheme : 'dark';
  });

  useEffect(() => {
    // Update the class on the html element whenever the theme changes
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Save to local storage
    localStorage.setItem('krevon_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

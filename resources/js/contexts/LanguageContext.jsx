import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [locale, setLocale] = useState('en');
    const [translations, setTranslations] = useState({});

    useEffect(() => {
        // Get locale from localStorage or default to 'en'
        const savedLocale = localStorage.getItem('locale') || 'en';
        setLocale(savedLocale);
        loadTranslations(savedLocale);

        // Set HTML attributes
        const html = document.documentElement;
        html.setAttribute('lang', savedLocale);
        html.setAttribute('dir', savedLocale === 'ur' ? 'rtl' : 'ltr');
    }, []);

    const loadTranslations = async (loc) => {
        try {
            // Load translations from API
            // For now, we'll use empty translations and let the backend provide them when needed
            // Translations can be loaded from the backend API if needed
            setTranslations({});
        } catch (error) {
            console.error('Error loading translations:', error);
            // Fallback to empty translations
            setTranslations({});
        }
    };

    const switchLanguage = async (newLocale) => {
        try {
            await api.post(`/locale/${newLocale}`);
            setLocale(newLocale);
            localStorage.setItem('locale', newLocale);
            loadTranslations(newLocale);

            // Update HTML attributes
            const html = document.documentElement;
            html.setAttribute('lang', newLocale);
            html.setAttribute('dir', newLocale === 'ur' ? 'rtl' : 'ltr');
        } catch (error) {
            console.error('Error switching language:', error);
        }
    };

    const t = (key, params = {}) => {
        let translation = translations[key] || key;
        
        // Replace parameters
        Object.keys(params).forEach((param) => {
            translation = translation.replace(`:${param}`, params[param]);
        });
        
        return translation;
    };

    const value = {
        locale,
        translations,
        switchLanguage,
        t,
    };

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};


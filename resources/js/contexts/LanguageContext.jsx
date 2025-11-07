import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [locale, setLocale] = useState('en');
    const [translations, setTranslations] = useState({});
    const [loading, setLoading] = useState(true);

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
            setLoading(true);
            const response = await api.get(`/translations/${loc}`);
            if (response.data && response.data.translations) {
                setTranslations(response.data.translations);
            }
        } catch (error) {
            console.error('Error loading translations:', error);
            // Fallback to empty translations
            setTranslations({});
        } finally {
            setLoading(false);
        }
    };

    const switchLanguage = async (newLocale) => {
        try {
            await api.post(`/locale/${newLocale}`);
            setLocale(newLocale);
            localStorage.setItem('locale', newLocale);
            await loadTranslations(newLocale);

            // Update HTML attributes
            const html = document.documentElement;
            html.setAttribute('lang', newLocale);
            html.setAttribute('dir', newLocale === 'ur' ? 'rtl' : 'ltr');
        } catch (error) {
            console.error('Error switching language:', error);
        }
    };

    const t = (key, params = {}) => {
        // Support nested keys like 'common.home' or 'navigation.about'
        const keys = key.split('.');
        let translation = translations;
        
        // Navigate through nested translation object
        for (const k of keys) {
            if (translation && typeof translation === 'object' && k in translation) {
                translation = translation[k];
            } else {
                // Key not found, return the key itself
                return key;
            }
        }
        
        // If translation is not a string, return the key
        if (typeof translation !== 'string') {
            return key;
        }
        
        // Replace parameters (support both :param and {param} syntax)
        let result = translation;
        Object.keys(params).forEach((param) => {
            result = result.replace(new RegExp(`:${param}`, 'g'), params[param]);
            result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
        });
        
        return result;
    };

    const value = {
        locale,
        translations,
        switchLanguage,
        t,
        loading,
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


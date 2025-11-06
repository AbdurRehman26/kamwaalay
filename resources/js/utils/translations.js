import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Hook to get translations
 */
export function useTranslations() {
    const { t: translate, translations } = useLanguage();
    
    return { t: translate, translations };
}

/**
 * Get translation outside of React component
 */
export function getTranslation(key, translations, params = {}) {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return key;
        }
    }
    
    if (typeof value === 'string' && Object.keys(params).length > 0) {
        return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
            return params[paramKey] || match;
        });
    }
    
    return value || key;
}


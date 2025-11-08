import { useLanguage } from "@/contexts/LanguageContext";

export default function LanguageSwitcher() {
    const { locale, switchLanguage } = useLanguage();

    const handleSwitchLanguage = (newLocale) => {
        if (newLocale === locale) {
            return; // Already on this language
        }
        
        switchLanguage(newLocale);
    };

    return (
        <div className="flex items-center space-x-2">
            <button
                onClick={() => handleSwitchLanguage("en")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    locale === "en"
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                }`}
            >
                English
            </button>
            <button
                onClick={() => handleSwitchLanguage("ur")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    locale === "ur"
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                }`}
            >
                اردو
            </button>
        </div>
    );
}


// Import individual language files
const translations = {
  en: enTranslations,
  ar: arTranslations,
  es: esTranslations,
};

// Language configuration
const languageConfig = {
  en: {
    name: "English",
    dir: "ltr",
    dateFormat: "MM/DD/YYYY",
  },
  ar: {
    name: "العربية",
    dir: "rtl",
    dateFormat: "DD/MM/YYYY",
  },
  es: {
    name: "Español",
    dir: "ltr",
    dateFormat: "DD/MM/YYYY",
  },
};

// Language utility functions
const languageUtils = {
  getCurrentLanguage() {
    return localStorage.getItem("language") || "en";
  },

  setLanguage(lang) {
    if (translations[lang]) {
      localStorage.setItem("language", lang);
      document.documentElement.lang = lang;
      document.dir = languageConfig[lang].dir;
      return true;
    }
    return false;
  },

  translate(key) {
    const currentLang = this.getCurrentLanguage();
    return translations[currentLang]?.[key] || translations.en[key] || key;
  },

  updatePageTranslations() {
    const currentLang = this.getCurrentLanguage();

    document.querySelectorAll("[data-translate]").forEach((element) => {
      const key = element.getAttribute("data-translate");
      const translation = this.translate(key);

      if (element.tagName === "INPUT" && element.getAttribute("placeholder")) {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    });

    // Update document direction
    document.dir = languageConfig[currentLang].dir;
  },
};

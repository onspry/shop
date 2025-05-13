const fs = require('fs');
const path = require('path');

// Define supported languages
const languages = ['en', 'de', 'fr', 'cn'];
const baseLang = 'en';

// Path to the messages directory
const messagesDir = path.join(process.cwd(), 'messages');

// Load translation files
const translations = {};
languages.forEach(lang => {
  try {
    const filePath = path.join(messagesDir, `${lang}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      translations[lang] = JSON.parse(content);
    } else {
      console.error(`Missing translation file for ${lang}`);
      translations[lang] = {};
    }
  } catch (error) {
    console.error(`Error loading ${lang} translations:`, error);
    translations[lang] = {};
  }
});

// Get base language keys
const baseKeys = new Set(Object.keys(translations[baseLang] || {}));

// Compare each language with the base language
languages.forEach(lang => {
  if (lang === baseLang) return;
  
  const langKeys = new Set(Object.keys(translations[lang] || {}));
  
  // Find missing keys (in base but not in this language)
  const missingKeys = [...baseKeys].filter(key => !langKeys.has(key));
  
  // Find extra keys (in this language but not in base)
  const extraKeys = [...langKeys].filter(key => !baseKeys.has(key));
  
  // Find untranslated keys (same value as base language)
  const untranslatedKeys = [...langKeys].filter(key => {
    return baseKeys.has(key) && 
           translations[lang][key] === translations[baseLang][key] &&
           key !== '$schema'; // Ignore schema key
  });
  
  // Print results
  console.log(`\n==== ${lang.toUpperCase()} ====`);
  console.log(`Total keys in base (${baseLang}): ${baseKeys.size}`);
  console.log(`Total keys in ${lang}: ${langKeys.size}`);
  
  if (missingKeys.length > 0) {
    console.log(`\nMissing keys in ${lang} (${missingKeys.length}):`);
    missingKeys.forEach(key => console.log(`  - ${key}`));
  } else {
    console.log(`\nNo missing keys in ${lang} 👍`);
  }
  
  if (extraKeys.length > 0) {
    console.log(`\nExtra keys in ${lang} (${extraKeys.length}):`);
    extraKeys.forEach(key => console.log(`  - ${key}`));
  } else {
    console.log(`\nNo extra keys in ${lang} 👍`);
  }
  
  if (untranslatedKeys.length > 0) {
    console.log(`\nUntranslated keys in ${lang} (${untranslatedKeys.length}):`);
    untranslatedKeys.forEach(key => console.log(`  - ${key}`));
  } else {
    console.log(`\nAll keys in ${lang} are translated 👍`);
  }
});

// Count total unique keys across all languages
const allKeys = new Set();
languages.forEach(lang => {
  Object.keys(translations[lang] || {}).forEach(key => allKeys.add(key));
});

console.log(`\n==== SUMMARY ====`);
console.log(`Total unique keys across all languages: ${allKeys.size}`); 
const fs = require('fs');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Konfiguration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// News-Quellen für verschiedene Kategorien
const NEWS_SOURCES = [
    'https://www.heise.de/news/',
    'https://www.golem.de/',
    'https://www.tagesschau.de/',
    'https://techcrunch.com/',
];

const TECH_SOURCES = [
    'https://github.com/trending',
    'https://news.ycombinator.com/',
    'https://www.reddit.com/r/programming.json',
];

async function fetchWebContent(url) {
    try {
        console.log(`Fetching: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ContextBot/1.0; +https://github.com)'
            },
            timeout: 10000
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        return null;
    }
}

async function getCurrentEvents() {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    Aktuelle Aufgabe: Erstelle eine Liste der wichtigsten Ereignisse und Entwicklungen der letzten 3 Monate.
    
    Berücksichtige folgende Kategorien:
    - Technologie (KI, Software, Hardware)
    - Politik (wichtige Wahlen, Gesetze, internationale Beziehungen)
    - Wirtschaft (große Unternehmensnews, Märkte)
    - Gesellschaft (wichtige kulturelle oder soziale Entwicklungen)
    
    Format: JSON Array mit Objekten:
    {
        "date": "Monat YYYY",
        "category": "Category",
        "description": "Kurze Beschreibung (max 100 Zeichen)"
    }
    
    Fokus auf das was für KI-Systeme relevant ist um aktuelle Kontexte zu verstehen.
    Aktuelles Datum: ${new Date().toISOString().split('T')[0]}
    
    Antworte NUR mit dem JSON Array, ohne zusätzlichen Text.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Extrahiere JSON aus der Antwort
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        return [];
    } catch (error) {
        console.error('Error generating events:', error);
        return [];
    }
}

async function getCurrentTechInfo() {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    Aktuelle Aufgabe: Erstelle eine Liste der aktuellen Software-Versionen und wichtigen Technologie-Updates.
    
    Berücksichtige:
    - Aktuelle LTS/Stable Versionen von: Node.js, Python, React, Vue, Angular
    - Wichtige KI-Modelle und deren Versionen (ChatGPT, Claude, Gemini, etc.)
    - Neue Browser-Versionen
    - Wichtige Framework-Updates
    
    Format: JSON Array mit Objekten:
    {
        "name": "Software/Tool Name",
        "version": "Version Number",
        "date": "Release Monat YYYY",
        "description": "Kurze Beschreibung"
    }
    
    Aktuelles Datum: ${new Date().toISOString().split('T')[0]}
    
    Antworte NUR mit dem JSON Array, ohne zusätzlichen Text.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Extrahiere JSON aus der Antwort
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        return [];
    } catch (error) {
        console.error('Error generating tech info:', error);
        return [];
    }
}

async function generateImportantFacts() {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    Erstelle eine Liste der wichtigsten Fakten, die KI-Systeme über die aktuelle Zeit (2025) wissen sollten.
    
    Fokus auf:
    - Aktuelles Jahr und Datum
    - Wichtige technologische Entwicklungen
    - Verbreitete Tools und Plattformen
    - Gesellschaftliche Veränderungen seit 2024
    
    Format: JSON Array mit Strings (jeweils max 100 Zeichen)
    
    Beispiel: ["Das aktuelle Jahr ist 2025, nicht 2024", "KI-Modelle sind weit verbreitet"]
    
    Antworte NUR mit dem JSON Array, ohne zusätzlichen Text.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Extrahiere JSON aus der Antwort
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        return [];
    } catch (error) {
        console.error('Error generating facts:', error);
        return [];
    }
}

async function updateContextData() {
    console.log('🤖 Starte Kontext-Aktualisierung...');
    
    const now = new Date();
    const events = await getCurrentEvents();
    const technology = await getCurrentTechInfo();
    const importantFacts = await generateImportantFacts();
    
    const contextData = {
        meta: {
            lastUpdated: now.toISOString(),
            nextUpdate: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), // +6 Stunden
            version: "1.0",
            purpose: "Aktuelle Kontextinformationen für KI-Systeme"
        },
        currentDate: {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
            dayOfWeek: now.toLocaleDateString('de-DE', { weekday: 'long' }),
            iso: now.toISOString().split('T')[0],
            timestamp: now.toISOString()
        },
        events: events.slice(0, 10), // Limitiere auf 10 Events
        technology: technology.slice(0, 15), // Limitiere auf 15 Tech-Items
        importantFacts: importantFacts.slice(0, 8), // Limitiere auf 8 Fakten
        context: {
            timeframe: `${now.toLocaleDateString('de-DE', { month: 'long' })} ${now.getFullYear()}`,
            worldState: "Post-2024 KI-Boom, kontinuierliche technologische Entwicklung",
            keyTopics: ["Künstliche Intelligenz", "Automatisierung", "Multimodale Systeme", "LLM Integration"]
        }
    };
    
    // Schreibe die aktualisierten Daten
    fs.writeFileSync('context.json', JSON.stringify(contextData, null, 2));
    
    console.log('✅ Kontext-Daten erfolgreich aktualisiert!');
    console.log(`📅 Aktuelles Datum: ${contextData.currentDate.iso}`);
    console.log(`📰 Events: ${events.length}`);
    console.log(`💻 Tech-Updates: ${technology.length}`);
    console.log(`💡 Wichtige Fakten: ${importantFacts.length}`);
}

// Hauptfunktion ausführen
if (require.main === module) {
    if (!GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY nicht gesetzt!');
        process.exit(1);
    }
    
    updateContextData().catch(error => {
        console.error('❌ Fehler beim Aktualisieren:', error);
        process.exit(1);
    });
}

module.exports = { updateContextData }; 
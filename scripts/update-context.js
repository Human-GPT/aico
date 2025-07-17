const fs = require('fs');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Konfiguration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY Umgebungsvariable ist nicht gesetzt!');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Erweiterte Axios-Konfiguration
const axiosConfig = {
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AICO-ContextBot/1.0; +https://github.com/Human-GPT/aico)'
    },
    maxRedirects: 5
};

// News-Quellen für aktuelle Ereignisse
const NEWS_SOURCES = [
    'https://www.tagesschau.de/',
    'https://www.spiegel.de/',
    'https://www.zeit.de/',
    'https://www.faz.net/',
    'https://www.sueddeutsche.de/',
    'https://www.welt.de/',
    'https://www.handelsblatt.com/',
    'https://www.wiwo.de/'
];

const TECH_SOURCES = [
    'https://www.heise.de/news/',
    'https://www.golem.de/',
    'https://www.techcrunch.com/',
    'https://www.theverge.com/',
    'https://www.engadget.com/',
    'https://www.zdnet.com/'
];

async function fetchWebContent(url) {
    try {
        console.log(`📡 Fetching: ${url}`);
        const response = await axios.get(url, axiosConfig);
        return response.data;
    } catch (error) {
        console.error(`❌ Error fetching ${url}:`, error.message);
        return null;
    }
}

async function extractNewsFromContent(htmlContent, sourceName) {
    if (!htmlContent) return [];
    
    try {
        // Einfache Text-Extraktion (ohne HTML-Tags)
        const textContent = htmlContent
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 5000); // Begrenze auf 5000 Zeichen
        
        return {
            source: sourceName,
            content: textContent,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error(`❌ Error extracting content from ${sourceName}:`, error.message);
        return null;
    }
}

async function getCurrentEvents() {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        }
    });
    
    const currentDate = new Date();
    const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    console.log('📰 Sammle aktuelle News der letzten Woche...');
    
    // Sammle News von verschiedenen Quellen
    const newsPromises = NEWS_SOURCES.map(async (url) => {
        const content = await fetchWebContent(url);
        return extractNewsFromContent(content, new URL(url).hostname);
    });
    
    const newsResults = await Promise.allSettled(newsPromises);
    const validNews = newsResults
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value)
        .slice(0, 5); // Verwende maximal 5 Quellen
    
    console.log(`✅ ${validNews.length} News-Quellen erfolgreich abgerufen`);
    
    // Erstelle einen kontextuellen Prompt mit echten News
    const newsContext = validNews.length > 0 
        ? `\n\nKontext aus aktuellen News-Quellen:\n${validNews.map(n => `${n.source}: ${n.content.substring(0, 200)}...`).join('\n')}`
        : '';
    
    const prompt = `Du bist ein Nachrichten-Analyst. Erstelle eine JSON-Liste der 8 wichtigsten aktuellen Ereignisse der letzten Woche (${oneWeekAgo.toLocaleDateString('de-DE')} bis ${currentDate.toLocaleDateString('de-DE')}).

Fokus auf ECHTE, AKTUELLE Ereignisse:
- Politik (Wahlen, Gesetze, internationale Beziehungen, Krisen)
- Wirtschaft (Unternehmensnews, Börse, Fusionen, Insolvenzen)
- Technologie (KI-Durchbrüche, Software-Releases, Cyberangriffe)
- Gesellschaft (Wichtige kulturelle/sportliche Ereignisse, Skandale)
- Wissenschaft (Medizinische Durchbrüche, Forschungsergebnisse)

WICHTIG: Verwende nur ECHTE, VERIFIZIERBARE Ereignisse der letzten 7 Tage!
${newsContext}

Format (exakt):
[
  {
    "date": "27.01.2025",
    "category": "Technologie",
    "description": "Kurze, präzise Beschreibung des ECHTEN Ereignisses",
    "source": "Quelle (optional)"
  }
]

Aktuelles Datum: ${currentDate.toLocaleDateString('de-DE')}
Zeitraum: Letzte 7 Tage
Antworte NUR mit dem JSON Array.`;

    try {
        console.log('🤖 Generiere aktuelle Ereignisse mit Gemini AI...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const events = await safeJsonParse(text, [
            { 
                date: currentDate.toLocaleDateString('de-DE'), 
                category: "System", 
                description: "AICO System erfolgreich aktualisiert",
                source: "AICO"
            }
        ]);
        
        console.log(`✅ ${events.length} aktuelle Ereignisse generiert`);
        return events.slice(0, 8);
    } catch (error) {
        console.error('❌ Fehler beim Generieren der Ereignisse:', error.message);
        return [
            { 
                date: currentDate.toLocaleDateString('de-DE'), 
                category: "System", 
                description: "Automatische Updates funktionieren",
                source: "AICO"
            }
        ];
    }
}

async function getCurrentTechInfo() {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
        }
    });
    
    const currentDate = new Date();
    
    console.log('💻 Sammle aktuelle Tech-News...');
    
    // Sammle Tech-News
    const techPromises = TECH_SOURCES.map(async (url) => {
        const content = await fetchWebContent(url);
        return extractNewsFromContent(content, new URL(url).hostname);
    });
    
    const techResults = await Promise.allSettled(techPromises);
    const validTech = techResults
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value)
        .slice(0, 3);
    
    console.log(`✅ ${validTech.length} Tech-Quellen erfolgreich abgerufen`);
    
    const techContext = validTech.length > 0 
        ? `\n\nKontext aus Tech-News:\n${validTech.map(t => `${t.source}: ${t.content.substring(0, 200)}...`).join('\n')}`
        : '';
    
    const prompt = `Du bist ein Tech-Experte. Erstelle eine JSON-Liste der 10 wichtigsten Software/Technologie-Updates der letzten Woche.

Berücksichtige AKTUELLE Releases und Updates:
- Node.js, Python, React, Vue.js, Angular neue Versionen
- Browser-Updates (Chrome, Firefox, Safari, Edge)
- KI-Modelle (ChatGPT, Claude, Gemini, etc.)
- Wichtige Framework-Updates
- Mobile Betriebssysteme (iOS, Android)
- Sicherheits-Updates und Patches
${techContext}

Format (exakt):
[
  {
    "name": "Software/Tool Name",
    "version": "Version Nummer",
    "date": "DD.MM.YYYY",
    "description": "Wichtigste Neuerung/Feature"
  }
]

Aktuelles Datum: ${currentDate.toLocaleDateString('de-DE')}
Zeitraum: Letzte 7 Tage
Antworte NUR mit dem JSON Array.`;

    try {
        console.log('🤖 Generiere Tech-Updates mit Gemini AI...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const technology = await safeJsonParse(text, [
            { 
                name: "AICO System", 
                version: "2.0", 
                date: currentDate.toLocaleDateString('de-DE'), 
                description: "Verbesserte News-Integration" 
            }
        ]);
        
        console.log(`✅ ${technology.length} Tech-Updates generiert`);
        return technology.slice(0, 10);
    } catch (error) {
        console.error('❌ Fehler beim Generieren der Tech-Infos:', error.message);
        return [
            { 
                name: "AICO", 
                version: "2.0", 
                date: currentDate.toLocaleDateString('de-DE'), 
                description: "Aktuelle News-Integration" 
            }
        ];
    }
}

async function generateImportantFacts() {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
        }
    });
    
    const currentDate = new Date();
    const prompt = `Du bist ein KI-Trainer. Erstelle eine JSON-Liste der 6 wichtigsten Fakten für KI-Systeme über die aktuelle Zeit (2025).

Fokus auf grundlegende Orientierung:
- Aktuelles Jahr (2025, nicht 2024!)
- Wichtige technologische Standards 
- Verbreitete Tools und Plattformen
- Gesellschaftliche Entwicklungen seit 2024
- Aktuelle politische/wirtschaftliche Situation

Format (exakt):
[
  "Das aktuelle Jahr ist 2025",
  "KI-Assistenten sind weit verbreitet",
  "Weitere wichtige Fakten..."
]

Datum heute: ${currentDate.toLocaleDateString('de-DE')}
Antworte NUR mit dem JSON Array.`;

    try {
        console.log('💡 Generiere wichtige Fakten...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const facts = await safeJsonParse(text, [
            "Das aktuelle Jahr ist 2025",
            "KI-Assistenten sind alltäglich geworden",
            "Automatisierung hat stark zugenommen"
        ]);
        
        console.log(`✅ ${facts.length} Fakten generiert`);
        return facts.slice(0, 6);
    } catch (error) {
        console.error('❌ Fehler beim Generieren der Fakten:', error.message);
        return [
            "Das aktuelle Jahr ist 2025",
            "KI-Systeme werden kontinuierlich verbessert"
        ];
    }
}

async function safeJsonParse(text, fallback = []) {
    try {
        // Bereinige Text von Markdown-Formatierung
        let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Finde JSON Array oder Object
        const jsonMatch = cleanText.match(/(\[[\s\S]*?\]|\{[\s\S]*?\})/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[1]);
            return Array.isArray(parsed) ? parsed : [parsed];
        }
        
        console.warn('⚠️  Kein valides JSON gefunden, verwende Fallback');
        return fallback;
    } catch (error) {
        console.error('❌ JSON Parse Fehler:', error.message);
        return fallback;
    }
}

async function updateContextData() {
    console.log('🤖 === AICO Kontext-Update gestartet ===');
    const startTime = Date.now();
    
    try {
        const now = new Date();
        
        // Parallelisiere API-Aufrufe für bessere Performance
        console.log('⏳ Generiere Daten parallel...');
        const [events, technology, importantFacts] = await Promise.all([
            getCurrentEvents(),
            getCurrentTechInfo(), 
            generateImportantFacts()
        ]);
        
        const contextData = {
            meta: {
                lastUpdated: now.toISOString(),
                nextUpdate: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
                version: "2.2",
                purpose: "Aktuelle Kontextinformationen für KI-Systeme",
                source: "Automatisch generiert via Gemini AI + News-Scraping",
                dataQuality: {
                    events: events.length > 1 ? "good" : "fallback",
                    technology: technology.length > 1 ? "good" : "fallback", 
                    facts: importantFacts.length > 1 ? "good" : "fallback"
                },
                newsSources: NEWS_SOURCES.length,
                techSources: TECH_SOURCES.length
            },
            currentDate: {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                day: now.getDate(),
                quarter: Math.ceil((now.getMonth() + 1) / 3),
                dayOfWeek: now.toLocaleDateString('de-DE', { weekday: 'long' }),
                monthName: now.toLocaleDateString('de-DE', { month: 'long' }),
                iso: now.toISOString().split('T')[0],
                timestamp: now.toISOString(),
                timezone: 'UTC',
                weekOfYear: Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
            },
            events: events,
            technology: technology,
            importantFacts: importantFacts,
            context: {
                timeframe: `${now.toLocaleDateString('de-DE', { month: 'long' })} ${now.getFullYear()}`,
                worldState: "Post-2024 KI-Boom, kontinuierliche technologische Entwicklung",
                keyTopics: ["Künstliche Intelligenz", "Automatisierung", "Multimodale Systeme", "LLM Integration"],
                lastMajorUpdate: now.toISOString().split('T')[0],
                newsCoverage: "Letzte 7 Tage",
                updateFrequency: "Alle 6 Stunden"
            },
            statistics: {
                eventsCount: events.length,
                technologyCount: technology.length,
                factsCount: importantFacts.length,
                generationTimeMs: Date.now() - startTime,
                newsSourcesQueried: NEWS_SOURCES.length,
                techSourcesQueried: TECH_SOURCES.length
            }
        };
        
        // Atomares Schreiben mit Backup
        const contextPath = 'context.json';
        const backupPath = 'context.json.backup';
        
        // Backup der aktuellen Datei
        if (fs.existsSync(contextPath)) {
            fs.copyFileSync(contextPath, backupPath);
        }
        
        // Neue Daten schreiben
        fs.writeFileSync(contextPath, JSON.stringify(contextData, null, 2), 'utf8');
        
        // Validierung
        const writtenData = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
        if (!writtenData.meta || !writtenData.currentDate) {
            throw new Error('Validierung fehlgeschlagen: Unvollständige Daten');
        }
        
        console.log('✅ === AICO Kontext-Update erfolgreich ===');
        console.log(`📅 Datum: ${contextData.currentDate.iso} (${contextData.currentDate.dayOfWeek})`);
        console.log(`📰 Events: ${events.length} (letzte Woche)`);
        console.log(`💻 Tech-Updates: ${technology.length}`);
        console.log(`💡 Fakten: ${importantFacts.length}`);
        console.log(`⏱️  Dauer: ${Date.now() - startTime}ms`);
        console.log(`🔗 JSON: ${fs.statSync(contextPath).size} Bytes`);
        console.log(`📡 News-Quellen: ${NEWS_SOURCES.length}, Tech-Quellen: ${TECH_SOURCES.length}`);
        
        // Cleanup Backup bei Erfolg
        if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
        }
        
    } catch (error) {
        console.error('❌ === AICO Kontext-Update fehlgeschlagen ===');
        console.error('Fehler:', error.message);
        
        // Restore Backup falls verfügbar
        const backupPath = 'context.json.backup';
        if (fs.existsSync(backupPath)) {
            fs.copyFileSync(backupPath, 'context.json');
            console.log('🔄 Backup wiederhergestellt');
        }
        
        process.exit(1);
    }
}

// Hauptfunktion ausführen
if (require.main === module) {
    updateContextData().catch(error => {
        console.error('❌ Kritischer Fehler:', error);
        process.exit(1);
    });
}

module.exports = { updateContextData }; 
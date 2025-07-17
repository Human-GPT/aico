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

// News-Quellen für aktuelle Ereignisse (deutsche Hauptnachrichten)
const NEWS_SOURCES = [
    'https://www.tagesschau.de/',
    'https://www.spiegel.de/',
    'https://www.zeit.de/',
    'https://www.faz.net/',
    'https://www.sueddeutsche.de/',
    'https://www.welt.de/',
    'https://www.handelsblatt.com/',
    'https://www.wiwo.de/',
    'https://www.n-tv.de/',
    'https://www.focus.de/',
    'https://www.stern.de/',
    'https://www.bild.de/'
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
    if (!htmlContent) return null;
    
    try {
        // Verbesserte Text-Extraktion mit Fokus auf News-Inhalte
        let textContent = htmlContent
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
            .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
            .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
            .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Fokus auf relevante News-Inhalte (erste 8000 Zeichen)
        textContent = textContent.substring(0, 8000);
        
        // Filtere nur Inhalte mit News-Keywords
        const newsKeywords = ['news', 'nachrichten', 'bericht', 'meldung', 'update', 'breaking', 'aktuell', 'heute', 'gestern', 'woche'];
        const hasNewsContent = newsKeywords.some(keyword => 
            textContent.toLowerCase().includes(keyword)
        );
        
        if (!hasNewsContent && textContent.length < 500) {
            console.log(`⚠️  ${sourceName}: Keine relevanten News-Inhalte gefunden`);
            return null;
        }
        
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
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        }
    });
    
    const currentDate = new Date();
    const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    console.log('📰 Sammle ECHTE aktuelle News der letzten Tage...');
    
    // Sammle News von verschiedenen Quellen
    const newsPromises = NEWS_SOURCES.map(async (url) => {
        const content = await fetchWebContent(url);
        return extractNewsFromContent(content, new URL(url).hostname);
    });
    
    const newsResults = await Promise.allSettled(newsPromises);
    const validNews = newsResults
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value)
        .slice(0, 8); // Verwende maximal 8 Quellen für bessere Abdeckung
    
    console.log(`✅ ${validNews.length} News-Quellen erfolgreich abgerufen`);
    
    // Erstelle einen kontextuellen Prompt mit echten News
    const newsContext = validNews.length > 0 
        ? `\n\nECHTE AKTUELLE NEWS (nur diese verwenden!):\n${validNews.map(n => `${n.source}: ${n.content.substring(0, 300)}...`).join('\n\n')}`
        : '';
    
    const prompt = `Du bist ein Nachrichten-Analyst. Analysiere die bereitgestellten ECHTEN News und erstelle eine JSON-Liste der wichtigsten aktuellen Ereignisse.

WICHTIG: 
- Verwende NUR die bereitgestellten echten News-Quellen
- Keine erfundenen oder zukünftigen Ereignisse
- Nur ECHTE, VERIFIZIERBARE Ereignisse der letzten Tage
- Stichpunkte statt Chat-Format für bessere KI-Lesbarkeit

Fokus auf:
- Politik (Wahlen, Gesetze, internationale Beziehungen, Krisen)
- Wirtschaft (Unternehmensnews, Börse, Fusionen, Insolvenzen) 
- Technologie (KI-Durchbrüche, Software-Releases, Cyberangriffe)
- Gesellschaft (Wichtige kulturelle/sportliche Ereignisse, Skandale)
- Wissenschaft (Medizinische Durchbrüche, Forschungsergebnisse)

${newsContext}

Format (exakt, für andere KIs optimiert):
[
  {
    "date": "17.07.2025",
    "category": "Technologie", 
    "description": "Kurzer, präziser Stichpunkt des ECHTEN Ereignisses",
    "source": "Quelle"
  }
]

Regeln:
- Nur ECHTE News aus den bereitgestellten Quellen
- Stichpunkte statt ausführliche Beschreibungen
- Für andere KIs leicht lesbar
- Aktuelles Datum: ${currentDate.toLocaleDateString('de-DE')}
- Antworte NUR mit dem JSON Array`;

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
        
        // Bessere Fallback-Ereignisse basierend auf aktuellen Trends
        const fallbackEvents = [
            { 
                date: currentDate.toLocaleDateString('de-DE'), 
                category: "System", 
                description: "AICO Kontext-System läuft automatisch",
                source: "AICO"
            },
            {
                date: currentDate.toLocaleDateString('de-DE'),
                category: "Technologie",
                description: "KI-Systeme werden kontinuierlich verbessert",
                source: "AICO"
            }
        ];
        
        console.log('⚠️  Verwende Fallback-Ereignisse');
        return fallbackEvents;
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
    
    // Sammle Tech-News und beliebte Package-Versionen parallel
    const [techResults, popularPackages] = await Promise.allSettled([
        Promise.allSettled(TECH_SOURCES.map(async (url) => {
            const content = await fetchWebContent(url);
            return extractNewsFromContent(content, new URL(url).hostname);
        })),
        getPopularPackageVersions()
    ]);
    
    const validTech = techResults.status === 'fulfilled' 
        ? techResults.value
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value)
            .slice(0, 3)
        : [];
    
    const packages = popularPackages.status === 'fulfilled' ? popularPackages.value : [];
    
    console.log(`✅ ${validTech.length} Tech-Quellen und ${packages.length} Package-Versionen abgerufen`);
    
    const techContext = validTech.length > 0 
        ? `\n\nKontext aus Tech-News:\n${validTech.map(t => `${t.source}: ${t.content.substring(0, 200)}...`).join('\n')}`
        : '';
    
    const packagesContext = packages.length > 0
        ? `\n\nAktuelle beliebte Package-Versionen:\n${packages.map(p => `${p.name}: v${p.version}`).join(', ')}`
        : '';
    
    const prompt = `Du bist ein Tech-Experte. Erstelle eine JSON-Liste der wichtigsten Software/Technologie-Updates der letzten Woche.

Berücksichtige AKTUELLE Releases und Updates:
- Browser-Updates (Chrome, Firefox, Safari, Edge)
- KI-Modelle (ChatGPT, Claude, Gemini, etc.)
- Mobile Betriebssysteme (iOS, Android)
- Sicherheits-Updates und Patches
- Andere relevante Tools und Frameworks
${techContext}${packagesContext}

WICHTIG: Kombiniere maximal 5-6 echte News-Updates mit den aktuellen Package-Versionen für eine ausgewogene Liste.

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
        
        // Parallel: AI-generierte Updates + echte Package-Versionen
        const [aiResult] = await Promise.allSettled([
            model.generateContent(prompt)
        ]);
        
        let aiTechnology = [];
        if (aiResult.status === 'fulfilled') {
            const response = await aiResult.value.response;
            const text = response.text();
            aiTechnology = await safeJsonParse(text, []);
        }
        
        // Kombiniere AI-Updates mit echten Package-Versionen
        const combinedTechnology = [
            ...packages, // Echte Package-Versionen zuerst
            ...aiTechnology.slice(0, 6) // Max 6 AI-generierte Updates
        ].slice(0, 12); // Gesamt max 12 Items
        
        console.log(`✅ ${combinedTechnology.length} Tech-Updates generiert (${packages.length} Packages + ${aiTechnology.length} AI-Updates)`);
        return combinedTechnology;
    } catch (error) {
        console.error('❌ Fehler beim Generieren der Tech-Infos:', error.message);
        
        // Fallback: Nur Package-Versionen verwenden
        const fallbackTech = packages.length > 0 ? packages : [
            { 
                name: "AICO", 
                version: "2.0", 
                date: currentDate.toLocaleDateString('de-DE'), 
                description: "Aktuelle News-Integration mit Package-Tracking" 
            }
        ];
        
        return fallbackTech;
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

// Beliebte Pakete und deren APIs für Versionschecking
const POPULAR_PACKAGES = {
    'Node.js': {
        api: 'https://nodejs.org/dist/index.json',
        parseVersion: (data) => data[0]?.version,
        description: 'JavaScript Runtime'
    },
    'React': {
        api: 'https://registry.npmjs.org/react/latest',
        parseVersion: (data) => data.version,
        description: 'UI Framework'
    },
    'Vue.js': {
        api: 'https://registry.npmjs.org/vue/latest',
        parseVersion: (data) => data.version,
        description: 'Progressive Framework'
    },
    'Angular': {
        api: 'https://registry.npmjs.org/@angular/core/latest',
        parseVersion: (data) => data.version,
        description: 'Web Framework'
    },
    'TypeScript': {
        api: 'https://registry.npmjs.org/typescript/latest',
        parseVersion: (data) => data.version,
        description: 'JavaScript mit Types'
    },
    'Express.js': {
        api: 'https://registry.npmjs.org/express/latest',
        parseVersion: (data) => data.version,
        description: 'Web Server Framework'
    },
    'Webpack': {
        api: 'https://registry.npmjs.org/webpack/latest',
        parseVersion: (data) => data.version,
        description: 'Module Bundler'
    },
    'Vite': {
        api: 'https://registry.npmjs.org/vite/latest',
        parseVersion: (data) => data.version,
        description: 'Build Tool'
    },
    'Next.js': {
        api: 'https://registry.npmjs.org/next/latest',
        parseVersion: (data) => data.version,
        description: 'React Framework'
    },
    'Tailwind CSS': {
        api: 'https://registry.npmjs.org/tailwindcss/latest',
        parseVersion: (data) => data.version,
        description: 'CSS Framework'
    }
};

async function getPackageVersion(packageInfo) {
    try {
        const response = await axios.get(packageInfo.api, {
            timeout: 5000,
            headers: { 'User-Agent': 'AICO-ContextBot/1.0' }
        });
        const version = packageInfo.parseVersion(response.data);
        return version ? version.replace(/^v/, '') : null;
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen von ${packageInfo.api}:`, error.message);
        return null;
    }
}

async function getPopularPackageVersions() {
    console.log('📦 Rufe beliebte Package-Versionen ab...');
    const packagePromises = Object.entries(POPULAR_PACKAGES).map(async ([name, info]) => {
        const version = await getPackageVersion(info);
        if (version) {
            return {
                name,
                version,
                date: new Date().toLocaleDateString('de-DE'),
                description: `${info.description} - Aktuelle stabile Version`
            };
        }
        return null;
    });
    
    const results = await Promise.allSettled(packagePromises);
    const packages = results
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value)
        .slice(0, 8); // Max 8 Pakete
    
    console.log(`✅ ${packages.length} Package-Versionen abgerufen`);
    return packages;
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
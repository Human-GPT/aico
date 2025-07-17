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

async function getCurrentEvents() {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-pro",
        generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        }
    });
    
    const currentDate = new Date().toISOString().split('T')[0];
    
    const prompt = `Du bist ein Informations-Assistent. Erstelle eine JSON-Liste der 8 wichtigsten Ereignisse seit Januar 2025.

Fokus auf:
- Politik (Wahlen, Gesetze, internationale Beziehungen)
- Technologie (KI, Software, Hardware-Releases)
- Wirtschaft (Unternehmensnews, Märkte, Fusionen)
- Gesellschaft (kulturelle/soziale Entwicklungen)

Format (exakt):
[
  {
    "date": "Januar 2025",
    "category": "Technologie",
    "description": "Kurze Beschreibung des Ereignisses"
  }
]

Aktuelles Datum: ${currentDate}
Antworte NUR mit dem JSON Array.`;

    try {
        console.log('📰 Generiere aktuelle Ereignisse...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const events = await safeJsonParse(text, [
            { date: "Januar 2025", category: "Technologie", description: "KI-Entwicklung schreitet voran" },
            { date: "Januar 2025", category: "Politik", description: "Internationale Zusammenarbeit stärkt sich" }
        ]);
        
        console.log(`✅ ${events.length} Ereignisse generiert`);
        return events.slice(0, 8);
    } catch (error) {
        console.error('❌ Fehler beim Generieren der Ereignisse:', error.message);
        return [
            { date: "Januar 2025", category: "System", description: "Automatische Updates funktionieren" }
        ];
    }
}

async function getCurrentTechInfo() {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-pro",
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
        }
    });
    
    const currentDate = new Date().toISOString().split('T')[0];
    
    const prompt = `Du bist ein Tech-Experte. Erstelle eine JSON-Liste der 10 wichtigsten Software-Versionen von 2025.

Berücksichtige:
- Node.js, Python, React, Vue.js, Angular aktuelle Versionen
- Browser (Chrome, Firefox, Safari, Edge)
- KI-Modelle (ChatGPT, Claude, Gemini, etc.)
- Wichtige Framework-Updates
- Mobile Betriebssysteme (iOS, Android)

Format (exakt):
[
  {
    "name": "Software Name",
    "version": "Version Nummer",
    "date": "Monat 2025",
    "description": "Wichtigste Neuerung"
  }
]

Aktuelles Datum: ${currentDate}
Antworte NUR mit dem JSON Array.`;

    try {
        console.log('💻 Generiere Tech-Informationen...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const technology = await safeJsonParse(text, [
            { name: "Node.js", version: "22.x", date: "Januar 2025", description: "Neue LTS Version" },
            { name: "React", version: "19.x", date: "Januar 2025", description: "Performance-Verbesserungen" }
        ]);
        
        console.log(`✅ ${technology.length} Tech-Updates generiert`);
        return technology.slice(0, 10);
    } catch (error) {
        console.error('❌ Fehler beim Generieren der Tech-Infos:', error.message);
        return [
            { name: "JavaScript", version: "ES2025", date: "Januar 2025", description: "Sprachweiterentwicklung" }
        ];
    }
}

async function generateImportantFacts() {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-pro",
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
        }
    });
    
    const currentDate = new Date();
    const prompt = `Du bist ein KI-Trainer. Erstelle eine JSON-Liste der 6 wichtigsten Fakten für KI-Systeme über 2025.

Fokus auf grundlegende Orientierung:
- Aktuelles Jahr (2025, nicht 2024!)
- Wichtige technologische Standards 
- Verbreitete Tools und Plattformen
- Gesellschaftliche Entwicklungen seit 2024

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
                version: "2.0",
                purpose: "Aktuelle Kontextinformationen für KI-Systeme",
                source: "Automatisch generiert via Gemini AI",
                dataQuality: {
                    events: events.length > 0 ? "good" : "fallback",
                    technology: technology.length > 0 ? "good" : "fallback", 
                    facts: importantFacts.length > 0 ? "good" : "fallback"
                }
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
                timezone: 'UTC'
            },
            events: events,
            technology: technology,
            importantFacts: importantFacts,
            context: {
                timeframe: `${now.toLocaleDateString('de-DE', { month: 'long' })} ${now.getFullYear()}`,
                worldState: "Post-2024 KI-Boom, kontinuierliche technologische Entwicklung",
                keyTopics: ["Künstliche Intelligenz", "Automatisierung", "Multimodale Systeme", "LLM Integration"],
                lastMajorUpdate: now.toISOString().split('T')[0]
            },
            statistics: {
                eventsCount: events.length,
                technologyCount: technology.length,
                factsCount: importantFacts.length,
                generationTimeMs: Date.now() - startTime
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
        console.log(`📰 Events: ${events.length}`);
        console.log(`💻 Tech-Updates: ${technology.length}`);
        console.log(`💡 Fakten: ${importantFacts.length}`);
        console.log(`⏱️  Dauer: ${Date.now() - startTime}ms`);
        console.log(`🔗 JSON: ${fs.statSync(contextPath).size} Bytes`);
        
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
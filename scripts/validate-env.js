#!/usr/bin/env node

/**
 * Validierungsscript für die Umgebungsvariablen
 * Hilft bei der Überprüfung der Konfiguration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Überprüfe Umgebungsvariablen...\n');

// Prüfe .env Datei
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasApiKey = envContent.includes('GEMINI_API_KEY=');
    
    if (hasApiKey) {
        const apiKeyLine = envContent.split('\n').find(line => line.startsWith('GEMINI_API_KEY='));
        const apiKeyValue = apiKeyLine.split('=')[1];
        
        if (apiKeyValue && apiKeyValue !== 'your_api_key_here') {
            console.log('✅ .env Datei gefunden mit API Key');
            console.log('⚠️  Warnung: API Key ist in .env Datei gespeichert (nur für lokale Entwicklung)');
        } else {
            console.log('ℹ️  .env Datei gefunden, aber API Key ist nicht gesetzt');
            console.log('   Für lokale Entwicklung: Setze GEMINI_API_KEY in .env');
        }
    } else {
        console.log('❌ .env Datei gefunden, aber GEMINI_API_KEY fehlt');
    }
} else {
    console.log('ℹ️  .env Datei nicht gefunden (normal für GitHub Actions)');
}

// Prüfe Umgebungsvariable
const envApiKey = process.env.GEMINI_API_KEY;
if (envApiKey) {
    console.log('✅ GEMINI_API_KEY Umgebungsvariable ist gesetzt');
    console.log(`   Länge: ${envApiKey.length} Zeichen`);
    console.log(`   Start: ${envApiKey.substring(0, 10)}...`);
} else {
    console.log('❌ GEMINI_API_KEY Umgebungsvariable ist NICHT gesetzt');
}

console.log('\n📋 Setup-Status:');
console.log('================');

if (envApiKey) {
    console.log('✅ GitHub Actions: Bereit (verwendet GitHub Secret)');
    console.log('✅ Lokale Entwicklung: Bereit (verwendet Umgebungsvariable)');
} else if (fs.existsSync(envPath) && fs.readFileSync(envPath, 'utf8').includes('GEMINI_API_KEY=')) {
    console.log('⚠️  GitHub Actions: Benötigt GitHub Secret GEMINI_API_KEY');
    console.log('✅ Lokale Entwicklung: Bereit (verwendet .env Datei)');
} else {
    console.log('❌ GitHub Actions: Benötigt GitHub Secret GEMINI_API_KEY');
    console.log('❌ Lokale Entwicklung: Benötigt GEMINI_API_KEY in .env oder Umgebungsvariable');
}

console.log('\n🔧 Nächste Schritte:');
if (!envApiKey && (!fs.existsSync(envPath) || !fs.readFileSync(envPath, 'utf8').includes('GEMINI_API_KEY='))) {
    console.log('1. Erstelle .env Datei mit: GEMINI_API_KEY=your_actual_api_key');
    console.log('2. Oder setze Umgebungsvariable: export GEMINI_API_KEY=your_actual_api_key');
}
console.log('3. Für GitHub Actions: Füge GEMINI_API_KEY als Repository Secret hinzu');
console.log('4. Teste mit: npm run update-context');

console.log('\n📖 Weitere Informationen:');
console.log('- README.md: Setup-Anleitung');
console.log('- .github/workflows/update-context.yml: GitHub Actions Konfiguration');
console.log('- scripts/update-context.js: Hauptscript'); 
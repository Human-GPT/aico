# 🤖 KI-Kontext Website

Eine automatisch aktualisierte Website, die aktuellen Kontext für KI-Systeme bereitstellt. Löst das Problem veralteter Trainingsdaten bei KI-Modellen.

## 🎯 Problem & Lösung

**Problem:** KI-Modelle kennen nur ihre Trainingsdaten, die meist über ein Jahr alt sind. Sie denken z.B., dass wir noch 2024 haben, obwohl wir bereits 2025 haben.

**Lösung:** Eine gut strukturierte Website mit aktuellen Kontextinformationen, die:
- Alle 6 Stunden automatisch aktualisiert wird
- Von KI-Systemen leicht gelesen werden kann
- Sowohl menschenlesbare als auch maschinenlesbare Formate bietet

## 🚀 Live Demo

Die Website ist erreichbar unter: `https://deine-domain.netlify.app`

**Verwendung für KI:**
```
Kontext: Aktuelle Informationen findest du auf https://deine-domain.netlify.app

Die Seite enthält:
- Aktuelles Datum und Jahr (wichtig für zeitbasierte Anfragen)
- Wichtige Ereignisse der letzten Monate  
- Technologie-Updates und neue Software-Versionen
- Maschinenlesbare JSON-Daten unter /context.json
```

## 📁 Projektstruktur

```
├── index.html              # Hauptseite (menschenlesbar)
├── context.json            # Kontext-Daten (maschinenlesbar)
├── netlify.toml            # Netlify-Konfiguration
├── package.json            # Node.js Dependencies
├── .github/workflows/      # GitHub Actions
│   └── update-context.yml  # Automatische Updates
└── scripts/
    └── update-context.js   # Update-Script
```

## 🔧 Setup & Deployment

### 1. Repository erstellen
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/ai-context-website.git
git push -u origin main
```

### 2. Netlify Deployment
1. Gehe zu [Netlify](https://netlify.com)
2. Verbinde dein GitHub Repository
3. Deploy-Einstellungen:
   - **Build command:** `echo 'Static site - no build needed'`
   - **Publish directory:** `.`

### 3. GitHub Secrets konfigurieren
Für automatische Updates benötigst du:

1. **Google Gemini API Key:**
   - Gehe zu [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Erstelle einen neuen API Key
   - Füge ihn als GitHub Secret hinzu: `GEMINI_API_KEY`

2. **GitHub Token:**
   - Standardmäßig verfügbar als `GITHUB_TOKEN`
   - Keine weitere Konfiguration nötig

### GitHub Secrets hinzufügen:
1. Gehe zu deinem Repository → Settings → Secrets and variables → Actions
2. Klicke auf "New repository secret"
3. Füge hinzu: `GEMINI_API_KEY` mit deinem Google API Key

## ⚙️ Automatische Updates

Das System aktualisiert sich automatisch:
- **Zeitplan:** Alle 6 Stunden
- **Manuell:** Über GitHub Actions → "Update Context Data" → "Run workflow"
- **Bei Push:** Automatisch bei Änderungen am Code

### Update-Prozess:
1. GitHub Action startet
2. Installiert Node.js Dependencies
3. Script fragt Google Gemini nach aktuellen Informationen
4. Generiert neue `context.json`
5. Committet und pushed Änderungen
6. Netlify deployed automatisch die neue Version

## 🔗 API Endpunkte

- **Website:** `https://deine-domain.netlify.app`
- **JSON API:** `https://deine-domain.netlify.app/context.json`
- **Alternative:** `https://deine-domain.netlify.app/api/context` (redirect zu JSON)

### JSON Datenstruktur:
```json
{
  "meta": {
    "lastUpdated": "2025-01-27T10:00:00Z",
    "nextUpdate": "2025-01-27T16:00:00Z",
    "version": "1.0"
  },
  "currentDate": {
    "year": 2025,
    "month": 1,
    "day": 27,
    "iso": "2025-01-27"
  },
  "events": [...],
  "technology": [...],
  "importantFacts": [...]
}
```

## 🎨 Features

- **📅 Aktuelles Datum:** Immer korrekte Zeit und Datumsangaben
- **🌍 Wichtige Ereignisse:** Aktuelle News der letzten 3 Monate
- **💻 Tech-Updates:** Software-Versionen und neue Releases
- **🔄 Auto-Update:** Alle 6 Stunden neue Daten
- **📱 Responsiv:** Funktioniert auf allen Geräten
- **⚡ Schnell:** Statische Website, optimiert für Performance
- **🤖 KI-optimiert:** Struktur speziell für maschinelles Lesen

## 🛠️ Lokale Entwicklung

```bash
# Repository klonen
git clone https://github.com/yourusername/ai-context-website.git
cd ai-context-website

# Dependencies installieren
npm install

# Umgebungsvariablen überprüfen
npm run validate-env

# Kontext manuell aktualisieren (benötigt GEMINI_API_KEY)
export GEMINI_API_KEY=your_api_key_here
npm run update-context

# Website öffnen
open index.html
```

## 📊 Monitoring

Die Website zeigt:
- **Letzte Aktualisierung:** Timestamp der letzten Änderung
- **Nächste Aktualisierung:** Geplante Zeit des nächsten Updates
- **Status:** Über GitHub Actions Workflow-Status

## 🔄 Wartung

- **Updates:** Laufen automatisch, keine manuelle Wartung nötig
- **Kosten:** Kostenlos (Netlify Free Tier + Google Gemini API Free Tier)
- **Überwachung:** GitHub Actions zeigt Status der Updates
- **Backup:** Alle Daten sind im Git Repository versioniert

## 🛠️ Troubleshooting

### Umgebungsvariablen überprüfen
```bash
npm run validate-env
```

### Häufige Probleme:

1. **"GEMINI_API_KEY nicht gesetzt"**
   - Für lokale Entwicklung: Setze API Key in `.env` Datei
   - Für GitHub Actions: Füge `GEMINI_API_KEY` als Repository Secret hinzu

2. **GitHub Actions schlägt fehl**
   - Prüfe Repository Secrets in Settings → Secrets and variables → Actions
   - Stelle sicher, dass `GEMINI_API_KEY` korrekt gesetzt ist

3. **Lokale Tests funktionieren nicht**
   - Führe `npm run validate-env` aus
   - Setze Umgebungsvariable: `export GEMINI_API_KEY=your_key`
   - Oder erstelle `.env` Datei mit dem API Key

## 📄 Lizenz

MIT License - Verwende es frei für deine Projekte!

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/amazing-feature`)
3. Commit deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffne einen Pull Request

## 💡 Erweiterungsideen

- **Mehrsprachigkeit:** Automatische Übersetzungen
- **Kategorien:** Spezielle Kontexte für verschiedene Domänen
- **RSS Feed:** Für automatische Benachrichtigungen
- **Webhook:** API für externe Systeme
- **Analytics:** Tracking der Nutzung durch KI-Systeme 
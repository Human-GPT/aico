# 🤖 AICO - AI Context Website

> **Aktuelle Kontextinformationen für KI-Systeme - Automatisch alle 6 Stunden aktualisiert**

[![Update Context Data](https://github.com/Human-GPT/aico/actions/workflows/update-context.yml/badge.svg)](https://github.com/Human-GPT/aico/actions/workflows/update-context.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/your-site-id/deploy-status)](https://app.netlify.com/sites/your-site-name/deploys)

AICO löst ein fundamentales Problem: **KI-Modelle wissen nicht, dass wir 2025 haben!** 

Diese Website stellt automatisch aktualisierte Kontextinformationen bereit, damit KI-Systeme über aktuelle Ereignisse, Technologie-Updates und wichtige Fakten informiert sind.

## 🌟 **Features**

### ✅ **Automatische Updates**
- **Alle 6 Stunden** neue Daten via GitHub Actions
- **Gemini AI Integration** für intelligente Inhaltsgenerierung  
- **Fallback-Mechanismen** bei API-Fehlern
- **Backup & Recovery** System

### 📊 **Dual-Format Bereitstellung**
- **Human-readable:** Moderne, responsive Website
- **Machine-readable:** JSON API für KI-Systeme
- **Real-time Updates** ohne Page Reload
- **Qualitätsindikatoren** für Datenzuverlässigkeit

### 🎨 **Moderne UX**
- **Responsive Design** für alle Geräte
- **Performance-optimiert** mit Caching
- **Accessibility-ready** (WCAG konform)
- **Dark/Light Mode** Support

## 🚀 **Live Demo**

**Website:** https://your-domain.netlify.app  
**API Endpoint:** https://your-domain.netlify.app/context.json

## 📋 **API Struktur**

```json
{
  "meta": {
    "lastUpdated": "2025-01-27T12:00:00.000Z",
    "nextUpdate": "2025-01-27T18:00:00.000Z",
    "version": "2.0",
    "dataQuality": {
      "events": "good",
      "technology": "good", 
      "facts": "good"
    }
  },
  "currentDate": {
    "year": 2025,
    "month": 1,
    "day": 27,
    "quarter": 1,
    "dayOfWeek": "Montag",
    "iso": "2025-01-27"
  },
  "events": [
    {
      "date": "Januar 2025",
      "category": "Technologie",
      "description": "Neue KI-Durchbrüche in multimodalen Systemen"
    }
  ],
  "technology": [
    {
      "name": "Node.js",
      "version": "22.x",
      "date": "Januar 2025",
      "description": "Neue LTS Version mit Performance-Verbesserungen"
    }
  ],
  "importantFacts": [
    "Das aktuelle Jahr ist 2025",
    "KI-Assistenten sind alltäglich geworden"
  ]
}
```

## ⚙️ **Setup & Installation**

### **1. Repository klonen**
```bash
git clone https://github.com/Human-GPT/aico.git
cd aico
```

### **2. GitHub Secret konfigurieren**
1. Gehe zu **Settings** → **Secrets and variables** → **Actions**
2. Klicke **"New repository secret"**
3. Name: `GEMINI_API_KEY`
4. Value: Dein Google Gemini API Key
5. Klicke **"Add secret"**

### **3. Netlify Deployment**
```bash
# Automatisches Deployment via Git
# Oder manuell:
npm install
npm run build
```

### **4. GitHub Actions aktivieren**
- Actions werden automatisch bei Push auf `main` ausgelöst
- Manueller Trigger unter **Actions** → **"Update Context Data"** → **"Run workflow"**

## 🛠️ **Lokale Entwicklung**

```bash
# Dependencies installieren
npm install

# Environment Variable setzen
export GEMINI_API_KEY="your-api-key"

# Kontext-Update testen
node scripts/update-context.js

# Lokalen Server starten (optional)
python -m http.server 8000
# oder
npx serve .
```

## 🔧 **Konfiguration**

### **Environment Variables**
```env
GEMINI_API_KEY=your-google-gemini-api-key
```

### **GitHub Actions Schedule**
```yaml
# Alle 6 Stunden
schedule:
  - cron: '0 */6 * * *'
```

### **Netlify Settings**
```toml
# netlify.toml
[build]
  publish = "."
  
[[headers]]
  for = "/context.json"
  [headers.values]
    Cache-Control = "public, max-age=300"
    Access-Control-Allow-Origin = "*"
```

## 🎯 **Verwendung für KI-Systeme**

### **Prompt-Integration**
```
Kontext: Aktuelle Informationen findest du auf https://your-domain.netlify.app

Die Seite enthält:
• Aktuelles Datum und Jahr (wichtig für zeitbasierte Anfragen)
• Wichtige Ereignisse seit Januar 2025  
• Technologie-Updates und neue Software-Versionen
• Maschinenlesbare JSON-Daten unter /context.json
```

### **API-Integration**
```javascript
// JavaScript Beispiel
const response = await fetch('https://your-domain.netlify.app/context.json');
const context = await response.json();

console.log(`Aktuelles Jahr: ${context.currentDate.year}`);
console.log(`Letzte Events: ${context.events.length}`);
```

```python
# Python Beispiel
import requests

response = requests.get('https://your-domain.netlify.app/context.json')
context = response.json()

print(f"Aktuelles Jahr: {context['currentDate']['year']}")
print(f"Tech-Updates: {len(context['technology'])}")
```

## 📈 **Monitoring & Analytics**

### **GitHub Actions Monitoring**
- Status unter **Actions** Tab im Repository
- E-Mail-Benachrichtigungen bei Fehlern
- Logs für Debugging verfügbar

### **Datenqualität**
- **Quality Indicators** in der JSON Response
- **Fallback-Daten** bei API-Fehlern
- **Backup-System** für Datenintegrität

### **Performance Metrics**
- Update-Dauer in `statistics.generationTimeMs`
- Daten-Freshness in `meta.lastUpdated`
- Cache-Control für optimale Performance

## 🔍 **Troubleshooting**

### **❌ "Resource not accessible by integration"**
```yaml
# Lösung: Erweiterte Berechtigungen in .github/workflows/update-context.yml
permissions:
  contents: write
  actions: read
```

### **❌ "GEMINI_API_KEY nicht verfügbar"**
1. GitHub Secret korrekt gesetzt?
2. API Key gültig und aktiv?
3. Quota-Limits erreicht?

### **❌ "JSON Parse Fehler"**
- Fallback-Daten werden automatisch verwendet
- Logs in GitHub Actions überprüfen
- API-Response-Format validieren

### **❌ Website zeigt veraltete Daten**
```bash
# Cache leeren
curl -X PURGE https://your-domain.netlify.app/context.json

# Oder manuell GitHub Action triggern
```

## 🤝 **Contributing**

1. **Fork** das Repository
2. **Branch** erstellen: `git checkout -b feature/amazing-feature`
3. **Commit** Änderungen: `git commit -m 'Add amazing feature'`
4. **Push** zum Branch: `git push origin feature/amazing-feature`
5. **Pull Request** erstellen

### **Code Style**
- **ESLint** für JavaScript
- **Prettier** für Formatierung
- **Semantic Commits** für bessere Git History

## 📄 **Lizenz**

Dieses Projekt ist unter der **MIT Lizenz** veröffentlicht. Siehe [LICENSE](LICENSE) für Details.

## 🙏 **Credits**

- **Google Gemini AI** für intelligente Inhaltsgenerierung
- **GitHub Actions** für automatische Updates
- **Netlify** für kostenloses Hosting
- **Modern CSS** Design System

## 📞 **Support**

- **Issues:** [GitHub Issues](https://github.com/Human-GPT/aico/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Human-GPT/aico/discussions)
- **Website:** https://your-domain.netlify.app

---

**⭐ Wenn dir dieses Projekt hilft, gib ihm einen Stern auf GitHub!** 
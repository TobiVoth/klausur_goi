# Multiple-Choice Klausurtrainer

Ein minimalistischer, performanter und containerisierter Web-Trainer zur gezielten Klausurvorbereitung.
Entwickelt mit **Next.js (App Router)**, **TypeScript**, **Tailwind CSS (Shadcn-Stil)** und einer persistenten **lokalen SQLite-Datenbank** (integriert via `node:sqlite`).

---

## 🚀 Features

- **Alle 15 Referatsthemen & 267 Klausurfragen**: Vollständig aus den `.docx`-Dateien extrahiert und qualitätsgeprüft (Fragen, Antwortoptionen, Mehrfachauswahl & Begründungen).
- **3 Lernmodi**:
  1. **Themen-Modus**: Gezieltes Lernen eines einzelnen Themas aus 15 Fachgebieten.
  2. **Zufalls-Mix (Alle Themen)**: Shuffled-Modus quer durch alle Fragen zur realistischen Klausursimulation (10, 20, 50 oder alle Fragen).
  3. **Meisterungs-Modus (Spaced Repetition)**: Trainiert **nur Fragen, die noch nicht 3-mal in Folge fehlerfrei beantwortet wurden**. Sobald eine Frage eine Serie von 3 erreicht, gilt sie als gemeistert und wird aussortiert.
- **Direktes Feedback & Begründungen**:
  - Sofortige optische Auflösung nach Beantwortung (Grün für Richtig, Rot für Falsch, Hervorhebung verpasster Optionen).
  - **Info-Button ("Begründung")**: Zeigt auf Klick die ausführliche fachliche Begründung aus den Referatsunterlagen.
- **Detaillierte Auswertung & Session-Zusammenfassung**:
  - Gesamtergebnis & Genauigkeit (%).
  - Aufschlüsselung nach Fachgebiet.
  - Frage-für-Frage Review mit Einblick in deine Antworten & Begründung.
- **Persistente Lernstatistiken (`/stats`)**:
  - Meisterungs-Rate (% gemeistert, in Bearbeitung, ungesehen).
  - Fortschrittsbalken je Fachgebiet.
  - Erkennung von Schwachstellen (Fragen mit den meisten Fehlversuchen).
  - Historie vergangener Durchläufe.
- **Minimalistisches Shadcn-Design**:
  - Dunkel- und Hellmodus (Dark/Light Mode).
  - Barrierefreie, ablenkungsfreie Benutzeroberfläche.
- **Docker & Docker-Compose Ready**:
  - Vollständig containerisiert mit automatischem Standalone-Build und gemountetem SQLite-Volume (`./data:/app/data`).

---

## 🐳 Starten mit Docker (Empfohlen)

Die Anwendung kann mit einem einzigen Befehl per Docker Compose gestartet werden:

```bash
docker compose up --build
```

Danach ist die Webseite im Browser erreichbar unter:
👉 **[http://localhost:3000](http://localhost:3000)**

> Die SQLite-Datenbank wird im Verzeichnis `./data` auf deinem Host-System gespeichert, sodass dein gesamter Lernfortschritt auch bei Neustarts oder Updates der Container dauerhaft erhalten bleibt.

---

## 💻 Lokale Entwicklung (ohne Docker)

Voraussetzung: Node.js (v20+ oder v22+ empfohlen)

1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

2. Entwicklungs-Server starten:
   ```bash
   npm run dev
   ```

3. Browser öffnen unter:
   👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📂 Enthaltene Themengebiete (15)

1. **Cloud Computing** (15 Fragen)
2. **ITIL** (16 Fragen)
3. **Authentifizierung: Schwerpunkt Besitz** (15 Fragen)
4. **Authentifizierung: Gesichtserkennung** (20 Fragen)
5. **Authentifizierung: Spracherkennung** (20 Fragen)
6. **IT-Projektmanagement** (20 Fragen)
7. **IT-Governance** (15 Fragen)
8. **KI-Rechenzentren** (15 Fragen)
9. **Kryptologie** (20 Fragen)
10. **Virtualisierung, Docker & Kubernetes** (20 Fragen)
11. **Neuronale Netze & Zahlenerkennung** (16 Fragen)
12. **Robotic Process Automation (RPA)** (20 Fragen)
13. **Reinforcement Learning** (20 Fragen)
14. **Security Operations (SOC)** (15 Fragen)
15. **Social Engineering** (20 Fragen)

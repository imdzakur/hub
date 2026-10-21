// Story game integration map: narrative, enemies, combat, resources, world, progression, platforms, data, and production.
import { initIntegrationMap } from "/assets/js/integration-map.js";
import { DOMAINS } from "./data.js";

initIntegrationMap({
  domains: DOMAINS,
  storageKey: "hub-game-story-tab",
  // Each area gets its own app icon color, like apps on an iPhone
  tabs: {
    antar: { icon: "network", color: "indigo" },
    narasi: { icon: "book", color: "purple" },
    musuh: { icon: "skull", color: "red" },
    combat: { icon: "crosshair", color: "orange" },
    sumber: { icon: "box", color: "brown" },
    dunia: { icon: "map", color: "green" },
    nilai: { icon: "gauge", color: "teal" },
    skor: { icon: "trophy", color: "yellow" },
    platform: { icon: "save", color: "blue" },
    data: { icon: "chart", color: "cyan" },
    produksi: { icon: "gear", color: "pink" },
  },
  modes: { rt: "Real time", bt: "Batch", ev: "Event" },
  modeHints: {
    rt: "Called every frame or on demand; the answer is awaited",
    bt: "Processed in bulk, like builds or nightly reports",
    ev: "Announced when something happens, no reply awaited",
  },
  protocols: {
    "Internal": "Modules inside the same engine, called directly.",
    "Engine event bus": "Gameplay events broadcast inside the engine to any listening system.",
    "Save file": "Game state written to and read from local or cloud saves.",
    "Platform SDK": "Console and store SDKs for achievements, trophies, and cloud saves.",
    "REST API": "HTTP calls with JSON to backend services.",
    "Message queue": "Asynchronous messages, like Kafka. Nothing is lost if the receiver is busy.",
    "Manual": "Documents exchanged and checked by people.",
    "Version control": "Assets and code tracked in Perforce or Git.",
    "Reporting portal": "Uploads to rating boards and platform certification portals.",
    "Batch file": "Scheduled CSV or text files, usually over SFTP.",
    "OAuth 2.0 / OIDC": "Sign in with a platform account without sharing passwords.",
    "Build pipeline": "Automated builds that cook assets and package the game.",
    "ETL": "Scheduled copy from telemetry into the data warehouse.",
  },
});

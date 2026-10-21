// Finance integration map: banks, insurers, markets, payments, and the systems between them.
import { initIntegrationMap } from "/assets/js/integration-map.js";
import { DOMAINS } from "./data.js";

initIntegrationMap({
  domains: DOMAINS,
  storageKey: "hub-finance-tab",
  // Each area gets its own app icon color, like apps on an iPhone
  tabs: {
    antar: { icon: "network", color: "indigo" },
    perbankan: { icon: "bank", color: "blue" },
    asuransi: { icon: "umbrella", color: "teal" },
    pasarmodal: { icon: "candle", color: "green" },
    akuntansi: { icon: "book", color: "brown" },
    pembayaran: { icon: "swap", color: "orange" },
    pembiayaan: { icon: "handcoin", color: "pink" },
    quant: { icon: "scatter", color: "purple" },
    regtech: { icon: "checklist", color: "red" },
  },
  modes: { rt: "Real time", bt: "Batch", ev: "Event" },
  modeHints: {
    rt: "Called during the transaction; the answer is awaited",
    bt: "Sent in bulk on a schedule, usually overnight",
    ev: "Announced when something happens, no reply awaited",
  },
  protocols: {
    "REST API": "HTTP calls with JSON. The most common link between apps, services, and partners.",
    "SNAP": "Bank Indonesia's national open API standard for payments.",
    "ISO 8583": "Compact message format for card and ATM transactions.",
    "ISO 20022": "Rich, usually XML, format for fund transfers. Used by BI-FAST and SWIFT.",
    "FIX": "Financial Information eXchange: orders and executions in capital markets.",
    "Market data feed": "One-way broadcast from the exchange, usually binary multicast.",
    "Message queue": "Asynchronous messages, like Kafka or IBM MQ. Nothing is lost if the receiver is busy.",
    "Host to host": "Direct server-to-server links between companies over a private line or VPN.",
    "Batch file": "Scheduled files (CSV, fixed width, MT940) usually sent over SFTP.",
    "ETL": "Scheduled copy from source systems into the data warehouse.",
    "Reporting portal": "Uploads to regulator, exchange, or government portals.",
    "Internal": "Modules inside the same system, called directly.",
    "NFC": "Contactless link between a chip card and a reader.",
    "Web publication": "Rules fetched on a schedule from official regulator sites.",
    "Manual": "Documents exchanged and checked by people.",
  },
});

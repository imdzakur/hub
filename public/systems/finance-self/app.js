// Personal finance integration map: one person's ledger, cash flow, assets, tax, and zakat.
import { initIntegrationMap } from "/assets/js/integration-map.js";
import { DOMAINS } from "./data.js";

initIntegrationMap({
  domains: DOMAINS,
  storageKey: "hub-finance-self-tab",
  // Each area gets its own app icon color, like apps on an iPhone
  tabs: {
    antar: { icon: "network", color: "indigo" },
    inti: { icon: "book", color: "blue" },
    aruskas: { icon: "swap", color: "green" },
    anggaran: { icon: "target", color: "orange" },
    utang: { icon: "card", color: "red" },
    aset: { icon: "trend", color: "teal" },
    proteksi: { icon: "umbrella", color: "cyan" },
    pajak: { icon: "percent", color: "brown" },
    zakat: { icon: "moon", color: "mint" },
    laporan: { icon: "audit", color: "purple" },
  },
  modes: { rt: "Immediate", bt: "Scheduled", ev: "Event" },
  modeHints: {
    rt: "Happens as the transaction is recorded; the result shows right away",
    bt: "Runs periodically, like a file import or the monthly close",
    ev: "Triggered by something, like a balance limit or a due date",
  },
  protocols: {
    "Internal": "Modules inside the same app, called directly.",
    "CSV/Excel import": "Tables downloaded from a bank, wallet, broker, or price source, read by a per-source format profile.",
    "PDF import": "E-statements, payslips, tax slips, card bills, or receipts read by a parser, then reviewed.",
    "Photo and OCR": "A photographed receipt read by OCR; amount and date are confirmed before journaling.",
    "Manual entry": "Typed in because the source has no export, like a pension balance or a tax form.",
    "Manual transfer": "Paid yourself in a bank or wallet app; the system only records it and keeps the proof.",
    "File export": "Data leaves as PDF, Excel, or an encrypted archive.",
    "Reminder": "A scheduled phone or email notification, like before a due date or when a balance runs low.",
  },
});

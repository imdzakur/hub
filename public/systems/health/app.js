// Health integration map: hospitals, primary care, diagnostics, payers, public platforms, apps, and research.
import { initIntegrationMap } from "/assets/js/integration-map.js";
import { DOMAINS } from "./data.js";

initIntegrationMap({
  domains: DOMAINS,
  storageKey: "hub-health-tab",
  // Each area gets its own app icon color, like apps on an iPhone
  tabs: {
    antar: { icon: "network", color: "indigo" },
    rs: { icon: "hospital", color: "red" },
    primer: { icon: "stetho", color: "green" },
    penunjang: { icon: "flask", color: "teal" },
    pembayar: { icon: "claim", color: "orange" },
    publik: { icon: "globe", color: "blue" },
    konsumen: { icon: "phone", color: "pink" },
    riset: { icon: "dna", color: "purple" },
  },
  modes: { rt: "Real time", bt: "Batch", ev: "Event" },
  modeHints: {
    rt: "Called during care; the answer is awaited",
    bt: "Sent in bulk on a schedule, usually overnight",
    ev: "Announced when something happens, no reply awaited",
  },
  protocols: {
    "REST API": "HTTP calls with JSON, including BPJS APIs like VClaim, PCare, and queue.",
    "FHIR": "HL7 FHIR: REST and JSON health data per resource. Used by SATUSEHAT and SMART on FHIR apps.",
    "HL7 v2": "Pipe-delimited messages like ADT, ORM, ORU. Still the backbone inside hospitals.",
    "CDA": "Clinical Document Architecture: XML documents like discharge summaries (C-CDA in the US).",
    "DICOM": "The standard for medical images between devices, PACS, and viewers.",
    "IHE XDS": "IHE profile for sharing clinical documents through registries and repositories.",
    "X12": "US HIPAA EDI: 270/271 eligibility, 837 claims, 835 remittance.",
    "NCPDP": "US standards for e-prescribing (SCRIPT) and pharmacy claims.",
    "ASTM": "Legacy protocol between lab analyzers and lab systems.",
    "E2B(R3)": "ICH XML format for adverse event case reports.",
    "CDISC": "Clinical trial data standards: CDASH, SDTM, ADaM.",
    "BLE device": "Bluetooth Low Energy from devices to phones: watches, BP cuffs, glucose monitors.",
    "Message queue": "Asynchronous messages, like Kafka. Nothing is lost if the receiver is busy.",
    "Batch file": "Scheduled CSV or text files, usually over SFTP.",
    "ETL": "Scheduled copy from source systems into the data warehouse.",
    "Reporting portal": "Uploads to regulator and government portals, like SIRS Online or FDA ESG.",
    "Internal": "Modules inside the same system, called directly.",
    "Manual": "Documents exchanged and checked by people.",
  },
});

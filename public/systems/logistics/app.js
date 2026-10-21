// Logistics integration map: planning, warehouses, road and rail, courier, sea, air, and customs.
import { initIntegrationMap } from "/assets/js/integration-map.js";
import { DOMAINS } from "./data.js";

initIntegrationMap({
  domains: DOMAINS,
  storageKey: "hub-logistics-tab",
  // Each area gets its own app icon color, like apps on an iPhone
  tabs: {
    antar: { icon: "network", color: "indigo" },
    rencana: { icon: "trend", color: "purple" },
    gudang: { icon: "warehouse", color: "brown" },
    darat: { icon: "truck", color: "orange" },
    kurir: { icon: "box", color: "pink" },
    laut: { icon: "ship", color: "blue" },
    udara: { icon: "plane", color: "teal" },
    bea: { icon: "gate", color: "red" },
  },
  modes: { rt: "Real time", bt: "Batch", ev: "Event" },
  modeHints: {
    rt: "Called during operations; the answer is awaited",
    bt: "Sent in bulk on a schedule, usually overnight",
    ev: "Announced when something happens, no reply awaited",
  },
  protocols: {
    "REST API": "HTTP calls with JSON between partners and platforms.",
    "Government portal": "Government systems like CEISA, INSW, and Inaportnet.",
    "Message queue": "Asynchronous messages, like Kafka. Nothing is lost if the receiver is busy.",
    "DCSA API": "Digital Container Shipping Association standards for bookings, eBL, and track and trace.",
    "ONE Record": "IATA shared data model for air cargo, one record per shipment.",
    "EDI X12": "US EDI standard: 204 load tender, 214 status, 210 freight invoice.",
    "Manual": "Documents exchanged and checked by people.",
    "Host to host": "Direct connection to a bank for billing codes and payments.",
    "IATA Cargo-XML": "IATA XML messages for air waybills, manifests, and status.",
    "Internal": "Modules inside the same system, called directly.",
    "UPU EDI": "Universal Postal Union messages for international mail, like CN38 and ITMATT.",
    "Batch file": "Scheduled CSV or text files, usually over SFTP.",
    "ETL": "Scheduled copy from source systems into the data warehouse.",
    "GS1 EPCIS": "GS1 standard for supply chain events: what, where, when, and why.",
    "EDI EDIFACT": "UN standard EDI used in shipping: BAPLIE, COPRAR, CODECO, IFTMIN.",
    "IoT telemetry": "Sensor data from GPS, reefers, and devices over MQTT.",
    "AIS": "Automatic Identification System: ship position broadcasts.",
  },
});

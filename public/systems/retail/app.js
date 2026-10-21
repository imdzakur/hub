// Retail and manufacturing integration map: product data, planning, procurement, production, automation,
// quality, maintenance, merchandising, stores, omnichannel, and customers.
import { initIntegrationMap } from "/assets/js/integration-map.js";
import { DOMAINS } from "./data.js";

initIntegrationMap({
  domains: DOMAINS,
  storageKey: "hub-retail-tab",
  // Each area gets its own app icon color, like apps on an iPhone
  tabs: {
    antar: { icon: "network", color: "indigo" },
    produk: { icon: "layers", color: "purple" },
    rencana: { icon: "calendar", color: "blue" },
    pengadaan: { icon: "handcoin", color: "teal" },
    produksi: { icon: "factory", color: "brown" },
    otomasi: { icon: "cpu", color: "gray" },
    kualitas: { icon: "filecheck", color: "green" },
    aset: { icon: "wrench", color: "orange" },
    merch: { icon: "tag", color: "pink" },
    toko: { icon: "store", color: "red" },
    omni: { icon: "cart", color: "cyan" },
    pelanggan: { icon: "users", color: "yellow" },
  },
  modes: { rt: "Real time", bt: "Batch", ev: "Event" },
  modeHints: {
    rt: "Called during the work; the answer is awaited",
    bt: "Sent in bulk on a schedule, usually overnight",
    ev: "Announced when something happens, no reply awaited",
  },
  protocols: {
    "Internal": "Modules inside the same app or process, called directly. Example: checkout input into the POS promo engine.",
    "Message queue": "Asynchronous events through a queue like Kafka; the sender doesn't wait. Example: new prices to hundreds of stores.",
    "REST API": "HTTP calls with JSON. Example: checkout to the payment gateway, the supplier portal.",
    "Batch file": "Scheduled files such as CSV or XML. Example: planograms to stores, matched invoices to accounting.",
    "ETL": "Scheduled copy into the data warehouse: extract, transform, load. Example: store sales to the forecast engine every night.",
    "MQTT": "Light publish and subscribe, often with Sparkplug B. Example: motor vibration and store chiller temperature.",
    "Reporting portal": "Uploads to regulator apps. Example: BPOM registration, SPARING, EUDR statements.",
    "OPC UA": "Industrial machine data standard with built-in information models and security. Example: recipe setpoints from MES to PLCs.",
    "Manual": "Decisions or documents handled by people. Example: final artwork sent to the packaging printer.",
    "Messaging API": "Official messaging APIs such as WhatsApp Business Platform and SMS. Example: order status to shoppers.",
    "EDI": "Standard X12 or EDIFACT trade documents over AS2, VAN, or SFTP. Example: POs, ASNs, and invoices with suppliers.",
    "Marketplace API": "Each marketplace's official API, with its own rules and rate limits. Example: listings and stock to Shopee and Tokopedia.",
    "Industrial fieldbus": "Machine networks like PROFINET, EtherNet/IP, Modbus, and EtherCAT. Example: sensors and actuators to PLCs.",
    "Webhook": "An HTTP notice from an outside party when something happens. Example: a new marketplace order, payment status.",
    "Remote access": "Remote sessions through a time-limited, recorded access gateway. Example: a vendor fixing a machine program.",
    "Payment terminal integration": "The POS sends the amount to the terminal; card data never passes the POS. Example: card and QRIS payments at checkout.",
  },
});

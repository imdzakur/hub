// Esport game integration map: accounts, matchmaking, game servers, economy, tournaments, data, integrity, and live ops.
import { initIntegrationMap } from "/assets/js/integration-map.js";
import { DOMAINS } from "./data.js";

initIntegrationMap({
  domains: DOMAINS,
  storageKey: "hub-game-esport-tab",
  // Each area gets its own app icon color, like apps on an iPhone
  tabs: {
    antar: { icon: "network", color: "indigo" },
    akun: { icon: "users", color: "blue" },
    match: { icon: "target", color: "teal" },
    moba: { icon: "swords", color: "red" },
    auto: { icon: "crown", color: "yellow" },
    ekonomi: { icon: "coins", color: "green" },
    esport: { icon: "trophy", color: "orange" },
    data: { icon: "chart", color: "purple" },
    integritas: { icon: "shield", color: "brown" },
    liveops: { icon: "server", color: "pink" },
  },
  modes: { rt: "Real time", bt: "Batch", ev: "Event" },
  modeHints: {
    rt: "Called during play; the answer is awaited",
    bt: "Sent in bulk on a schedule, usually overnight",
    ev: "Announced when something happens, no reply awaited",
  },
  protocols: {
    "REST API": "HTTP calls with JSON between backend services and clients.",
    "WebSocket": "A persistent two-way connection for lobbies, chat, and live updates.",
    "UDP netcode": "Fast, lossy packets carrying game state between client and server every tick.",
    "gRPC": "Binary RPC between internal services, fast and strongly typed.",
    "Message queue": "Asynchronous messages, like Kafka. Nothing is lost if the receiver is busy.",
    "Store billing API": "Purchase and receipt APIs from Google Play, the App Store, and console stores.",
    "Batch file": "Scheduled CSV or text files, usually over SFTP.",
    "Video streaming": "Live video to platforms like YouTube and Twitch over RTMP or SRT.",
    "Reporting portal": "Uploads to regulator and rating portals.",
    "OAuth 2.0 / OIDC": "Sign in with a platform or social account without sharing passwords.",
    "Internal": "Modules inside the same system, called directly.",
    "Push notification": "Messages to phones through APNs and FCM.",
    "Webhook": "An HTTP call sent when something happens, like a payment or report.",
    "ETL": "Scheduled copy from source systems into the data warehouse.",
    "Manual": "Documents exchanged and checked by people.",
    "CDN": "Patches and assets downloaded from servers near the player.",
  },
});

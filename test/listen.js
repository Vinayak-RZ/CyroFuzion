// tests/listen.js
const WebSocket = require("ws");

const ws = new WebSocket("ws://localhost:8080");

ws.on("open", () => {
    console.log("🔌 Connected to rate WebSocket");

    ws.send(JSON.stringify({
        orderId: "0x7c3c614431c3097670a981ff95ef153ccb3fe77dd620fd6d4e08a87019c0064d"
    }));
});

ws.on("message", (message) => {
    const data = JSON.parse(message.toString());

    if (data.error) {
        console.error("❌ Error from server:", data.error);
        return;
    }

    console.log(`📦 Update for ${data.orderId}:`);
    console.log(`Second ${data.second}: Current rate = ${data.rate}`);
});

ws.on("error", (err) => {
    console.error("🚨 WebSocket error:", err);
});

ws.on("close", () => {
    console.log("🔌 WebSocket connection closed");
});

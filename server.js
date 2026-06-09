import express from "express";

const app = express();
app.use(express.json());

const bots = {};

// register bot
app.post("/register", (req, res) => {
    const { botId } = req.body;

    bots[botId] = {
        lastSeen: Date.now(),
        command: null
    };

    res.send({ ok: true });
});

// heartbeat
app.post("/heartbeat/:id", (req, res) => {
    const id = req.params.id;
    if (bots[id]) bots[id].lastSeen = Date.now();
    res.send({ ok: true });
});

// send command
app.post("/command/:id", (req, res) => {
    const id = req.params.id;
    if (!bots[id]) return res.send({ error: "not found" });

    bots[id].command = req.body;
    res.send({ ok: true });
});

// get command (and clear it)
app.get("/command/:id", (req, res) => {
    const id = req.params.id;

    const bot = bots[id];
    if (!bot) return res.send({ action: "none" });

    const cmd = bot.command;
    bot.command = null;

    res.send(cmd || { action: "none" });
});

// list bots
app.get("/bots", (req, res) => {
    const now = Date.now();

    for (const id in bots) {
        if (now - bots[id].lastSeen > 30000) {
            delete bots[id];
        }
    }

    res.send(Object.keys(bots));
});

app.listen(process.env.PORT || 3000, () => {
    console.log("running");
});

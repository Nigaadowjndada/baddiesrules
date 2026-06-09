const express = require('express');
const app = express();

// Allow Roblox to connect
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json());
app.use(express.text());

const connectedBots = new Map();

// Clean up old bots every 30 seconds
setInterval(() => {
    const now = Date.now();
    for (const [name, data] of connectedBots.entries()) {
        if (now - data.lastSeen > 15000) { // 15 seconds timeout
            connectedBots.delete(name);
            console.log(`Bot ${name} disconnected`);
        }
    }
}, 15000);

// Bot ping endpoint
app.get('/ping', (req, res) => {
    const botName = req.query.name;
    if (!botName) {
        res.status(400).send('Missing name');
        return;
    }
    
    const botData = connectedBots.get(botName);
    const currentCommand = botData ? botData.command : 'stalk';
    
    connectedBots.set(botName, {
        command: currentCommand,
        lastSeen: Date.now()
    });
    
    console.log(`✅ ${botName} pinged - command: ${currentCommand}`);
    res.set('Content-Type', 'text/plain');
    res.send(currentCommand);
});

// Command endpoint
app.post('/command', (req, res) => {
    const command = req.body;
    console.log(`📢 Command: ${command} to ${connectedBots.size} bots`);
    
    for (const [botName, data] of connectedBots.entries()) {
        connectedBots.set(botName, {
            command: command,
            lastSeen: data.lastSeen
        });
    }
    
    res.send('OK');
});

// Bots list endpoint
app.get('/bots', (req, res) => {
    const botList = Array.from(connectedBots.keys());
    console.log(`📋 Bot list: ${botList.length} bots`);
    res.json(botList);
});

// Root endpoint for testing
app.get('/', (req, res) => {
    res.send('Bot Server Online');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

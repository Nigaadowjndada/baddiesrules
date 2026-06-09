const express = require('express');
const app = express();

app.use(express.json());
app.use(express.text());

// Store connected bots: { "BotUsername": { command: "stalk", lastSeen: timestamp } }
const connectedBots = new Map();

// Clean up old bots every 30 seconds (remove if they haven't pinged in 10 seconds)
setInterval(() => {
    const now = Date.now();
    for (const [name, data] of connectedBots.entries()) {
        if (now - data.lastSeen > 10000) { // 10 seconds timeout
            connectedBots.delete(name);
            console.log(`Bot ${name} disconnected (timeout)`);
        }
    }
}, 30000);

// Bot ping endpoint - bots call this every second
app.get('/ping', (req, res) => {
    const botName = req.query.name;
    if (!botName) {
        res.status(400).send('Missing name parameter');
        return;
    }
    
    // Get current command for this bot (default to 'stalk')
    const botData = connectedBots.get(botName);
    const currentCommand = botData ? botData.command : 'stalk';
    
    // Update or add bot with current timestamp
    connectedBots.set(botName, {
        command: currentCommand,
        lastSeen: Date.now()
    });
    
    console.log(`✅ ${botName} pinged - command: ${currentCommand}`);
    res.send(currentCommand);
});

// Controller sends command to ALL bots
app.post('/command', (req, res) => {
    const command = req.body;
    console.log(`📢 Controller sent command: ${command} to ${connectedBots.size} bots`);
    
    // Update command for all connected bots
    for (const [botName, data] of connectedBots.entries()) {
        connectedBots.set(botName, {
            command: command,
            lastSeen: data.lastSeen
        });
    }
    
    res.send('OK');
});

// Get list of all currently connected bots
app.get('/bots', (req, res) => {
    const botList = Array.from(connectedBots.keys());
    console.log(`📋 Bot list requested: ${botList.length} bots online`);
    res.json(botList);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Ready to manage bots!`);
});

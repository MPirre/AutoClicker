const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3005;
const DATA_FILE = path.join(__dirname, 'data', 'players.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Carrega dados
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

// Salva dados
function writeData(data) {
    // Garante que a pasta existe
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Rota para carregar o jogo
app.get('/api/load/:playerId', (req, res) => {
    const playerId = req.params.playerId;
    const data = readData();
    res.json(data[playerId] || {});
});

// Rota para guardar o jogo
app.post('/api/save', (req, res) => {
    console.log('Dados recebidos em /api/save:', req.body);
    const saveData = req.body;
    const data = readData();
    data[saveData.playerId] = saveData;
    writeData(data);
    res.sendStatus(200);
});

// Rota para submeter ao leaderboard
app.post('/api/submit-score', (req, res) => {
    console.log('Dados recebidos em /api/submit-score:', req.body);
    const { playerId, name, score } = req.body;
    if (!playerId || !name || typeof score !== 'number') {
        return res.status(400).json({ error: "Dados inválidos." });
    }

    const data = readData();
    if (!data[playerId]) {
        data[playerId] = { playerId, name, score };
    }

    if (!data[playerId].score || score > data[playerId].score) {
        data[playerId].name = name;
        data[playerId].score = score;
    }

    writeData(data);
    res.sendStatus(200);
});

// Rota para leaderboard
app.get('/api/leaderboard', (req, res) => {
    const data = Object.values(readData());
    const leaderboard = data
        .filter(p => typeof p.score === 'number')
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    res.json(leaderboard);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});

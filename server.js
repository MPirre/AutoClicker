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
    console.log('Tipo dos dados:', typeof req.body);
    console.log('playerId:', req.body.playerId, 'tipo:', typeof req.body.playerId);
    console.log('name:', req.body.name, 'tipo:', typeof req.body.name);
    console.log('score:', req.body.score, 'tipo:', typeof req.body.score);
    console.log('scoreCycle:', req.body.scoreCycle, 'tipo:', typeof req.body.scoreCycle);
    
    const { playerId, name, score, scoreCycle } = req.body;
    
    console.log('Valores extraídos:', { playerId, name, score, scoreCycle });
    
    console.log('Validação dos dados:');
    console.log('- playerId válido:', !!playerId, 'valor:', playerId);
    console.log('- name válido:', !!name, 'valor:', name);
    console.log('- score válido:', !!score, 'valor:', score);
    
    if (!playerId || !name || !score) {
        console.log('❌ Dados inválidos detectados!');
        console.log('Dados inválidos:', { 
            playerId: !!playerId, 
            name: !!name, 
            score: !!score,
            playerIdValue: playerId,
            nameValue: name,
            scoreValue: score
        });
        return res.status(400).json({ error: "Dados inválidos.", details: { playerId: !!playerId, name: !!name, score: !!score } });
    }
    
    console.log('✅ Todos os dados são válidos!');

    const data = readData();
    if (!data[playerId]) {
        data[playerId] = { playerId, name, score, scoreCycle };
    }

    // Comparar scores considerando ciclos
    const currentScoreCycle = data[playerId].scoreCycle || 0;
    const shouldUpdate = !data[playerId].score || 
                        (scoreCycle > currentScoreCycle) ||
                        (scoreCycle === currentScoreCycle && score !== data[playerId].score);

    if (shouldUpdate) {
        // Adicionar letra do ciclo ao score para o leaderboard
        const cycleLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let cycleSuffix = scoreCycle > 0 ? cycleLetters[scoreCycle - 1] || scoreCycle : "";
        let scoreWithCycle = score + cycleSuffix;
        
        data[playerId].name = name;
        data[playerId].score = scoreWithCycle; // Guardar com letra do ciclo
        data[playerId].scoreCycle = scoreCycle || 0;
    }

    writeData(data);
    res.sendStatus(200);
});

// Rota para leaderboard
app.get('/api/leaderboard', (req, res) => {
    const data = Object.values(readData());
    const leaderboard = data
        .filter(p => p.score) // Aceitar tanto números como strings
        .sort((a, b) => {
            // Se um tem scoreCycle e outro não, o que tem scoreCycle vai primeiro
            if (a.scoreCycle && !b.scoreCycle) return -1;
            if (!a.scoreCycle && b.scoreCycle) return 1;
            
            // Se ambos têm scoreCycle, ordenar por scoreCycle (maior primeiro)
            if (a.scoreCycle && b.scoreCycle) {
                if (a.scoreCycle !== b.scoreCycle) {
                    return b.scoreCycle - a.scoreCycle;
                }
            }
            
            // Se scoreCycle igual ou ambos sem scoreCycle, tentar ordenar por score
            const scoreA = typeof a.score === 'number' ? a.score : parseFloat(a.score) || 0;
            const scoreB = typeof b.score === 'number' ? b.score : parseFloat(b.score) || 0;
            return scoreB - scoreA;
        })
        .slice(0, 10);
    res.json(leaderboard);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});

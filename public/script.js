// Variáveis globais
function generateUUID() {
    if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    // Fallback para navegadores antigos
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

let playerId = localStorage.getItem('playerId');
if (!playerId) {
    playerId = generateUUID();
    localStorage.setItem('playerId', playerId);
}

let score = 0;
let clickPower = 1;
let upgradeLevel = 0;
let upgradeCost = 50;

let autoClickers = 0;
let autoClickerLevel = 0;
let autoClickerCost = 150;

let critChance = 0;
let critLevel = 0;
const critMaxLevel = 15;
let critCost = 2000;

let amizadeLevel = 0;
const amizadeMaxLevel = 10;
let amizadeCost = 5000;

let franchisingLevel = 0;
const maxFranchisingLevel = 2;
const franchisingMultipliers = [1, 2, 3];
const franchisingCosts = [0, 15000, 30000];

let musicPlaying = false;

let leaderboard = [];

let mendesVisible = false;

let scoreCycle = 0; // 0 = nada, 1 = A, 2 = B, etc.
const cycleLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// DOM Elements
const music = document.getElementById('musica-fundo');
const musicToggle = document.getElementById('music-toggle');
const musicIcon = document.getElementById('music-icon');

const scoreDisplay = document.getElementById('score-value');
const cookieButton = document.getElementById('Trident-button');
const resetButton = document.getElementById('reset-button');

const shopToggle = document.getElementById('shop-toggle');
const shopMenu = document.getElementById('shop-menu');

const upgradeAssalto = document.getElementById('upgrade-assalto');
const upgradeText = upgradeAssalto.querySelector('.upgrade-text');

const upgradeAuto = document.getElementById('upgrade-auto');
const autoText = upgradeAuto.querySelector('.upgrade-text');

const upgradeCritico = document.getElementById('upgrade-critico');
const critText = upgradeCritico.querySelector('.upgrade-text');

const upgradeAmizade = document.getElementById('upgrade-amizade');
const amizadeText = upgradeAmizade.querySelector('.upgrade-text');

const upgradeFranchising = document.getElementById('upgrade-franchising');
const franchisingText = upgradeFranchising.querySelector('.upgrade-text');

const superTridentContainer = document.getElementById('super-trident-container');

const volumeSlider = document.getElementById('volume-slider');

// Definir volume inicial para metade (0.5)
music.volume = 0.3;
volumeSlider.value = 0.3;

volumeSlider.addEventListener('input', () => {
    music.volume = volumeSlider.value;
});

// Definir URL base da API conforme ambiente
const API_BASE_URL = window.location.origin.includes('localhost')
  ? 'http://localhost:3005'
  : 'http://mpirre.com';

// Carregar Jogo
async function loadGame() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/load/${playerId}`);
        if (!response.ok) throw new Error("Erro ao carregar dados do servidor.");
        const data = await response.json();

        score = data.score || 0;
        clickPower = data.clickPower || 1;
        upgradeLevel = data.upgradeLevel || 0;
        upgradeCost = data.upgradeCost || 50;
        autoClickers = data.autoClickers || 0;
        autoClickerLevel = data.autoClickerLevel || 0;
        autoClickerCost = data.autoClickerCost || 150;
        critChance = data.critChance || 0;
        critLevel = data.critLevel || 0;
        critCost = data.critCost || 2000;
        amizadeLevel = data.amizadeLevel || 0;
        amizadeCost = data.amizadeCost || 5000;
        franchisingLevel = data.franchisingLevel || 0;
        scoreCycle = data.scoreCycle || 0;
    } catch (err) {
        console.warn("Jogo novo ou erro ao carregar:", err.message);
    }
    updateAll();
}

musicToggle.addEventListener('click', () => {
    if (musicPlaying) {
        music.pause();
        musicIcon.src = 'Imagens/sound.jpg';
    } else {
        music.play().catch(err => {
            console.warn("Erro ao reproduzir música:", err);
        });
        musicIcon.src = 'Imagens/som-desligado.webp';
    }
    musicPlaying = !musicPlaying;
});

window.addEventListener('click', () => {
    if (!musicPlaying) {
        music.play().then(() => {
            musicPlaying = true;
            musicIcon.src = 'Imagens/som-desligado.webp';
        }).catch(() => {
            console.warn("Autoplay bloqueado, clique no botão de som.");
        });
    }
}, { once: true });

// Guardar Jogo
async function saveGame() {
    const saveData = {
        playerId,
        score, clickPower, upgradeLevel, upgradeCost,
        autoClickers, autoClickerLevel, autoClickerCost,
        critChance, critLevel, critCost,
        amizadeLevel, amizadeCost,
        franchisingLevel,
        scoreCycle
    };

    try {
        await fetch(`${API_BASE_URL}/api/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saveData)
        });
    } catch (err) {
        console.error("Erro ao guardar jogo:", err.message);
    }
}

function resetScore() {
    score = 0;
    clickPower = 1;
    upgradeLevel = 0;
    upgradeCost = 50;
    autoClickers = 0;
    autoClickerLevel = 0;
    autoClickerCost = 150;
    critChance = 0;
    critLevel = 0;
    critCost = 2000;
    amizadeLevel = 0;
    amizadeCost = 5000;
    franchisingLevel = 0;
    scoreCycle = 0;
    updateAll();
    saveGame();
}

function updateScore() {
    let earned = clickPower;
    if (Math.random() < critChance) {
        earned = Math.ceil(earned * 1.5);
        showCritEffect();
    }
    score += earned;
    checkScoreCycle();
    updateAll();
}

const SCORE_LIMIT = 1000; // Limite mais baixo para ser mais fácil de atingir

function checkScoreCycle() {
    if (score > SCORE_LIMIT) {
        score = 0;
        scoreCycle++;
        
        // Reset automático de todos os upgrades quando avança de ciclo
        clickPower = 1;
        upgradeLevel = 0;
        upgradeCost = 50;
        autoClickers = 0;
        autoClickerLevel = 0;
        autoClickerCost = 150;
        critChance = 0;
        critLevel = 0;
        critCost = 2000;
        amizadeLevel = 0;
        amizadeCost = 5000;
        franchisingLevel = 0;
        
        alert(`Parabéns! Avançaste para o ciclo ${cycleLetters[scoreCycle - 1] || scoreCycle}! Todos os upgrades foram resetados.`);
        
        // Atualizar a interface após o reset
        updateAll();
        
        // Guardar o jogo automaticamente após avançar de ciclo
        saveGame();
    }
}

function updateAll() {
    let cycleSuffix = scoreCycle > 0 ? cycleLetters[scoreCycle - 1] || scoreCycle : "";
    scoreDisplay.textContent = formatScoreWithSpaces(score) + cycleSuffix;
    updateUpgradeButton();
    updateAutoUpgradeButton();
    updateCritUpgradeButton();
    updateAmizadeButton();
    updateFranchisingButton();
    checkNeonBorder();
    checkSuperTrident();
}

function showCritEffect() {
    const critEffect = document.createElement('div');
    critEffect.className = 'crit-hit';
    critEffect.innerText = '💥 CRÍTICO!';
    const buttonRect = cookieButton.getBoundingClientRect();
    critEffect.style.position = 'fixed';
    critEffect.style.left = `${buttonRect.left + buttonRect.width / 2}px`;
    critEffect.style.top = `${buttonRect.top - 20}px`;
    critEffect.style.transform = 'translateX(-50%)';
    critEffect.style.pointerEvents = 'none';
    critEffect.style.zIndex = 1000;
    document.body.appendChild(critEffect);
    setTimeout(() => critEffect.remove(), 1000);
}

// Atualização dos botões
function updateUpgradeButton() {
    upgradeText.textContent = `ASSALTO ${upgradeLevel + 1}: +${clickPower} por Click! (Custa ${upgradeCost})`;
    upgradeAssalto.disabled = score < upgradeCost;
}
function updateAutoUpgradeButton() {
    autoText.textContent = `FARM AUTOMÁTICA DE TRIDENT ${autoClickerLevel + 1} Click/s! (Custa ${autoClickerCost})`;
    upgradeAuto.disabled = score < autoClickerCost;
}
function updateCritUpgradeButton() {
    if (critLevel >= critMaxLevel) {
        critText.textContent = `CRÍTICO MÁXIMO! (${(critChance * 100).toFixed(0)}%)`;
        upgradeCritico.disabled = true;
    } else {
        critText.textContent = `CRÍTICO ${critLevel + 1}: +${(critChance * 100).toFixed(0)}% chance de 1.5x no clique! (Custa ${critCost})`;
        upgradeCritico.disabled = score < critCost;
    }
}
function updateAmizadeButton() {
    if (amizadeLevel >= amizadeMaxLevel) {
        amizadeText.textContent = `AMIZADE MÁXIMA! (+${amizadeLevel}% Tridents por segundo)`;
        upgradeAmizade.disabled = true;
    } else {
        amizadeText.textContent = `AMIZADE ${amizadeLevel + 1}: +${amizadeLevel + 1}% dos teus Tridents por segundo (Custa ${amizadeCost})`;
        upgradeAmizade.disabled = score < amizadeCost;
    }
}
function updateFranchisingButton() {
    if (franchisingLevel >= maxFranchisingLevel) {
        franchisingText.textContent = `FRANCHISING MÁXIMO (${franchisingMultipliers[franchisingLevel]}x produção automática)`;
        upgradeFranchising.disabled = true;
    } else {
        const nextMultiplier = franchisingMultipliers[franchisingLevel + 1];
        const cost = franchisingCosts[franchisingLevel + 1];
        franchisingText.textContent = `FRANCHISING ${franchisingLevel + 1}: ${nextMultiplier}x produção automática (Custa ${cost})`;
        upgradeFranchising.disabled = score < cost;
    }
}

function checkNeonBorder() {
    cookieButton.classList.toggle('rainbow-neon', score >= 500);
}
function isScientificNotation(value) {
    const str = value.toString();
    return /^[+-]?\d+(\.\d+)?e[+-]?\d+$/i.test(str);
}

function checkSuperTrident() {
    superTridentContainer.style.display = score > 9000 ? 'block' : 'none';

    const mendes = document.getElementById('mendes');
    const mendesSound = document.getElementById('mendes-sound');

    const shouldShowMendes = isScientificNotation(score);

    if (shouldShowMendes && !mendesVisible) {
        mendes.style.display = 'block';
        mendesSound.currentTime = 0;
        mendesSound.play();
        mendesVisible = true;
    } else if (!shouldShowMendes && mendesVisible) {
        mendes.style.display = 'none';
        mendesVisible = false;
    }
}

// Leaderboard
async function loadLeaderboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/leaderboard`);
        if (!response.ok) throw new Error("Erro ao carregar leaderboard.");
        leaderboard = await response.json();
        updateLeaderboardDisplay();
    } catch (err) {
        console.error("Erro ao carregar leaderboard:", err.message);
    }
}

function updateLeaderboardDisplay() {
    const listEl = document.getElementById('leaderboard-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    
    // O servidor já ordena por ciclos, só mostrar os dados
    leaderboard.forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `${entry.name}: ${entry.score}`;
        listEl.appendChild(li);
    });
}

async function submitScore() {
    const input = document.getElementById('player-name');
    const playerName = input.value.trim();

    if (!playerName) {
        alert("Por favor, insira o seu username antes de submeter.");
        return;
    }



    // Enviar apenas o score numérico, o servidor vai adicionar a letra do ciclo
    let scoreToSend = formatScoreWithSpaces(score);
    
    console.log('Debug score:', {
        score: score,
        scoreCycle: scoreCycle,
        scoreToSend: scoreToSend
    });
    
    // Garantir que o score não seja uma string vazia
    if (!scoreToSend || scoreToSend.trim() === '') {
        alert("Score inválido. Tenta novamente.");
        return;
    }

    try {
        const requestData = { 
            playerId, 
            name: playerName, 
            score: scoreToSend,
            scoreCycle: scoreCycle
        };
        
        console.log('Enviando dados:', requestData);
        console.log('playerId verificação:', playerId, 'tipo:', typeof playerId);
        
        const response = await fetch(`${API_BASE_URL}/api/submit-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        console.log('Status da resposta:', response.status);
        
        if (response.ok) {
            let cycleSuffix = scoreCycle > 0 ? cycleLetters[scoreCycle - 1] || scoreCycle : "";
            let displayScore = scoreToSend + cycleSuffix;
            alert(`Obrigado, ${playerName}! Submeteste ${displayScore} Tridents para o Leaderboard!`);
            input.value = '';
            loadLeaderboard();
        } else {
            const errorText = await response.text();
            console.error('Erro do servidor:', errorText);
            throw new Error(`Erro ao submeter score. Status: ${response.status}`);
        }
    } catch (err) {
        console.error('Erro completo:', err);
        alert("Erro ao submeter para o leaderboard: " + err.message);
    }
}

// Eventos
let lastClickTime = 0;
let clickTimestamps = [];
const MAX_CLICKS_PER_SECOND = 18;
const MIN_CLICK_INTERVAL = 50; // ms

cookieButton.addEventListener('click', function () {
    const now = Date.now();

    // 1. Verifica intervalo mínimo entre cliques
    if (now - lastClickTime < MIN_CLICK_INTERVAL) {
        triggerAutoClickerPunish();
        return;
    }
    lastClickTime = now;

    // 2. Conta cliques por segundo
    clickTimestamps.push(now);
    clickTimestamps = clickTimestamps.filter(ts => now - ts < 1000);

    if (clickTimestamps.length > MAX_CLICKS_PER_SECOND) {
        triggerAutoClickerPunish();
        return;
    }

    updateScore();
});

function triggerAutoClickerPunish() {
    // Mostra o aviso
    document.getElementById('autoclicker-warning').style.display = 'block';
    // Esconde o resto da página
    document.getElementById('main-content').style.display = 'none';
    // Desabilita o botão
    cookieButton.disabled = true;

    // Após 2 minutos, esconde o aviso e reabilita o botão e o conteúdo
    setTimeout(() => {
        document.getElementById('autoclicker-warning').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        cookieButton.disabled = false;
        // Limpa os registros de clique para evitar punição em loop
        clickTimestamps = [];
        lastClickTime = 0;
    }, 120000); // 2 minutos = 120000 ms
}

cookieButton.addEventListener('mousedown', () => cookieButton.style.transform = 'scale(0.95)');
cookieButton.addEventListener('mouseup', () => cookieButton.style.transform = 'scale(1)');
resetButton.addEventListener('click', resetScore);
shopToggle.addEventListener('click', () => {
    shopMenu.style.display = shopMenu.style.display === 'none' ? 'block' : 'none';
});
upgradeAssalto.addEventListener('click', () => {
    if (score >= upgradeCost) {
        score -= upgradeCost;
        clickPower *= 2;
        upgradeLevel++;
        upgradeCost *= 2;
        updateAll();
        saveGame();
    }
});
upgradeAuto.addEventListener('click', () => {
    if (score >= autoClickerCost) {
        score -= autoClickerCost;
        autoClickers++;
        autoClickerLevel++;
        autoClickerCost *= 2;
        updateAll();
        saveGame();
    }
});
upgradeCritico.addEventListener('click', () => {
    if (score >= critCost && critLevel < critMaxLevel) {
        score -= critCost;
        critLevel++;
        critChance += 0.01;
        critCost *= (critLevel >= critMaxLevel - 2) ? 10 : 2;
        updateAll();
        saveGame();
    }
});
upgradeAmizade.addEventListener('click', () => {
    if (score >= amizadeCost && amizadeLevel < amizadeMaxLevel) {
        score -= amizadeCost;
        amizadeLevel++;
        amizadeCost *= (amizadeLevel >= amizadeMaxLevel - 2) ? 10 : 2;
        updateAll();
        saveGame();
    }
});
upgradeFranchising.addEventListener('click', () => {
    const nextLevel = franchisingLevel + 1;
    const cost = franchisingCosts[nextLevel];
    if (score >= cost && nextLevel <= maxFranchisingLevel) {
        score -= cost;
        franchisingLevel = nextLevel;
        updateAll();
        saveGame();
    }
});
document.getElementById('submit-score')?.addEventListener('click', submitScore);

// Ganho passivo
setInterval(() => {
    let passiveGain = autoClickers * franchisingMultipliers[franchisingLevel];
    if (amizadeLevel > 0) {
        passiveGain += Math.floor(score * (amizadeLevel / 100));
    }
    if (passiveGain > 0) {
        score += passiveGain;
        updateAll();
    }
}, 1000);

// Auto-save
setInterval(saveGame, 10000);

// On load
window.onload = () => {
    loadGame();
    loadLeaderboard();

    // Inicialização do modo escuro
    const darkModeButton = document.getElementById('toggle-dark-mode');
    let darkMode = false;

    darkModeButton.addEventListener('click', () => {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        document.getElementById('main-content').classList.toggle('dark-mode', darkMode);
        darkModeButton.textContent = darkMode ? 'Desativar Modo Assalto' : 'Ativar Modo Assalto';
    });
};

document.addEventListener('DOMContentLoaded', function() {
    const darkModeButton = document.getElementById('toggle-dark-mode');
    if (darkModeButton) {
        darkModeButton.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
        });
    }
});

function formatScoreWithSpaces(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
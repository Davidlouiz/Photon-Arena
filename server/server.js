// Serveur Node.js avec WebSocket pour Photon Arena

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const GameState = require('./gameState');
const MapLoader = require('./mapLoader');

const PORT = 3000;
const TICK_RATE = 30; // 30 ticks par seconde

// Initialiser Express et HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Servir les fichiers statiques du client
app.use(express.static(path.join(__dirname, '../client')));

// État du jeu
const gameState = new GameState();
const mapLoader = new MapLoader();

// Charger la map par défaut
const MAP_PATH = path.join(__dirname, '../maps/default.bmp');

mapLoader.loadMap(MAP_PATH).then(success => {
    if (success) {
        gameState.setSpawnPoints(mapLoader.getSpawnPoints());
        console.log('Map chargée avec succès');
    } else {
        console.warn('Impossible de charger la map, utilisation de points de spawn par défaut');
    }
});

// Gestion des connexions WebSocket
wss.on('connection', (ws) => {
    let playerId = null;

    console.log('Nouvelle connexion WebSocket');

    // Message de bienvenue
    ws.send(JSON.stringify({
        type: 'connected',
        data: { message: 'Connecté au serveur' }
    }));

    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message);

            switch (msg.type) {
                case 'join':
                    // Joueur rejoint la partie
                    playerId = generateId();
                    const player = gameState.addPlayer(playerId, msg.data.username);

                    if (player) {
                        ws.send(JSON.stringify({
                            type: 'joined',
                            data: {
                                playerId,
                                player,
                                mapData: mapLoader.getMapData()
                            }
                        }));
                        console.log(`Joueur ${msg.data.username} (${playerId}) a rejoint la partie`);
                    } else {
                        ws.send(JSON.stringify({
                            type: 'error',
                            data: { message: 'Partie pleine' }
                        }));
                    }
                    break;

                case 'input':
                    // Mise à jour des inputs du joueur
                    if (playerId && msg.data.position && msg.data.rotation) {
                        gameState.updatePlayerPosition(playerId, msg.data.position, msg.data.rotation);
                    }
                    break;

                case 'shoot':
                    // Traiter un tir
                    if (playerId && msg.data.targetId) {
                        const result = gameState.processShooting(playerId, msg.data.targetId, msg.data.hitPosition);

                        if (result) {
                            // Broadcast l'événement de tir à tous les clients
                            broadcast({
                                type: 'shootResult',
                                data: result
                            });
                        }
                    }
                    break;
            }
        } catch (error) {
            console.error('Erreur traitement message:', error);
        }
    });

    ws.on('close', () => {
        if (playerId) {
            gameState.removePlayer(playerId);
            console.log(`Joueur ${playerId} déconnecté`);
        }
    });

    ws.on('error', (error) => {
        console.error('Erreur WebSocket:', error);
    });
});

// Broadcast un message à tous les clients connectés
function broadcast(message) {
    const data = JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// Boucle de jeu principale (tick)
setInterval(() => {
    gameState.update();

    // Envoyer l'état du jeu à tous les clients
    broadcast({
        type: 'gameState',
        data: gameState.getState()
    });

    // Si la partie est terminée, envoyer le classement
    if (gameState.isGameOver) {
        broadcast({
            type: 'gameOver',
            data: { leaderboard: gameState.getLeaderboard() }
        });
    }
}, 1000 / TICK_RATE);

// Générer un ID unique
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Démarrer le serveur
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════╗
║       PHOTON ARENA - SERVEUR          ║
╚═══════════════════════════════════════╝

Serveur démarré sur le port ${PORT}

Pour rejoindre la partie, ouvrez dans votre navigateur:
- En local: http://localhost:${PORT}
- Sur le réseau: http://[VOTRE_IP]:${PORT}

Appuyez sur Ctrl+C pour arrêter le serveur.
  `);
});

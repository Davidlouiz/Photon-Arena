// Gestion de l'état du jeu (joueurs, scores, timer)

const GAME_DURATION = 5 * 60 * 1000; // 5 minutes en ms
const MAX_SCORE = 20; // Score pour gagner
const RESPAWN_TIME = 3000; // 3 secondes
const PLAYER_HEALTH = 100;
const WEAPON_DAMAGE = 25;
const MAX_PLAYERS = 8;

class GameState {
    constructor() {
        this.players = new Map(); // id -> player object
        this.gameStartTime = Date.now();
        this.isGameOver = false;
        this.spawnPoints = [];
    }

    // Ajouter un joueur
    addPlayer(id, username) {
        if (this.players.size >= MAX_PLAYERS) {
            return null;
        }

        const spawnPos = this.getRandomSpawnPoint();
        const player = {
            id,
            username,
            position: spawnPos,
            rotation: { x: 0, y: 0 },
            health: PLAYER_HEALTH,
            score: 0,
            isAlive: true,
            respawnTime: 0
        };

        this.players.set(id, player);
        return player;
    }

    // Retirer un joueur
    removePlayer(id) {
        this.players.delete(id);
    }

    // Obtenir un point de spawn aléatoire
    getRandomSpawnPoint() {
        if (this.spawnPoints.length === 0) {
            // Point de spawn par défaut si aucun n'est défini
            return { x: 0, y: 1, z: 0 };
        }
        const spawn = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
        return { ...spawn };
    }

    // Définir les points de spawn depuis la map
    setSpawnPoints(points) {
        this.spawnPoints = points;
    }

    // Mettre à jour la position d'un joueur
    updatePlayerPosition(id, position, rotation) {
        const player = this.players.get(id);
        if (player && player.isAlive) {
            player.position = position;
            player.rotation = rotation;
        }
    }

    // Traiter un tir
    processShooting(shooterId, targetId, hitPosition) {
        const shooter = this.players.get(shooterId);
        const target = this.players.get(targetId);

        if (!shooter || !target || !shooter.isAlive || !target.isAlive) {
            return null;
        }

        // Appliquer les dégâts
        target.health -= WEAPON_DAMAGE;

        if (target.health <= 0) {
            // Le joueur est éliminé
            target.health = 0;
            target.isAlive = false;
            target.respawnTime = Date.now() + RESPAWN_TIME;
            shooter.score += 1;

            // Vérifier la condition de victoire
            if (shooter.score >= MAX_SCORE) {
                this.isGameOver = true;
            }

            return {
                type: 'kill',
                shooter: shooterId,
                target: targetId,
                newScore: shooter.score
            };
        }

        return {
            type: 'hit',
            target: targetId,
            newHealth: target.health
        };
    }

    // Mettre à jour les respawns
    update() {
        const now = Date.now();

        // Respawn des joueurs morts
        for (const [id, player] of this.players) {
            if (!player.isAlive && now >= player.respawnTime) {
                player.health = PLAYER_HEALTH;
                player.isAlive = true;
                player.position = this.getRandomSpawnPoint();
            }
        }

        // Vérifier le timer de fin de partie
        const elapsedTime = now - this.gameStartTime;
        if (elapsedTime >= GAME_DURATION) {
            this.isGameOver = true;
        }
    }

    // Obtenir le temps restant
    getRemainingTime() {
        const elapsed = Date.now() - this.gameStartTime;
        const remaining = Math.max(0, GAME_DURATION - elapsed);
        return Math.floor(remaining / 1000); // en secondes
    }

    // Obtenir l'état sérialisable pour les clients
    getState() {
        const playersArray = Array.from(this.players.values()).map(p => ({
            id: p.id,
            username: p.username,
            position: p.position,
            rotation: p.rotation,
            health: p.health,
            score: p.score,
            isAlive: p.isAlive
        }));

        return {
            players: playersArray,
            remainingTime: this.getRemainingTime(),
            isGameOver: this.isGameOver
        };
    }

    // Obtenir le classement
    getLeaderboard() {
        const sorted = Array.from(this.players.values())
            .sort((a, b) => b.score - a.score);

        return sorted.map((p, index) => ({
            rank: index + 1,
            username: p.username,
            score: p.score
        }));
    }
}

module.exports = GameState;

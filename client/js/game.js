// Boucle principale du jeu et gestion de la scène Three.js

let scene, camera, renderer, controls;
let player, gameMap;
let otherPlayers = new Map(); // id -> mesh
let clock;
let isGameStarted = false;

// Initialisation
async function init() {
    // Récupérer le pseudo depuis localStorage
    const username = localStorage.getItem('photonArenaUsername');
    if (!username) {
        window.location.href = 'index.html';
        return;
    }

    // Créer la scène
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a0a, 10, 100);

    // Caméra
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.y = 1.6; // Hauteur des yeux

    // Renderer
    const canvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lumières
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    scene.add(dirLight);

    // Lumière néon
    const neonLight = new THREE.PointLight(0x00ffff, 1, 50);
    neonLight.position.set(0, 10, 0);
    scene.add(neonLight);

    // Contrôles FPS
    controls = new THREE.PointerLockControls(camera, document.body);
    scene.add(controls.getObject());

    console.log('Contrôles FPS initialisés');

    // Gestion du verrouillage de la souris
    const startButton = document.getElementById('startButton');
    if (!startButton) {
        console.error('Bouton startButton non trouvé!');
        return;
    }

    startButton.addEventListener('click', () => {
        console.log('Bouton COMMENCER cliqué');
        try {
            controls.lock();
            console.log('Verrouillage de la souris demandé');
        } catch (error) {
            console.error('Erreur lors du verrouillage:', error);
        }
    });

    controls.addEventListener('lock', () => {
        console.log('Souris verrouillée');
        document.getElementById('startMessage').style.display = 'none';
        if (!isGameStarted) {
            startGame(username);
        }
    });

    controls.addEventListener('unlock', () => {
        console.log('Souris déverrouillée');
        // Ne rien faire pour l'instant
    });

    // Map
    gameMap = new GameMap(scene);

    // Joueur
    player = new Player(camera, scene, controls);
    scene.add(player.mesh);

    // Clock pour delta time
    clock = new THREE.Clock();

    // Connexion au serveur
    try {
        await network.connect();
        setupNetworkHandlers();
    } catch (error) {
        console.error('Impossible de se connecter au serveur:', error);
        alert('Erreur de connexion au serveur');
    }

    // Gestion du redimensionnement
    window.addEventListener('resize', onWindowResize);

    // Démarrer la boucle de rendu
    animate();
}

// Démarrer la partie
function startGame(username) {
    isGameStarted = true;
    network.join(username);
}

// Handlers réseau
function setupNetworkHandlers() {
    // Confirmation de connexion à la partie
    network.on('joined', (data) => {
        console.log('Rejoint la partie:', data);
        network.playerId = data.playerId;

        // Générer la map
        if (data.mapData) {
            gameMap.generate(data.mapData);
        }

        // Positionner le joueur
        if (data.player && data.player.position) {
            camera.position.set(
                data.player.position.x,
                data.player.position.y,
                data.player.position.z
            );
        }
    });

    // État du jeu
    network.on('gameState', (data) => {
        updateGameState(data);
    });

    // Résultat d'un tir
    network.on('shootResult', (data) => {
        if (data.type === 'kill') {
            console.log('Élimination:', data);
            // Effet visuel ou son
        } else if (data.type === 'hit') {
            console.log('Touché:', data);
        }

        // Mettre à jour la santé si c'est le joueur local
        if (data.target === network.playerId) {
            player.setHealth(data.newHealth || 0);
        }

        // Mettre à jour le score si c'est le joueur local
        if (data.shooter === network.playerId && data.newScore !== undefined) {
            player.setScore(data.newScore);
        }
    });

    // Fin de partie
    network.on('gameOver', (data) => {
        showGameOver(data.leaderboard);
    });
}

// Mettre à jour l'état du jeu
function updateGameState(data) {
    // Mettre à jour le timer
    const minutes = Math.floor(data.remainingTime / 60);
    const seconds = data.remainingTime % 60;
    document.getElementById('timerValue').textContent =
        `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Mettre à jour les autres joueurs
    const currentPlayerIds = new Set();

    data.players.forEach(playerData => {
        if (playerData.id === network.playerId) {
            // Joueur local
            player.setHealth(playerData.health);
            player.setScore(playerData.score);
            player.setAlive(playerData.isAlive);
        } else {
            // Autres joueurs
            currentPlayerIds.add(playerData.id);

            if (!otherPlayers.has(playerData.id)) {
                // Créer un nouveau joueur
                createOtherPlayer(playerData);
            } else {
                // Mettre à jour la position
                const mesh = otherPlayers.get(playerData.id);
                mesh.position.set(
                    playerData.position.x,
                    playerData.position.y,
                    playerData.position.z
                );
                mesh.rotation.y = playerData.rotation.y;
                mesh.visible = playerData.isAlive;
            }
        }
    });

    // Supprimer les joueurs déconnectés
    for (const [id, mesh] of otherPlayers) {
        if (!currentPlayerIds.has(id)) {
            scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
            otherPlayers.delete(id);
        }
    }

    // Mettre à jour le scoreboard
    updateScoreboard(data.players);
}

// Créer le mesh d'un autre joueur
function createOtherPlayer(playerData) {
    const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
    const material = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 0.5
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
        playerData.position.x,
        playerData.position.y,
        playerData.position.z
    );
    mesh.castShadow = true;

    // Ajouter le nom au-dessus du joueur
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    context.fillStyle = '#ffffff';
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.fillText(playerData.username, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 0.5, 1);
    sprite.position.y = 1.5;
    mesh.add(sprite);

    otherPlayers.set(playerData.id, mesh);
    scene.add(mesh);
}

// Mettre à jour le scoreboard
function updateScoreboard(players) {
    const sorted = players.sort((a, b) => b.score - a.score);
    const scoreboardList = document.getElementById('scoreboardList');

    scoreboardList.innerHTML = sorted.map(p => `
    <div class="player-score ${p.id === network.playerId ? 'winner' : ''}">
      <span class="player-name">${p.username}</span>
      <span class="player-points">${p.score}</span>
    </div>
  `).join('');
}

// Afficher l'écran de fin
function showGameOver(leaderboard) {
    const gameOverDiv = document.getElementById('gameOver');
    const leaderboardDiv = document.getElementById('leaderboard');

    leaderboardDiv.innerHTML = leaderboard.map(item => `
    <div class="leaderboard-item ${item.rank === 1 ? 'winner' : ''}">
      <span class="rank">#${item.rank}</span>
      <span>${item.username}</span>
      <span>${item.score} pts</span>
    </div>
  `).join('');

    gameOverDiv.style.display = 'block';
    controls.unlock();
}

// Boucle d'animation
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Mise à jour du joueur
    if (player && isGameStarted) {
        player.update(delta, gameMap, otherPlayers);

        // Envoyer la position au serveur (60 fois par seconde max)
        if (controls.isLocked) {
            network.sendInput(player.getPosition(), player.getRotation());
        }

        // Vérifier les tirs et hits
        checkShooting();
    }

    // Rendu
    renderer.render(scene, camera);
}

// Vérifier les tirs contre les autres joueurs
let lastRaycaster = null;
function checkShooting() {
    // Cette fonction est appelée dans l'event de tir
    // Pour l'instant, on laisse le serveur gérer la validation
}

// Gestion du click pour le tir
document.addEventListener('click', () => {
    if (controls.isLocked && player && player.isAlive) {
        const raycaster = player.shoot();

        if (raycaster) {
            // Vérifier si on a touché un autre joueur
            const intersects = raycaster.intersectObjects(
                Array.from(otherPlayers.values())
            );

            if (intersects.length > 0) {
                const hit = intersects[0];
                const targetMesh = hit.object;

                // Trouver l'ID du joueur touché
                for (const [id, mesh] of otherPlayers) {
                    if (mesh === targetMesh) {
                        network.sendShoot(id, hit.point);
                        break;
                    }
                }
            }
        }
    }
});

// Redimensionnement de la fenêtre
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Démarrer le jeu au chargement de la page
window.addEventListener('load', init);

# 📋 Exemples et Cas d'Usage

## Scénarios de Test

### Test en Solo (Développement)
```bash
# Terminal 1 : Lancer le serveur
cd server && npm start

# Navigateur 1 : http://localhost:3000
# Pseudo : Player1

# Navigateur 2 : http://localhost:3000
# Pseudo : Player2
```

### Test en LAN (Multijoueur)
```bash
# Machine Serveur (ex: 192.168.1.10)
cd server && npm start

# Machine Joueur 1
# Navigateur : http://192.168.1.10:3000

# Machine Joueur 2
# Navigateur : http://192.168.1.10:3000
```

## Exemples de Maps

### Map Arena Simple (32x32)
```python
from PIL import Image

width, height = 32, 32
img = Image.new('RGB', (width, height), color=(255, 255, 255))
pixels = img.load()

# Murs extérieurs
for i in range(width):
    pixels[i, 0] = pixels[i, height-1] = (0, 0, 0)
for i in range(height):
    pixels[0, i] = pixels[width-1, i] = (0, 0, 0)

# Pilier central
for x in range(14, 18):
    for y in range(14, 18):
        pixels[x, y] = (0, 0, 0)

# Spawns aux 4 coins
spawns = [(5, 5), (26, 5), (5, 26), (26, 26)]
for x, y in spawns:
    pixels[x, y] = (255, 0, 255)

img.save('arena.bmp')
```

### Map Labyrinthe (64x64)
```python
from PIL import Image

width, height = 64, 64
img = Image.new('RGB', (width, height), color=(255, 255, 255))
pixels = img.load()

# Contours
for i in range(width):
    pixels[i, 0] = pixels[i, height-1] = (0, 0, 0)
for i in range(height):
    pixels[0, i] = pixels[width-1, i] = (0, 0, 0)

# Couloirs horizontaux
for y in [16, 32, 48]:
    for x in range(8, width-8):
        if x % 16 not in [0, 1]:  # Espaces pour passer
            pixels[x, y] = (0, 0, 0)

# Couloirs verticaux
for x in [16, 32, 48]:
    for y in range(8, height-8):
        if y % 16 not in [0, 1]:
            pixels[x, y] = (0, 0, 0)

# Spawns dispersés
spawns = [(10, 10), (54, 10), (32, 32), (10, 54), (54, 54)]
for x, y in spawns:
    pixels[x, y] = (255, 0, 255)

img.save('maze.bmp')
```

### Map Duel (Petite, 24x24)
```python
from PIL import Image

width, height = 24, 24
img = Image.new('RGB', (width, height), color=(255, 255, 255))
pixels = img.load()

# Murs extérieurs
for i in range(width):
    pixels[i, 0] = pixels[i, height-1] = (0, 0, 0)
for i in range(height):
    pixels[0, i] = pixels[width-1, i] = (0, 0, 0)

# Cover central
for x in range(10, 14):
    pixels[x, 12] = (0, 0, 0)

# 2 spawns face à face
pixels[5, 12] = (255, 0, 255)
pixels[18, 12] = (255, 0, 255)

img.save('duel.bmp')
```

## Messages WebSocket

### Client → Serveur

**Rejoindre** :
```json
{
  "type": "join",
  "data": {
    "username": "Player1"
  }
}
```

**Input** :
```json
{
  "type": "input",
  "data": {
    "position": { "x": 0, "y": 1.6, "z": 0 },
    "rotation": { "x": 0, "y": 1.57 }
  }
}
```

**Tir** :
```json
{
  "type": "shoot",
  "data": {
    "targetId": "abc123",
    "hitPosition": { "x": 5, "y": 1.5, "z": 10 }
  }
}
```

### Serveur → Client

**Confirmation connexion** :
```json
{
  "type": "joined",
  "data": {
    "playerId": "abc123",
    "player": {
      "id": "abc123",
      "username": "Player1",
      "position": { "x": 0, "y": 1, "z": 0 },
      "health": 100,
      "score": 0
    },
    "mapData": {
      "width": 64,
      "height": 64,
      "walls": [...]
    }
  }
}
```

**État du jeu** :
```json
{
  "type": "gameState",
  "data": {
    "players": [
      {
        "id": "abc123",
        "username": "Player1",
        "position": { "x": 0, "y": 1, "z": 0 },
        "rotation": { "x": 0, "y": 0 },
        "health": 100,
        "score": 5,
        "isAlive": true
      }
    ],
    "remainingTime": 267,
    "isGameOver": false
  }
}
```

**Résultat tir** :
```json
{
  "type": "shootResult",
  "data": {
    "type": "kill",
    "shooter": "abc123",
    "target": "def456",
    "newScore": 6
  }
}
```

**Fin de partie** :
```json
{
  "type": "gameOver",
  "data": {
    "leaderboard": [
      { "rank": 1, "username": "Player1", "score": 20 },
      { "rank": 2, "username": "Player2", "score": 15 }
    ]
  }
}
```

## Personnalisation

### Modifier les Paramètres de Jeu

Éditez [server/gameState.js](server/gameState.js) :

```javascript
const GAME_DURATION = 5 * 60 * 1000;  // Durée de partie (ms)
const MAX_SCORE = 20;                  // Score pour gagner
const RESPAWN_TIME = 3000;             // Temps de respawn (ms)
const PLAYER_HEALTH = 100;             // PV de départ
const WEAPON_DAMAGE = 25;              // Dégâts par tir
const MAX_PLAYERS = 8;                 // Joueurs maximum
```

### Modifier les Contrôles

Éditez [client/js/player.js](client/js/player.js) :

```javascript
// Vitesse de déplacement
this.speed = 10;

// Hauteur de saut
this.jumpVelocity = 8;

// Gravité
this.gravity = 20;

// Cooldown entre tirs (ms)
this.shootCooldown = 250;
```

### Changer le Port

Éditez [server/server.js](server/server.js) :

```javascript
const PORT = 3000;  // Changer ici
```

## Dépannage Avancé

### Activer les Logs de Debug

Ajoutez dans [server/server.js](server/server.js) :
```javascript
// Après les imports
const DEBUG = true;

// Dans la fonction broadcast
if (DEBUG) console.log('Broadcast:', message.type);

// Dans ws.on('message')
if (DEBUG) console.log('Reçu:', msg.type, msg.data);
```

### Tester la Map

Créez un script de test :
```javascript
// test-map.js
const MapLoader = require('./server/mapLoader');

async function test() {
  const loader = new MapLoader();
  await loader.loadMap('./maps/default.bmp');
  
  console.log('Dimensions:', loader.width, 'x', loader.height);
  console.log('Murs:', loader.walls.length);
  console.log('Spawns:', loader.spawnPoints.length);
}

test();
```

### Monitorer les Connexions

Ajoutez dans [server/server.js](server/server.js) :
```javascript
setInterval(() => {
  console.log('Joueurs connectés:', gameState.players.size);
  console.log('Clients WebSocket:', wss.clients.size);
}, 10000);
```

---

Pour plus d'informations, consultez le [README.md](README.md)

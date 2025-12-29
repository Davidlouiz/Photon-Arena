# 🎮 Photon Arena

**FPS multijoueur type laser game** - Jouez directement dans votre navigateur sans inscription !

Photon Arena est un jeu de tir à la première personne en temps réel pour 2 à 8 joueurs. Connectez-vous simplement via une IP locale, choisissez votre pseudo et entrez dans l'arène !

## ✨ Caractéristiques

- 🎯 **FPS multijoueur** en temps réel
- 🌐 **Navigateur uniquement** - Aucun téléchargement requis
- 🚀 **Sans inscription** - Pseudo et c'est parti
- 🗺️ **Maps personnalisables** via fichiers BMP
- ⚡ **Connexion directe** par IP locale
- 🎨 **Style néon low-poly** pour des performances optimales

## 🎮 Gameplay

### Contrôles
- **ZQSD** : Déplacements
- **Souris** : Viser
- **Clic gauche** : Tirer
- **Espace** : Saut

### Règles
- Chaque joueur a **100 PV**
- Chaque tir inflige **25 dégâts** (4 tirs = élimination)
- **+1 point** par élimination
- Respawn automatique après **3 secondes**

### Conditions de victoire
- Premier à atteindre **20 éliminations**
- Ou meilleur score après **5 minutes**

## 🚀 Installation et Lancement

### Prérequis
- **Node.js** (version 14 ou supérieure)
- Un navigateur moderne (Chrome, Firefox, Edge)
- Python 3 avec PIL/Pillow (pour créer des maps personnalisées)

### Installation

```bash
# Cloner ou télécharger le projet
cd "Photon Arena"

# Installer les dépendances du serveur
cd server
npm install
```

### Lancer le serveur

```bash
cd server
npm start
```

Le serveur démarre sur le port **3000**. Vous verrez un message avec les URLs de connexion :

```
╔═══════════════════════════════════════╗
║       PHOTON ARENA - SERVEUR          ║
╚═══════════════════════════════════════╝

Serveur démarré sur le port 3000

Pour rejoindre la partie, ouvrez dans votre navigateur:
- En local: http://localhost:3000
- Sur le réseau: http://[VOTRE_IP]:3000
```

### Rejoindre la partie

1. **Sur la même machine** : Ouvrez `http://localhost:3000`
2. **Sur le réseau local** : 
   - Trouvez l'IP du serveur : 
     - Windows : `ipconfig`
     - Linux/Mac : `ip addr` ou `ifconfig`
   - Ouvrez `http://[IP_SERVEUR]:3000` (ex: `http://192.168.1.10:3000`)
3. Entrez votre **pseudo**
4. Cliquez sur **REJOINDRE LA PARTIE**
5. Cliquez sur **COMMENCER** pour verrouiller la souris et jouer !

## 🗺️ Créer des Maps Personnalisées

Les maps sont des **images BMP** de 64x64 pixels (ou plus) avec un codage couleur spécifique :

### Codage couleur

| Couleur | Code Hex | Fonction |
|---------|----------|----------|
| ⬜ Blanc | `#FFFFFF` | Sol (zone traversable) |
| ⬛ Noir | `#000000` | Mur (collision) |
| 🟪 Fuchsia | `#FF00FF` | Point de respawn |

### Créer une map

1. **Avec un éditeur d'image** :
   - Créez une image 64x64 pixels (ou 128x128 pour plus de détails)
   - Utilisez les couleurs exactes ci-dessus
   - Placez au moins 4 points de spawn (pixels fuchsia)
   - Sauvegardez en format **BMP**

2. **Avec Python** :
```python
from PIL import Image

# Créer une map 64x64
width, height = 64, 64
img = Image.new('RGB', (width, height), color=(255, 255, 255))
pixels = img.load()

# Murs (bords)
for x in range(width):
    pixels[x, 0] = (0, 0, 0)
    pixels[x, height-1] = (0, 0, 0)
for y in range(height):
    pixels[0, y] = (0, 0, 0)
    pixels[width-1, y] = (0, 0, 0)

# Points de spawn
pixels[10, 10] = (255, 0, 255)
pixels[54, 10] = (255, 0, 255)
pixels[10, 54] = (255, 0, 255)
pixels[54, 54] = (255, 0, 255)

img.save('ma_map.bmp')
```

3. **Placez la map** :
   - Copiez votre fichier `.bmp` dans le dossier `/maps`
   - Renommez-le `default.bmp` (ou modifiez `server/server.js` ligne 16)
   - Redémarrez le serveur

## 📁 Structure du Projet

```
Photon Arena/
├── server/                 # Serveur Node.js
│   ├── server.js          # Point d'entrée WebSocket
│   ├── gameState.js       # Gestion de l'état du jeu
│   ├── mapLoader.js       # Chargement des maps BMP
│   └── package.json       # Dépendances
├── client/                # Client web
│   ├── index.html         # Page d'accueil (connexion)
│   ├── game.html          # Page de jeu
│   └── js/
│       ├── game.js        # Boucle principale
│       ├── player.js      # Contrôles FPS
│       ├── network.js     # WebSocket client
│       └── map.js         # Génération 3D de la map
├── maps/                  # Maps BMP
│   └── default.bmp        # Map par défaut
└── README.md
```

## 🔧 Architecture Technique

### Serveur (Node.js)
- **WebSocket** pour la communication temps réel
- **Serveur autoritaire** : validation des tirs, dégâts, positions
- **Tick rate** : 30 Hz
- Lecture de maps BMP avec **Jimp**

### Client (HTML/CSS/JS)
- **Three.js** pour le rendu 3D
- **PointerLockControls** pour la caméra FPS
- **WebSocket** pour la synchronisation
- Interpolation des positions des autres joueurs

### Réseau
- Client → Serveur : Inputs (mouvement, rotation, tir)
- Serveur → Client : État du jeu (positions, scores, santé)
- Validation côté serveur pour éviter la triche

## 🐛 Dépannage

### Le serveur ne démarre pas
- Vérifiez que Node.js est installé : `node --version`
- Vérifiez que le port 3000 n'est pas déjà utilisé
- Installez les dépendances : `npm install`

### Impossible de se connecter
- Vérifiez que le serveur est démarré
- Vérifiez l'URL (http://, pas https://)
- Vérifiez le pare-feu (autoriser le port 3000)
- Sur réseau local, utilisez l'IP locale (192.168.x.x)

### La map ne se charge pas
- Vérifiez que `default.bmp` existe dans `/maps`
- Vérifiez les couleurs (exactement #FFFFFF, #000000, #FF00FF)
- Vérifiez qu'il y a au moins 1 point de spawn (fuchsia)

### Lag ou saccades
- Limitez le nombre de murs dans la map
- Réduisez la taille de la map (64x64 recommandé)
- Fermez les autres applications

## 🎯 Roadmap / Améliorations Possibles

- [ ] Plusieurs types d'armes
- [ ] Power-ups sur la map
- [ ] Modes de jeu (Team Deathmatch, Capture the Flag)
- [ ] Système de parties multiples (rooms)
- [ ] Sons et effets sonores
- [ ] Minimap
- [ ] Statistiques de partie
- [ ] Support mobile (tactile)

## 📜 Licence

MIT - Utilisez, modifiez et distribuez librement !

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Créer des maps personnalisées
- Améliorer le code

---

**Bon jeu dans Photon Arena ! ⚡🎮**

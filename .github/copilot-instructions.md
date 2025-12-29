# Photon Arena - AI Coding Instructions

## Project Overview
Photon Arena est un FPS multijoueur type laser game jouable directement dans le navigateur, sans inscription, entre 2 et 8 joueurs. Mode FFA (free-for-all) avec connexion directe via IP locale.

**Tech Stack**: Node.js + WebSocket (serveur) | HTML/CSS/JS + Three.js (client)

## Architecture

### Project Structure
```
/server         # Serveur Node.js autoritaire
  server.js     # Point d'entrée WebSocket
  gameState.js  # État du jeu, joueurs, scores
  mapLoader.js  # Chargement map BMP
/client         # Client web
  index.html    # Page d'entrée
  game.html     # Page de jeu
  js/
    game.js     # Boucle principale
    player.js   # Contrôles FPS
    network.js  # WebSocket client
    map.js      # Rendu 3D de la map
/maps           # Images BMP des maps
  default.bmp   # Map par défaut 128x128
```

### Core Components
- **Serveur autoritaire**: Valide tous les tirs, dégâts, positions, scores. Le client envoie des inputs, jamais des résultats.
- **Map BMP**: Codage couleur pixel (blanc=sol, noir=mur, fuchsia=spawn). Lecture côté serveur, génération 3D côté client.
- **Synchronisation**: Client envoie inputs à fréquence fixe, serveur broadcast l'état, client interpole les autres joueurs.

## Development Workflow

### Setup
```bash
cd server && npm install
```

### Build & Run
```bash
# Lancer le serveur
cd server && npm start

# Le client se connecte via navigateur à http://IP:3000
# Exemple: http://192.168.1.10:3000
```

### Testing Strategy
- Tester avec minimum 2 navigateurs (ou 2 machines)
- Vérifier la synchronisation en déplaçant les joueurs
- Valider les tirs : le serveur doit confirmer les dégâts
- Tester le respawn et le timer de fin de partie

## Code Conventions

### Naming Patterns
- Fichiers serveur en camelCase: `gameState.js`, `mapLoader.js`
- Constantes en UPPER_CASE: `MAX_PLAYERS`, `RESPAWN_TIME`
- Classes en PascalCase: `Player`, `GameMap`

### Project-Specific Patterns
- **Serveur autoritaire strict**: Jamais de confiance client pour dégâts/score
- **Fréquence fixe**: Client envoie inputs à 60Hz, serveur tick à 30Hz
- **Map BMP**: Fichier statique lu au démarrage, pas de hot-reload
- **WebSocket**: Un message = un objet JSON typé avec `type` et `data`
- **Three.js**: PointerLockControls pour la caméra FPS

## Key Integration Points
- **WebSocket**: Communication bidirectionnelle client ↔ serveur
  - Client → Serveur: `{type: 'input', data: {move, rotate, shoot}}`
  - Serveur → Client: `{type: 'gameState', data: {players, scores, timer}}`
- **Map Loading**: Serveur lit BMP, envoie données au client pour génération 3D
- **Raycasting**: Three.js Raycaster côté client, validation serveur

## Important Notes
- **Pas de persistance**: Tout est en mémoire, le serveur reset à chaque redémarrage
- **Une seule partie par serveur**: Simplification MVP, pas de rooms multiples
- **IP locale uniquement**: Pas de serveur distant, connexion directe LAN
- **Performance**: Viser 60fps, limiter le nombre de geometries Three.js
- **BMP strict**: Respecter le codage couleur (blanc/noir/fuchsia), sinon bugs de collision
- **CORS**: Le serveur doit servir les fichiers statiques client

---
*Ce projet suit un développement MVP itératif : fonctionnel d'abord, optimisation ensuite.*

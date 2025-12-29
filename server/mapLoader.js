// Chargement et lecture d'une map BMP

const Jimp = require('jimp');
const path = require('path');

const COLORS = {
    FLOOR: 0xFFFFFFFF,   // Blanc (sol)
    WALL: 0x000000FF,    // Noir (mur)
    SPAWN: 0xFF00FFFF    // Fuchsia (spawn)
};

class MapLoader {
    constructor() {
        this.mapData = null;
        this.width = 0;
        this.height = 0;
        this.walls = [];
        this.spawnPoints = [];
    }

    // Charger une map BMP
    async loadMap(mapPath) {
        try {
            const image = await Jimp.read(mapPath);
            this.width = image.bitmap.width;
            this.height = image.bitmap.height;

            this.mapData = [];
            this.walls = [];
            this.spawnPoints = [];

            // Lire pixel par pixel
            for (let y = 0; y < this.height; y++) {
                const row = [];
                for (let x = 0; x < this.width; x++) {
                    const color = image.getPixelColor(x, y);

                    let cellType = 'floor';

                    // Déterminer le type de cellule
                    if (this.colorsMatch(color, COLORS.WALL)) {
                        cellType = 'wall';
                        // Ajouter aux murs (coordonnées 3D)
                        this.walls.push({ x, z: y });
                    } else if (this.colorsMatch(color, COLORS.SPAWN)) {
                        cellType = 'spawn';
                        // Ajouter aux points de spawn (coordonnées 3D)
                        this.spawnPoints.push({
                            x: x - this.width / 2,
                            y: 1,
                            z: y - this.height / 2
                        });
                    }

                    row.push(cellType);
                }
                this.mapData.push(row);
            }

            console.log(`Map chargée: ${this.width}x${this.height} pixels`);
            console.log(`Murs: ${this.walls.length}, Points de spawn: ${this.spawnPoints.length}`);

            return true;
        } catch (error) {
            console.error('Erreur lors du chargement de la map:', error);
            return false;
        }
    }

    // Comparer deux couleurs (tolérance pour variations BMP)
    colorsMatch(color1, color2) {
        const tolerance = 10;
        const r1 = (color1 >> 24) & 0xFF;
        const g1 = (color1 >> 16) & 0xFF;
        const b1 = (color1 >> 8) & 0xFF;

        const r2 = (color2 >> 24) & 0xFF;
        const g2 = (color2 >> 16) & 0xFF;
        const b2 = (color2 >> 8) & 0xFF;

        return Math.abs(r1 - r2) <= tolerance &&
            Math.abs(g1 - g2) <= tolerance &&
            Math.abs(b1 - b2) <= tolerance;
    }

    // Vérifier si une position est valide (pas de collision)
    isValidPosition(x, z) {
        // Convertir coordonnées 3D en coordonnées de grille
        const gridX = Math.floor(x + this.width / 2);
        const gridZ = Math.floor(z + this.height / 2);

        if (gridX < 0 || gridX >= this.width || gridZ < 0 || gridZ >= this.height) {
            return false;
        }

        return this.mapData[gridZ][gridX] !== 'wall';
    }

    // Obtenir les données de map pour le client
    getMapData() {
        return {
            width: this.width,
            height: this.height,
            walls: this.walls
        };
    }

    getSpawnPoints() {
        return this.spawnPoints;
    }
}

module.exports = MapLoader;

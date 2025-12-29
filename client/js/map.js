// Génération et rendu de la map 3D

class GameMap {
    constructor(scene) {
        this.scene = scene;
        this.mapData = null;
        this.walls = [];
        this.floor = null;
    }

    // Générer la map à partir des données du serveur
    generate(mapData) {
        this.mapData = mapData;
        this.clear();

        // Créer le sol
        this.createFloor();

        // Créer les murs
        this.createWalls();

        // Créer la skybox
        this.createSkybox();

        console.log('Map générée:', this.walls.length, 'murs');
    }

    // Créer le sol
    createFloor() {
        const geometry = new THREE.PlaneGeometry(
            this.mapData.width,
            this.mapData.height
        );

        const material = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.8,
            metalness: 0.2
        });

        this.floor = new THREE.Mesh(geometry, material);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;

        this.scene.add(this.floor);
    }

    // Créer les murs
    createWalls() {
        const wallHeight = 3;
        const wallGeometry = new THREE.BoxGeometry(1, wallHeight, 1);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.2,
            roughness: 0.5,
            metalness: 0.7
        });

        // Créer un mur pour chaque position
        this.mapData.walls.forEach(wall => {
            const mesh = new THREE.Mesh(wallGeometry, wallMaterial);

            // Convertir coordonnées de grille en coordonnées 3D
            mesh.position.x = wall.x - this.mapData.width / 2;
            mesh.position.y = wallHeight / 2;
            mesh.position.z = wall.z - this.mapData.height / 2;

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            this.walls.push(mesh);
            this.scene.add(mesh);
        });
    }

    // Créer une skybox simple
    createSkybox() {
        const skyGeometry = new THREE.BoxGeometry(500, 500, 500);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x0a0a0a,
            side: THREE.BackSide
        });

        const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(skybox);

        // Ajouter des "étoiles" (particules)
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 1000;
        const positions = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 400;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.5,
            transparent: true,
            opacity: 0.8
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        this.scene.add(particles);
    }

    // Nettoyer la map
    clear() {
        this.walls.forEach(wall => {
            this.scene.remove(wall);
            wall.geometry.dispose();
            wall.material.dispose();
        });
        this.walls = [];

        if (this.floor) {
            this.scene.remove(this.floor);
            this.floor.geometry.dispose();
            this.floor.material.dispose();
            this.floor = null;
        }
    }

    // Vérifier les collisions avec les murs
    checkCollision(position, radius = 0.5) {
        const playerBox = new THREE.Box3(
            new THREE.Vector3(position.x - radius, position.y - 1, position.z - radius),
            new THREE.Vector3(position.x + radius, position.y + 1, position.z + radius)
        );

        for (const wall of this.walls) {
            const wallBox = new THREE.Box3().setFromObject(wall);
            if (playerBox.intersectsBox(wallBox)) {
                return true;
            }
        }

        return false;
    }
}

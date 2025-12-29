// Gestion du joueur local (contrôles FPS, caméra, déplacements)

class Player {
    constructor(camera, scene, controls) {
        this.camera = camera;
        this.scene = scene;
        this.controls = controls;

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        this.jumping = false;

        this.health = 100;
        this.score = 0;
        this.isAlive = true;

        // Paramètres de mouvement
        this.speed = 10;
        this.jumpVelocity = 8;
        this.gravity = 20;

        // Modèle du joueur (capsule simple)
        this.mesh = null;
        this.createMesh();

        // Arme
        this.weapon = null;
        this.createWeapon();

        // Cooldown de tir
        this.lastShootTime = 0;
        this.shootCooldown = 250; // ms entre chaque tir

        this.setupControls();
    }

    createMesh() {
        // Capsule représentant le joueur (invisible pour le joueur local)
        const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.visible = false; // Le joueur ne se voit pas lui-même
    }

    createWeapon() {
        // Arme laser simple (ligne)
        const weaponGroup = new THREE.Group();

        // Corps de l'arme
        const bodyGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(0.3, -0.2, -0.5);
        weaponGroup.add(body);

        this.weapon = weaponGroup;
        this.camera.add(this.weapon);
    }

    setupControls() {
        // Gestion du clavier
        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'KeyW':
                case 'KeyZ': // AZERTY
                    this.moveForward = true;
                    break;
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'KeyA':
                case 'KeyQ': // AZERTY
                    this.moveLeft = true;
                    break;
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    if (this.canJump) {
                        this.velocity.y = this.jumpVelocity;
                        this.canJump = false;
                        this.jumping = true;
                    }
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW':
                case 'KeyZ':
                    this.moveForward = false;
                    break;
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'KeyA':
                case 'KeyQ':
                    this.moveLeft = false;
                    break;
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        });

        // Gestion de la souris (tir)
        document.addEventListener('click', () => {
            if (this.controls.isLocked && this.isAlive) {
                this.shoot();
            }
        });
    }

    update(delta, gameMap, otherPlayers) {
        if (!this.controls.isLocked || !this.isAlive) return;

        // Gravité
        this.velocity.y -= this.gravity * delta;

        // Direction de déplacement
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        // Déplacement
        const moveSpeed = this.speed * delta;

        // Avant/Arrière
        if (this.direction.z !== 0) {
            this.controls.moveForward(this.direction.z * moveSpeed);
        }

        // Gauche/Droite
        if (this.direction.x !== 0) {
            this.controls.moveRight(this.direction.x * moveSpeed);
        }

        // Position actuelle de la caméra
        const position = this.camera.position.clone();
        position.y += this.velocity.y * delta;

        // Vérifier les collisions
        if (gameMap && !gameMap.checkCollision(position)) {
            this.camera.position.y = position.y;
        } else {
            this.velocity.y = 0;
        }

        // Sol
        if (this.camera.position.y <= 1.6) {
            this.camera.position.y = 1.6;
            this.velocity.y = 0;
            this.canJump = true;
            this.jumping = false;
        }

        // Mettre à jour la position du mesh
        this.mesh.position.copy(this.camera.position);
        this.mesh.position.y -= 0.8; // Ajuster pour centrer la capsule
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShootTime < this.shootCooldown) {
            return;
        }
        this.lastShootTime = now;

        // Raycasting pour détecter les hits
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

        // Effet visuel du tir laser
        this.createLaserEffect(raycaster);

        // Retourner les données du raycaster pour la détection de hit
        return raycaster;
    }

    createLaserEffect(raycaster) {
        // Créer une ligne représentant le laser
        const points = [];
        points.push(this.camera.position.clone());

        // Point d'impact ou point à 100 unités
        const endPoint = this.camera.position.clone();
        endPoint.add(raycaster.ray.direction.multiplyScalar(100));
        points.push(endPoint);

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            linewidth: 2,
            transparent: true,
            opacity: 1
        });

        const laser = new THREE.Line(geometry, material);
        this.scene.add(laser);

        // Animer et supprimer le laser
        let opacity = 1;
        const fadeOut = setInterval(() => {
            opacity -= 0.1;
            material.opacity = opacity;

            if (opacity <= 0) {
                clearInterval(fadeOut);
                this.scene.remove(laser);
                geometry.dispose();
                material.dispose();
            }
        }, 20);
    }

    getPosition() {
        return this.camera.position.clone();
    }

    getRotation() {
        return {
            x: this.camera.rotation.x,
            y: this.camera.rotation.y
        };
    }

    setHealth(health) {
        this.health = health;
        document.getElementById('healthValue').textContent = health;
    }

    setScore(score) {
        this.score = score;
        document.getElementById('scoreValue').textContent = score;
    }

    setAlive(alive) {
        this.isAlive = alive;
    }
}

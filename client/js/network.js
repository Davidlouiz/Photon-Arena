// Gestion de la connexion WebSocket

class Network {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.playerId = null;
        this.callbacks = {};
    }

    // Connexion au serveur
    connect() {
        return new Promise((resolve, reject) => {
            // Déterminer l'URL du WebSocket
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            const wsUrl = `${protocol}//${host}`;

            console.log('Connexion au serveur:', wsUrl);

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('Connecté au serveur');
                this.connected = true;
                resolve();
            };

            this.ws.onerror = (error) => {
                console.error('Erreur WebSocket:', error);
                reject(error);
            };

            this.ws.onclose = () => {
                console.log('Déconnecté du serveur');
                this.connected = false;
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Erreur traitement message:', error);
                }
            };
        });
    }

    // Traiter les messages reçus
    handleMessage(message) {
        const { type, data } = message;

        // Appeler le callback correspondant s'il existe
        if (this.callbacks[type]) {
            this.callbacks[type](data);
        }
    }

    // Enregistrer un callback pour un type de message
    on(type, callback) {
        this.callbacks[type] = callback;
    }

    // Envoyer un message au serveur
    send(type, data) {
        if (this.ws && this.connected) {
            this.ws.send(JSON.stringify({ type, data }));
        }
    }

    // Rejoindre la partie
    join(username) {
        this.send('join', { username });
    }

    // Envoyer les inputs du joueur
    sendInput(position, rotation) {
        this.send('input', { position, rotation });
    }

    // Envoyer un tir
    sendShoot(targetId, hitPosition) {
        this.send('shoot', { targetId, hitPosition });
    }
}

// Instance globale
const network = new Network();

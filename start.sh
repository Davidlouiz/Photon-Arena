#!/bin/bash

# Script de lancement rapide pour Photon Arena

echo "╔═══════════════════════════════════════╗"
echo "║    PHOTON ARENA - LANCEMENT RAPIDE    ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé !"
    echo "Installez Node.js depuis https://nodejs.org"
    exit 1
fi

echo "✅ Node.js détecté : $(node --version)"
echo ""

# Vérifier que les dépendances sont installées
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installation des dépendances..."
    cd server && npm install
    cd ..
    echo ""
fi

# Obtenir l'IP locale
echo "🌐 Adresses réseau disponibles :"
if command -v ip &> /dev/null; then
    ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print "   - http://"$2}' | sed 's/\/.*/:3000/'
elif command -v ifconfig &> /dev/null; then
    ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print "   - http://"$2":3000"}'
fi
echo "   - http://localhost:3000 (local uniquement)"
echo ""

# Lancer le serveur
echo "🚀 Démarrage du serveur..."
echo ""
cd server && npm start

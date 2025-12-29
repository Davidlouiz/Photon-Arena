@echo off
REM Script de lancement rapide pour Photon Arena (Windows)

echo ╔═══════════════════════════════════════╗
echo ║    PHOTON ARENA - LANCEMENT RAPIDE    ║
echo ╚═══════════════════════════════════════╝
echo.

REM Vérifier que Node.js est installé
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js n'est pas installé !
    echo Installez Node.js depuis https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js détecté
node --version
echo.

REM Vérifier que les dépendances sont installées
if not exist "server\node_modules" (
    echo 📦 Installation des dépendances...
    cd server
    call npm install
    cd ..
    echo.
)

REM Afficher les informations de connexion
echo 🌐 Pour rejoindre la partie :
echo    - En local : http://localhost:3000
echo    - Sur le réseau : http://[VOTRE_IP]:3000
echo.
echo Pour trouver votre IP : tapez 'ipconfig' dans un autre terminal
echo.

REM Lancer le serveur
echo 🚀 Démarrage du serveur...
echo.
cd server
call npm start

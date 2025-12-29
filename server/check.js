// Test de vérification des imports et dépendances

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification du projet Photon Arena...\n');

const checks = [
    {
        name: 'Dépendances Node.js',
        test: () => {
            try {
                require('ws');
                require('jimp');
                require('express');
                return true;
            } catch (e) {
                return false;
            }
        }
    },
    {
        name: 'Fichiers serveur',
        test: () => {
            return fs.existsSync('server.js') &&
                fs.existsSync('gameState.js') &&
                fs.existsSync('mapLoader.js');
        }
    },
    {
        name: 'Fichiers client',
        test: () => {
            return fs.existsSync('../client/index.html') &&
                fs.existsSync('../client/game.html') &&
                fs.existsSync('../client/js/game.js');
        }
    },
    {
        name: 'Map par défaut',
        test: () => {
            return fs.existsSync('../maps/default.bmp');
        }
    }
];

let allPassed = true;

checks.forEach(check => {
    const passed = check.test();
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
    if (!passed) allPassed = false;
});

console.log('\n' + (allPassed ?
    '🎉 Tout est prêt ! Lancez le serveur avec : npm start' :
    '⚠️  Certaines vérifications ont échoué. Vérifiez les erreurs ci-dessus.'
));

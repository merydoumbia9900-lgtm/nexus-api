const express = require('express');
const app = express();
const PORT = 3000;

// --- CONFIGURATION ---
const secretKey = "MERRY-SECRET-PASS"; // Ta clé de sécurité
app.use(express.json());

// --- SIMULATION BASE DE DONNÉES (BLACKLIST) ---
// Ici, on simule une liste de numéros d'arnaqueurs connus
const blacklist = [
    "+22300000000", // Faux numéro arnaqueur Mali
    "+33600000000"  // Faux numéro arnaqueur France
];

// --- MIDDLEWARE DE SÉCURITÉ (Le Vigile) ---
app.use((req, res, next) => {
    if (req.path === '/') return next(); // Accueil public
    const userKey = req.headers['x-api-key'];
    if (userKey === secretKey) {
        next();
    } else {
        res.status(403).json({ error: "Accès refusé. Clé API manquante." });
    }
});

// --- ROUTE D'ACCUEIL ---
app.get('/', (req, res) => {
    res.json({ status: "En ligne", version: "2.0 (Finance + Sécurité)", creator: "Merry Doumbia" });
});

// --- LE CERVEAU (MOTEUR D'ANALYSE) ---
app.post('/verifier-numero', (req, res) => {
    const { telephone } = req.body;

    if (!telephone) return res.status(400).json({ erreur: "Numéro manquant." });

    // 1. NETTOYAGE
    // On enlève espaces, tirets, points
    let cleanNum = telephone.replace(/[\s\-\.]/g, '');

    // Structure de réponse par défaut
    let analyse = {
        numero_clean: cleanNum,
        valide: false,
        pays: "Inconnu",
        operateur: "Inconnu",
        mobile_money: {
            disponible: false,
            service: "Non détecté"
        },
        securite: {
            score_risque: 0, // 0 = Sûr, 100 = Dangereux
            statut: "SÛR",
            message: "Rien à signaler"
        }
    };

    // 2. DÉTECTION PAYS & OPÉRATEUR
    // MALI (+223)
    if (/^(\+223|00223|223)?([5-9][0-9]{7})$/.test(cleanNum)) {
        analyse.valide = true;
        analyse.pays = "Mali 🇲🇱";
        
        // Logique Opérateur & Mobile Money Mali
        if (cleanNum.includes("2237") || cleanNum.includes("2239")) {
            analyse.operateur = "Orange Mali";
            analyse.mobile_money = { disponible: true, service: "Orange Money" };
        } else if (cleanNum.includes("2236")) {
            analyse.operateur = "Malitel / Moov";
            analyse.mobile_money = { disponible: true, service: "Moov Money" };
        } else {
            analyse.operateur = "Telecel / Autre";
            analyse.mobile_money = { disponible: true, service: "Inconnu" };
        }
    }
    // FRANCE (+33)
    else if (/^(\+33|0033|33)?([6-7][0-9]{8})$/.test(cleanNum)) {
        analyse.valide = true;
        analyse.pays = "France 🇫🇷";
        analyse.operateur = "Mobile FR (Orange/SFR/Bouygues/Free)";
        analyse.mobile_money = { disponible: true, service: "Paylib / Apple Pay" };
    }

    // 3. DÉTECTION DE SÉCURITÉ (BLACKLIST)
    // Si le numéro est dans notre liste noire
    if (blacklist.includes(cleanNum)) {
        analyse.securite.score_risque = 100;
        analyse.securite.statut = "DANGER 🔴";
        analyse.securite.message = "Numéro signalé comme FRAUDEUR dans la base Nexus.";
    }

    res.json(analyse);
});

// LANCEMENT
app.listen(PORT, () => {
    console.log(`🚀 Nexus V2 tourne sur le port ${PORT}`);
});

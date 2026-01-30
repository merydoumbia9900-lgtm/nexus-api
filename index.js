const express = require('express');
const app = express();
const PORT = 3000;

// --- LE VIGILE (Sécurité API Key) ---
const secretKey = "MERRY-SECRET-PASS"; // Ceci sera ta clé "maître" pour l'instant

// Ce code s'active à CHAQUE demande pour vérifier la clé
app.use((req, res, next) => {
    // On laisse passer la page d'accueil (le message de bienvenue)
    if (req.path === '/') return next();

    const userKey = req.headers['x-api-key']; // Le client doit envoyer sa clé ici

    if (userKey === secretKey) {
        next(); // La clé est bonne, on laisse entrer
    } else {
        res.status(403).json({ error: "Accès refusé. Clé API manquante ou invalide." });
    }
});
// -------------------------------------

// Ceci permet à ton API de comprendre les données qu'on lui envoie
app.use(express.json());

// La route d'accueil (pour tester que ça marche)
app.get('/', (req, res) => {
    res.json({
        status: "success",
        message: "Bienvenue sur l'API Nexus. Le système est opérationnel.",
        creator: "Merry Doumbia"
    });
});

// --- LE COEUR DU BUSINESS (API DE VERIFICATION) ---

app.post('/verifier-numero', (req, res) => {
    const { telephone } = req.body; // On récupère le numéro envoyé

    if (!telephone) {
        return res.status(400).json({ erreur: "Merci de fournir un numéro de téléphone." });
    }

    // Nettoyage : on enlève les espaces et les tirets pour avoir un truc propre
    let numeroPropre = telephone.replace(/\s+/g, '').replace(/-/g, '');

    let resultat = {
        numero_envoye: telephone,
        valide: false,
        pays: "Inconnu",
        operateur: "Inconnu",
        message: "Numéro non reconnu ou format invalide."
    };

    // LOGIQUE MALI (+223) - 8 chiffres après le 223
    if (/^(\+223|00223|223)?([5-9][0-9]{7})$/.test(numeroPropre)) {
        resultat.valide = true;
        resultat.pays = "Mali 🇲🇱";
        resultat.message = "Numéro malien valide détecté.";

        // Détection opérateur (Exemple simplifié)
        if (numeroPropre.includes("2236") || numeroPropre.includes("2237")) {
            resultat.operateur = "Orange Mali / Malitel (Probable)";
        } else {
             resultat.operateur = "Autre / Moov";
        }
    }

    // LOGIQUE FRANCE (+33) - 9 chiffres après le +33
    else if (/^(\+33|0033|33)?([1-9][0-9]{8})$/.test(numeroPropre)) {
        resultat.valide = true;
        resultat.pays = "France 🇫🇷";
        resultat.message = "Numéro français valide détecté.";
        resultat.operateur = "Opérateur FR (Free/Orange/SFR/Bouygues)";
    }

    // On renvoie la réponse au client (l'entreprise qui paie)
    res.json(resultat);
});

// --------------------------------------------------

// Lancement du serveur
app.listen(PORT, () => {
    console.log(`🚀 Le serveur Nexus tourne sur http://localhost:${PORT}`);
});

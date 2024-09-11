const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// Le clé
const jwtSecretKey = "AZERTY";

// Initialiser l'application back
const app = express();

// Autoriser envoie JSON
app.use(express.json());
// Désactiver le CORS 
app.use(cors());


// MOCK
// Simulation de données en mémoire
let DB_Articles = [
    { id: '1', title: 'Premier article', desc: 'Contenu du premier article', author: 'Isaac', imgPath: 'https://dogtime.com/wp-content/uploads/sites/12/2011/01/GettyImages-653001154-e1691965000531.jpg' },
    { id: '2', title: 'Deuxième article', desc: 'Contenu du deuxième article', author: 'Sanchez', imgPath: 'https://dogtime.com/wp-content/uploads/sites/12/2011/01/GettyImages-653001154-e1691965000531.jpg' },
    { id: '3', title: 'Troisième article', desc: 'Contenu du troisième article', author: 'Toto', imgPath: 'https://dogtime.com/wp-content/uploads/sites/12/2011/01/GettyImages-653001154-e1691965000531.jpg' }
];

let DB_USERS = [
    { email: 'isaac@gmail.com', password: 'password', pseudo: 'Isaac', cityCode: '44300', city: 'Nantes', phone: '0650660000' },
    { email: 'tata@gmail.com', password: '123456', pseudo: 'Tata', cityCode: '44300', city: 'TataLand', phone: '0650660000' },
    { email: 'toto@gmail.com', password: '12345', pseudo: 'Toto', cityCode: '44300', city: 'NutellaCrevette', phone: '0650660000' },
];

// SWAGGER
// Init swagger middleware
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./swagger_output.json');

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));


function generetePassword(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    let password = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      password += chars[randomIndex];
    }
  
    return password;
  }

// Déclarer un route GET qui retourne une réponse json
// Route pour se connecter
app.post("/login", async (request, response) => {

    const userRequest = request.body;

    const foundUser = DB_USERS.find(user => user.email === userRequest.email && user.password === userRequest.password);

    // Erreur : 1
    if (!foundUser) {
        return response.json({ code: "768", message: "Couple email/mot de passe incorrect", data: null });
    }

    // générer un token
    const token = await jwt.sign({ email: "toto@gmail.com" }, jwtSecretKey, { expiresIn: '10s' });

    return response.json({ code: "200", message: "Vous êtes connecté(e)", data: token });
});

app.post("/signup", async (request, response) => {

    const userRequest = request.body;

    const foundUser = DB_USERS.find(user => user.email === userRequest.email);

    // Erreur : Can't create user with same email
    if (foundUser) {
        return response.json({ code: "712", message: "L'email n'est plus valide", data: null });
    }

    // Erreur : Password confirmation
    if (userRequest.password != userRequest.passwordConfirm) {
        return response.json({ code: "712", message: "Le mot de passe de confirmation n'est pas identique", data: null });
    }

    // Erreur : Les champs inexistant
    const fields = ['email', 'password', 'pseudo', 'cityCode', 'city', 'phone']
    const fieldSuccess = fields.every(field => userRequest.hasOwnProperty(field));
    if (!fieldSuccess) {
        return response.json({ code: "713", message: "Il manque un ou des champs", data: null });
    }

    // Add user
    // -- keep only valid fields
    let newUser = {};
    fields.forEach(field => {
        if (field in userRequest) {
            newUser[field] = userRequest[field];
        }
    });
   // -- insert
    DB_USERS.push(newUser);

    return response.json({ code: "200", message: "Inscription effectuée avec succès", data: newUser });
});

app.post("/reset-password", async (request, response) => {

    const userRequest = request.body;

    let foundUser = DB_USERS.find(user => user.email === userRequest.email);

    const newPassword = generetePassword(8);

    // Reset password
    if (foundUser) {
        foundUser.password = newPassword
    }

    return response.json({ code: "200", message: "Mot de passe réinitialisé avec succès", data: newPassword });
});

// ================================================================== //
// GESTION ARTICLES
// ================================================================== //
/**
 * Route GET : Pour récupèrer tout les articles
 */
app.get("/articles", async (request, response) => {
    // Récupèrer une liste/tableau d'article
    const articles = DB_Articles;

    // Retourner les articles dans la réponse JSON
    return response.json({ code: "200", message: `La liste des articles a été récupérée avec succès !`, data: articles });
});

/**
 * Route GET : Pour récupèrer un article
 */
app.get("/article/:id", async (request, response) => {
    // Récupérer l'id de l'url
    const idParam = request.params.id;

    // Rechercher un article par son id
    const foundArticle = DB_Articles.find(article => article.id === idParam);

    if (!foundArticle) {
        return response.json({ code: "721", message: `L'article n'existe pas`, data: null });
    }

    return response.json({ code: "200", message: `L'article a été modifié avec succès`, data: foundArticle });

});

/**
 * Route POST : Pour ajouter un article
 */
app.post("/save-article", async (request, response) => {
    // Récupérer l'article qui est envoyé en JSON
    const articleJSON = request.body;

    let foundArticle = null;

    // Est-ce on a un id envoyer dans le json
    if (articleJSON.id != undefined || articleJSON.id) {
        // essayer de trouver un article existant
        foundArticle = DB_Articles.find(article => article.id === articleJSON.id);
    }

    // Si je trouve je modifie les nouvelles valeurs
    if (foundArticle) {
        foundArticle.title = articleJSON.title;
        foundArticle.desc = articleJSON.desc;
        foundArticle.author = articleJSON.author;

        return response.json({ code: "200", message: `L'article a été modifié avec succès`, data: articleJSON });
    }

    // Sinon par défaut je créer

    // -- generer l'id
    articleJSON.id = uuidv4();

    DB_Articles.push(articleJSON);

    return response.json({ code: "200", message: `Article crée avec succès !`, data: articleJSON });
});


/**
 * Route POST : Pour ajouter supprimer un article
 */
app.delete('/article/:id', (request, response) => {

    // Il faut l'id en entier
    const id = parseInt(request.params.id);

    // trouver l'index
    const foundArticleIndex = DB_Articles.findIndex(article => article.id === id);

    // si article trouve erreur
    if (foundArticleIndex < 0) {
        return response.json({ code: "721", message: `Impossible de supprimer un article inexistant`, data: null });
    }

    // supprimer grace à l'index
    DB_Articles.slice(foundArticleIndex, 1);

    return response.json({ code: "200", message: `Supprimera un article id ${id}`, data: null });
});


// Démarrer le serveur avec le port 3000
app.listen(3000, () => {
    console.log("Le serveur a démarré");
});
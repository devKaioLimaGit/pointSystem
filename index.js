const express = require("express");
const bodyParser = require("body-parser");
const session = require('express-session');
const adminAuth = require("./middlewares/adminAuth.js");
const Relationship = require("./model/relationship");
const UserController = require("./model/users/userscontroller");
const adminController = require("./model/admin/adiminController.js");
const raizController = require("./model/raiz/raizController.js");
const app = express();
const port = 8080;

app.use(express.static("public"));

app.use(session({
    secret: "K_*&$lpUTR@!çPÇ0524.nup",
    cookie: { maxAge:1800000}
}));

// Configuração ejs:
app.set("view engine", "ejs");

// Configuração body-parser:
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Rotas
app.use("/admin", adminController);
app.use("/user", UserController);
app.use("/", raizController);

// Rota padrão para capturar todas as outras rotas não definidas
app.use((req, res, next) => {
    res.redirect("/")
});

app.listen(port, (err) => err ? console.log("O servidor está com problema!") : console.log("O servidor está rodando corretamente!"));

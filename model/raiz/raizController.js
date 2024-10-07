const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { Op } = require("sequelize");
const bcryptjs = require("bcryptjs");
const Users = require("../users/Users");


router.get("/reset/password", async (req, res) => {
    res.render("users/resetPassword");
});

router.post('/reset-password', async (req, res) => {
    let { identifier } = req.body;

    // Função para formatar o CPF
    identifier = formatCPF(identifier);

    try {
        // Busque o usuário pelo CPF, e-mail ou login
        let user = await Users.findOne({
            where: {
                [Op.or]: [
                    { cpf: identifier },
                    { email: identifier }
                ]
            }
        });

        if (!user) {
            // Se o usuário não for encontrado pelo CPF ou e-mail, tentar encontrar pelo nome
            const cpfOrEmailOrLogin = identifier.toLowerCase().replace('@gmail.com','');
            const nameParts = cpfOrEmailOrLogin.split('.');
            const firstName = nameParts.shift().toUpperCase();
            const lastName = nameParts.pop().toUpperCase();

            user = await Users.findOne({ where: { name: firstName, surname: { [Op.like]: '%' + lastName + '%' } } });

            if (!user) {
                return res.render('users/resetPassword', { message: 'Usuário não encontrado' });
            }
        }

        // Gerar token de redefinição de senha
        const token = crypto.randomBytes(20).toString('hex');
        const resetPasswordUrl = `http://${req.headers.host}/user/reset-password/${token}`;

        // Atualizar usuário com token de redefinição e data de expiração
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hora de validade
        await user.save();

        // Enviar e-mail com o link de redefinição
        const smtp = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "pontosecad@gmail.com",
                pass: "olbb rpqm tygo pvni"
            }
        });

        const configEmail = {
            from: "pontosecad@gmail.com",
            to: user.email,
            subject: 'Redefinição de Senha',
            text: `Você está recebendo isso porque você (ou outra pessoa) solicitou a redefinição da senha da sua conta.\n\n` +
                  `Por favor, clique no seguinte link, ou cole no seu navegador para completar o processo:\n\n` +
                  `${resetPasswordUrl}\n\n` +
                  `Se você não solicitou isso, por favor ignore este email e sua senha permanecerá inalterada.\n`
        };

        await smtp.sendMail(configEmail);
        smtp.close();

        res.render('users/resetPassword', { message: 'Email de redefinição de senha enviado com sucesso' });

    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).render('error', { message: 'Erro interno ao buscar usuário' });
    }
});

// Função para formatar CPF
function formatCPF(cpf) {
    cpf = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
    cpf = cpf.padStart(11, '0'); // Garante que o CPF tenha 11 dígitos, preenchendo com zeros à esquerda se necessário
    cpf = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'); // Formata o CPF
    return cpf;
}



  
router.get('/user/reset-password/:token', async (req, res) => {
    const { token } = req.params;

    // Verificar se o token é válido e não expirou
    const user = await Users.findOne({
        where: {
            resetPasswordToken: token,
            resetPasswordExpires: {
                [Op.gt]: Date.now()
            }
        }
    });

    if (!user) {
        return res.render('users/reset', { message: 'Token de redefinição de senha é inválido ou expirou' });
    }

    // Renderizar a página de redefinição de senha
    res.render('users/reset', { token, message: null });
});

router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const user = await Users.findOne({
        where: {
            resetPasswordToken: token,
            resetPasswordExpires: {
                [Op.gt]: Date.now()
            }
        }
    });

    if (!user) {
        return res.render('users/reset', { message: 'Token de redefinição de senha é inválido ou expirou' });
    }

    const hash = bcryptjs.hashSync(password, 10);
    user.password = hash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.render('users/reset', { message: 'Senha redefinida com sucesso', token: null });
});

router.get("/login", async (req, res) => {
    res.render("users/login")
});

router.get('/logout', (req, res) => {
    // Destruir a sessão (limpar dados de sessão no servidor)
    req.session.destroy(err => {
        if (err) {
            console.log(err);
        } else {
            // Limpar cookie de sessão no lado do cliente
            res.clearCookie('connect.sid', { path: '/' }); // 'connect.sid' é o nome padrão do cookie de sessão
            res.redirect('/login');
        }
    });
});

router.get("/", async(req,res)=>{
    res.render("index.ejs")
});


module.exports = router;

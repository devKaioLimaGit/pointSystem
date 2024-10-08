const express = require("express");
const router = express.Router();
const Users = require("./Users");
const bcryptjs = require("bcryptjs");
const Hours = require("../hours/Hours.js");
const { Op, where } = require("sequelize");
const adminAuth = require("../../middlewares/adminAuth.js");
const multer = require("multer");
const path = require("path");
const { format } = require("date-fns"); // Adicione a biblioteca date-fns para formatação de data
const { id } = require("date-fns/locale");
const fs = require("fs"); // Corrige o erro de 'fs' não definido

// Configuração de armazenamento para multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../public/uploads"));
  },
  filename: function (req, file, cb) {
    // Mantém o nome original, mas é aconselhável usar um timestamp para evitar conflitos
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, uniqueSuffix); // Altera para `uniqueSuffix` para evitar conflitos
  },
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Apenas imagens são permitidas!"), false);
  }
};

// Configuração do upload com multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

// Rota para atualizar o usuário
router.post("/update", upload.single("image"), async (req, res) => {
  const id = req.body.id; // Obtém o ID do usuário a partir do corpo da requisição

  try {
    // Busca o usuário no banco de dados pelo ID
    const user = await Users.findByPk(id);
    if (!user) {
      return res.status(404).send("Usuário não encontrado.");
    }

    // Verifica se um arquivo de imagem foi enviado
    if (req.file) {
      const oldImageName = user.image; // Obtém o nome da imagem antiga do banco de dados
      const oldImagePath = path.join(
        __dirname,
        "../../public/uploads",
        user.image
      );

      // Verifica se há uma imagem antiga para ser deletada
      if (oldImageName) {
        try {
          await fs.promises.unlink(oldImagePath); // Deleta a imagem antiga
          console.log("Imagem antiga deletada com sucesso.");
        } catch (err) {
          console.error("Erro ao deletar a imagem antiga:", err);
        }
      }

      // Define o nome da nova imagem como original
      const newImageName = req.file.filename; // Mantém o nome original da imagem

      // Atualiza o campo de imagem no banco de dados
      user.image = newImageName; // Atualiza com o novo nome
      await user.save(); // Salva as alterações no banco de dados
      console.log("Nome da nova imagem atualizado no banco de dados.");

      // Salva a nova imagem no diretório
      const newImagePath = path.join(
        __dirname,
        "../../public/uploads",
        newImageName
      );
    }
    res.redirect(`/user/${user.name.toLowerCase()}`);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).send("Erro ao atualizar usuário.");
  }
});

router.get(
  "/:fullname/justify/denied/:id",
  adminAuth.authenticateLogin,
  adminAuth.authenticateLowUser,
  async (req, res) => {
    const { id } = req.params;
    const hour = await Hours.findByPk(id);
    res.render("users/justifyDenied.ejs", {
      justifydenied: hour.justifydenied,
    });
  }
);

router.post("/save/justify", async (req, res) => {
  // Corrigido o caminho da rota para corresponder ao formulário
  try {
    const { justify, id } = req.body;
    const [updated] = await Hours.update(
      { justify: justify },
      { where: { id: id } }
    );

    if (updated) {
      res.redirect(`/user/${req.session.user.name.toLowerCase()}`);
    } else {
      res.send("Não enviado");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error updating justification");
  }
});

router.post(
  "/:fullname/filter",
  adminAuth.authenticateLogin,
  async (req, res) => {
    const { date } = req.body;
    const userId = req.session.user.id;
    const user = await Users.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).send("Usuário não encontrado.");
    }
    if (!date) {
      return res.status(400).render("users/filtro.ejs", {
        errorMessage: "Por favor, selecione uma data para filtrar.",
        filteredHours: [],
        user: req.session.user,
        image: user.image,
      });
    }

    try {
      const formattedDate = new Date(date);

      const startOfDay = new Date(formattedDate.setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(formattedDate.setUTCHours(23, 59, 59, 999));

      console.log("Início do dia:", startOfDay);
      console.log("Fim do dia:", endOfDay);

      const filteredHours = await Hours.findAll({
        include: [
          {
            model: Users,
            required: true,
            where: { id: userId },
          },
        ],
        where: {
          createdAt: {
            [Op.gte]: startOfDay,
            [Op.lte]: endOfDay,
          },
        },
        order: [["createdAt", "DESC"]],
      });

      const formattedHours = filteredHours.map((hour) => {
        return {
          ...hour.toJSON(),
          createdAtFormatted: format(new Date(hour.createdAt), "dd/MM/yyyy"),
        };
      });

      res.render("users/filtro.ejs", {
        filteredHours: formattedHours,
        user: req.session.user,
        errorMessage:
          formattedHours.length === 0 ? "Nenhum dado encontrado." : null,
        image: user.image,
      });
    } catch (error) {
      console.error("Erro ao buscar os dados:", error);
      res.status(500).send("Erro ao buscar os dados");
    }
  }
);

router.post("/hours/request", async (req, res) => {
  try {
    const { hourId } = req.body;
    const hour = await Hours.findByPk(hourId);
    if (hour) {
      hour.request = true;
      await hour.save();
      return res
        .status(200)
        .json({ success: true, message: "Request updated successfully" });
    }
    return res.status(404).json({ success: false, message: "Hour not found" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

router.post("/save/time", adminAuth.authenticateLogin, async (req, res) => {
  const { entradaTime, saidaTime, userId, idAtual } = req.body;

  console.log(entradaTime, saidaTime);

  try {
    if (entradaTime !== undefined) {
      await Hours.create({
        prohibited: entradaTime,
        exit: "",
        request: 0,
        denied: 0,
        justify: "",
        justifydenied: "",
        userId: userId,
      });
      console.log("Entrada salva com sucesso.");
    }

    if (saidaTime !== undefined) {
      const updated = await Hours.update(
        { exit: saidaTime },
        { where: { id: idAtual } }
      );
      if (updated[0] === 0) {
        throw new Error(
          "Registro de horas não encontrado para atualização de saída."
        );
      }
      console.log("Saída atualizada com sucesso.");
    }

    res.redirect("/logout");
  } catch (error) {
    console.error("Erro ao salvar horários: ", error);
    res.status(500).send("Erro ao salvar horários.");
  }
});

router.get(
  "/:name",
  adminAuth.authenticateLogin,
  adminAuth.authenticateLowUser,
  async (req, res) => {
    const userName = req.params.name;
    const user = await Users.findOne({ where: { name: userName } });

    if (user) {
      const hours = await Hours.findAll({
        include: [{ model: Users }],
        where: { UserId: user.id },
        order: [["createdAt", "DESC"]],
        limit: 6,
      });

      // Converte o valor de createdAt para o formato adequado
      const formattedHours = hours.map((hour) => {
        const formattedDate = new Date(hour.createdAt).toLocaleDateString(
          "pt-BR"
        );
        return {
          ...hour.dataValues,
          formattedDate: formattedDate,
        };
      });

      res.render("users/index.ejs", { hours: formattedHours, user: user });
    } else {
      res.render("error.ejs", { message: "Usuário não encontrado" });
    }
  }
);

router.post("/login/authenticate", async (req, res) => {
  let { cpfOrEmailOrLogin, password } = req.body;
  let user;

  // Verifica se o input é um email
  if (cpfOrEmailOrLogin.includes("@")) {
    user = await Users.findOne({ where: { email: cpfOrEmailOrLogin } });
  }
  // Verifica se o input é um CPF formatado ou não formatado
  else if (
    cpfOrEmailOrLogin.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/) ||
    cpfOrEmailOrLogin.match(/^\d{11}$/)
  ) {
    let cpf = cpfOrEmailOrLogin.replace(/\D/g, ""); // Remove todos os não dígitos
    if (cpf.length === 11) {
      cpf = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"); // Formatação CPF
    }
    user = await Users.findOne({ where: { cpf: cpf } });
  }
  // Verifica se o input é pelo nome
  else if (cpfOrEmailOrLogin.includes(".")) {
    const nameParts = cpfOrEmailOrLogin.split(".");
    const firstName = nameParts.shift().toUpperCase();
    const lastName = nameParts.pop().toUpperCase();

    user = await Users.findOne({
      where: { name: firstName, surname: { [Op.like]: "%" + lastName + "%" } },
    });
  }
  // Caso não se encaixe em nenhum padrão reconhecido
  else {
    res.render("users/login", {
      error: "Formato inválido para CPF, email ou nome.",
    });
    return;
  }

  // Verifica se o usuário foi encontrado e está ativo
  if (user && user.isActive) {
    const comparison = bcryptjs.compareSync(password, user.password);

    if (comparison) {
      req.session.user = {
        id: user.id,
        name: user.name,
        surname: user.surname,
        institution: user.institution,
        course: user.course,
        period: user.period,
        shift: user.shift,
        prohibited: user.prohibited,
        exit: user.exit,
        cpf: user.cpf,
        email: user.email,
        roles: user.roles,
      };

      const redirect = {
        admin: "/admin/main",
        lowuser: `/user/${user.name.toLowerCase()}`, // Pass the username in the URL after login (in lowercase)
      };
      const route = redirect[req.session.user.roles];
      route
        ? res.redirect(route)
        : res.status(403).send("Função de usuário inválida");
    } else {
      res.render("users/login", { error: "Senha incorreta." });
    }
  } else {
    res.render("users/login", { error: "Usuário não encontrado ou inativo." });
  }
});

module.exports = router;

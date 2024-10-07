const express = require("express");
const router = express.Router();
const Users = require("../users/Users");
const bcryptjs = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const adminAuth = require("../../middlewares/adminAuth");
const multer = require("multer");
const Hours = require("../hours/Hours");
const { id } = require("date-fns/locale");
const { where } = require("sequelize");
const moment = require("moment");

router.get(
  "/request",
  adminAuth.authenticateLogin,
  adminAuth.authenticateADM,
  async (req, res) => {
    try {
      // Buscar todas as entradas de horas com o usuário associado
      const hours = await Hours.findAll({
        include: {
          model: Users,
        },
      });

      // Filtrar as entradas que possuem requests
      const requests = hours.filter((hour) => hour.request !== false);

      // Enviar a resposta após coletar todos os dados necessários
      res.render("admin/request", { requests: requests });
    } catch (error) {
      console.error("Erro ao buscar os pedidos:", error);
      res.status(500).send("Erro no servidor");
    }
  }
);

router.get(
  "/deny/:id",
  adminAuth.authenticateLogin,
  adminAuth.authenticateADM,
  async (req, res) => {
    const { id } = req.params;
    const hour = await Hours.findByPk(id);
    res.render("admin/deny", { hour: hour });
  }
);

router.post("/deny/adjustment", async (req, res) => {
  const { id, justify } = req.body;
  const negacao = await Hours.update(
    { request: false, denied: true, justifydenied: justify },
    { where: { id: id } }
  );
  res.redirect("/admin/schedules");
});

router.get(
  "/adjustment/:id",
  adminAuth.authenticateLogin,
  adminAuth.authenticateADM,
  async (req, res) => {
    const { id } = req.params;
    const hours = await Hours.findByPk(id);
    res.render("admin/adjustment", { hours: hours });
  }
);

router.post("/update/hour", async (req, res) => {
  const { id, prohibited, exit } = req.body;

  // Atualiza os dados no banco de dados
  const update = await Hours.update(
    { prohibited: prohibited, exit: exit, request: false, denied: false },
    { where: { id: id } }
  );

  res.redirect("/admin/schedules");
});

router.get(
  "/justify/:id",
  adminAuth.authenticateLogin,
  adminAuth.authenticateADM,
  async (req, res) => {
    const { id } = req.params;
    try {
      const hour = await Hours.findByPk(id);
      if (hour) {
        res.render("admin/justify.ejs", { hour: hour });
      } else {
        res.status(404).send("Hour not found");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.get(
  "/schedules",
  adminAuth.authenticateLogin,
  adminAuth.authenticateADM,
  async (req, res) => {
    try {
      const users = await Users.findAll();
      res.render("admin/schedules", { users });
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).send("Erro ao buscar usuários.");
    }
  }
);

router.post("/schedules/filter", async (req, res) => {
  const { userName } = req.body;

  try {
    const users = await Users.findAll(); // Busca todos os usuários
    const user = await Users.findOne({
      where: { name: userName },
      include: [{ model: Hours }],
    });

    if (user) {
      res.render("admin/schedulesFiltered.ejs", {
        users,
        selectedUser: user,
        hours: user.hours || [],
      });
    } else {
      res.status(404).send("Usuário não encontrado.");
    }
  } catch (error) {
    console.error("Erro ao buscar horários do usuário:", error);
    res.status(500).send("Erro ao buscar horários do usuário.");
  }
});

router.get(
  "/horario/:id",
  adminAuth.authenticateLogin,
  adminAuth.authenticateADM,
  async (req, res) => {
    const id = req.params.id;
    const hours = await Hours.findByPk(id);
    res.render("admin/ajuste", { hours: hours });
  }
);

router.post("/update/hour", async (req, res) => {
  const { id, entrada, saida } = req.body;

  try {
    // Encontra a instância do horário pelo ID
    const hour = await Hours.findByPk(id);
    if (!hour) {
      return res.status(404).send("Horário não encontrado.");
    }

    // Atualiza os campos da instância encontrada
    await hour.update({ prohibited: entrada, exit: saida });

    // Redireciona para a página de horários após a atualização
    res.redirect("/admin/schedules");
  } catch (error) {
    console.error("Erro ao atualizar horário:", error);
    res.status(500).send("Erro ao atualizar horário.");
  }
});

// Função para obter o próximo número disponível para o nome do arquivo
function getNextAvailableNumber(directory) {
  const files = fs.readdirSync(directory);
  let maxNumber = 0;
  files.forEach((file) => {
    const match = file.match(/^image-(\d+)\.\w+$/);
    if (match) {
      const number = parseInt(match[1]);
      if (number > maxNumber) {
        maxNumber = number;
      }
    }
  });
  return maxNumber + 1;
}

// Configuração do armazenamento com Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/imgUsers"); // Diretório onde os arquivos serão armazenados
  },
  filename: function (req, file, cb) {
    const ext = ".jpg"; // Definindo a extensão como .jpg
    const number = getNextAvailableNumber("public/imgUsers"); // Obtém o próximo número disponível
    cb(null, "image-" + number + ext); // Nome do arquivo com base no próximo número disponível e extensão .jpg
  },
});

// Inicializa o upload com Multer
const upload = multer({ storage: storage });

router.post("/save/new", upload.single("image"), async (req, res) => {
  let {
    name,
    surname,
    cpf,
    email,
    password,
    roles,
    institution,
    course,
    period,
    shift,
    prohibited,
    exit,
  } = req.body;
  const image = req.file ? req.file.filename : null; // Obtém o nome do arquivo de imagem

  name = name.toUpperCase();
  surname = surname.toUpperCase();
  email = email.toLowerCase();

  // Formatação da data de entrada e saída para dia/mês/ano
  prohibited = moment(prohibited, "YYYY-MM-DD").format("DD/MM/YYYY");
  exit = moment(exit, "YYYY-MM-DD").format("DD/MM/YYYY");

  // Regex para formatar o CPF com pontos e traço
  cpf = cpf.replace(/\D/g, ""); // Remove caracteres não numéricos do CPF
  cpf = cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4"); // Formatação com pontos e traço

  try {
    const existingUser = await Users.findOne({ where: { email: email } });
    const existingCpf = await Users.findOne({ where: { cpf: cpf } });

    if (!existingUser && !existingCpf) {
      const salt = bcryptjs.genSaltSync(10);
      const hash = bcryptjs.hashSync(password, salt);

      await Users.create({
        name: name,
        surname: surname,
        image: image,
        cpf: cpf,
        email: email,
        institution: institution,
        course: course,
        period: period,
        shift: shift,
        prohibited: prohibited,
        exit: exit,
        password: hash,
        roles: roles,
      });

      res.redirect("/admin/main");
    } else {
      res.redirect("/admin/create/new");
    }
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).send("Erro interno do servidor");
  }
});

router.get(
  "/create/new",
  async (req, res) => {
    res.render("admin/new.ejs");
  }
);

router.get(
  "/delete/:id",
  adminAuth.authenticateLogin,
  adminAuth.authenticateADM,
  async (req, res) => {
    const userId = req.params.id;

    try {
      if (userId !== req.session.user.id) {
        // Deleta registros da tabela Hours relacionados ao usuário
        await Hours.destroy({
          where: {
            userId: userId,
          },
        });

        // Deleta o usuário
        await Users.destroy({
          where: {
            id: userId,
          },
        });

        res.redirect("/admin/main");
      } else {
        // Reverte a transação caso o usuário tente se excluir
        res.status(403).send("Você não pode excluir a si mesmo!");
      }
    } catch (error) {
      // Reverte a transação em caso de erro
      await transaction.rollback();
      console.error("Erro ao excluir usuário:", error);
      res.status(500).send("Erro ao excluir usuário");
    }
  }
);

router.get(
  "/deactivate/:id",
  adminAuth.authenticateLogin,
  adminAuth.authenticateADM,
  async (req, res) => {
    const userId = req.params.id;

    try {
      if (userId !== req.session.user.id) {
        await Users.update(
          { isActive: false },
          {
            where: {
              id: userId,
            },
          }
        );
        res.redirect("/admin/main");
      } else {
        res.status(403).send("Você não pode desativar a si mesmo!");
      }
    } catch (error) {
      console.error("Erro ao desativar usuário:", error);
      res.status(500).send("Erro ao desativar usuário");
    }
  }
);

router.get(
  "/toggle/:id",
  adminAuth.authenticateLogin,
  adminAuth.authenticateADM,
  async (req, res) => {
    const userId = req.params.id;

    try {
      if (userId !== req.session.user.id) {
        const user = await Users.findOne({ where: { id: userId } });
        const newStatus = !user.isActive;
        await Users.update(
          { isActive: newStatus },
          {
            where: {
              id: userId,
            },
          }
        );
        res.redirect("/admin/main");
      } else {
        res.status(403).send("Você não pode alterar seu próprio estado!");
      }
    } catch (error) {
      console.error("Erro ao alterar o estado do usuário:", error);
      res.status(500).send("Erro ao alterar o estado do usuário");
    }
  }
);

const formatDateToISO = (dateString) => {
  const [day, month, year] = dateString.split("/");
  return `${year}-${month}-${day}`;
};

const formatDateToNormal = (dateString) => {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

router.post("/update/:id", async (req, res) => {
  const userId = req.params.id;
  const user = await Users.findByPk(userId);

  // Convertendo as datas para o formato ISO (YYYY-MM-DD)
  user.prohibited = formatDateToISO(user.prohibited);
  user.exit = formatDateToISO(user.exit);

  res.render("admin/edit", { user: user });
});

router.post("/update", async (req, res) => {
  let {
    id,
    name,
    surname,
    cpf,
    email,
    password,
    roles,
    institution,
    course,
    period,
    shift,
    prohibited,
    exit,
  } = req.body;
  name = name.toUpperCase();
  surname = surname.toUpperCase();

  // Convertendo as datas para o formato normal (DD/MM/YYYY)
  prohibited = formatDateToNormal(prohibited);
  exit = formatDateToNormal(exit);

  // Regex para formatar o CPF com pontos e traço
  cpf = cpf.replace(/\D/g, ""); // Remove caracteres não numéricos do CPF
  cpf = cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4"); // Formatação com pontos e traço

  try {
    if (id) {
      const hash = password ? bcryptjs.hashSync(password, 10) : undefined;

      await Users.update(
        {
          name: name,
          surname: surname,
          institution: institution,
          course: course,
          period: period,
          shift: shift,
          prohibited: prohibited,
          cpf: cpf,
          exit: exit,
          email: email,
          password: hash,
          roles: roles,
        },
        {
          where: {
            id: id,
          },
        }
      );

      res.redirect("/admin/main");
    } else {
      res.status(403).send("Você não pode atualizar a si mesmo!");
    }
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).send("Erro ao atualizar usuário");
  }
});

router.get("/main", async (req, res) => {
  // TIREI O MIDDLEWARES DE AUTENTICAÇÃO "adminAuth.authenticateLogin,adminAuth.authenticateADM," :)
  try {
    const users = await Users.findAll();
    res.render("admin/index", { users: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;

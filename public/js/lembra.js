document
  .getElementById("togglePassword")
  .addEventListener("click", function () {
    const passwordInput = document.getElementById("password");
    const eyeIcon = this;

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      eyeIcon.classList.remove("fa-eye");
      eyeIcon.classList.add("fa-eye-slash");
    } else {
      passwordInput.type = "password";
      eyeIcon.classList.remove("fa-eye-slash");
      eyeIcon.classList.add("fa-eye");
    }
  });

const rememberMeCheckbox = document.getElementById("rememberMe");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password"); // Certifique-se de que há um input com o id "password"
let saveData = []; // Inicializa o array para armazenar os dados

document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("@rememberuser");
  if (user) {
    const user = JSON.parse(localStorage.getItem("@rememberuser"));
    usernameInput.value = user[0];
    passwordInput.value = user[1];
    rememberMeCheckbox.checked = true;
  } else {
    rememberMeCheckbox.checked = false;
  }
});

rememberMeCheckbox.addEventListener("change", function () {
  if (rememberMeCheckbox.checked) {
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (username === "" || password === "") {
      return;
    }

    // Salva o username e password no array
    saveData = [username, password];

    // Armazena no localStorage
    localStorage.setItem("@rememberuser", JSON.stringify(saveData));
  } else {
    // Remove apenas a chave específica do localStorage
    localStorage.removeItem("@rememberuser");
  }
});

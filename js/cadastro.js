// ================= SELEÇÃO DE ELEMENTOS =================
const btn = document.querySelector(".btn-Entrar");

const inputEmail = document.querySelector(".input-E-mail");
const inputSenha = document.querySelector(".input-senha");
const inputConfirmar = document.querySelector(".input-confirmar");

const erroEmail = document.querySelector(".erro-email");
const erroSenha = document.querySelector(".erro-senha");
const erroConfirmar = document.querySelector(".erro-confirmar");
const forcaSenha = document.querySelector(".forca-senha");

const checkbox = document.querySelector("#checkbox");
const erroTermos = document.querySelector(".erro-termos");

// ⚠️ PROTEÇÃO (caso não exista no HTML)
const termosContainer = document.querySelector(".termos-container");

// REGEX email
const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


// ================= CLICK BOTÃO =================
btn.addEventListener("click", function (event) {
    event.preventDefault();

    let valido = true;

    limparErros();

    // ================= EMAIL =================
    if (inputEmail.value.trim() === "") {
        erroEmail.textContent = "E-mail é obrigatório";
        inputEmail.style.borderColor = "#ef4444";
        valido = false;
    } else if (!regexEmail.test(inputEmail.value)) {
        erroEmail.textContent = "E-mail inválido";
        inputEmail.style.borderColor = "#ef4444";
        valido = false;
    }

    // ================= SENHA =================
    if (inputSenha.value.trim() === "") {
        erroSenha.textContent = "Senha é obrigatória";
        inputSenha.style.borderColor = "#ef4444";
        valido = false;
    } else if (inputSenha.value.length < 6) {
        erroSenha.textContent = "Mínimo de 6 caracteres";
        inputSenha.style.borderColor = "#ef4444";
        valido = false;
    }

    // ================= CONFIRMAR SENHA =================
    if (inputConfirmar.value.trim() === "") {
        erroConfirmar.textContent = "Confirme sua senha";
        inputConfirmar.style.borderColor = "#ef4444";
        valido = false;
    } else if (inputConfirmar.value !== inputSenha.value) {
        erroConfirmar.textContent = "As senhas não coincidem";
        inputConfirmar.style.borderColor = "#ef4444";
        valido = false;
    }

    // ================= TERMOS =================
    if (!checkbox.checked) {
        erroTermos.textContent = "Você precisa aceitar os termos de serviço";

        if (termosContainer) {
            termosContainer.classList.add("erro");
        }

        valido = false;
    }

    // ================= REDIRECIONAMENTO =================
    if (valido) {
        window.location.href = "login.html";
    }
});


// ================= FORÇA DA SENHA =================
inputSenha.addEventListener("input", function () {
    const senha = inputSenha.value;

    let forca = 0;

    if (senha.length >= 6) forca++;
    if (/[A-Z]/.test(senha)) forca++;
    if (/[0-9]/.test(senha)) forca++;
    if (/[^A-Za-z0-9]/.test(senha)) forca++;

    if (senha === "") {
        forcaSenha.textContent = "";
        inputSenha.style.borderColor = "#2d4464";
        return;
    }

    if (forca <= 1) {
        forcaSenha.textContent = "Senha fraca";
        forcaSenha.style.color = "#ef4444";
        inputSenha.style.borderColor = "#ef4444";
    } 
    else if (forca <= 3) {
        forcaSenha.textContent = "Senha média";
        forcaSenha.style.color = "#facc15";
        inputSenha.style.borderColor = "#facc15";
    } 
    else {
        forcaSenha.textContent = "Senha forte";
        forcaSenha.style.color = "#22c55e";
        inputSenha.style.borderColor = "#22c55e";
    }
});


// ================= CONFIRMAR SENHA (TEMPO REAL) =================
inputConfirmar.addEventListener("input", function () {
    if (inputConfirmar.value === "") {
        erroConfirmar.textContent = "";
        inputConfirmar.style.borderColor = "#2d4464";
        return;
    }

    if (inputConfirmar.value !== inputSenha.value) {
        erroConfirmar.textContent = "As senhas não coincidem";
        inputConfirmar.style.borderColor = "#ef4444";
    } else {
        erroConfirmar.textContent = "";
        inputConfirmar.style.borderColor = "#22c55e";
    }
});


// ================= TERMOS (REMOVE ERRO AUTOMÁTICO) =================
checkbox.addEventListener("change", function () {
    if (checkbox.checked) {
        erroTermos.textContent = "";

        if (termosContainer) {
            termosContainer.classList.remove("erro");
        }
    }
});


// ================= LIMPAR ERROS =================
function limparErros() {
    erroEmail.textContent = "";
    erroSenha.textContent = "";
    erroConfirmar.textContent = "";
    erroTermos.textContent = "";

    inputEmail.style.borderColor = "#2d4464";
    inputSenha.style.borderColor = "#2d4464";
    inputConfirmar.style.borderColor = "#2d4464";

    if (termosContainer) {
        termosContainer.classList.remove("erro");
    }
}


// ================= CLICK NO TEXTO DOS TERMOS =================
if (termosContainer) {
    termosContainer.addEventListener("click", () => {
        checkbox.checked = !checkbox.checked;

        if (checkbox.checked) {
            erroTermos.textContent = "";
            termosContainer.classList.remove("erro");
        }
    });
}
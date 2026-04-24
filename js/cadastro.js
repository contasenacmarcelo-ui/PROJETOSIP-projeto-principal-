// ================= SELEÇÃO DE ELEMENTOS =================
const btn = document.querySelector(".btn-Entrar");

const inputNome = document.querySelector(".Nome");
const inputEmail = document.querySelector(".input-E-mail");
const inputTelefone = document.querySelector(".input-telefone");
const inputSenha = document.querySelector(".input-senha");
const inputConfirmar = document.querySelector(".input-confirmar");

const erroEmail = document.querySelector(".erro-email");
const erroTelefone = document.querySelector(".erro-telefone");
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

    // ================= TELEFONE =================
    const telefoneLimpo = inputTelefone ? inputTelefone.value.replace(/\D/g, '') : '';
    if (inputTelefone && telefoneLimpo.length < 10) {
        erroTelefone.textContent = "Telefone inválido (mín. 10 dígitos)";
        inputTelefone.style.borderColor = "#ef4444";
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
        // salvar usuário no localStorage
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');

            const emailLower = inputEmail.value.trim().toLowerCase();
            // checar se já existe
            if (users.some(u => u.email === emailLower)) {
                erroEmail.textContent = 'E-mail já cadastrado';
                inputEmail.style.borderColor = '#ef4444';
                return;
            }

            const novo = {
                name: inputNome ? inputNome.value.trim() : '',
                email: emailLower,
                telefone: inputTelefone ? inputTelefone.value.trim() : '',
                // NÃO é seguro para produção: apenas obfuscação básica
                password: btoa(inputSenha.value)
            };

            users.push(novo);
            localStorage.setItem('users', JSON.stringify(users));

            // redirecionar para login
            window.location.href = 'login.html';
        } catch (e) {
            console.error('Erro ao salvar usuário:', e);
            window.location.href = 'login.html';
        }
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
    if (erroTelefone) erroTelefone.textContent = "";
    erroSenha.textContent = "";
    erroConfirmar.textContent = "";
    erroTermos.textContent = "";

    inputEmail.style.borderColor = "#2d4464";
    if (inputTelefone) inputTelefone.style.borderColor = "#2d4464";
    inputSenha.style.borderColor = "#2d4464";
    inputConfirmar.style.borderColor = "#2d4464";

    if (termosContainer) {
        termosContainer.classList.remove("erro");
    }
}


// O label nativo do HTML já cuida de marcar/desmarcar o checkbox
// ao clicar no texto. O listener de 'change' acima remove o erro.

const toggleSenha = document.querySelector("#toggleSenha");
const campoSenha = document.querySelector(".input-senha");

toggleSenha.addEventListener("click", () => {
    if (campoSenha.type === "password") {
        campoSenha.type = "text";
        toggleSenha.classList.remove("bi-eye");
        toggleSenha.classList.add("bi-eye-slash");
    } else {
        campoSenha.type = "password";
        toggleSenha.classList.remove("bi-eye-slash");
        toggleSenha.classList.add("bi-eye");
    }
});

// ================= MOSTRAR / OCULTAR CONFIRMAR SENHA =================
const toggleConfirmar = document.querySelector("#toggleConfirmar");
const campoConfirmar = document.querySelector(".input-confirmar");

if (toggleConfirmar && campoConfirmar) {
    toggleConfirmar.addEventListener("click", () => {
        if (campoConfirmar.type === "password") {
            campoConfirmar.type = "text";
            toggleConfirmar.classList.remove("bi-eye");
            toggleConfirmar.classList.add("bi-eye-slash");
        } else {
            campoConfirmar.type = "password";
            toggleConfirmar.classList.remove("bi-eye-slash");
            toggleConfirmar.classList.add("bi-eye");
        }
    });
}

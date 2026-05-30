// ================= SELEÇÃO DE ELEMENTOS =================
console.log("Inicializando cadastro...");

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
const termosContainer = document.querySelector(".termos-container");

function safeText(el, value) {
    if (!el) return;
    el.textContent = value ?? '';
}

function safeBorder(el, value) {
    if (!el) return;
    el.style.borderColor = value;
}

function limparErros() {
    safeText(erroEmail, "");
    safeText(erroTelefone, "");
    safeText(erroSenha, "");
    safeText(erroConfirmar, "");
    safeText(erroTermos, "");

    safeBorder(inputEmail, "#2d4464");
    safeBorder(inputTelefone, "#2d4464");
    safeBorder(inputSenha, "#2d4464");
    safeBorder(inputConfirmar, "#2d4464");

    if (termosContainer) {
        termosContainer.classList.remove("erro");
    }
}

// Se algum elemento crítico não existir, não executa para evitar quebrar outras telas.
if (!btn || !inputEmail || !inputSenha || !inputConfirmar || !checkbox || !erroEmail || !erroSenha || !erroConfirmar) {
    console.warn("cadastro.js: elementos críticos não encontrados; script interrompido.");
} else {
    // REGEX email
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // ================= CLICK BOTÃO =================
    btn.addEventListener("click", function (event) {
        event.preventDefault();

        let valido = true;
        limparErros();

        // ================= EMAIL =================
        if (!inputEmail.value || inputEmail.value.trim() === "") {
            safeText(erroEmail, "E-mail é obrigatório");
            safeBorder(inputEmail, "#ef4444");
            valido = false;
        } else if (!regexEmail.test(inputEmail.value)) {
            safeText(erroEmail, "E-mail inválido");
            safeBorder(inputEmail, "#ef4444");
            valido = false;
        }

        // ================= TELEFONE =================
        if (inputTelefone) {
            const telefoneLimpo = (inputTelefone.value || '').replace(/\D/g, '');
            if (telefoneLimpo.length > 0 && telefoneLimpo.length < 10) {
                safeText(erroTelefone, "Telefone inválido (mín. 10 dígitos)");
                safeBorder(inputTelefone, "#ef4444");
                valido = false;
            }
        }

        // ================= SENHA =================
        if (!inputSenha.value || inputSenha.value.trim() === "") {
            safeText(erroSenha, "Senha é obrigatória");
            safeBorder(inputSenha, "#ef4444");
            valido = false;
        } else if (inputSenha.value.length < 6) {
            safeText(erroSenha, "Mínimo de 6 caracteres");
            safeBorder(inputSenha, "#ef4444");
            valido = false;
        }

        // ================= CONFIRMAR SENHA =================
        if (!inputConfirmar.value || inputConfirmar.value.trim() === "") {
            safeText(erroConfirmar, "Confirme sua senha");
            safeBorder(inputConfirmar, "#ef4444");
            valido = false;
        } else if (inputConfirmar.value !== inputSenha.value) {
            safeText(erroConfirmar, "As senhas não coincidem");
            safeBorder(inputConfirmar, "#ef4444");
            valido = false;
        }

        // ================= TERMOS =================
        if (!checkbox.checked) {
            safeText(erroTermos, "Você precisa aceitar os termos de serviço");
            if (termosContainer) termosContainer.classList.add("erro");
            valido = false;
        }

        // ================= REDIRECIONAMENTO =================
        if (!valido) return;

        const novo = {
            nome: inputNome ? (inputNome.value || '').trim() : '',
            email: inputEmail.value.trim().toLowerCase(),
            telefone: inputTelefone ? (inputTelefone.value || '').trim() : '',
            senha: inputSenha.value
        };

        fetch(`${window.location.origin}/api/auth/cadastro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novo)
        })
            .then(async (response) => {
                if (!response.ok) {
                    let errPayload = null;
                    try { errPayload = await response.json(); } catch { /* ignore */ }
                    return Promise.reject(errPayload || { error: `HTTP ${response.status}` });
                }
                return response.json();
            })
            .then((data) => {
                if (data && data.access_token) {
                    localStorage.setItem('access_token', data.access_token);
                }
                localStorage.setItem('loggedInUser', JSON.stringify(data.user || novo));
                window.location.href = '/public/pages/login.html';
            })
            .catch((error) => {
                console.error('Erro ao cadastrar:', error);
                const errMsg = error?.error || error?.message || '';
                if (typeof errMsg === 'string' && errMsg.includes('já cadastrado')) {
                    safeText(erroEmail, 'E-mail já cadastrado');
                    safeBorder(inputEmail, '#ef4444');
                    return;
                }
                alert('Erro ao cadastrar. Tente novamente.');
            });
    });

    // ================= FORÇA DA SENHA =================
    inputSenha.addEventListener("input", function () {
        const senha = inputSenha.value || '';

        let forca = 0;
        if (senha.length >= 6) forca++;
        if (/[A-Z]/.test(senha)) forca++;
        if (/[0-9]/.test(senha)) forca++;
        if (/[^A-Za-z0-9]/.test(senha)) forca++;

        if (senha === "") {
            if (forcaSenha) forcaSenha.textContent = "";
            safeBorder(inputSenha, "#2d4464");
            return;
        }

        if (forca <= 1) {
            safeText(forcaSenha, "Senha fraca");
            if (forcaSenha) forcaSenha.style.color = "#ef4444";
            safeBorder(inputSenha, "#ef4444");
        } else if (forca <= 3) {
            safeText(forcaSenha, "Senha média");
            if (forcaSenha) forcaSenha.style.color = "#facc15";
            safeBorder(inputSenha, "#facc15");
        } else {
            safeText(forcaSenha, "Senha forte");
            if (forcaSenha) forcaSenha.style.color = "#22c55e";
            safeBorder(inputSenha, "#22c55e");
        }
    });

    // ================= CONFIRMAR SENHA (TEMPO REAL) =================
    inputConfirmar.addEventListener("input", function () {
        if (!erroConfirmar) return;

        if (!inputConfirmar.value || inputConfirmar.value === "") {
            safeText(erroConfirmar, "");
            safeBorder(inputConfirmar, "#2d4464");
            return;
        }

        if (inputConfirmar.value !== inputSenha.value) {
            safeText(erroConfirmar, "As senhas não coincidem");
            safeBorder(inputConfirmar, "#ef4444");
        } else {
            safeText(erroConfirmar, "");
            safeBorder(inputConfirmar, "#22c55e");
        }
    });

    // ================= TERMOS (REMOVE ERRO AUTOMÁTICO) =================
    checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
            safeText(erroTermos, "");
            if (termosContainer) termosContainer.classList.remove("erro");
        }
    });

    // ================= OLHO SENHA (toggling) =================
    const toggleSenha = document.querySelector("#toggleSenha");
    if (toggleSenha && inputSenha) {
        toggleSenha.addEventListener("click", () => {
            if (inputSenha.type === "password") {
                inputSenha.type = "text";
                toggleSenha.classList.remove("bi-eye");
                toggleSenha.classList.add("bi-eye-slash");
            } else {
                inputSenha.type = "password";
                toggleSenha.classList.remove("bi-eye-slash");
                toggleSenha.classList.add("bi-eye");
            }
        });
    }

    const toggleConfirmar = document.querySelector("#toggleConfirmar");
    if (toggleConfirmar && inputConfirmar) {
        toggleConfirmar.addEventListener("click", () => {
            if (inputConfirmar.type === "password") {
                inputConfirmar.type = "text";
                toggleConfirmar.classList.remove("bi-eye");
                toggleConfirmar.classList.add("bi-eye-slash");
            } else {
                inputConfirmar.type = "password";
                toggleConfirmar.classList.remove("bi-eye-slash");
                toggleConfirmar.classList.add("bi-eye");
            }
        });
    }
}


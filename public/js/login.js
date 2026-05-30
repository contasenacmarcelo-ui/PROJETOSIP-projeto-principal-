// BOTÃO
const botao = document.querySelector(".btn-Entrar");

// INPUTS
const emailInput = document.querySelector(".input-E-mail");
const senhaInput = document.querySelector(".input-senha");


// ERROS
const erroEmail = document.querySelector(".erro-email");
const erroSenha = document.querySelector(".erro-senha");

// Evitar submit automático/duplo causado por navegador/Chrome
const form = document.querySelector('form') || null;
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
}

// OLHO SENHA
const toggle = document.getElementById("toggleSenha");


//  MOSTRAR / OCULTAR SENHA (proteção caso o elemento não exista)
if (toggle) {
    toggle.addEventListener("click", () => {
        if (senhaInput.type === "password") {
            senhaInput.type = "text";
            toggle.classList.remove("bi-eye");
            toggle.classList.add("bi-eye-slash");
        } else {
            senhaInput.type = "password";
            toggle.classList.remove("bi-eye-slash");
            toggle.classList.add("bi-eye");
        }
    });
}


// 👂 ESCUTAR SENHA ENQUANTO DIGITA
senhaInput.addEventListener("input", () => {

    if (senhaInput.value.length < 6) {
        senhaInput.style.border = "1px solid #ef4444";
    } else {
        senhaInput.style.border = "1px solid #10b981";
    }

});


// 🚀 VALIDAÇÃO NO CLIQUE
botao.addEventListener("click", function (event) {

    event.preventDefault(); // 🚨 impede o link

    let valido = true;

    // limpar erros
    erroEmail.textContent = "";
    erroSenha.textContent = "";

    emailInput.style.border = "1px solid #2d4464";
    senhaInput.style.border = "1px solid #2d4464";

    // REGEX EMAIL (profissional)
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // VALIDAR EMAIL
    if (emailInput.value.trim() === "") {
        erroEmail.textContent = "O campo e-mail é obrigatório";
        emailInput.style.border = "1px solid #ef4444";
        valido = false;

    } else if (!emailValido.test(emailInput.value)) {
        erroEmail.textContent = "Digite um e-mail válido";
        emailInput.style.border = "1px solid #ef4444";
        valido = false;
    }

    // VALIDAR SENHA
    if (senhaInput.value.trim() === "") {
        erroSenha.textContent = "O campo senha é obrigatório";
        senhaInput.style.border = "1px solid #ef4444";
        valido = false;

    } else if (senhaInput.value.length < 6) {
        erroSenha.textContent = "A senha deve ter pelo menos 6 caracteres";
        senhaInput.style.border = "1px solid #ef4444";
        valido = false;
    }

    // SE TUDO OK -> validar credenciais contra o servidor
    if (valido) {
        const credenciais = {
            email: emailInput.value.trim().toLowerCase(),
            senha: senhaInput.value
        };

fetch('/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credenciais)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => Promise.reject(err));
            }
            return response.json();
        })
        .then(data => {
            // Sucesso: armazenar token e dados do usuário
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
            }
            localStorage.setItem('loggedInUser', JSON.stringify(data.user || { email: credenciais.email }));

            // Redirecionar baseado no role do usuário
            if (data.user && data.user.role === 'admin') {
                window.location.href = '/public/pages/admia.html'; // Painel admin
            } else {
                window.location.href = '/public/pages/cliente.html'; // Dashboard cliente
            }
        })
        .catch(error => {
            console.error('Erro ao fazer login:', error);
            if (error.error && error.error.includes('não cadastrado')) {
                erroEmail.textContent = 'E-mail não cadastrado';
                emailInput.style.border = '1px solid #ef4444';
            } else if (error.error && error.error.includes('incorreta')) {
                erroSenha.textContent = 'Senha incorreta';
                senhaInput.style.border = '1px solid #ef4444';
            } else {
                alert('Erro ao fazer login. Tente novamente.');
            }
        });
    }

});
// BOTÃO
const botao = document.querySelector(".btn-Entrar");

// INPUTS
const emailInput = document.querySelector(".input-E-mail");
const senhaInput = document.querySelector(".input-senha");

// ERROS
const erroEmail = document.querySelector(".erro-email");
const erroSenha = document.querySelector(".erro-senha");

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

    // SE TUDO OK -> validar credenciais contra localStorage
    if (valido) {
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const emailLower = emailInput.value.trim().toLowerCase();

            const usuario = users.find(u => u.email === emailLower);
            if (!usuario) {
                erroEmail.textContent = 'E-mail não cadastrado';
                emailInput.style.border = '1px solid #ef4444';
                return;
            }

            if (usuario.password !== btoa(senhaInput.value)) {
                erroSenha.textContent = 'Senha incorreta';
                senhaInput.style.border = '1px solid #ef4444';
                return;
            }

            // sucesso: marcar usuário como logado e redirecionar
            localStorage.setItem('loggedInUser', JSON.stringify({ email: usuario.email, name: usuario.name }));
            window.location.href = 'cliente.html';
        } catch (e) {
            console.error('Erro ao verificar credenciais:', e);
            window.location.href = 'cliente.html';
        }
    }

});
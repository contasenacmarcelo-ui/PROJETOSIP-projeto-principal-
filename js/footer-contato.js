// Modal de Contato do Footer

const modalContato = document.getElementById('modalContatoFooter');
const abrirContato = document.getElementById('abrirContatoFooter');
const fecharContato = document.getElementById('fecharContatoFooter');
const formContato = document.getElementById('formContatoFooter');

// Abrir Modal
if (abrirContato) {
    abrirContato.addEventListener('click', (e) => {
        e.preventDefault();
        modalContato.classList.add('ativo');
    });
}

// Fechar Modal
if (fecharContato) {
    fecharContato.addEventListener('click', () => {
        modalContato.classList.remove('ativo');
        limparForm();
    });
}

// Fechar ao clicar fora do modal
window.addEventListener('click', (event) => {
    if (event.target == modalContato) {
        modalContato.classList.remove('ativo');
        limparForm();
    }
});

// Validar e Enviar Formulário
if (formContato) {
    formContato.addEventListener('submit', (e) => {
        e.preventDefault();

        const nome = document.getElementById('nomeContato').value.trim();
        const email = document.getElementById('emailContato').value.trim();
        const telefone = document.getElementById('telContato').value.trim();
        const mensagem = document.getElementById('mensagemContato').value.trim();

        // Limpar erros
        document.querySelectorAll('.erro-contato').forEach(el => el.classList.remove('show'));

        let temErro = false;

        // Validar Nome
        if (nome.length < 3) {
            mostrarErro('erro-nome', 'Nome deve ter no mínimo 3 caracteres');
            temErro = true;
        }

        // Validar Email
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexEmail.test(email)) {
            mostrarErro('erro-email', 'Email inválido');
            temErro = true;
        }

        // Validar Telefone (se preenchido)
        if (telefone && telefone.length < 10) {
            mostrarErro('erro-tel', 'Telefone deve ter no mínimo 10 dígitos');
            temErro = true;
        }

        // Validar Mensagem
        if (mensagem.length < 10) {
            mostrarErro('erro-mensagem', 'Mensagem deve ter no mínimo 10 caracteres');
            temErro = true;
        }

        // Se não tiver erro, enviar
        if (!temErro) {
            enviarMensagem(nome, email, telefone, mensagem);
        }
    });
}

function mostrarErro(elementId, mensagem) {
    const elemento = document.getElementById(elementId);
    elemento.textContent = mensagem;
    elemento.classList.add('show');
}

function enviarMensagem(nome, email, telefone, mensagem) {
    // Aqui você pode integrar com um backend real
    // Por enquanto, vamos simular o envio
    
    console.log('Mensagem de contato:');
    console.log('Nome:', nome);
    console.log('Email:', email);
    console.log('Telefone:', telefone);
    console.log('Mensagem:', mensagem);

    // Mostrar mensagem de sucesso
    document.getElementById('formContatoFooter').style.display = 'none';
    document.getElementById('sucessoContato').style.display = 'block';

    // Fechar modal após 3 segundos
    setTimeout(() => {
        modalContato.classList.remove('ativo');
        limparForm();
    }, 3000);
}

function limparForm() {
    if (formContato) {
        formContato.reset();
        formContato.style.display = 'block';
    }
    document.getElementById('sucessoContato').style.display = 'none';
    document.querySelectorAll('.erro-contato').forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
    });
}

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
    const contato = {
        nome: nome,
        email: email,
        telefone: telefone || '',
        assunto: 'Contato via Site',
        mensagem: mensagem
    };

    // Enviar para o banco de dados
fetch('/api/contato',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(contato)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Contato enviado com sucesso:', data);

        // Mostrar mensagem de sucesso
        document.getElementById('formContatoFooter').style.display = 'none';
        document.getElementById('sucessoContato').style.display = 'block';

        // Fechar modal após 3 segundos
        setTimeout(() => {
            modalContato.classList.remove('ativo');
            limparForm();
        }, 3000);
    })
    .catch(error => {
        console.error('Erro ao enviar mensagem:', error);
        mostrarErro('erro-mensagem', 'Erro ao enviar mensagem. Tente novamente.');
    });
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

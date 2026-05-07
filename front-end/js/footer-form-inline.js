// Formulário de Contato Inline do Footer
// Salva cada mensagem individualmente no localStorage

const formContatoInline = document.getElementById('formContatoFooterInline');
const sucessoFormInline = document.getElementById('sucessoFormInline');
const textareaContato = document.getElementById('mensagemContatoInline');
const charCounter = document.getElementById('charCounter');

// Contador de caracteres
if (textareaContato && charCounter) {
    textareaContato.addEventListener('input', () => {
        const atual = textareaContato.value.length;
        const max = textareaContato.getAttribute('maxlength') || 200;
        charCounter.textContent = `${atual}/${max}`;
        
        if (atual >= max * 0.9) {
            charCounter.style.color = '#ff4757';
        } else if (atual >= max * 0.7) {
            charCounter.style.color = '#facc15';
        } else {
            charCounter.style.color = 'rgba(255, 255, 255, 0.5)';
        }
    });
}

// Abrir/fechar modal de histórico (se existir)
function getContatos() {
    const dados = localStorage.getItem('sip_contatos');
    return dados ? JSON.parse(dados) : [];
}

function salvarContato(contato) {
    const contatos = getContatos();
    contatos.push(contato);
    localStorage.setItem('sip_contatos', JSON.stringify(contatos));
}

function mostrarErroInline(elementId, mensagem) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.textContent = mensagem;
        elemento.classList.add('show');
    }
}

function limparErrosInline() {
    document.querySelectorAll('.erro-form').forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
    });
}

function limparFormInline() {
    if (formContatoInline) {
        formContatoInline.reset();
        formContatoInline.style.display = 'block';
    }
    if (sucessoFormInline) {
        sucessoFormInline.style.display = 'none';
    }
    limparErrosInline();
}

if (formContatoInline) {
    formContatoInline.addEventListener('submit', (e) => {
        e.preventDefault();
        limparErrosInline();

        const nome = document.getElementById('nomeContatoInline').value.trim();
        const email = document.getElementById('emailContatoInline').value.trim();
        const telefone = document.getElementById('telefoneContatoInline') ? document.getElementById('telefoneContatoInline').value.trim() : '';
        const mensagem = document.getElementById('mensagemContatoInline').value.trim();

        let temErro = false;

        // Validar Nome
        if (nome.length < 3) {
            mostrarErroInline('erro-nome-inline', 'Nome deve ter no mínimo 3 caracteres');
            temErro = true;
        }

        // Validar Email
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexEmail.test(email)) {
            mostrarErroInline('erro-email-inline', 'Email inválido');
            temErro = true;
        }

        // Validar Telefone (se preenchido)
        const telefoneLimpo = telefone.replace(/\D/g, '');
        if (telefone && telefoneLimpo.length < 10) {
            mostrarErroInline('erro-telefone-inline', 'Telefone inválido (mín. 10 dígitos)');
            temErro = true;
        }

        // Validar Mensagem
        if (mensagem.length < 10) {
            mostrarErroInline('erro-msg-inline', 'Mensagem deve ter no mínimo 10 caracteres');
            temErro = true;
        }

        if (temErro) return;

        // Criar objeto de contato individual
        const contato = {
            id: Date.now(),
            nome: nome,
            email: email,
            telefone: telefone || '',
            mensagem: mensagem,
            data: new Date().toLocaleString('pt-BR'),
            lida: false
        };

        // Salvar no localStorage
        salvarContato(contato);

        // Mostrar toast de sucesso
        if (typeof toastSucesso === 'function') {
            toastSucesso('Mensagem enviada com sucesso! Entraremos em contato em breve.', 4000);
        }

        console.log('Contato salvo no localStorage:', contato);

        // Limpar formulário
        limparFormInline();
    });
}


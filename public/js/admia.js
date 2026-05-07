document.addEventListener('DOMContentLoaded', function () {
    // ============================
    // MENU MOBILE
    // ============================
    const btn = document.getElementById("btn-menu");
    const menu = document.getElementById("menu-mobile");

    if (btn && menu) {
        btn.addEventListener("click", () => {
            btn.classList.toggle("ativo");
            menu.classList.toggle("ativo");
        });

        document.addEventListener("click", (e) => {
            if (!menu.contains(e.target) && !btn.contains(e.target)) {
                menu.classList.remove("ativo");
                btn.classList.remove("ativo");
            }
        });
    }

    // ============================
    // MODAL NOVO USUÁRIO
    // ============================
    const modal = document.getElementById("modal");

    window.abrirModal = function () {
        if (!modal) return;
        modal.style.display = "block";

        setTimeout(() => {
            const nomeInput = document.getElementById("nome");
            if (nomeInput) nomeInput.focus();
        }, 100);
    };

    window.fecharModal = function () {
        if (!modal) return;
        modal.style.display = "none";
    };

    if (modal) {
        window.addEventListener("click", (e) => {
            if (e.target === modal) {
                fecharModal();
            }
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            fecharModal();
            fecharModalDetalhes();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (modal && modal.style.display === "block" && e.key === "Enter") {
            e.preventDefault();
            window.adicionarUsuario();
        }
    });

    // ============================
    // MODAL DETALHES DO USUÁRIO
    // ============================
    const modalDetalhes = document.getElementById("modal-detalhes");

    window.abrirModalDetalhes = function () {
        if (!modalDetalhes) return;
        modalDetalhes.style.display = "block";
    };

    window.fecharModalDetalhes = function () {
        if (!modalDetalhes) return;
        modalDetalhes.style.display = "none";
    };

    if (modalDetalhes) {
        window.addEventListener("click", (e) => {
            if (e.target === modalDetalhes) {
                fecharModalDetalhes();
            }
        });
    }

    // ============================
    // LOCAL STORAGE + TABELA
    // ============================
    const tabelaBody = document.getElementById("tabela-body");
    const LS_KEY = "users";

    function carregarDados() {
        return JSON.parse(localStorage.getItem(LS_KEY)) || [];
    }

    function salvarDados(dados) {
        localStorage.setItem(LS_KEY, JSON.stringify(dados));
    }

    function getOrcamentos() {
        const dados = localStorage.getItem('sip_orcamentos');
        return dados ? JSON.parse(dados) : [];
    }

    function getSuportes() {
        const dados = localStorage.getItem('sip_suportes');
        return dados ? JSON.parse(dados) : [];
    }

    function gerarNovoId(dados) {
        if (dados.length === 0) return "001";
        const idsNumericos = dados
            .map(u => parseInt(u.id, 10))
            .filter(n => !isNaN(n));
        const maxId = idsNumericos.length > 0 ? Math.max(...idsNumericos) : 0;
        return String(maxId + 1).padStart(3, "0");
    }

    function renderizarTabela() {
        if (!tabelaBody) return;

        const dados = carregarDados();
        tabelaBody.innerHTML = "";

        if (dados.length === 0) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td colspan="6" class="estado-vazio">
                    <i class="bi bi-inbox"></i>
                    <p>Nenhum usuário cadastrado.</p>
                </td>
            `;
            tabelaBody.appendChild(tr);
            return;
        }

        dados.forEach((user, index) => {
            const status = user.status || "Ativo";
            const classeStatus =
                status === "Ativo" ? "on" :
                status === "Pendente" ? "pendente" : "open";

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${user.id || "—"}</td>
                <td>${user.name || "—"}</td>
                <td>${user.email || "—"}</td>
                <td>${user.telefone || "—"}</td>
                <td><span class="${classeStatus}">${status}</span></td>
                <td>
                    <button class="btn-view" data-index="${index}" title="Ver detalhes">
                        <i class="bi bi-eye-fill"></i>
                    </button>
                    <button class="btn-remove" data-index="${index}" title="Remover">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                </td>
            `;

            tabelaBody.appendChild(tr);
        });

        tabelaBody.querySelectorAll(".btn-view").forEach(btn => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.getAttribute("data-index"), 10);
                verDetalhesUsuario(idx);
            });
        });

        tabelaBody.querySelectorAll(".btn-remove").forEach(btn => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.getAttribute("data-index"), 10);
                removerUsuario(idx);
            });
        });
    }

    function removerUsuario(index) {
        let dados = carregarDados();
        dados.splice(index, 1);
        salvarDados(dados);
        renderizarTabela();
    }

    window.verDetalhesUsuario = function (index) {
        const usuarios = carregarDados();
        const user = usuarios[index];
        if (!user) return;

        const detNome = document.getElementById("det-nome");
        const detEmail = document.getElementById("det-email");
        const detTelefone = document.getElementById("det-telefone");
        const detStatus = document.getElementById("det-status");
        const detPedidos = document.getElementById("det-pedidos");
        const detSuportes = document.getElementById("det-suportes");

        if (detNome) detNome.textContent = user.name || "—";
        if (detEmail) detEmail.textContent = user.email || "—";
        if (detTelefone) detTelefone.textContent = user.telefone || "—";
        if (detStatus) detStatus.textContent = user.status || "Ativo";

        // Pedidos / Projetos
        const pedidos = getOrcamentos().filter(p => p.userEmail === user.email);
        if (detPedidos) {
            if (pedidos.length === 0) {
                detPedidos.innerHTML = '<p class="sem-dados">Nenhum pedido encontrado.</p>';
            } else {
                let html = '';
                pedidos.slice().reverse().forEach(p => {
                    html += `
                        <div class="detalhe-card">
                            <strong>${p.titulo || 'Sem título'}</strong>
                            <span class="detalhe-tag">${p.tipo || '-'}</span>
                            <p>${p.descricao || ''}</p>
                            <div class="detalhe-meta">
                                <span><i class="bi bi-calendar"></i> Prazo: ${p.prazo || '-'}</span>
                                <span><i class="bi bi-clock"></i> ${p.dataEnvio || '-'}</span>
                                <span class="detalhe-status ${(p.status || 'Pendente').toLowerCase().replace(' ', '-')}">${p.status || 'Pendente'}</span>
                            </div>
                        </div>
                    `;
                });
                detPedidos.innerHTML = html;
            }
        }

        // Suportes
        const suportes = getSuportes().filter(s => s.userEmail === user.email);
        if (detSuportes) {
            if (suportes.length === 0) {
                detSuportes.innerHTML = '<p class="sem-dados">Nenhum chamado encontrado.</p>';
            } else {
                let html = '';
                suportes.slice().reverse().forEach(s => {
                    html += `
                        <div class="detalhe-card">
                            <strong>${s.assunto || 'Sem assunto'}</strong>
                            <p>${s.mensagem || ''}</p>
                            <div class="detalhe-meta">
                                <span><i class="bi bi-clock"></i> ${s.dataEnvio || '-'}</span>
                                <span class="detalhe-status ${(s.status || 'Aberto').toLowerCase().replace(' ', '-')}">${s.status || 'Aberto'}</span>
                            </div>
                        </div>
                    `;
                });
                detSuportes.innerHTML = html;
            }
        }

        abrirModalDetalhes();
    };

    window.adicionarUsuario = function () {
        const nomeInput = document.getElementById("nome");
        const emailInput = document.getElementById("email");
        const telefoneInput = document.getElementById("telefone");
        const statusInput = document.getElementById("status");

        if (!nomeInput || !emailInput || !statusInput) return;

        const nome = nomeInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        const telefone = telefoneInput ? telefoneInput.value.trim() : "";
        const status = statusInput.value;

        if (nome === "") {
            alert("Digite um nome!");
            return;
        }

        if (email === "") {
            alert("Digite um e-mail!");
            return;
        }

        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexEmail.test(email)) {
            alert("E-mail inválido!");
            return;
        }

        let dados = carregarDados();

        if (dados.some(u => u.email === email)) {
            alert("E-mail já cadastrado!");
            return;
        }

        const novoId = gerarNovoId(dados);

        const novoUsuario = {
            id: novoId,
            name: nome,
            email: email,
            telefone: telefone,
            status: status,
            password: btoa("123456")
        };

        dados.push(novoUsuario);
        salvarDados(dados);
        renderizarTabela();

        nomeInput.value = "";
        emailInput.value = "";
        if (telefoneInput) telefoneInput.value = "";
        fecharModal();
    };

    // ============================
    // INICIAR
    // ============================
    renderizarTabela();
});


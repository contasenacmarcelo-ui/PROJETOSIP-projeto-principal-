        const rows = document.querySelectorAll("tbody tr");
        const btn = document.getElementById("btn-menu");
        const menu = document.getElementById("menu-mobile");

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

        // PAGINAÇÃO

        const pagination = document.getElementById("pagination");
        const rowsPerPage = 9;
        let currentPage = 1;

        function showPage(page) {
            currentPage = page;

            const start = (page - 1) * rowsPerPage;
            const end = start + rowsPerPage;

            rows.forEach((row, index) => {
                row.style.display = (index >= start && index < end)
                    ? "table-row"
                    : "none";
            });

            updateButtons();
        }

        function createButtons() {
            const totalPages = Math.ceil(rows.length / rowsPerPage);

            for (let i = 1; i <= totalPages; i++) {
                const btn = document.createElement("button");
                btn.innerText = i;

                btn.addEventListener("click", () => {
                    showPage(i);
                });

                pagination.appendChild(btn);
            }
        }

        // 🔥 AGORA FORA
        function updateButtons() {
            const buttons = pagination.querySelectorAll("button");

            buttons.forEach((btn, index) => {
                btn.classList.toggle("ativo", index + 1 === currentPage);
            });
        }

        createButtons();
        showPage(1);
// Menu Hamburguer //

const btn = document.getElementById("btn-menu");
const menu = document.getElementById("menu-mobile");

btn.addEventListener("click", () => {
    btn.classList.toggle("ativo");
    menu.classList.toggle("ativo");
});

// fechar ao clicar fora
document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove("ativo");
        btn.classList.remove("ativo");
    }
});

// Form //

const form = document.querySelector("#form")

form.addEventListener("submit", (e) => {

    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const lista = JSON.parse(localStorage.getItem("dados")) || [];
    
    let input = document.querySelector("#input")
    let texto = input.value.trim();

    if(texto === ""){
        return;
    }

    lista.push(data);
    localStorage.setItem("dados", JSON.stringify(lista));

    console.log("Salvo!", data);

    form.reset();
});

form.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        form.requestSubmit();
    }
})

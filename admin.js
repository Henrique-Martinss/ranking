// ===============================
// DADOS
// ===============================
let dadosSalvos = JSON.parse(localStorage.getItem("rankingData")) || {
    jogadores: [],
    dataAtualizacao: null
};

let ranking = dadosSalvos.jogadores;

// ===============================
// ELEMENTOS
// ===============================
const form = document.getElementById("form");
const lista = document.getElementById("lista-admin");
const inputData = document.getElementById("dataAtualizacao");

// preencher data
if (inputData) {
    inputData.value = dadosSalvos.dataAtualizacao || "";
}

// ===============================
// SALVAR
// ===============================
function salvar() {
    localStorage.setItem("rankingData", JSON.stringify({
        jogadores: ranking,
        dataAtualizacao: inputData.value || null
    }));
}

// ===============================
// RENDER
// ===============================
function render() {
    lista.innerHTML = "";

    ranking.forEach((player, index) => {
        const div = document.createElement("div");
        div.classList.add("player-admin");
        div.dataset.index = index;

        div.innerHTML = `
            <span class="drag-handle">☰</span>
            <input type="text" value="${player.nome}" class="edit-nome">
            <input type="number" value="${player.xp}" class="edit-xp">
            <button class="delete-btn">❌</button>
        `;

        const handle = div.querySelector(".drag-handle");

        // ===============================
        // DRAG só pela handle
        // ===============================
        handle.setAttribute("draggable", true);

        handle.addEventListener("dragstart", (e) => {
            draggedIndex = index;
        });

        handle.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        handle.addEventListener("drop", (e) => {
            const targetDiv = e.target.closest(".player-admin");
            if (!targetDiv) return;

            const targetIndex = targetDiv.dataset.index;

            const item = ranking[draggedIndex];
            ranking.splice(draggedIndex, 1);
            ranking.splice(targetIndex, 0, item);

            salvar();
            render();
        });

        // ===============================
        // EDITAR (AUTO SAVE)
        // ===============================
        div.querySelector(".edit-nome").addEventListener("input", (e) => {
            ranking[index].nome = e.target.value;
            salvar();
        });

        div.querySelector(".edit-xp").addEventListener("input", (e) => {
            ranking[index].xp = parseInt(e.target.value) || 0;
            salvar();
        });

        // ===============================
        // DELETAR
        // ===============================
        div.querySelector(".delete-btn").addEventListener("click", () => {
            const confirmar = confirm("Tem certeza que deseja deletar esse jogador?");
            if (!confirmar) return;

            ranking.splice(index, 1);
            salvar();
            render();
        });

        lista.appendChild(div);
    });
}

// ===============================
// ADICIONAR JOGADOR
// ===============================
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const xp = parseInt(document.getElementById("xp").value);

    if (!nome) {
        alert("Digite o nome!");
        return;
    }

    if (isNaN(xp)) {
        alert("XP inválido!");
        return;
    }

    ranking.push({ nome, xp });

    salvar();
    form.reset();
    render();
});

// ===============================
// INIT
// ===============================
let draggedIndex = null;

render();
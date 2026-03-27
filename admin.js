// ===============================
// 🔒 PROTEÇÃO (ATENÇÃO: ESTA É UMA PROTEÇÃO BÁSICA CLIENT-SIDE)
// ===============================
// Para um painel administrativo real, é ALTAMENTE RECOMENDADO implementar
// um sistema de autenticação robusto no lado do servidor, como o Firebase Authentication,
// para garantir a segurança dos dados e evitar acessos não autorizados.
// A verificação via localStorage é facilmente contornável.
if (localStorage.getItem("auth") !== "true") {
    window.location.href = "login.html";
}

// ===============================
// FIREBASE
// ===============================
// É crucial que firebase.initializeApp() seja chamado antes deste script.
// Assumimos que 'firebase' já está disponível globalmente.
if (typeof firebase === "undefined") {
    console.error("Erro: A biblioteca Firebase não foi carregada. Certifique-se de que os scripts do Firebase SDK estão incluídos e inicializados corretamente.");
    // Se o Firebase não carregar, o script não pode funcionar.
    throw new Error("Firebase SDK não disponível.");
}

const db = firebase.database();

// ===============================
// ESTADO GLOBAL
// ===============================
let ranking = [];
let draggedIndex = null;

// ===============================
// CONSTANTES FIREBASE
// ===============================
const FIREBASE_RANKING_PATH = "ranking";
const FIREBASE_PLAYERS_KEY = "jogadores";
const FIREBASE_UPDATE_DATE_KEY = "dataAtualizacao";

// ===============================
// ELEMENTOS DOM
// ===============================
const form = document.getElementById("form");
const lista = document.getElementById("lista-admin");
const inputData = document.getElementById("dataAtualizacao");
const logoutBtn = document.getElementById("logoutBtn");

// Verifica se os elementos essenciais foram encontrados
if (!form || !lista || !inputData || !logoutBtn) {
    console.error("Erro: Um ou mais elementos DOM essenciais não foram encontrados. Verifique os IDs no HTML.");
    // Poderíamos desabilitar funcionalidades ou exibir uma mensagem ao usuário.
}

// ===============================
// UTILITIES
// ===============================
/**
 * Escapa caracteres HTML para prevenir ataques XSS.
 * @param {string} str A string a ser escapada.
 * @returns {string} A string com caracteres HTML escapados.
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// ===============================
// FUNÇÕES DE DADOS E RENDERIZAÇÃO
// ===============================

/**
 * Salva o ranking atual e a data de atualização no Firebase.
 */
function salvar() {
    if (!db) {
        console.error("Firebase Database não inicializado.");
        return;
    }
    const dataToSave = {
        [FIREBASE_PLAYERS_KEY]: ranking,
        [FIREBASE_UPDATE_DATE_KEY]: inputData ? inputData.value || null : null
    };
    db.ref(FIREBASE_RANKING_PATH).set(dataToSave)
        .then(() => console.log("Dados salvos com sucesso!"))
        .catch(error => console.error("Erro ao salvar dados no Firebase:", error));
}

/**
 * Renderiza a lista de jogadores no painel administrativo.
 */
function render() {
    if (!lista) return; // Garante que 'lista' existe

    lista.innerHTML = "";
    const fragment = document.createDocumentFragment();

    ranking.forEach((player, index) => {
        // Validação básica do objeto player
        if (!player || typeof player.nome === 'undefined' || typeof player.level === 'undefined') {
            console.warn(`Dados de jogador inválidos no índice ${index}:`, player);
            return; // Pula jogadores com dados incompletos
        }

        const div = document.createElement("div");
        div.classList.add("player-admin");
        div.dataset.index = index;
        div.setAttribute("draggable", "true"); // Torna o item arrastável

        const escapedNome = escapeHTML(player.nome);

        div.innerHTML = `
            <span class="drag-handle">☰</span>
            <input type="text" value="${escapedNome}" aria-label="Nome do Jogador">
            <input type="number" value="${player.level}" aria-label="Level do Jogador">
            <button class="delete-btn" type="button" aria-label="Deletar Jogador">❌</button>
        `;

        // Referências aos elementos internos da div
        const handle = div.querySelector(".drag-handle");
        const inputNome = div.querySelector("input[type='text']");
        const inputLevel = div.querySelector("input[type='number']");
        const deleteBtn = div.querySelector(".delete-btn");

        // ===============================
        // DRAG AND DROP
        // ===============================
        if (handle) {
            handle.addEventListener("dragstart", (e) => {
                draggedIndex = index;
                e.dataTransfer.effectAllowed = "move";
                // Adiciona uma classe para feedback visual durante o arrasto
                setTimeout(() => div.classList.add("dragging"), 0);
            });
        }

        div.addEventListener("dragover", (e) => {
            e.preventDefault(); // Permite o drop
            e.dataTransfer.dropEffect = "move";
            // Adiciona feedback visual para o local de drop
            if (div.dataset.index !== draggedIndex) {
                div.classList.add("drag-over");
            }
        });

        div.addEventListener("dragleave", () => {
            div.classList.remove("drag-over");
        });

        div.addEventListener("drop", () => {
            div.classList.remove("drag-over");
            div.classList.remove("dragging");

            if (draggedIndex === null || draggedIndex === index) return;

            const targetIndex = Number(div.dataset.index);

            const item = ranking[draggedIndex];
            ranking.splice(draggedIndex, 1); // Remove o item da posição original
            ranking.splice(targetIndex, 0, item); // Insere o item na nova posição

            draggedIndex = null;
            salvar(); // Salva as mudanças no Firebase
            render(); // Re-renderiza para refletir a nova ordem
        });

        div.addEventListener("dragend", () => {
            div.classList.remove("dragging");
            // Garante que todas as classes drag-over sejam removidas
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        });

        // ===============================
        // EDIÇÃO DE JOGADOR
        // ===============================
        if (inputNome) {
            inputNome.addEventListener("input", (e) => {
                ranking[index].nome = e.target.value;
                salvar();
            });
        }

        if (inputLevel) {
            inputLevel.addEventListener("input", (e) => {
                // Garante que o valor seja um número inteiro, ou 0 se inválido
                ranking[index].level = parseInt(e.target.value) || 0;
                salvar();
            });
        }

        // ===============================
        // DELETAR JOGADOR
        // ===============================
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => {
                if (!confirm(`Deseja realmente deletar o jogador ${ranking[index].nome}?`)) return;

                ranking.splice(index, 1);
                salvar(); // Salva as mudanças no Firebase
                render(); // Re-renderiza a lista após a exclusão
            });
        }

        fragment.appendChild(div);
    });
    lista.appendChild(fragment);
}

// ===============================
// ESCUTAR FIREBASE
// ===============================
if (db && lista && inputData) { // Garante que db, lista e inputData existem
    db.ref(FIREBASE_RANKING_PATH).on("value", (snapshot) => {
        const dados = snapshot.val();

        ranking = dados?.[FIREBASE_PLAYERS_KEY] || [];

        // Preenche o input de data, se existir
        inputData.value = dados?.[FIREBASE_UPDATE_DATE_KEY] || "";

        render();
    });
}

// ===============================
// ADICIONAR JOGADOR
// ===============================
if (form) {
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const nomeInput = document.getElementById("nome");
        const levelInput = document.getElementById("level");

        if (!nomeInput || !levelInput) {
            console.error("Erro: Campos de nome ou level não encontrados no formulário.");
            alert("Erro interno: Campos do formulário ausentes.");
            return;
        }

        const nome = nomeInput.value.trim();
        const level = parseInt(levelInput.value);

        if (!nome || isNaN(level) || level < 0) { // Adicionado validação para level não negativo
            alert("Por favor, insira um nome válido e um level numérico positivo.");
            return;
        }

        ranking.push({ nome, level });

        salvar();
        form.reset(); // Limpa o formulário após adicionar
        nomeInput.focus(); // Coloca o foco de volta no campo nome
    });
}

// ===============================
// ATUALIZAR DATA
// ===============================
if (inputData) {
    inputData.addEventListener("change", salvar);
}

// ===============================
// LOGOUT
// ===============================
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        if (!confirm("Deseja sair do painel administrativo?")) return;

        localStorage.removeItem("auth");
        window.location.href = "login.html";
    });
}
// ===============================
// FIREBASE
// ===============================
// É crucial que firebase.initializeApp() seja chamado antes deste script.
// Assumimos que 'firebase' já está disponível globalmente.
if (typeof firebase === "undefined") {
    console.error("Erro: A biblioteca Firebase não foi carregada. Certifique-se de que os scripts do Firebase SDK estão incluídos e inicializados corretamente.");
    // Poderíamos adicionar um return aqui para evitar erros subsequentes se Firebase for essencial.
    // return;
}

const db = firebase.database();

// ===============================
// CONSTANTES
// ===============================
const FIREBASE_RANKING_PATH = "ranking";
const FIREBASE_PLAYERS_KEY = "jogadores";
const FIREBASE_UPDATE_DATE_KEY = "dataAtualizacao";

// ===============================
// ELEMENTOS
// ===============================
const container = document.getElementById("ranking-lista");
const dataElemento = document.getElementById("data");

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
// FORMATAR LEVEL
// ===============================
function formatLevel(level) {
    if (level >= 1000000) return (level / 1000000).toFixed(1) + "M";
    if (level >= 1000) return (level / 1000).toFixed(1) + "K";
    return level;
}

// ===============================
// BUSCAR DADOS
// ===============================
db.ref(FIREBASE_RANKING_PATH).on("value", (snapshot) => {
    const dados = snapshot.val();

    if (!dados || !dados[FIREBASE_PLAYERS_KEY]) {
        console.warn("Dados de ranking não encontrados ou incompletos no Firebase.", dados);
        if (container) {
            container.innerHTML = "<p>Sem dados disponíveis</p>";
        }
        if (dataElemento) {
            dataElemento.textContent = "Sem atualização recente";
        }
        return;
    }

    const ranking = dados[FIREBASE_PLAYERS_KEY];

    if (container) {
        container.innerHTML = ""; // Limpa o conteúdo existente

        // Usar um DocumentFragment para otimizar a manipulação do DOM
        const fragment = document.createDocumentFragment();

        ranking.forEach((player, index) => {
            if (!player || typeof player.nome === 'undefined' || typeof player.level === 'undefined') {
                console.warn(`Dados de jogador inválidos no índice ${index}:`, player);
                return; // Pula jogadores com dados incompletos
            }

            const div = document.createElement("div");
            div.classList.add("player");

            if (index === 0) div.classList.add("top1");
            if (index === 1) div.classList.add("top2");
            if (index === 2) div.classList.add("top3");

            const medalha =
                index === 0 ? "🥇" :
                index === 1 ? "🥈" :
                index === 2 ? "🥉" :
                index + 1;

            const level = player.level ?? 0;
            const escapedNome = escapeHTML(player.nome); // Escapa o nome do jogador

            div.innerHTML = `
                <span class="posicao">${medalha}</span>
                <span class="nome">${escapedNome}</span>
                <span class="xp">${formatLevel(level)}</span>
            `;

            fragment.appendChild(div);
        });
        container.appendChild(fragment);
    }

    // DATA
    if (dataElemento) {
        if (dados[FIREBASE_UPDATE_DATE_KEY]) {
            const dataFormatada = new Date(dados[FIREBASE_UPDATE_DATE_KEY])
                .toLocaleDateString("pt-BR");

            dataElemento.textContent = `Última atualização: ${dataFormatada}`;
        } else {
            dataElemento.textContent = "Sem atualização recente";
        }
    }
});

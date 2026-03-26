// DADOS (VOCÊ VAI EDITAR TODA SEMANA)
const dados = JSON.parse(localStorage.getItem("rankingData")) || {
    jogadores: [],
    dataAtualizacao: null
};

const ranking = dados.jogadores.length > 0 ? dados.jogadores : [
    { nome: "Brian", xp: 2300000, variacao: +1 },
    { nome: "Ahkiu_ojiru", xp: 2100000, variacao: -1 },
    { nome: "NoSleep", xp: 1950000, variacao: +2 },
    { nome: "GrinderPro", xp: 1800000, variacao: 0 },
    { nome: "FarmKing", xp: 1700000, variacao: -1 },
];

// FORMATAR XP
function formatXP(xp) {
    if (xp >= 1000000) return (xp / 1000000).toFixed(1) + "M";
    if (xp >= 1000) return (xp / 1000).toFixed(1) + "K";
    return xp;
}

// RENDERIZAR
const container = document.getElementById("ranking-lista");

ranking.forEach((player, index) => {

    const div = document.createElement("div");
    div.classList.add("player");

    if (index === 0) div.classList.add("top1");
    if (index === 1) div.classList.add("top2");
    if (index === 2) div.classList.add("top3");

    let medalha = index === 0 ? "🥇" :
        index === 1 ? "🥈" :
            index === 2 ? "🥉" :
                index + 1;

    let variacaoIcon = player.variacao > 0 ? "🔼" :
        player.variacao < 0 ? "🔽" :
            "➖";

    div.innerHTML = `
        <span class="posicao">${medalha}</span>
        <span class="nome">${player.nome}</span>
        <span class="xp">${formatXP(player.xp)} XP</span>
        <span class="variacao">${variacaoIcon}</span>
    `;

    container.appendChild(div);

    const dataElemento = document.getElementById("data");

    if (dados.dataAtualizacao) {
        const dataFormatada = new Date(dados.dataAtualizacao)
            .toLocaleDateString("pt-BR");

        dataElemento.textContent = `Última atualização: ${dataFormatada}`;
    } else {
        dataElemento.textContent = "Sem atualização recente";
    }
});
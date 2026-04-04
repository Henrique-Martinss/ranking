/* =========================================
   CONFIGURAÇÃO FIREBASE
   ========================================= */
const firebaseConfig = {
  apiKey: "AIzaSyCIga-4FApbkNLR2ycPMNVstrWAE2jN-NM",
  authDomain: "ranking-fortnite.firebaseapp.com",
  databaseURL: "https://ranking-fortnite-default-rtdb.firebaseio.com",
  projectId: "ranking-fortnite",
  storageBucket: "ranking-fortnite.firebasestorage.app",
  messagingSenderId: "997780363006",
  appId: "1:997780363006:web:f2e22d9724ceeef53577af"
};

/* =========================================
   INICIALIZAÇÃO
   ========================================= */
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

/* =========================================
   ELEMENTOS DOM
   ========================================= */
const pageRanking  = document.getElementById('page-ranking');
const pageLogin    = document.getElementById('page-login');
const pageAdmin    = document.getElementById('page-admin');
const loadingEl    = document.getElementById('loading');
const toastEl      = document.getElementById('toast');
const btnAdminNav  = document.getElementById('btn-admin-nav');
const btnLogoutNav = document.getElementById('btn-logout-nav');
const modalEdit    = document.getElementById('modal-edit');

let rankingUnsubscribe = null;

/* =========================================
   ROTEAMENTO
   ========================================= */
function showPage(name) {
  [pageRanking, pageLogin, pageAdmin].forEach(p => p.classList.add('hidden'));
  if (name === 'ranking') pageRanking.classList.remove('hidden');
  if (name === 'login')   pageLogin.classList.remove('hidden');
  if (name === 'admin')   pageAdmin.classList.remove('hidden');
}

/* =========================================
   TOAST
   ========================================= */
let toastTimer;
function showToast(msg, type = 'ok') {
  toastEl.textContent = msg;
  toastEl.className = 'show' + (type === 'error' ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.className = ''; }, 3000);
}

/* =========================================
   AUTH
   ========================================= */
auth.onAuthStateChanged(user => {
  loadingEl.classList.add('hidden');

  if (user) {
    btnAdminNav.classList.add('hidden');
    btnLogoutNav.classList.remove('hidden');
    if (rankingUnsubscribe) {
      rankingUnsubscribe();
      rankingUnsubscribe = null;
    }
    showPage('admin');
    loadAdminData();
  } else {
    btnAdminNav.classList.remove('hidden');
    btnLogoutNav.classList.add('hidden');
    showPage('ranking');
    loadRanking();
  }
});

/* =========================================
   LOGIN
   ========================================= */
btnAdminNav.addEventListener('click', () => showPage('login'));

document.getElementById('btn-back-ranking').addEventListener('click', () => {
  showPage('ranking');
  loadRanking();
});

document.getElementById('btn-login').addEventListener('click', async () => {
  const email = document.getElementById('inp-email').value.trim();
  const pass  = document.getElementById('inp-pass').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');

  if (!email || !pass) {
    errEl.textContent = 'Preencha email e senha.';
    errEl.classList.remove('hidden');
    return;
  }
  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (e) {
    errEl.textContent = 'Email ou senha incorretos.';
    errEl.classList.remove('hidden');
  }
});

document.getElementById('inp-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-login').click();
});

/* =========================================
   LOGOUT
   ========================================= */
btnLogoutNav.addEventListener('click', async () => {
  await auth.signOut();
  showPage('ranking');
  loadRanking();
});

/* =========================================
   RANKING PÚBLICO — tempo real
   ========================================= */
async function loadRanking() {
  if (rankingUnsubscribe) {
    rankingUnsubscribe();
    rankingUnsubscribe = null;
  }

  try {
    const cfgSnap = await db.collection('config').doc('week').get();
    if (cfgSnap.exists) {
      const d = cfgSnap.data();
      document.getElementById('lbl-week').textContent = d.weekName || '—';
      document.getElementById('lbl-map').textContent  = d.mapName  || '—';
    }

    rankingUnsubscribe = db.collection('players')
      .orderBy('levels', 'desc')
      .onSnapshot({ includeMetadataChanges: false }, snap => {
        const players = [];
        snap.forEach(doc => players.push({ id: doc.id, ...doc.data() }));
        renderPodium(players);
        renderRankList(players);
      });

  } catch (e) {
    console.error('Erro ao carregar ranking:', e);
  }
}

/* =========================================
   PÓDIO (ordem visual: 2º | 1º | 3º)
   ========================================= */
function renderPodium(players) {
  const container = document.getElementById('podium-container');
  container.innerHTML = '';
  if (players.length === 0) return;

  const top3   = [players[1], players[0], players[2]];
  const posNum = [2, 1, 3];
  const crowns = ['', '👑', ''];

  top3.forEach((p, i) => {
    if (!p) return;
    const initial = p.name ? p.name[0].toUpperCase() : '?';
    const div = document.createElement('div');
    div.className = 'pod';
    div.innerHTML = `
      <div class="pod-avatar">
        ${crowns[i] ? `<span class="pod-crown">${crowns[i]}</span>` : ''}
        ${initial}
      </div>
      <div class="pod-name">${p.name}</div>
      <div class="pod-lv">+<strong>${p.levels}</strong> lvls</div>
      <div class="pod-base">${posNum[i]}</div>
    `;
    container.appendChild(div);
  });
}

/* =========================================
   LISTA COMPLETA DE RANKING
   ========================================= */
function renderRankList(players) {
  const list = document.getElementById('rank-list');
  list.innerHTML = '';

  if (players.length === 0) {
    list.innerHTML = '<div class="empty-state">Nenhum jogador cadastrado ainda.</div>';
    return;
  }

  const maxLvl = players[0]?.levels || 1;

  players.forEach((p, i) => {
    const pct = Math.round((p.levels / maxLvl) * 100);
    const row = document.createElement('div');
    row.className = 'rank-row';
    row.style.animationDelay = `${i * 60}ms`;
    row.innerHTML = `
      <div class="rank-num">${i + 1}</div>
      <div class="rank-info">
        <div class="rank-player">${p.name}</div>
        <div class="rank-detail">Top ${i + 1} da semana</div>
        <div class="rank-bar">
          <div class="rank-bar-fill" style="width:${pct}%"></div>
        </div>
      </div>
      <div class="rank-score">
        <div class="big">${p.levels}</div>
        <div class="lbl">NÍVEIS</div>
      </div>
    `;
    list.appendChild(row);
  });
}

/* =========================================
   ADMIN — carrega dados em tempo real
   ========================================= */
function loadAdminData() {
  db.collection('config').doc('week').get().then(snap => {
    if (snap.exists) {
      const d = snap.data();
      document.getElementById('inp-week-name').value = d.weekName || '';
      document.getElementById('inp-map-name').value  = d.mapName  || '';
    }
  });

  db.collection('players')
    .orderBy('levels', 'desc')
    .onSnapshot({ includeMetadataChanges: false }, snap => {
      const players = [];
      snap.forEach(doc => {
        // CORREÇÃO: serverTimestamps:'estimate' faz o Firestore estimar
        // a data no cliente imediatamente, sem esperar o servidor.
        // Isso resolve o '—' que aparecia logo após adicionar um jogador.
        players.push({
          id: doc.id,
          ...doc.data({ serverTimestamps: 'estimate' })
        });
      });
      renderAdminTable(players);
    });
}

/* =========================================
   TABELA ADMIN
   ========================================= */
function renderAdminTable(players) {
  const tbody = document.getElementById('admin-table-body');
  tbody.innerHTML = '';

  const total = players.length;
  document.getElementById('player-count').textContent =
    `${total} jogador${total !== 1 ? 'es' : ''}`;

  if (total === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:30px">Nenhum jogador cadastrado.</td></tr>`;
    return;
  }

  players.forEach(p => {
    // Verificação defensiva: checa se toDate é uma função antes de chamar
    let date = '—';
    if (p.createdAt && typeof p.createdAt.toDate === 'function') {
      date = p.createdAt.toDate().toLocaleDateString('pt-BR');
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.levels}</td>
      <td style="color:var(--muted);font-size:.85rem">${date}</td>
      <td>
        <div class="td-actions">
          <button class="btn-edit" onclick="openEditModal('${p.id}','${p.name.replace(/'/g, "\\'")}',${p.levels})">EDITAR</button>
          <button class="btn-del"  onclick="deletePlayer('${p.id}','${p.name.replace(/'/g, "\\'")}')">EXCLUIR</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================================
   SALVAR CONFIG DA SEMANA
   ========================================= */
document.getElementById('btn-save-config').addEventListener('click', async () => {
  const weekName = document.getElementById('inp-week-name').value.trim();
  const mapName  = document.getElementById('inp-map-name').value.trim();

  if (!weekName || !mapName) {
    showToast('Preencha nome da semana e do mapa.', 'error');
    return;
  }
  try {
    await db.collection('config').doc('week').set({ weekName, mapName });
    showToast('Configuração salva!');
  } catch (e) {
    // Exibe o código de erro real para facilitar diagnóstico
    console.error('Erro ao salvar config:', e);
    showToast('Erro: ' + (e.code || e.message), 'error');
  }
});

/* =========================================
   ADICIONAR JOGADOR
   ========================================= */
document.getElementById('btn-add-player').addEventListener('click', async () => {
  const nameInput   = document.getElementById('inp-new-name');
  const levelsInput = document.getElementById('inp-new-levels');
  const name        = nameInput.value.trim();
  const levels      = parseInt(levelsInput.value) || 0;

  if (!name) { showToast('Informe o nome do jogador.', 'error'); return; }

  try {
    await db.collection('players').add({
      name,
      levels,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Limpa campos e foca no nome para o próximo cadastro
    nameInput.value   = '';
    levelsInput.value = '';
    nameInput.focus();

    showToast(`${name} adicionado!`);
  } catch (e) {
    console.error('Erro ao adicionar jogador:', e);
    showToast('Erro: ' + (e.code || e.message), 'error');
  }
});

/* =========================================
   MODAL DE EDIÇÃO
   ========================================= */
window.openEditModal = function(id, name, levels) {
  document.getElementById('edit-id').value     = id;
  document.getElementById('edit-name').value   = name;
  document.getElementById('edit-levels').value = levels;
  modalEdit.classList.remove('hidden');
};

document.getElementById('btn-cancel-edit').addEventListener('click', () => {
  modalEdit.classList.add('hidden');
});

modalEdit.addEventListener('click', e => {
  if (e.target === modalEdit) modalEdit.classList.add('hidden');
});

document.getElementById('btn-save-edit').addEventListener('click', async () => {
  const id     = document.getElementById('edit-id').value;
  const name   = document.getElementById('edit-name').value.trim();
  const levels = parseInt(document.getElementById('edit-levels').value) || 0;

  if (!name) { showToast('Nome não pode estar vazio.', 'error'); return; }

  try {
    await db.collection('players').doc(id).update({ name, levels });
    modalEdit.classList.add('hidden');
    showToast('Jogador atualizado!');
  } catch (e) {
    console.error('Erro ao editar:', e);
    showToast('Erro: ' + (e.code || e.message), 'error');
  }
});

/* =========================================
   EXCLUIR JOGADOR
   ========================================= */
window.deletePlayer = async function(id, name) {
  if (!confirm(`Excluir "${name}" do ranking?`)) return;
  try {
    await db.collection('players').doc(id).delete();
    showToast(`${name} removido.`);
  } catch (e) {
    console.error('Erro ao excluir:', e);
    showToast('Erro: ' + (e.code || e.message), 'error');
  }
};

/* =========================================
   ZERAR SEMANA
   ========================================= */
document.getElementById('btn-reset-week').addEventListener('click', async () => {
  if (!confirm('Tem certeza? Isso apaga TODOS os jogadores do ranking atual.')) return;
  try {
    const snap  = await db.collection('players').get();
    const batch = db.batch();
    snap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    showToast('Semana zerada! Ranking limpo.');
  } catch (e) {
    console.error('Erro ao zerar:', e);
    showToast('Erro: ' + (e.code || e.message), 'error');
  }
});
// ===============================
// CONFIGURAÇÃO DO FIREBASE
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyCIga-4FApbkNLR2ycPMNVstrWAE2jN-NM",
  authDomain: "ranking-fortnite.firebaseapp.com",
  databaseURL: "https://ranking-fortnite-default-rtdb.firebaseio.com",
  projectId: "ranking-fortnite",
  storageBucket: "ranking-fortnite.firebasestorage.app",
  messagingSenderId: "997780363006",
  appId: "1:997780363006:web:f2e22d9724ceeef53577af"
};

// Verifica se a biblioteca Firebase foi carregada antes de inicializar
if (typeof firebase !== "undefined" ) {
    firebase.initializeApp(firebaseConfig);
    // Expõe o objeto de banco de dados globalmente para fácil acesso em outros scripts
    window.db = firebase.database();
    console.log("Firebase inicializado e 'db' disponível globalmente.");
} else {
    console.error("Erro: A biblioteca Firebase SDK não foi carregada. Verifique os scripts no HTML.");
}

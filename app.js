import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, deleteDoc, setDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithCustomToken, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBFR5q22-9AIGJYN6fFFJVV3p9LH6p5Ma8",
    authDomain: "torneios-nin.firebaseapp.com",
    projectId: "torneios-nin",
    storageBucket: "torneios-nin.firebasestorage.app",
    messagingSenderId: "466171413764",
    appId: "1:466171413764:web:77e537310a16c391193c51"
};
const DISCORD_CLIENT_ID = "1453817939265589452"; 
const BOT_API_URL = "https://torneionevoa.squareweb.app/auth/discord";
const SUPER_ADMINS = ["170310660167565323", "1410456333391761462", "1410661305227935875"]; 

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);

let currentUserRoles = [];
let userHasPermission = false;

// SISTEMA DE NOTIFICAÇÃO (TOAST)
window.showToast = (msg, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const icon = type === 'success' ? '<i class="fas fa-check-circle text-green-400 text-xl"></i>' : '<i class="fas fa-exclamation-circle text-red-400 text-xl"></i>';
    const borderClass = type === 'success' ? 'border-green-500/50' : 'border-red-500/50';
    
    toast.className = `toast flex items-center gap-3 bg-slate-800 border ${borderClass} p-4 rounded-lg shadow-xl min-w-[300px] z-50`;
    toast.innerHTML = `
        ${icon}
        <div class="flex-grow font-medium text-sm text-white">${msg}</div>
        <button onclick="this.parentElement.remove()" class="text-slate-500 hover:text-white"><i class="fas fa-times"></i></button>
    `;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};

// DADOS DE FORMATO (DESCRIÇÕES)
const FORMAT_INFO = {
    matches: {
        '1x1': "Duelo individual. Foco total em habilidade, leitura e execução. Simples, rápido e direto.",
        '2x2': "Duplas. Valoriza sinergia, comunicação e combinação de estilos.",
        '3x3': "Times médios. Permite estratégias profundas e papéis definidos.",
        '4x4': "Equipes grandes. Foco em coordenação, controle de área e decisões em grupo.",
        'ffa': "Cada jogador ou time enfrenta todos os outros. Caótico e divertido.",
        'nmp': "O vencedor permanece na arena até ser derrotado. Formato Rei da Mesa.",
        'nmp_random': "Times. Um alvo aleatório é escolhido. Vença derrotando o alvo inimigo."
    },
    structure: {
        'single_elim': "Perdeu, saiu. Ritmo acelerado e decisão constante.",
        'double_elim': "Segunda chance para quem perder. Mais justo, mais demorado.",
        'swiss': "Todos jogam várias rodadas. Confrontos ajustados por desempenho.",
        'groups_playoff': "Fase de grupos seguida por mata-mata.",
        'points': "Vitórias rendem pontos ao longo de várias rodadas."
    },
    shuffle: {
        'order': "Pareamentos seguem a ordem de entrada. Fácil, mas aleatório.",
        'random': "Sorteio livre. Simples e rápido.",
        'random_protected': "Sorteio com restrições para evitar confrontos repetidos.",
        'ranking': "Jogadores enfrentam oponentes de força semelhante.",
        'mirror': "Melhores contra Piores (Espelhamento).",
        'thematic': "Baseado em Clã ou Tema.",
        'narrative': "Confrontos para gerar história e rivalidade."
    }
};

// UI Helpers
const els = {
    loginBtn: document.getElementById('login-btn'), loadingBtn: document.getElementById('loading-btn'),
    loginScreen: document.getElementById('login-screen'), mainContent: document.getElementById('main-content'),
    userInfo: document.getElementById('user-info'), 
    newEventBtn: document.getElementById('new-event-btn'),
    settingsBtn: document.getElementById('settings-btn'), settingsModal: document.getElementById('settings-modal'),
    rolesList: document.getElementById('roles-list'), savePermsBtn: document.getElementById('save-permissions-btn'),
    detailsModal: document.getElementById('details-modal'), 
    startModal: document.getElementById('start-modal'), confirmStartBtn: document.getElementById('confirm-start-btn')
};

// --- ATUALIZA DESCRIÇÕES DINAMICAMENTE NO CREATE ---
function updateDescription() {
    const m = document.getElementById('t-match-format').value;
    const s = document.getElementById('t-structure').value;
    const h = document.getElementById('t-shuffle').value;
    
    const desc = `${FORMAT_INFO.matches[m] || ''} <br> 
                  <span class="text-slate-500">• ${FORMAT_INFO.structure[s] || ''}</span> <br> 
                  <span class="text-slate-500">• ${FORMAT_INFO.shuffle[h] || ''}</span>`;
    document.getElementById('format-description').innerHTML = desc;
}
document.getElementById('t-match-format').onchange = updateDescription;
document.getElementById('t-structure').onchange = updateDescription;
document.getElementById('t-shuffle').onchange = updateDescription;

// --- AUTH ---
els.loginBtn.onclick = () => window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}&response_type=code&scope=identify`;
window.addEventListener('load', async () => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
        window.history.replaceState({}, '', window.location.pathname);
        toggleLoading(true);
        try {
            const res = await fetch(BOT_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, redirectUri: window.location.origin + window.location.pathname }) });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            localStorage.setItem('discord_roles', JSON.stringify(data.roles || []));
            await signInWithCustomToken(auth, data.token);
            window.showToast("Login realizado com sucesso!", "success");
        } catch (e) { 
            console.error(e);
            window.showToast("Erro ao realizar login.", "error");
            toggleLoading(false); 
        }
    }
});
function toggleLoading(b) { els.loginBtn.classList.toggle('hidden', b); els.loadingBtn.classList.toggle('hidden', !b); }
document.getElementById('logout-btn').onclick = () => { localStorage.removeItem('discord_roles'); signOut(auth); };

onAuthStateChanged(auth, async u => {
    toggleLoading(false);
    if (u) {
        els.loginScreen.classList.add('hidden'); els.mainContent.classList.remove('hidden'); els.userInfo.classList.remove('hidden');
        document.getElementById('username').innerText = u.displayName; 
        
        let avatarUrl = u.photoURL;
        if (u.providerData && u.providerData.length > 0 && u.providerData[0].photoURL) {
            avatarUrl = u.providerData[0].photoURL;
        }
        if(!avatarUrl || avatarUrl.includes('undefined')) avatarUrl = "https://cdn.discordapp.com/embed/avatars/0.png";
        
        document.getElementById('user-avatar').src = avatarUrl;

        try { currentUserRoles = JSON.parse(localStorage.getItem('discord_roles') || "[]"); } catch(e) {}
        await checkPermissions(u.uid);
        startTournamentListener();
        if (SUPER_ADMINS.includes(u.uid)) { els.settingsBtn.classList.remove('hidden'); els.settingsBtn.onclick = openSettingsModal; }
    } else {
        els.loginScreen.classList.remove('hidden'); els.mainContent.classList.add('hidden'); els.userInfo.classList.add('hidden');
        els.newEventBtn.classList.add('hidden'); els.settingsBtn.classList.add('hidden');
    }
});

async function checkPermissions(uid) {
    userHasPermission = SUPER_ADMINS.includes(uid);
    if (!userHasPermission) {
        const s = await getDoc(doc(db, "config", "permissions"));
        if (s.exists()) userHasPermission = currentUserRoles.some(r => (s.data().allowed_create_roles || []).includes(r));
    }
    if (userHasPermission) {
        els.newEventBtn.classList.remove('hidden');
        els.newEventBtn.onclick = () => document.getElementById('create-modal').classList.remove('hidden');
    } else {
        els.newEventBtn.classList.add('hidden');
    }
}

// --- SETTINGS ---
async function openSettingsModal() {
    els.settingsModal.classList.remove('hidden');
    document.getElementById('roles-list-loader').classList.remove('hidden'); els.rolesList.innerHTML = "";
    const [rolesSnap, permsSnap] = await Promise.all([getDoc(doc(db, "config", "discord_roles")), getDoc(doc(db, "config", "permissions"))]);
    const allowed = permsSnap.exists() ? (permsSnap.data().allowed_create_roles || []) : [];
    document.getElementById('roles-list-loader').classList.add('hidden');
    if (rolesSnap.exists()) {
        rolesSnap.data().list.forEach(r => {
            if (r.name !== '@everyone') els.rolesList.innerHTML += `<label class="flex items-center p-3 rounded hover:bg-slate-700/50 cursor-pointer"><input type="checkbox" class="role-checkbox w-5 h-5 rounded text-green-600" value="${r.id}" ${allowed.includes(r.id)?'checked':''}><span class="ml-3 font-medium" style="color:${r.color}">${r.name}</span></label>`;
        });
    } else els.rolesList.innerHTML = "<p class='text-red-400'>Sem cargos. Reinicie o Bot.</p>";
}
els.savePermsBtn.onclick = async () => {
    const ids = Array.from(document.querySelectorAll('.role-checkbox:checked')).map(c => c.value);
    els.savePermsBtn.innerText = "Salvando...";
    await setDoc(doc(db, "config", "permissions"), { allowed_create_roles: ids }, { merge: true });
    els.savePermsBtn.innerText = "Salvo!"; setTimeout(() => { els.savePermsBtn.innerText = "Salvar"; els.settingsModal.classList.add('hidden'); if(auth.currentUser) checkPermissions(auth.currentUser.uid); window.showToast("Permissões atualizadas!"); }, 1000);
};

// --- CREATE ---
document.getElementById('create-tournament-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.closest('#create-modal').querySelector('button[onclick*="submit"]'); 
    const old = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
    try {
        await addDoc(collection(db, "tournaments"), {
            title: document.getElementById('t-title').value, 
            date: document.getElementById('t-date').value,
            description: document.getElementById('t-desc').value,
            // Novos Campos
            matchFormat: document.getElementById('t-match-format').value,
            structure: document.getElementById('t-structure').value,
            shuffle: document.getElementById('t-shuffle').value,
            
            status: "pending",
            createdAt: new Date(), createdBy: auth.currentUser.uid, participants: []
        });
        window.showToast("Torneio criado e enviado para o Discord!");
        document.getElementById('create-tournament-form').reset();
        document.getElementById('create-modal').classList.add('hidden');
    } catch (err) { window.showToast("Erro ao criar: " + err.message, "error"); }
    finally { btn.disabled = false; btn.innerHTML = old; }
};

// --- ACTIONS (DELETE & START & JOIN & DETAILS) ---
window.deleteTournament = async (id) => {
    if(!confirm("Tem certeza? Isso apagará o torneio do site e do Discord.")) return;
    try { 
        await deleteDoc(doc(db, "tournaments", id)); 
        document.getElementById('details-modal').classList.add('hidden');
        window.showToast("Torneio excluído com sucesso.");
    } catch(e) { window.showToast("Erro: " + e.message, "error"); }
};

window.openStartModal = async (id) => {
    document.getElementById('start-doc-id').value = id;
    els.startModal.classList.remove('hidden');
    document.getElementById('details-modal').classList.add('hidden');
    
    // Carregar dados salvos no torneio para preencher o modal
    const docSnap = await getDoc(doc(db, "tournaments", id));
    if (docSnap.exists()) {
        const d = docSnap.data();
        if(d.matchFormat) document.getElementById('start-match-format').value = d.matchFormat;
        if(d.structure) document.getElementById('start-structure').value = d.structure;
        if(d.shuffle) document.getElementById('start-shuffle').value = d.shuffle;
        
        // Sugerir modo lógico baseado na estrutura
        if(d.structure === 'single_elim') document.getElementById('start-logic-mode').value = 'elimination';
        else document.getElementById('start-logic-mode').value = 'battleroyale';
    }
};

window.joinTournament = async (id) => {
    try {
        const user = auth.currentUser;
        if(!user) return window.showToast("Você precisa estar logado.", "error");
        
        const docRef = doc(db, "tournaments", id);
        const snap = await getDoc(docRef);
        if(!snap.exists()) return;
        
        let parts = snap.data().participants || [];
        parts = parts.filter(p => p.id !== user.uid);
        parts.push({ id: user.uid, name: user.displayName, status: 'confirmed' });
        
        await updateDoc(docRef, { participants: parts });
        window.openDetails(id);
        window.showToast("Inscrição confirmada!", "success");
    } catch(e) { console.error(e); window.showToast("Erro ao entrar: " + e.message, "error"); }
};

window.openDetails = async (id) => {
    const modal = document.getElementById('details-modal');
    const titleEl = document.getElementById('modal-title');
    const dateEl = document.getElementById('modal-date');
    const descEl = document.getElementById('modal-desc');
    const statusBadge = document.getElementById('modal-status-badge');
    const formatBadge = document.getElementById('modal-format-badge');
    const formatDesc = document.getElementById('modal-format-desc');
    const adminControls = document.getElementById('modal-admin-controls');
    const joinArea = document.getElementById('modal-join-area');

    modal.classList.remove('hidden');
    titleEl.innerText = "Carregando...";
    
    const snap = await getDoc(doc(db, "tournaments", id));
    if (!snap.exists()) { modal.classList.add('hidden'); return; }
    const d = snap.data();

    titleEl.innerText = d.title;
    dateEl.innerText = d.date;
    descEl.innerText = d.description;
    
    // Format Info
    const matchText = FORMAT_INFO.matches[d.matchFormat] || '';
    formatBadge.innerText = d.matchFormat ? d.matchFormat.toUpperCase() : 'GERAL';
    formatDesc.innerText = matchText;

    let statusTag = `<span class="px-2 py-1 rounded text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">ABERTO PARA INSCRIÇÕES</span>`;
    if (d.status === 'pending') statusTag = `<span class="px-2 py-1 rounded text-xs font-bold bg-yellow-500/10 text-yellow-500 animate-pulse">PROCESSANDO...</span>`;
    if (d.status === 'started') statusTag = `<span class="px-2 py-1 rounded text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">🔴 EM ANDAMENTO</span>`;
    statusBadge.innerHTML = statusTag;

    const parts = d.participants || [];
    const filterParts = (s) => parts.filter(p => p.status === s);
    
    const fillList = (id, list) => {
        const el = document.getElementById(id);
        const countEl = document.getElementById('count-' + id.split('-')[1]);
        el.innerHTML = "";
        countEl.innerText = list.length;
        if(list.length === 0) el.innerHTML = "<span class='text-slate-600 italic text-xs'>Ninguém</span>";
        list.forEach(p => {
            el.innerHTML += `
                <div class="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-700/50">
                    <span class="text-slate-300">${p.name}</span>
                    ${p.reason ? `<i class="fas fa-info-circle text-slate-500 cursor-help" title="${p.reason}"></i>` : ''}
                </div>`;
        });
    };

    fillList('list-confirmed', filterParts('confirmed'));
    fillList('list-maybe', filterParts('maybe'));
    fillList('list-declined', filterParts('declined'));

    adminControls.innerHTML = "";
    adminControls.classList.add('hidden');
    if (userHasPermission) {
        adminControls.classList.remove('hidden');
        if (d.status !== 'started') {
            adminControls.innerHTML += `<button onclick="window.openStartModal('${id}')" class="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm font-bold shadow transition"><i class="fas fa-play mr-1"></i> Iniciar</button>`;
        }
        adminControls.innerHTML += `<button onclick="window.deleteTournament('${id}')" class="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm font-bold shadow transition"><i class="fas fa-trash mr-1"></i> Excluir</button>`;
    }

    const myId = auth.currentUser ? auth.currentUser.uid : null;
    const amIIn = parts.some(p => p.id === myId && p.status === 'confirmed');
    
    if (d.status !== 'started') {
        if (amIIn) {
            joinArea.innerHTML = `<div class="w-full bg-green-900/30 border border-green-500/30 text-green-400 py-3 rounded-lg text-center font-bold"><i class="fas fa-check-circle mr-2"></i> Você está confirmado!</div>`;
        } else {
            joinArea.innerHTML = `<button onclick="window.joinTournament('${id}')" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg transition transform hover:scale-[1.01]">Confirmar Presença</button>`;
        }
    } else {
        joinArea.innerHTML = `<div class="text-center text-slate-500 text-sm italic">Inscrições encerradas.</div>`;
    }
};

els.confirmStartBtn.onclick = async () => {
    const id = document.getElementById('start-doc-id').value;
    // Pega os valores possivelmente editados
    const matchFormat = document.getElementById('start-match-format').value;
    const structure = document.getElementById('start-structure').value;
    const shuffle = document.getElementById('start-shuffle').value;
    const logicMode = document.getElementById('start-logic-mode').value;
    
    els.confirmStartBtn.innerText = "Gerando..."; els.confirmStartBtn.disabled = true;
    try {
        const docRef = doc(db, "tournaments", id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) throw new Error("Torneio não existe.");
        
        let players = (snap.data().participants || []).filter(p => p.status === 'confirmed').map(p => ({ id: p.id, name: p.name }));
        if (players.length < 2) throw new Error("Mínimo de 2 participantes confirmados.");

        // Lógica de Embaralhamento (Se for random)
        if (shuffle === 'random' || shuffle === 'random_protected') {
            for (let i = players.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [players[i], players[j]] = [players[j], players[i]];
            }
        }

        let matches = [];
        // Se a lógica escolhida for "Mata-Mata (Chaves)"
        if (logicMode === 'elimination') {
            const totalMatches = Math.floor(players.length / 2);
            for(let i=0; i<totalMatches; i++) {
                matches.push({ round: 1, matchId: i+1, p1: players[i*2], p2: players[i*2+1], winner: null });
            }
            if (players.length % 2 !== 0) {
                matches.push({ round: 1, matchId: totalMatches + 1, p1: players[players.length - 1], p2: null, winner: players[players.length - 1].id, note: "Bye" });
            }
        }

        await updateDoc(docRef, { 
            status: 'started', 
            startedAt: new Date(), 
            // Salva as configurações finais usadas
            matchFormat: matchFormat,
            structure: structure,
            shuffle: shuffle,
            logicMode: logicMode,
            matches: matches, 
            finalParticipants: players 
        });
        els.startModal.classList.add('hidden');
        window.showToast("Torneio iniciado com sucesso!", "success");
        window.openDetails(id);
    } catch(e) { window.showToast("Erro: " + e.message, "error"); }
    finally { els.confirmStartBtn.innerText = "INICIAR"; els.confirmStartBtn.disabled = false; }
};

function startTournamentListener() {
    const list = document.getElementById('tournaments-list');
    document.getElementById('loader-tournaments').classList.remove('hidden');
    
    onSnapshot(query(collection(db, "tournaments"), orderBy("createdAt", "desc")), snapshot => {
        document.getElementById('loader-tournaments').classList.add('hidden');
        list.innerHTML = "";
        if (snapshot.empty) return list.innerHTML = `<div class="col-span-full text-center text-slate-500 py-10">Nenhum evento.</div>`;

        snapshot.forEach(doc => {
            const d = doc.data();
            if(d.status === 'finished') return;

            const conf = (d.participants||[]).filter(p=>p.status==='confirmed').length;
            
            let statusTag = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">ABERTO</span>`;
            if (d.status === 'pending') statusTag = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500 animate-pulse">...</span>`;
            if (d.status === 'started') statusTag = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">AO VIVO</span>`;

            // Formato Badge
            const formatLabel = d.matchFormat ? d.matchFormat.toUpperCase() : 'GERAL';

            list.innerHTML += `
                <div onclick="window.openDetails('${doc.id}')" class="bg-slate-800 rounded-xl border border-slate-700 hover:border-yellow-500/50 transition duration-300 group overflow-hidden flex flex-col h-full shadow-lg cursor-pointer relative transform hover:-translate-y-1">
                    <div class="p-5 flex-grow relative">
                        <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><i class="fas fa-trophy text-6xl text-yellow-500"></i></div>
                        <div class="flex justify-between items-start mb-4">
                            ${statusTag} 
                            <div class="flex gap-1">
                                <span class="text-[10px] font-mono bg-slate-700 px-1 rounded text-slate-300">${formatLabel}</span>
                                <span class="text-xs text-slate-500 font-mono">#${doc.id.substr(0,4)}</span>
                            </div>
                        </div>
                        <h3 class="font-bold text-lg text-white mb-2 leading-tight">${d.title}</h3>
                        <div class="flex items-center gap-2 text-xs text-yellow-500 font-medium mb-4 bg-slate-900/50 w-fit px-2 py-1 rounded"><i class="far fa-clock"></i> ${d.date}</div>
                        <p class="text-slate-400 text-sm line-clamp-3 mb-4 border-l-2 border-slate-700 pl-3">${d.description}</p>
                    </div>
                    <div class="bg-slate-900/50 border-t border-slate-700/50 p-3 flex justify-between items-center text-xs text-slate-400">
                        <span><i class="fas fa-users text-green-500 mr-1"></i> <b>${conf}</b> Confirmados</span>
                        <span class="text-yellow-500 hover:underline">Ver detalhes <i class="fas fa-arrow-right ml-1"></i></span>
                    </div>
                </div>
            `;
        });
    });
}

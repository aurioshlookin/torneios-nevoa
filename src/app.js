import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { collection, addDoc, deleteDoc, updateDoc, doc, getDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { signInWithCustomToken, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";

import { db, auth } from './config/firebase.js';
import { SUPER_ADMINS, DISCORD_CLIENT_ID, BOT_API_URL } from './config/constants.js';

import LoginScreen from './components/LoginScreen.js';
import Header from './components/Header.js';
import TournamentCard from './components/TournamentCard.js';
import CreateModal from './components/CreateModal.js';
import DetailsModal from './components/DetailsModal.js';
import StartModal from './components/StartModal.js';
import SettingsModal from './components/SettingsModal.js';

// Configurar persistência
setPersistence(auth, browserLocalPersistence).catch(console.error);

const App = () => {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [tournaments, setTournaments] = useState([]);
    const [loadingTournaments, setLoadingTournaments] = useState(false);
    
    // Modais
    const [showCreate, setShowCreate] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [showStart, setShowStart] = useState(false); // ID do torneio para iniciar

    // Permissões
    const [hasPermission, setHasPermission] = useState(false);
    const [toasts, setToasts] = useState([]);

    // --- TOAST SYSTEM ---
    const showToast = (msg, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    // --- AUTH LOGIC ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                // Recuperar avatar correto
                let avatar = u.photoURL;
                if (!avatar && u.providerData?.[0]?.photoURL) avatar = u.providerData[0].photoURL;
                if (!avatar) avatar = "https://cdn.discordapp.com/embed/avatars/0.png";
                
                setUser({ uid: u.uid, displayName: u.displayName, avatarUrl: avatar });
                await checkPermission(u.uid);
            } else {
                setUser(null);
            }
            setLoadingAuth(false);
        });

        // Verificar código de login na URL (Callback do Discord)
        const code = new URLSearchParams(window.location.search).get('code');
        if (code) handleDiscordCallback(code);

        return () => unsubscribe();
    }, []);

    const handleDiscordCallback = async (code) => {
        window.history.replaceState({}, '', window.location.pathname);
        setLoadingAuth(true);
        try {
            const res = await fetch(BOT_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, redirectUri: window.location.origin + window.location.pathname })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            
            // Salvar roles para verificação de permissão
            localStorage.setItem('discord_roles', JSON.stringify(data.roles || []));
            
            await signInWithCustomToken(auth, data.token);
            showToast('Login realizado!', 'success');
        } catch (e) {
            console.error(e);
            showToast('Erro no login: ' + e.message, 'error');
            setLoadingAuth(false);
        }
    };

    const handleLogin = () => {
        const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
        window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=identify`;
    };

    const handleLogout = () => {
        signOut(auth);
        localStorage.removeItem('discord_roles');
    };

    const checkPermission = async (uid) => {
        if (SUPER_ADMINS.includes(uid)) {
            setHasPermission(true);
            return;
        }
        try {
            const snap = await getDoc(doc(db, "config", "permissions"));
            if (snap.exists()) {
                const allowedRoles = snap.data().allowed_create_roles || [];
                const myRoles = JSON.parse(localStorage.getItem('discord_roles') || "[]");
                setHasPermission(myRoles.some(r => allowedRoles.includes(r)));
            } else {
                setHasPermission(false);
            }
        } catch (e) {
            console.error("Erro perm:", e);
            setHasPermission(false);
        }
    };

    // --- DATA LOGIC ---
    useEffect(() => {
        if (!user) return;
        setLoadingTournaments(true);
        const q = query(collection(db, "tournaments"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setTournaments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoadingTournaments(false);
        });
        return () => unsub();
    }, [user]);

    // --- ACTIONS ---
    const handleCreate = async (formData) => {
        try {
            await addDoc(collection(db, "tournaments"), {
                ...formData,
                status: "pending",
                createdAt: new Date(),
                createdBy: user.uid,
                participants: []
            });
            setShowCreate(false);
            showToast("Torneio criado com sucesso!");
        } catch (e) { showToast(e.message, 'error'); }
    };

    const handleJoin = async (id) => {
        try {
            const ref = doc(db, "tournaments", id);
            const snap = await getDoc(ref);
            if (!snap.exists()) return;
            
            let parts = snap.data().participants || [];
            parts = parts.filter(p => p.id !== user.uid);
            parts.push({ id: user.uid, name: user.displayName, status: 'confirmed' });
            
            await updateDoc(ref, { participants: parts });
            
            // Atualiza modal se estiver aberto
            if (selectedTournament?.id === id) {
                setSelectedTournament({ ...selectedTournament, participants: parts });
            }
            showToast("Inscrição confirmada!");
        } catch (e) { showToast(e.message, 'error'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir?")) return;
        try {
            await deleteDoc(doc(db, "tournaments", id));
            setSelectedTournament(null);
            showToast("Torneio excluído.");
        } catch (e) { showToast(e.message, 'error'); }
    };

    const handleStart = async (id, config) => {
        try {
            const ref = doc(db, "tournaments", id);
            const snap = await getDoc(ref);
            if (!snap.exists()) throw new Error("Torneio não encontrado");
            
            const data = snap.data();
            let players = (data.participants || []).filter(p => p.status === 'confirmed').map(p => ({ id: p.id, name: p.name }));
            
            if (players.length < 2) throw new Error("Mínimo de 2 jogadores confirmados.");

            // Shuffle Logic
            if (config.shuffle === 'random' || config.shuffle === 'random_protected') {
                for (let i = players.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [players[i], players[j]] = [players[j], players[i]];
                }
            }

            let matches = [];
            if (config.logicMode === 'elimination') {
                const totalMatches = Math.floor(players.length / 2);
                for(let i=0; i<totalMatches; i++) {
                    matches.push({ round: 1, matchId: i+1, p1: players[i*2], p2: players[i*2+1], winner: null });
                }
                if (players.length % 2 !== 0) {
                    matches.push({ round: 1, matchId: totalMatches + 1, p1: players[players.length - 1], p2: null, winner: players[players.length - 1].id, note: "Bye" });
                }
            }

            await updateDoc(ref, {
                status: 'started',
                startedAt: new Date(),
                ...config,
                matches,
                finalParticipants: players
            });

            setShowStart(false);
            if (selectedTournament) setSelectedTournament({ ...selectedTournament, status: 'started' }); // Atualização otimista simples
            showToast("Torneio iniciado!");
        } catch (e) { showToast(e.message, 'error'); }
    };

    // --- RENDER ---
    if (loadingAuth) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><i className="fas fa-circle-notch fa-spin text-4xl text-cyan-500"></i></div>;

    if (!user) return <LoginScreen onLogin={handleLogin} />;

    return (
        <>
            {/* Toast Container */}
            <div className="fixed top-20 right-5 z-[100] flex flex-col gap-3">
                {toasts.map(t => (
                    <div key={t.id} className={`flex items-center gap-3 bg-slate-800 border p-4 rounded-lg shadow-xl min-w-[300px] toast-enter-active ${t.type === 'error' ? 'border-red-500/50' : 'border-green-500/50'}`}>
                        <i className={`fas ${t.type === 'error' ? 'fa-exclamation-circle text-red-400' : 'fa-check-circle text-green-400'} text-xl`}></i>
                        <div className="flex-grow font-medium text-sm text-white">{t.msg}</div>
                    </div>
                ))}
            </div>

            <Header 
                user={user} 
                hasPermission={hasPermission} 
                onOpenCreate={() => setShowCreate(true)} 
                onOpenSettings={() => setShowSettings(true)}
                onLogout={handleLogout}
            />

            <main className="container mx-auto p-6 flex-grow">
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Mural de Eventos</h2>
                    <div className="h-1 flex-grow bg-slate-800 rounded-full overflow-hidden"><div className="h-full w-24 bg-yellow-500/50 rounded-full"></div></div>
                    {loadingTournaments && <i className="fas fa-sync fa-spin text-yellow-500"></i>}
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {tournaments.map(t => (
                        <TournamentCard 
                            key={t.id} 
                            tournament={t} 
                            onClick={setSelectedTournament} 
                            currentUserId={user.uid}
                            hasPermission={hasPermission}
                        />
                    ))}
                    {!loadingTournaments && tournaments.length === 0 && (
                        <div className="col-span-full text-center text-slate-500 py-20">Nenhum evento encontrado.</div>
                    )}
                </div>
            </main>

            <footer className="bg-slate-900 border-t border-slate-800 p-6 text-center mt-auto">
                <p className="text-slate-500 text-sm">Sistema da Névoa &bull; Integrado ao Discord</p>
            </footer>

            {/* MODAIS */}
            {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
            
            {selectedTournament && (
                <DetailsModal 
                    tournament={selectedTournament} 
                    user={user}
                    hasPermission={hasPermission}
                    onClose={() => setSelectedTournament(null)} 
                    onJoin={handleJoin}
                    onDelete={handleDelete}
                    onOpenStart={(t) => { setShowStart(t); /* setSelectedTournament(null); */ }}
                />
            )}

            {showStart && (
                <StartModal 
                    tournament={showStart}
                    onClose={() => setShowStart(false)}
                    onConfirm={handleStart}
                />
            )}

            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSave={() => { checkPermission(user.uid); setShowSettings(false); showToast("Permissões recarregadas!"); }} />}
        </>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);

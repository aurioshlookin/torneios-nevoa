// --- App Principal ---
// Dependências globais (React, firebase, etc) já injetadas pelo loader

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
    const [showStart, setShowStart] = useState(false); 
    const [showBrackets, setShowBrackets] = useState(null);

    const [hasPermission, setHasPermission] = useState(false);
    const [toasts, setToasts] = useState([]);

    const showToast = (msg, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    // --- Hooks e Auth (Mantidos iguais) ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
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

    useEffect(() => {
        if (!user) return;
        setLoadingTournaments(true);
        const q = query(collection(db, "tournaments"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setTournaments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoadingTournaments(false);
            if (selectedTournament) {
                const updated = snap.docs.find(d => d.id === selectedTournament.id);
                if (updated) setSelectedTournament({ id: updated.id, ...updated.data() });
            }
            if (showBrackets) {
                const updated = snap.docs.find(d => d.id === showBrackets.id);
                if (updated) setShowBrackets({ id: updated.id, ...updated.data() });
            }
        });
        return () => unsub();
    }, [user, selectedTournament?.id, showBrackets?.id]);

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

    const handleAddBot = async (tournamentId, botName) => {
        try {
            const ref = doc(db, "tournaments", tournamentId);
            const snap = await getDoc(ref);
            if (!snap.exists()) return;
            let parts = snap.data().participants || [];
            const botId = `bot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            parts.push({ id: botId, name: botName, status: 'confirmed', isBot: true });
            await updateDoc(ref, { participants: parts });
            showToast(`Bot "${botName}" adicionado!`);
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

    // --- LÓGICA DE PARTIDAS E PONTUAÇÃO ---

    const generateSwissPairings = (participants, matches, roundNum, nextMatchId) => {
        const scores = {};
        participants.forEach(p => scores[p.id] = 0);
        
        matches.forEach(m => {
            if (m.winner) {
                scores[m.winner] += 3; 
            }
        });

        let sorted = [...participants].sort(() => Math.random() - 0.5);
        sorted.sort((a, b) => scores[b.id] - scores[a.id]);

        const newMatches = [];
        const paired = new Set();

        for (let i = 0; i < sorted.length; i++) {
            if (paired.has(sorted[i].id)) continue;
            
            const p1 = sorted[i];
            let p2 = null;

            for (let j = i + 1; j < sorted.length; j++) {
                if (!paired.has(sorted[j].id)) {
                    p2 = sorted[j];
                    break;
                }
            }

            if (p2) {
                newMatches.push({ round: roundNum, matchId: nextMatchId++, p1, p2, winner: null });
                paired.add(p1.id);
                paired.add(p2.id);
            } else {
                newMatches.push({ round: roundNum, matchId: nextMatchId++, p1, p2: null, winner: p1.id, note: "Bye (Pontos)" });
                paired.add(p1.id);
            }
        }
        return newMatches;
    };

    const handleSetWinner = async (tournamentId, matchId, winnerId) => {
        if (!window.confirm("Confirmar vencedor? Essa ação avança a chave.")) return;
        
        try {
            const ref = doc(db, "tournaments", tournamentId);
            const snap = await getDoc(ref);
            if (!snap.exists()) return;
            const data = snap.data();
            
            let matches = [...data.matches];
            const matchIndex = matches.findIndex(m => m.matchId === matchId);
            if (matchIndex === -1) return;

            matches[matchIndex].winner = winnerId;
            const winner = data.finalParticipants.find(p => p.id === winnerId);

            const currentRound = matches[matchIndex].round;
            const matchesInRound = matches.filter(m => m.round === currentRound);
            const isRoundComplete = matchesInRound.every(m => m.winner);

            if (isRoundComplete) {
                const isElimination = data.structure === 'single_elim' || data.structure === 'double_elim';
                
                if (isElimination && matchesInRound.length === 1) {
                    await updateDoc(ref, { matches, status: 'finished', winner: winner });
                    showToast(`🏆 TORNEIO FINALIZADO! Vencedor: ${winner.name}`);
                    return;
                }

                const nextRoundNum = currentRound + 1;
                let nextMatchId = Math.max(...matches.map(m => m.matchId)) + 1;
                let nextRoundMatches = [];

                if (data.structure === 'swiss') {
                    const maxRounds = Math.ceil(Math.log2(data.finalParticipants.length)) + 1;
                    
                    if (currentRound >= maxRounds) {
                        await updateDoc(ref, { matches, status: 'finished', winner: winner });
                        showToast("Fim das rodadas Suíças!");
                        return;
                    }

                    nextRoundMatches = generateSwissPairings(data.finalParticipants, matches, nextRoundNum, nextMatchId);
                
                } else {
                    const winners = matchesInRound.map(m => data.finalParticipants.find(p => p.id === m.winner));
                    for (let i = 0; i < winners.length; i += 2) {
                        if (i + 1 < winners.length) {
                            nextRoundMatches.push({
                                round: nextRoundNum,
                                matchId: nextMatchId++,
                                p1: winners[i],
                                p2: winners[i+1],
                                winner: null
                            });
                        } else {
                            nextRoundMatches.push({
                                round: nextRoundNum,
                                matchId: nextMatchId++,
                                p1: winners[i],
                                p2: null,
                                winner: winners[i].id,
                                note: "Bye"
                            });
                        }
                    }
                }

                matches = [...matches, ...nextRoundMatches];
                showToast("Rodada concluída! Próxima rodada gerada.");
            } else {
                showToast("Vencedor definido!");
            }

            await updateDoc(ref, { matches });

        } catch (e) { showToast(e.message, 'error'); }
    };

    const handleStart = async (id, config) => {
        try {
            const ref = doc(db, "tournaments", id);
            const snap = await getDoc(ref);
            if (!snap.exists()) throw new Error("Torneio não encontrado");
            const data = snap.data();
            
            // 1. Filtrar Confirmados
            let confirmedPlayers = (data.participants || []).filter(p => p.status === 'confirmed');
            
            // 2. Embaralhar Inicial
            if (config.shuffle === 'random' || config.shuffle === 'random_protected') {
                for (let i = confirmedPlayers.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [confirmedPlayers[i], confirmedPlayers[j]] = [confirmedPlayers[j], confirmedPlayers[i]];
                }
            }

            // 3. Formação de Times (AGORA LÊ A PROPRIEDADE PARTNERS DO FIREBASE)
            let entities = []; 
            let teamSize = 1;
            
            if (config.matchFormat === '2x2') teamSize = 2;
            else if (config.matchFormat === '3x3') teamSize = 3;
            else if (config.matchFormat === '4x4') teamSize = 4;

            if (teamSize > 1) {
                // Estratégia Híbrida:
                // Prioridade 1: Quem já se registrou como Time (tem 'partners')
                // Prioridade 2: Agrupar quem está sozinho (Solos)

                const preFormedTeams = [];
                const soloPlayers = [];
                const processedIds = new Set();

                // Identifica times pré-formados
                confirmedPlayers.forEach(p => {
                    if (processedIds.has(p.id)) return;

                    if (p.partners && Array.isArray(p.partners) && p.partners.length > 0) {
                        // É um time pré-definido
                        const members = [p, ...p.partners];
                        // Marca IDs como processados para não duplicar se o parceiro também estiver na lista principal
                        members.forEach(m => processedIds.add(m.id));
                        
                        const teamName = `Time ${p.name}`; 
                        preFormedTeams.push({
                            id: `team-${p.id}`,
                            name: teamName,
                            isTeam: true,
                            members: members
                        });
                    } else {
                        soloPlayers.push(p);
                    }
                });

                // Adiciona times pré-formados às entidades
                entities = [...preFormedTeams];

                // Agrupa jogadores solo restantes
                let teamCount = preFormedTeams.length + 1;
                for (let i = 0; i < soloPlayers.length; i += teamSize) {
                    const chunk = soloPlayers.slice(i, i + teamSize);
                    if (chunk.length === teamSize) {
                        const teamName = `Time ${teamCount} (${chunk.map(p => p.name).join(', ')})`;
                        entities.push({
                            id: `team-auto-${teamCount}`,
                            name: teamName,
                            isTeam: true,
                            members: chunk
                        });
                        teamCount++;
                    } else {
                        // Sobras (poderiam ser reservas ou bye)
                        // Por enquanto ignoramos ou criamos time incompleto
                         const teamName = `Time ${teamCount} (${chunk.map(p => p.name).join(', ')})`;
                        entities.push({
                            id: `team-auto-${teamCount}`,
                            name: teamName,
                            isTeam: true,
                            members: chunk,
                            note: "Incompleto"
                        });
                    }
                }
            } else {
                // 1x1
                entities = confirmedPlayers.map(p => ({ id: p.id, name: p.name, isTeam: false }));
            }

            if (entities.length < 2) throw new Error(`Participantes/Times insuficientes para iniciar.`);

            // 4. Geração de Partidas (Round 1)
            let matches = [];
            
            if (config.logicMode === 'elimination') {
                const totalMatches = Math.floor(entities.length / 2);
                for(let i=0; i<totalMatches; i++) {
                    matches.push({ round: 1, matchId: i+1, p1: entities[i*2], p2: entities[i*2+1], winner: null });
                }
                if (entities.length % 2 !== 0) {
                    matches.push({ round: 1, matchId: totalMatches + 1, p1: entities[entities.length - 1], p2: null, winner: entities[entities.length - 1].id, note: "Bye" });
                }
            }

            await updateDoc(ref, {
                status: 'started',
                startedAt: new Date(),
                ...config,
                matches,
                finalParticipants: entities 
            });

            setShowStart(false);
            showToast("Torneio iniciado! Times formados.");
        } catch (e) { showToast(e.message, 'error'); }
    };

    if (loadingAuth) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><i className="fas fa-circle-notch fa-spin text-4xl text-cyan-500"></i></div>;

    if (!user) return <LoginScreen onLogin={handleLogin} />;

    return (
        <>
            <div className="fixed top-20 right-5 z-[100] flex flex-col gap-3">
                {toasts.map(t => (
                    <div key={t.id} className={`flex items-center gap-3 bg-slate-800 border p-4 rounded-lg shadow-xl min-w-[300px] toast-enter-active ${t.type === 'error' ? 'border-red-500/50' : 'border-green-500/50'}`}>
                        <i className={`fas ${t.type === 'error' ? 'fa-exclamation-circle text-red-400' : 'fa-check-circle text-green-400'} text-xl`}></i>
                        <div className="flex-grow font-medium text-sm text-white">{t.msg}</div>
                    </div>
                ))}
            </div>

            <Header user={user} hasPermission={hasPermission} onOpenCreate={() => setShowCreate(true)} onOpenSettings={() => setShowSettings(true)} onLogout={handleLogout} />

            <main className="container mx-auto p-6 flex-grow">
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Mural de Eventos</h2>
                    <div className="h-1 flex-grow bg-slate-800 rounded-full overflow-hidden"><div className="h-full w-24 bg-yellow-500/50 rounded-full"></div></div>
                    {loadingTournaments && <i className="fas fa-sync fa-spin text-yellow-500"></i>}
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {tournaments.map(t => (
                        <TournamentCard key={t.id} tournament={t} onClick={setSelectedTournament} currentUserId={user.uid} hasPermission={hasPermission} />
                    ))}
                    {!loadingTournaments && tournaments.length === 0 && (
                        <div className="col-span-full text-center text-slate-500 py-20">Nenhum evento encontrado.</div>
                    )}
                </div>
            </main>

            <footer className="bg-slate-900 border-t border-slate-800 p-6 text-center mt-auto">
                <p className="text-slate-500 text-sm">Sistema da Névoa &bull; Integrado ao Discord</p>
            </footer>

            {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
            
            {selectedTournament && (
                <DetailsModal 
                    tournament={selectedTournament} 
                    user={user}
                    hasPermission={hasPermission}
                    onClose={() => setSelectedTournament(null)} 
                    onAddBot={handleAddBot}
                    onDelete={handleDelete}
                    onOpenStart={(t) => { setShowStart(t); }}
                    onOpenBrackets={(t) => { setShowBrackets(t); }}
                />
            )}

            {showBrackets && (
                <BracketsModal 
                    tournament={showBrackets}
                    user={user}
                    hasPermission={hasPermission}
                    onClose={() => setShowBrackets(null)}
                    onSetWinner={handleSetWinner}
                />
            )}

            {showStart && <StartModal tournament={showStart} onClose={() => setShowStart(false)} onConfirm={handleStart} />}

            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSave={() => { checkPermission(user.uid); setShowSettings(false); showToast("Permissões recarregadas!"); }} />}
        </>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);

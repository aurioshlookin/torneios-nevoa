// --- BracketsModal.js ---
// Renderiza o chaveamento e permite definir vencedores

const BracketsModal = ({ tournament, onClose, onSetWinner, user, hasPermission }) => {
    if (!tournament) return null;
    const { matches, logicMode, finalParticipants, status, winner } = tournament;

    // Se não for modo de chaves ou não tiver partidas
    if (logicMode !== 'elimination' || !matches || matches.length === 0) {
        return (
            <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 text-center max-w-md shadow-2xl">
                    <i className="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                    <h3 className="text-xl font-bold text-white mb-2">Modo Lista Única</h3>
                    <p className="text-slate-400 mb-6">Este torneio não usa sistema de chaves automáticas. Gerencie os resultados manualmente in-game.</p>
                    <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded transition">Fechar</button>
                </div>
            </div>
        );
    }

    // Agrupa partidas por rodada
    const rounds = {};
    matches.forEach(m => {
        if (!rounds[m.round]) rounds[m.round] = [];
        rounds[m.round].push(m);
    });

    const totalRounds = Object.keys(rounds).length;

    return (
        <div className="fixed inset-0 z-[80] bg-black/95 flex flex-col animate-fade-in">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center shadow-lg z-10">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <i className="fas fa-sitemap text-green-500"></i> Chaveamento
                        {status === 'finished' && <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded border border-yellow-500/30">🏆 FINALIZADO</span>}
                    </h2>
                    <p className="text-slate-400 text-sm">{tournament.title}</p>
                </div>
                <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white p-2 px-4 rounded transition border border-slate-700">
                    <i className="fas fa-times mr-2"></i> Fechar
                </button>
            </div>

            {/* Vencedor Final Banner */}
            {status === 'finished' && winner && (
                <div className="bg-gradient-to-r from-yellow-900/50 to-slate-900 border-b border-yellow-500/30 p-4 text-center">
                    <h3 className="text-yellow-400 font-bold text-lg animate-pulse">👑 CAMPEÃO: {winner.name} 👑</h3>
                </div>
            )}

            {/* Área de Chaves com Scroll Horizontal */}
            <div className="flex-grow overflow-auto p-8 cursor-grab active:cursor-grabbing bg-slate-900 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                <div className="flex gap-16 min-w-max mx-auto justify-center pt-10">
                    {Object.keys(rounds).map(roundNum => {
                        const isFinal = parseInt(roundNum) === totalRounds;
                        return (
                            <div key={roundNum} className="flex flex-col justify-center gap-8 w-80">
                                <h4 className={`text-center font-bold uppercase tracking-widest text-sm py-2 rounded border shadow-lg mb-4
                                    ${isFinal ? 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}
                                `}>
                                    {isFinal ? 'Grande Final' : `Rodada ${roundNum}`}
                                </h4>
                                
                                {rounds[roundNum].map(match => {
                                    const p1 = match.p1;
                                    const p2 = match.p2;
                                    const isWinnerP1 = match.winner === p1?.id;
                                    const isWinnerP2 = match.winner === p2?.id;
                                    const hasWinner = !!match.winner;

                                    return (
                                        <div key={match.matchId} className="relative group">
                                            {/* Conector (Linha para próxima rodada) */}
                                            {!isFinal && (
                                                <div className="absolute -right-8 top-1/2 w-8 h-0.5 bg-slate-700 group-hover:bg-slate-500 transition"></div>
                                            )}

                                            <div className="bg-slate-800 border border-slate-600 rounded-lg overflow-hidden shadow-xl transition hover:border-slate-500 hover:shadow-2xl">
                                                {/* Header Partida */}
                                                <div className="bg-slate-950/50 p-1.5 text-[10px] text-center text-slate-500 border-b border-slate-700 flex justify-between px-3">
                                                    <span>Match #{match.matchId}</span>
                                                    {match.note && <span className="text-yellow-500/70">{match.note}</span>}
                                                </div>

                                                {/* Player/Team 1 */}
                                                <div 
                                                    onClick={() => hasPermission && !hasWinner && p1 && p2 && onSetWinner(tournament.id, match.matchId, p1.id)}
                                                    className={`p-3 flex justify-between items-center transition relative
                                                        ${isWinnerP1 ? 'bg-green-900/20 text-green-400 font-bold' : 'bg-slate-800 text-slate-300'}
                                                        ${!hasWinner && p1 && p2 && hasPermission ? 'hover:bg-slate-700 cursor-pointer hover:text-white' : ''}
                                                        ${!p1 ? 'opacity-50' : ''}
                                                    `}
                                                    title={p1 ? p1.name : ''}
                                                >
                                                    {/* Nome com suporte a quebra de linha para times grandes */}
                                                    <span className="truncate max-w-[200px] text-sm block">{p1 ? p1.name : 'Aguardando...'}</span>
                                                    {isWinnerP1 && <i className="fas fa-check-circle text-green-500 flex-shrink-0 ml-2"></i>}
                                                    {/* Indicador de clique para admin */}
                                                    {!hasWinner && p1 && p2 && hasPermission && (
                                                        <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 flex items-center justify-center">
                                                            <span className="text-[10px] bg-black/50 px-2 rounded">Venceu?</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="h-px bg-slate-700 w-full relative">
                                                    <div className="absolute left-1/2 -translate-x-1/2 -top-2 bg-slate-700 text-[9px] px-1 rounded text-slate-400 font-bold">VS</div>
                                                </div>

                                                {/* Player/Team 2 */}
                                                <div 
                                                    onClick={() => hasPermission && !hasWinner && p1 && p2 && onSetWinner(tournament.id, match.matchId, p2.id)}
                                                    className={`p-3 flex justify-between items-center transition relative
                                                        ${isWinnerP2 ? 'bg-green-900/20 text-green-400 font-bold' : 'bg-slate-800 text-slate-300'}
                                                        ${!hasWinner && p1 && p2 && hasPermission ? 'hover:bg-slate-700 cursor-pointer hover:text-white' : ''}
                                                        ${!p2 && match.note !== 'Bye' ? 'opacity-50' : ''}
                                                    `}
                                                    title={p2 ? p2.name : ''}
                                                >
                                                    <span className="truncate max-w-[200px] text-sm block">{p2 ? p2.name : (match.note === 'Bye' ? '-' : 'Aguardando...')}</span>
                                                    {isWinnerP2 && <i className="fas fa-check-circle text-green-500 flex-shrink-0 ml-2"></i>}
                                                    {!hasWinner && p1 && p2 && hasPermission && (
                                                        <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 flex items-center justify-center">
                                                            <span className="text-[10px] bg-black/50 px-2 rounded">Venceu?</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

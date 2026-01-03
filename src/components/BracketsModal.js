import React from 'react';

const BracketsModal = ({ tournament, onClose, onSetWinner, user, hasPermission }) => {
    if (!tournament) return null;
    const { matches, logicMode, finalParticipants } = tournament;

    // Se não for modo de chaves, avisa
    if (logicMode !== 'elimination' || !matches || matches.length === 0) {
        return (
            <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 text-center max-w-md">
                    <i className="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                    <h3 className="text-xl font-bold text-white mb-2">Modo Lista Única</h3>
                    <p className="text-slate-400 mb-6">Este torneio não usa sistema de chaves automáticas. Gerencie os resultados manualmente in-game.</p>
                    <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded">Fechar</button>
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

    return (
        <div className="fixed inset-0 z-[80] bg-black/95 flex flex-col animate-fade-in">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center shadow-lg z-10">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <i className="fas fa-sitemap text-green-500"></i> Chaveamento
                    </h2>
                    <p className="text-slate-400 text-sm">{tournament.title}</p>
                </div>
                <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white p-2 px-4 rounded transition">
                    <i className="fas fa-times mr-2"></i> Fechar
                </button>
            </div>

            {/* Área de Zoom/Scroll */}
            <div className="flex-grow overflow-auto p-8 cursor-grab active:cursor-grabbing bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                <div className="flex gap-12 min-w-max mx-auto justify-center">
                    {Object.keys(rounds).map(roundNum => (
                        <div key={roundNum} className="flex flex-col justify-center gap-8 w-64">
                            <h4 className="text-center font-bold text-green-400 uppercase tracking-widest text-sm bg-slate-900/80 py-1 rounded border border-green-500/30">
                                {roundNum == Object.keys(rounds).length ? 'Grande Final' : `Rodada ${roundNum}`}
                            </h4>
                            
                            {rounds[roundNum].map(match => {
                                const p1 = match.p1;
                                const p2 = match.p2;
                                const isWinnerP1 = match.winner === p1?.id;
                                const isWinnerP2 = match.winner === p2?.id;

                                return (
                                    <div key={match.matchId} className="relative group">
                                        {/* Conectores (Linhas) */}
                                        {roundNum < Object.keys(rounds).length && (
                                            <div className="absolute -right-6 top-1/2 w-6 h-0.5 bg-slate-600"></div>
                                        )}

                                        <div className="bg-slate-800 border border-slate-600 rounded-lg overflow-hidden shadow-xl">
                                            {/* Header Partida */}
                                            <div className="bg-slate-900/50 p-1 text-[10px] text-center text-slate-500 border-b border-slate-700">
                                                Match #{match.matchId}
                                            </div>

                                            {/* Player 1 */}
                                            <div 
                                                onClick={() => hasPermission && !match.winner && p1 && p2 && onSetWinner(tournament.id, match.matchId, p1.id)}
                                                className={`p-3 flex justify-between items-center transition
                                                    ${isWinnerP1 ? 'bg-green-900/40 text-green-400' : 'bg-slate-800 text-slate-300'}
                                                    ${!match.winner && p1 && p2 && hasPermission ? 'hover:bg-slate-700 cursor-pointer' : ''}
                                                    ${!p1 ? 'opacity-50' : ''}
                                                `}
                                            >
                                                <span className="font-bold truncate max-w-[140px]">{p1 ? p1.name : 'Aguardando...'}</span>
                                                {isWinnerP1 && <i className="fas fa-check-circle"></i>}
                                            </div>

                                            <div className="h-px bg-slate-700 w-full"></div>

                                            {/* Player 2 */}
                                            <div 
                                                onClick={() => hasPermission && !match.winner && p1 && p2 && onSetWinner(tournament.id, match.matchId, p2.id)}
                                                className={`p-3 flex justify-between items-center transition
                                                    ${isWinnerP2 ? 'bg-green-900/40 text-green-400' : 'bg-slate-800 text-slate-300'}
                                                    ${!match.winner && p1 && p2 && hasPermission ? 'hover:bg-slate-700 cursor-pointer' : ''}
                                                    ${!p2 && match.note !== 'Bye' ? 'opacity-50' : ''}
                                                `}
                                            >
                                                <span className="font-bold truncate max-w-[140px]">{p2 ? p2.name : (match.note === 'Bye' ? 'Bye' : 'Aguardando...')}</span>
                                                {isWinnerP2 && <i className="fas fa-check-circle"></i>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BracketsModal;

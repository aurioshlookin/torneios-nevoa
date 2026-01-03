import React from 'react';
import { FORMAT_INFO } from '../config/constants.js';

const DetailsModal = ({ tournament, onClose, onJoin, onDelete, onOpenStart, user, hasPermission, onAddBot, onSetWinner }) => {
    const [botName, setBotName] = useState('');

    if (!tournament) return null;

    const { title, date, description, status, participants, matchFormat, id, matches, logicMode } = tournament;
    
    // Status Badge
    let statusTag = <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">ABERTO</span>;
    if (status === 'pending') statusTag = <span className="text-yellow-500 animate-pulse">PROCESSANDO...</span>;
    if (status === 'started') statusTag = <span className="text-red-500 animate-pulse font-bold">🔴 EM ANDAMENTO</span>;
    if (status === 'finished') statusTag = <span className="text-blue-400 font-bold">FINALIZADO</span>;

    // Listas
    const parts = participants || [];
    const confirmed = parts.filter(p => p.status === 'confirmed');
    const maybe = parts.filter(p => p.status === 'maybe');
    const declined = parts.filter(p => p.status === 'declined');

    const handleAddBot = () => {
        if (!botName.trim()) return;
        onAddBot(id, botName);
        setBotName('');
    };

    const renderList = (list, title, colorClass) => (
        <div className="mb-4">
            <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 border-b pb-1 flex justify-between ${colorClass}`}>
                {title} <span className="bg-slate-800 px-2 rounded text-xs py-0.5 text-white">{list.length}</span>
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {list.length === 0 ? <span className="text-slate-600 text-xs italic">Vazio</span> : 
                list.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-700/50">
                        <span className="text-slate-300 text-sm">{p.name}</span>
                        {p.reason && <i className="fas fa-info-circle text-slate-500 cursor-help" title={p.reason}></i>}
                    </div>
                ))}
            </div>
        </div>
    );

    // --- RENDERIZAÇÃO DAS PARTIDAS (CHAVES) ---
    const renderBrackets = () => {
        if (logicMode !== 'elimination' || !matches || matches.length === 0) return (
            <div className="text-center p-4 bg-slate-900/50 rounded border border-slate-700">
                <p className="text-slate-400">Modo de lista única. Gerencie as partidas manualmente no jogo.</p>
            </div>
        );

        // Agrupa partidas por rodada
        const rounds = {};
        matches.forEach(m => {
            if (!rounds[m.round]) rounds[m.round] = [];
            rounds[m.round].push(m);
        });

        return (
            <div className="space-y-6 mt-4">
                <h3 className="text-lg font-bold text-white border-b border-slate-700 pb-2">Chaveamento</h3>
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {Object.keys(rounds).map(roundNum => (
                        <div key={roundNum} className="min-w-[200px] flex flex-col gap-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase text-center mb-2">Rodada {roundNum}</h4>
                            {rounds[roundNum].map(match => (
                                <div key={match.matchId} className="bg-slate-800 border border-slate-700 rounded p-2 text-sm relative">
                                    <div className="absolute -left-1 top-1/2 w-1 h-8 bg-slate-700 -translate-y-1/2 rounded-r"></div>
                                    
                                    {/* Jogador 1 */}
                                    <div 
                                        onClick={() => hasPermission && !match.winner && match.p1 && match.p2 && onSetWinner(id, match.matchId, match.p1.id)}
                                        className={`p-2 rounded cursor-pointer flex justify-between items-center mb-1 ${match.winner === match.p1?.id ? 'bg-green-900/30 text-green-400 font-bold border border-green-500/30' : 'bg-slate-900/50 hover:bg-slate-700'}`}
                                    >
                                        <span>{match.p1 ? match.p1.name : 'Wait...'}</span>
                                        {match.winner === match.p1?.id && <i className="fas fa-check text-xs"></i>}
                                    </div>

                                    {/* VS */}
                                    <div className="text-[10px] text-center text-slate-600 font-bold my-0.5">VS</div>

                                    {/* Jogador 2 */}
                                    <div 
                                        onClick={() => hasPermission && !match.winner && match.p1 && match.p2 && onSetWinner(id, match.matchId, match.p2.id)}
                                        className={`p-2 rounded cursor-pointer flex justify-between items-center ${match.winner === match.p2?.id ? 'bg-green-900/30 text-green-400 font-bold border border-green-500/30' : 'bg-slate-900/50 hover:bg-slate-700'}`}
                                    >
                                        <span>{match.p2 ? match.p2.name : (match.note === 'Bye' ? '-' : 'Wait...')}</span>
                                        {match.winner === match.p2?.id && <i className="fas fa-check text-xs"></i>}
                                    </div>
                                    
                                    {match.note && <div className="text-[10px] text-slate-500 text-center mt-1 italic">{match.note}</div>}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-800 w-full max-w-5xl rounded-xl border border-slate-600 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                <div className="p-6 border-b border-slate-700 bg-slate-900/80 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><i class="fas fa-times fa-lg"></i></button>
                    <div className="pr-8">
                        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-300 items-center">
                            <span className="bg-slate-700/50 px-2 py-1 rounded"><i class="far fa-clock text-yellow-500 mr-1"></i> {date}</span>
                            {statusTag}
                            <span className="bg-blue-900/30 border border-blue-500/30 text-blue-300 px-2 py-1 rounded text-xs uppercase font-bold">{matchFormat}</span>
                        </div>
                    </div>
                    
                    {hasPermission && (
                        <div className="mt-4 flex gap-2">
                            {status !== 'started' && status !== 'finished' && (
                                <button onClick={() => onOpenStart(tournament)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm font-bold shadow transition">
                                    <i class="fas fa-play mr-1"></i> Iniciar
                                </button>
                            )}
                            <button onClick={() => onDelete(id)} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm font-bold shadow transition">
                                <i class="fas fa-trash mr-1"></i> Excluir
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-grow overflow-y-auto p-6 grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        {/* Se iniciado, mostra as chaves PRIMEIRO */}
                        {(status === 'started' || status === 'finished') && renderBrackets()}

                        <div>
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Sobre</h4>
                            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">{description}</p>
                            <div className="mt-2 text-xs text-yellow-500/80 italic border-l-2 border-yellow-500 pl-2">
                                {FORMAT_INFO.matches[matchFormat]}
                            </div>
                        </div>
                        
                        <div className="border-t border-slate-700 pt-4">
                            {/* Apenas Admins podem adicionar bots. Usuários normais só veem aviso */}
                            {hasPermission && status !== 'started' && status !== 'finished' ? (
                                <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                                    <label className="text-xs font-bold text-slate-400 mb-2 block">Adicionar Bot de Teste</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Nome (ex: Bot Test 1)" 
                                            className="flex-grow bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:border-green-500 outline-none"
                                            value={botName}
                                            onChange={(e) => setBotName(e.target.value)}
                                        />
                                        <button 
                                            onClick={handleAddBot}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold transition"
                                        >
                                            Adicionar
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1">Útil para testar chaveamento.</p>
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 text-sm italic">
                                    {status === 'started' ? 'Torneio em andamento.' : (status === 'finished' ? 'Torneio finalizado.' : 'Inscrições exclusivas via Discord.')}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 bg-slate-900/30 p-4 rounded-lg border border-slate-700/30 h-fit">
                        {renderList(confirmed, 'Confirmados', 'text-green-400 border-green-500/20')}
                        {renderList(maybe, 'Talvez', 'text-yellow-400 border-yellow-500/20')}
                        {renderList(declined, 'Ausentes', 'text-red-400 border-red-500/20')}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default DetailsModal;

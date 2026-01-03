import React from 'react';

const TournamentCard = ({ tournament, onClick }) => {
    const { title, date, description, status, participants, id, matchFormat } = tournament;
    
    // CORREÇÃO: Conta o líder + quantidade de parceiros
    const conf = (participants || []).filter(p => p.status === 'confirmed').reduce((total, p) => {
        const partnersCount = (p.partners && Array.isArray(p.partners)) ? p.partners.length : 0;
        return total + 1 + partnersCount;
    }, 0);

    const isPending = status === 'pending';
    const isStarted = status === 'started';
    const isFinished = status === 'finished';

    let statusTag = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">ABERTO</span>;
    
    if (isPending) {
        statusTag = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500 animate-pulse">PROCESSANDO</span>;
    } else if (isStarted) {
        statusTag = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">AO VIVO</span>;
    } else if (isFinished) {
        statusTag = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">FINALIZADO</span>;
    }

    const formatLabel = matchFormat ? matchFormat.toUpperCase() : 'GERAL';

    return (
        <div onClick={() => onClick(tournament)} className={`bg-slate-800 rounded-xl border ${isFinished ? 'border-blue-900/50 opacity-75 hover:opacity-100' : 'border-slate-700'} hover:border-yellow-500/50 transition duration-300 group overflow-hidden flex flex-col h-full shadow-lg cursor-pointer relative transform hover:-translate-y-1`}>
            <div className="p-5 flex-grow relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <i className={`fas ${isFinished ? 'fa-medal' : 'fa-trophy'} text-6xl text-yellow-500`}></i>
                </div>
                <div className="flex justify-between items-start mb-4">
                    {statusTag}
                    <div className="flex gap-1">
                        <span className="text-[10px] font-mono bg-slate-700 px-1 rounded text-slate-300">{formatLabel}</span>
                        <span className="text-xs text-slate-500 font-mono">#{id.substr(0,4)}</span>
                    </div>
                </div>
                <h3 className="font-bold text-lg text-white mb-2 leading-tight group-hover:text-yellow-400 transition">{title}</h3>
                <div className="flex items-center gap-2 text-xs text-yellow-500 font-medium mb-4 bg-slate-900/50 w-fit px-2 py-1 rounded">
                    <i className="far fa-clock"></i> {date}
                </div>
                <p className="text-slate-400 text-sm line-clamp-3 mb-4 border-l-2 border-slate-700 pl-3">{description}</p>
            </div>
            
            <div className="bg-slate-900/50 border-t border-slate-700/50 p-3 flex justify-between items-center text-xs text-slate-400">
                <span><i className="fas fa-users text-green-500 mr-1"></i> <b>{conf}</b> Confirmados</span>
                <span className="text-yellow-500 group-hover:underline flex items-center gap-1">
                    Ver detalhes <i className="fas fa-arrow-right"></i>
                </span>
            </div>
        </div>
    );
};
export default TournamentCard;

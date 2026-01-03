import React, { useState } from 'react';
import { FORMAT_INFO } from '../config/constants.js';

const DetailsModal = ({ tournament, onClose, onJoin, onDelete, onOpenStart, user, hasPermission, onAddBot, onOpenBrackets }) => {
    
    if (!tournament) return null;

    const { title, date, description, status, participants, matchFormat, id, logicMode } = tournament;
    
    // Status Badge e Cores
    let statusTag = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">ABERTO</span>;
    if (status === 'pending') statusTag = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500 animate-pulse">PROCESSANDO</span>;
    if (status === 'started') statusTag = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">AO VIVO</span>;
    if (status === 'finished') statusTag = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">FINALIZADO</span>;

    const parts = participants || [];
    const confirmed = parts.filter(p => p.status === 'confirmed');
    const maybe = parts.filter(p => p.status === 'maybe');
    const declined = parts.filter(p => p.status === 'declined');

    // Nova função de adicionar bot automático
    const handleAddBot = () => {
        // Conta quantos bots já existem para gerar o nome
        const botCount = parts.filter(p => p.isBot).length + 1;
        const generatedName = `Bot ${botCount}`;
        onAddBot(id, generatedName);
    };

    // CORREÇÃO: Renderiza parceiros e calcula contagem total
    const renderList = (list, title, colorClass) => {
        // Calcula total incluindo parceiros
        const totalCount = list.reduce((acc, p) => acc + 1 + (p.partners ? p.partners.length : 0), 0);

        return (
            <div className="mb-4">
                <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 border-b pb-1 flex justify-between ${colorClass}`}>
                    {title} <span className="bg-slate-800 px-2 rounded text-xs py-0.5 text-white">{totalCount}</span>
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {list.length === 0 ? <span className="text-slate-600 text-xs italic">Vazio</span> : 
                    list.map(p => (
                        <div key={p.id} className="flex flex-col bg-slate-800/50 p-2 rounded border border-slate-700/50">
                            <div className="flex justify-between items-center w-full">
                                <span className="text-slate-300 text-sm font-medium">
                                    {p.name}
                                    {/* Badge de Líder/Time se tiver parceiros */}
                                    {p.partners && p.partners.length > 0 && <span className="ml-2 text-[9px] bg-blue-900 text-blue-300 px-1 rounded">TIME</span>}
                                </span>
                                {p.reason && <i className="fas fa-info-circle text-slate-500 cursor-help" title={p.reason}></i>}
                            </div>
                            
                            {/* Renderiza os Parceiros indentados */}
                            {p.partners && p.partners.length > 0 && (
                                <div className="mt-1 pl-2 border-l-2 border-slate-600 space-y-0.5">
                                    {p.partners.map((part, idx) => (
                                        <div key={part.id || idx} className="text-xs text-slate-400 flex items-center gap-1">
                                            <i className="fas fa-angle-right text-[10px] text-slate-600"></i> {part.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-800 w-full max-w-3xl rounded-xl border border-slate-600 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
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
                    
                    <div className="mt-4 flex gap-2 flex-wrap">
                        {/* Botão de Chaves aparece se iniciado ou finalizado */}
                        {(status === 'started' || status === 'finished') && (
                            <button onClick={() => onOpenBrackets(tournament)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold shadow transition flex items-center gap-2">
                                <i className="fas fa-sitemap"></i> 
                                {logicMode === 'elimination' ? 'Ver Chaves / Partidas' : 'Ver Status / Lista'}
                            </button>
                        )}

                        {/* Botões de Admin */}
                        {hasPermission && (
                            <>
                                {status !== 'started' && status !== 'finished' && (
                                    <button onClick={() => onOpenStart(tournament)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded text-sm font-bold shadow transition">
                                        <i className="fas fa-play mr-1"></i> Iniciar
                                    </button>
                                )}
                                <button onClick={() => onDelete(id)} className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded text-sm font-bold shadow transition">
                                    <i className="fas fa-trash mr-1"></i> Excluir
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-6 grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Sobre</h4>
                            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">{description}</p>
                            <div className="mt-2 text-xs text-yellow-500/80 italic border-l-2 border-yellow-500 pl-2">
                                {FORMAT_INFO.matches[matchFormat]}
                            </div>
                        </div>
                        
                        <div className="border-t border-slate-700 pt-4">
                            {hasPermission && status !== 'started' && status !== 'finished' ? (
                                <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-slate-400">Adicionar Bot de Teste</label>
                                        <span className="text-[10px] text-slate-500">Geração Automática</span>
                                    </div>
                                    <button onClick={handleAddBot} className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded text-sm font-bold transition flex justify-center items-center gap-2 border border-slate-600 hover:border-slate-500">
                                        <i className="fas fa-robot text-yellow-500"></i> Adicionar Bot (+1)
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 text-sm italic">
                                    {status === 'started' ? 'Torneio em andamento. Acompanhe as chaves!' : (status === 'finished' ? 'Torneio finalizado.' : 'Inscrições exclusivas via Discord.')}
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

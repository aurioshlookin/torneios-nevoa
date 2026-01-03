import React, { useState } from 'react';

const StartModal = ({ tournament, onClose, onConfirm }) => {
    const [config, setConfig] = useState({
        matchFormat: tournament.matchFormat || '1x1',
        structure: tournament.structure || 'single_elim',
        shuffle: tournament.shuffle || 'random',
        // MUDANÇA AQUI: O padrão agora é 'elimination' para evitar iniciar sem chaves por engano
        logicMode: 'elimination'
    });

    const handleChange = (e) => setConfig({ ...config, [e.target.id]: e.target.value });

    return (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-800 w-full max-w-lg rounded-xl border border-slate-600 shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                    <h3 className="font-bold text-lg text-white"><i class="fas fa-play-circle text-green-500 mr-2"></i>Iniciar Torneio</h3>
                </div>
                
                <div className="p-6 space-y-5">
                    <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded text-sm text-blue-200 mb-4 flex items-start gap-2">
                        <i class="fas fa-info-circle mt-1"></i>
                        <div>Edite os formatos finais antes de gerar.</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Formato</label>
                            <select id="matchFormat" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" value={config.matchFormat} onChange={handleChange}>
                                <option value="1x1">1x1</option>
                                <option value="2x2">2x2</option>
                                <option value="3x3">3x3</option>
                                <option value="4x4">4x4+</option>
                                <option value="ffa">FFA</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Estrutura</label>
                            <select id="structure" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" value={config.structure} onChange={handleChange}>
                                <option value="single_elim">Eliminação Simples</option>
                                <option value="double_elim">Eliminação Dupla</option>
                                <option value="swiss">Sistema Suíço</option>
                                <option value="points">Pontos</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">Mecânica</label>
                        <select id="logicMode" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white focus:border-green-500" value={config.logicMode} onChange={handleChange}>
                            <option value="elimination">⚔️ Gerar Chaves (Mata-mata)</option>
                            <option value="battleroyale">🔥 Apenas Listar / Manual</option>
                        </select>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-end gap-3">
                    <button onClick={onClose} className="text-slate-400 hover:text-white font-bold px-4">Cancelar</button>
                    <button onClick={() => onConfirm(tournament.id, config)} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold shadow-lg transition transform hover:scale-105">INICIAR</button>
                </div>
            </div>
        </div>
    );
};
export default StartModal;

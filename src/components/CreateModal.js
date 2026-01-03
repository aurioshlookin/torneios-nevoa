// --- CreateModal.js ---

const CreateModal = ({ onClose, onCreate }) => {
    // Pega a data/hora atual no formato correto para o input (YYYY-MM-DDTHH:MM)
    const getCurrentDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const [form, setForm] = useState({
        title: '', 
        date: getCurrentDateTime(), // Define padrão como agora
        description: '',
        matchFormat: '1x1', 
        structure: 'single_elim', 
        shuffle: 'random'
    });

    const [descPreview, setDescPreview] = useState(FORMAT_INFO.matches['1x1']);

    const handleChange = (e) => {
        const { id, value } = e.target;
        const key = id.replace('t-', '');
        const newForm = { ...form, [key]: value };
        setForm(newForm);

        if(['matchFormat', 'structure', 'shuffle'].includes(key)) {
            const desc = (
                <span>
                    <strong>Formato:</strong> {FORMAT_INFO.matches[newForm.matchFormat] || ''} <br/>
                    <span className="text-slate-400 mt-1 block"><strong>Estrutura:</strong> {FORMAT_INFO.structure[newForm.structure] || ''}</span>
                    <span className="text-slate-400 mt-1 block"><strong>Shuffle:</strong> {FORMAT_INFO.shuffle[newForm.shuffle] || ''}</span>
                </span>
            );
            setDescPreview(desc);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Formata a data para ficar mais bonita na exibição se necessário, 
        // ou manda bruta mesmo. Aqui vamos mandar formatada levemente.
        const dateObj = new Date(form.date);
        const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        
        onCreate({ ...form, date: formattedDate, rawDate: form.date });
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-800 w-full max-w-2xl rounded-xl border border-slate-600 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <h3 className="font-bold text-lg text-green-400"><i className="fas fa-calendar-plus mr-2"></i>Agendar Evento</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><i class="fas fa-times"></i></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-grow">
                    <form id="create-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1 font-bold ml-1">Título</label>
                                <input type="text" id="t-title" required placeholder="Ex: Exame Chunin" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:border-green-500 outline-none text-white transition" onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1 font-bold ml-1">Data/Horário</label>
                                {/* MUDANÇA: Input do tipo datetime-local */}
                                <input 
                                    type="datetime-local" 
                                    id="t-date" 
                                    required 
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:border-green-500 outline-none text-white transition [color-scheme:dark]" 
                                    value={form.date}
                                    onChange={handleChange} 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                            <div>
                                <label className="block text-xs uppercase text-slate-400 mb-1 font-bold">Formato</label>
                                <select id="t-matchFormat" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm focus:border-green-500 outline-none text-white transition cursor-pointer" onChange={handleChange} value={form.matchFormat}>
                                    <option value="1x1">1x1 (Duelo)</option>
                                    <option value="2x2">2x2 (Duplas)</option>
                                    <option value="3x3">3x3 (Times)</option>
                                    <option value="4x4">4x4+ (Equipes)</option>
                                    <option value="ffa">FFA (Todos contra Todos)</option>
                                    <option value="nmp">Ninja Mais Procurado</option>
                                    <option value="nmp_random">NMP (Alvo Aleatório)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-slate-400 mb-1 font-bold">Estrutura</label>
                                <select id="t-structure" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm focus:border-green-500 outline-none text-white transition cursor-pointer" onChange={handleChange} value={form.structure}>
                                    <option value="single_elim">Eliminação Simples</option>
                                    <option value="double_elim">Eliminação Dupla</option>
                                    <option value="swiss">Sistema Suíço</option>
                                    <option value="groups_playoff">Grupos + Mata-mata</option>
                                    <option value="points">Pontuação Acumulativa</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-slate-400 mb-1 font-bold">Shuffle</label>
                                <select id="t-shuffle" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm focus:border-green-500 outline-none text-white transition cursor-pointer" onChange={handleChange} value={form.shuffle}>
                                    <option value="random">Aleatório Puro</option>
                                    <option value="random_protected">Aleatório (Protegido)</option>
                                    <option value="order">Ordem de Inscrição</option>
                                    <option value="ranking">Por Ranking/Nível</option>
                                    <option value="mirror">Espelhamento</option>
                                    <option value="thematic">Temático</option>
                                    <option value="narrative">Narrativo</option>
                                </select>
                            </div>
                            <div className="col-span-full mt-2">
                                <div className="text-xs text-yellow-500/80 italic border-l-2 border-yellow-500 pl-2">{descPreview}</div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1 font-bold ml-1">Descrição</label>
                            <textarea id="t-description" rows="4" required placeholder="Regras..." className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:border-green-500 outline-none text-white transition" onChange={handleChange}></textarea>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-end gap-3">
                    <button onClick={onClose} className="text-slate-400 hover:text-white font-bold px-4">Cancelar</button>
                    <button onClick={() => document.getElementById('create-form').requestSubmit()} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg flex items-center gap-2 hover:shadow-green-500/20 transition transform hover:scale-105">
                        Publicar <i className="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- SettingsModal.js ---

const SettingsModal = ({ onClose, onSave }) => {
    // Usa as globais injetadas pelo loader
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allowedRoles, setAllowedRoles] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [rSnap, pSnap] = await Promise.all([
                    getDoc(doc(db, "config", "discord_roles")),
                    getDoc(doc(db, "config", "permissions"))
                ]);
                
                if (rSnap.exists()) setRoles(rSnap.data().list || []);
                if (pSnap.exists()) setAllowedRoles(pSnap.data().allowed_create_roles || []);
            } catch (e) {
                console.error("Erro ao carregar settings:", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const toggleRole = (id) => {
        setAllowedRoles(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    const handleSave = async () => {
        try {
            await setDoc(doc(db, "config", "permissions"), { allowed_create_roles: allowedRoles }, { merge: true });
            onSave();
        } catch (e) {
            console.error("Erro ao salvar permissões:", e);
            alert("Erro ao salvar permissões.");
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-800 w-full max-w-lg rounded-xl border border-slate-600 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <h3 className="font-bold text-lg text-white">Permissões de Criação</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><i className="fas fa-times"></i></button>
                </div>
                <div className="p-6 overflow-y-auto flex-grow">
                    {loading ? (
                        <div className="text-center"><i className="fas fa-spinner fa-spin text-yellow-500"></i></div>
                    ) : (
                        <div className="space-y-2">
                            {roles.length === 0 ? <p className="text-red-400 text-sm">Nenhum cargo encontrado. O bot precisa estar no servidor.</p> : null}
                            {roles.map(r => r.name !== '@everyone' && (
                                <label key={r.id} className="flex items-center p-3 rounded hover:bg-slate-700/50 cursor-pointer border border-transparent hover:border-slate-600 transition">
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 rounded text-green-600 bg-slate-700 border-slate-500 focus:ring-green-500 focus:ring-offset-slate-800" 
                                        checked={allowedRoles.includes(r.id)} 
                                        onChange={() => toggleRole(r.id)} 
                                    />
                                    <span className="ml-3 font-medium" style={{color: r.color && r.color !== '#000000' ? r.color : '#e2e8f0'}}>{r.name}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-end">
                    <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold transition shadow-lg">Salvar</button>
                </div>
            </div>
        </div>
    );
};

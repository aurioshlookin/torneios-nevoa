// --- Header.js ---
// Navbar principal com logo e controles de usuário

const Header = ({ user, hasPermission, onOpenCreate, onOpenSettings, onLogout }) => {
    return (
        <nav className="bg-slate-800 p-4 border-b border-slate-700 sticky top-0 z-50 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold text-yellow-500 tracking-wider flex items-center gap-2">
                    <i className="fas fa-khanda text-3xl"></i>
                    <span className="hidden sm:inline">Torneios da Névoa</span>
                </h1>
                
                <div className="flex items-center gap-4">
                    {hasPermission && (
                        <>
                            <button id="new-event-btn" onClick={onOpenCreate} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg transition flex items-center gap-2 transform hover:scale-105">
                                <i className="fas fa-plus"></i> <span className="hidden sm:inline">Novo Evento</span>
                            </button>

                            <button onClick={onOpenSettings} className="text-slate-400 hover:text-white transition p-2 rounded hover:bg-slate-700" title="Configurações">
                                <i className="fas fa-cog fa-lg"></i>
                            </button>
                        </>
                    )}

                    <div className="flex items-center gap-3 bg-slate-700/50 pr-4 pl-1 py-1 rounded-full border border-slate-600">
                        <img 
                            src={user.avatarUrl} 
                            alt="User" 
                            className="w-8 h-8 rounded-full border border-yellow-500 object-cover bg-slate-800"
                        />
                        <span className="font-medium text-sm hidden sm:inline">{user.displayName}</span>
                        <button onClick={onLogout} className="text-xs text-red-400 hover:text-red-300 ml-2 border-l border-slate-600 pl-3">
                            SAIR
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

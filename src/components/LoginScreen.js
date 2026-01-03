// --- LoginScreen.js ---
// Tela de boas-vindas e login

const LoginScreen = ({ onLogin, loading }) => {
    return (
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="bg-slate-800 p-10 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
                
                <div className="text-6xl text-yellow-500 mb-6 drop-shadow-lg">
                    <i className="fas fa-scroll"></i>
                </div>
                <h2 className="text-3xl font-bold mb-3 text-white">Bem-vindo à Névoa</h2>
                <p className="text-slate-400 mb-8">Faça login para gerenciar os eventos.</p>
                
                {loading ? (
                    <div className="w-full bg-slate-700 text-slate-300 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-wait">
                        <i className="fas fa-circle-notch fa-spin"></i> Conectando...
                    </div>
                ) : (
                    <button onClick={onLogin} className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-3 shadow-lg transform hover:scale-105">
                        <i className="fab fa-discord text-xl"></i> Entrar com Discord
                    </button>
                )}
            </div>
        </div>
    );
};

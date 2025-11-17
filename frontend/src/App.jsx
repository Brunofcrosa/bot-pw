import React, { useState, useEffect } from 'react'; 
import ServerList from './componentes/server/ServerList';
import ServerCard from './componentes/server/ServerCard';
import BottomBar from './componentes/server/BottomBar';
import AccountModal from './componentes/account/AccountModal'; 

import { FaPlus, FaPencilAlt, FaTrash, FaCheckSquare } from 'react-icons/fa';
import '../index.css'; 

// --- CORREÇÃO: Constantes de estilo restauradas ---
const mainLayout = {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gridTemplateRows: '1fr',
    minHeight: '100vh',
    paddingBottom: '50px', 
    backgroundColor: 'var(--color-bg-body)'
};

const contentArea = {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: 'var(--color-bg-body)'
};

const contentHeader = {
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid var(--border-color)', 
    flexShrink: 0,
};

const cardGrid = {
    flexGrow: 1,
    overflowY: 'auto',
    margin: '0',
    paddingBottom: '10px',
};
// --- FIM DA CORREÇÃO ---


// --- DADOS DE EXEMPLO INICIAIS ---
const initialAccounts = [
    { id: 'id-ryuzaki', charName: "Ryuzaki-", charClass: "Arqueiro", charAvatarBg: "#ffd600", login: 'user1', password: 'pw1', exePath: 'C:\\Games\\PW-Classic\\element\\elementclient.exe' },
    { id: 'id-aetherius', charName: "Aetherius", charClass: "Feiticeira", charAvatarBg: "#17a2b8", login: 'user2', password: 'pw2', exePath: 'C:\\Games\\PW-BR\\element\\elementclient.exe' }
];


const App = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentServerName, setCurrentServerName] = useState('classic pw');
    
    // --- ESTADOS ---
    const [runningAccounts, setRunningAccounts] = useState([]);
    const [accounts, setAccounts] = useState(initialAccounts);


    useEffect(() => {
        window.electronAPI.on('element-opened', (data) => {
            if (data.success) {
                console.log(`[React] Jogo aberto. PID: ${data.pid}, Conta: ${data.accountId}`);
                setRunningAccounts(prev => 
                    prev.map(acc => 
                        acc.accountId === data.accountId 
                        ? { ...acc, pid: data.pid, status: 'running' } 
                        : acc
                    )
                );
            }
        });

        window.electronAPI.on('element-closed', (data) => {
            if (data.success) {
                console.log(`[React] Conta fechada: ${data.accountId}`);
                setRunningAccounts(prev => prev.filter(acc => acc.accountId !== data.accountId));
            }
        });

    }, []);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSaveNewAccount = (newAccount) => {
        setAccounts(prevAccounts => [...prevAccounts, newAccount]);
        console.log('[React] Nova conta salva:', newAccount);
    };

    const handleOpenAccount = async (accountData) => {
        console.log(`[React] Tentando abrir conta: ${accountData.login}`);
        
        const args = {
            id: accountData.id,
            exePath: accountData.exePath, 
            login: accountData.login,
            password: accountData.password,
            characterName: accountData.charName,
            argument: null 
        };

        setRunningAccounts(prev => [...prev, { accountId: args.id, pid: null, charName: args.charName, status: 'starting' }]);

        const result = await window.electronAPI.invoke('open-element', args);
        
        if (!result.success) {
            console.error(`[React] Falha ao iniciar helper:`, result.error);
            setRunningAccounts(prev => prev.filter(acc => acc.accountId !== args.id));
        } else {
            console.log(`[React] Helper iniciado (PID ${result.pid}). Aguardando PID do jogo...`);
        }
    };

    const handleCloseAccount = async (pid) => {
        if (!pid) {
            console.warn('[React] PID inválido, não é possível fechar.');
            return;
        }
        console.log(`[React] Tentando fechar processo PID: ${pid}`);
        const result = await window.electronAPI.invoke('close-element', pid);
        
        if (!result.success) {
            console.error(`[React] Falha ao fechar PID ${pid}:`, result.error);
            setRunningAccounts(prev => prev.filter(acc => acc.pid !== pid));
        }
    };

    return (
        <>
            <div style={mainLayout}>
                <ServerList />

                <div style={contentArea}>
                    <div style={contentHeader}>
                        <div className="d-flex align-items-center gap-2">
                            <div className="btn-group" role="group">
                                <button type="button" className="btn btn-outline-secondary">
                                    <FaPlus className="me-1" /> {currentServerName}
                                </button>
                                <button type="button" className="btn btn-outline-secondary">
                                    <FaPencilAlt />
                                </button>
                                <button type="button" className="btn btn-outline-secondary">
                                    <FaTrash />
                                </button>
                            </div>
                            <button type="button" className="btn btn-outline-secondary">
                                <FaCheckSquare className="me-1" /> Selecionar
                            </button>
                            
                            <button 
                                type="button" 
                                className="btn btn-primary"
                                onClick={handleOpenModal} 
                            >
                                <FaPlus className="me-1" /> Adicionar conta
                            </button>
                        </div>
                    </div>

                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3" style={cardGrid}>
                        
                        {accounts.map(acc => {
                            const runningInstance = runningAccounts.find(r => r.accountId === acc.id);
                            const isRunning = !!runningInstance;
                            const pid = runningInstance?.pid;
                            const status = runningInstance?.status;
                            
                            return (
                                <div key={acc.id} className="col">
                                    <div className="card h-100">
                                        <ServerCard 
                                            charName={acc.charName} 
                                            charClass={acc.charClass} 
                                            charAvatarBg={acc.charAvatarBg} 
                                        />
                                        <div className="card-footer">
                                            {isRunning ? (
                                                <button 
                                                    className="btn btn-danger w-100" 
                                                    onClick={() => handleCloseAccount(pid)}
                                                    disabled={!pid || status === 'starting'}
                                                >
                                                    {status === 'starting' ? 'Iniciando...' : `Fechar (PID: ${pid})`}
                                                </button>
                                            ) : (
                                                <button 
                                                    className="btn btn-success w-100" 
                                                    onClick={() => handleOpenAccount(acc)}
                                                >
                                                    Abrir
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            <BottomBar />

            <AccountModal 
                show={isModalOpen} 
                onClose={handleCloseModal} 
                serverName={currentServerName}
                onSaveAccount={handleSaveNewAccount} 
            />
        </>
    );
};

export default App;
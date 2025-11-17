import React, { useState, useEffect, useMemo } from 'react'; 
// Componentes importados
import ServerList from './componentes/server/ServerList';
import AccountModal from './componentes/account/AccountModal'; 
import AddServerModal from './componentes/server/AddServerModal'; 
import ServerCard from './componentes/server/ServerCard'; 
import BottomBar from './componentes/server/BottomBar'; 

// Importa o novo CSS de layout
import './App.css'; 

// --- Ícones SVG Inline (Mantidos aqui) ---
const PlusIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const PencilIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);
const TrashIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const CheckSquareIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
);
const FolderOpenIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
);


const App = () => {
    // Estado para o modal de conta
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    // Novo estado para o modal de servidor
    const [isAddServerModalOpen, setIsAddServerModalOpen] = useState(false);
    
    // Novo estado para a lista de servidores
    const [servers, setServers] = useState([]);
    // Novo estado para o ID do servidor ativo.
    const [currentServerId, setCurrentServerId] = useState(null); 

    // Estados existentes
    const [runningAccounts, setRunningAccounts] = useState([]);
    const [accounts, setAccounts] = useState([]);

    // Busca o objeto do servidor ativo para exibir o nome
    const currentServer = useMemo(() => {
        return servers.find(s => s.id === currentServerId) || { id: '', name: 'Selecionar Servidor' };
    }, [servers, currentServerId]);


    // Efeito para carregar a lista de servidores e contas do servidor ativo
    useEffect(() => {
        // 1. Carregar a lista de servidores
        const loadServersAndSelectFirst = async () => {
            console.log(`[React] Carregando lista de servidores...`);
            const loadedServers = await window.electronAPI.invoke('load-servers'); 
            
            if (Array.isArray(loadedServers) && loadedServers.length > 0) {
                setServers(loadedServers);
                // Se não houver servidor ativo, define o primeiro como ativo
                if (currentServerId === null || !loadedServers.some(s => s.id === currentServerId)) {
                    setCurrentServerId(loadedServers[0].id);
                }
            }
        };

        // 2. Carregar contas para o servidor ativo
        const loadPersistedAccounts = async () => {
            if (currentServerId) {
                const serverName = currentServer.name; 
                console.log(`[React] Carregando contas persistidas para ${serverName}...`);
                const persistedAccounts = await window.electronAPI.invoke('load-accounts', currentServerId); 
                if (Array.isArray(persistedAccounts)) {
                    setAccounts(persistedAccounts);
                    console.log(`[React] ${persistedAccounts.length} contas carregadas.`);
                } else {
                     setAccounts([]);
                }
            } else {
                 setAccounts([]);
            }
        };

        if (currentServerId === null) {
             loadServersAndSelectFirst();
        } else {
             loadPersistedAccounts();
        }
        
        // Listeners do Electron (inalterados)
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

    }, [currentServerId, currentServer.name]); 

    // --- Handlers para Servidores (inalterados) ---
    const handleOpenAddServerModal = () => setIsAddServerModalOpen(true);
    const handleCloseAddServerModal = () => setIsAddServerModalOpen(false);

    const handleSaveNewServer = (newServer) => {
        const serverExists = servers.some(s => s.id === newServer.id);
        if (serverExists) {
            console.error(`[React] O servidor "${newServer.name}" já existe.`);
            return;
        }

        setServers(prevServers => {
            const updatedServers = [...prevServers, newServer];
            
            window.electronAPI.invoke('save-servers', updatedServers)
                .then(result => {
                    if (result.success) {
                        console.log('[React] Lista de servidores salva no disco com sucesso.');
                    } else {
                        console.error('[React] Falha ao salvar lista de servidores:', result.error);
                    }
                })
                .catch(error => {
                    console.error('[React] Erro de IPC ao salvar lista de servidores:', error);
                });

            return updatedServers;
        });
        
        setCurrentServerId(newServer.id); 
        setIsAddServerModalOpen(false);
    };

    const handleSelectServer = (serverId) => {
        if (serverId !== currentServerId) {
            setCurrentServerId(serverId);
        }
    };
    
    // --- Handlers para Contas (inalterados) ---
    const handleOpenAccountModal = () => {
        if (!currentServerId) {
            console.warn('[React] Nenhum servidor selecionado.');
            return;
        }
        setIsAccountModalOpen(true);
    }
    const handleCloseAccountModal = () => setIsAccountModalOpen(false);

    const handleSaveNewAccount = (newAccount) => {
        setAccounts(prevAccounts => {
            const updatedAccounts = [...prevAccounts, newAccount];
            console.log('[React] Nova conta salva:', newAccount);

            window.electronAPI.invoke('save-accounts', currentServerId, updatedAccounts)
                .then(result => {
                    if (result.success) {
                        console.log('[React] Contas salvas no disco com sucesso.');
                    } else {
                        console.error('[React] Falha ao salvar contas:', result.error);
                    }
                })
                .catch(error => {
                    console.error('[React] Erro de IPC ao salvar contas:', error);
                });

            return updatedAccounts;
        });
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
        <div className="main-layout">
            <ServerList 
                servers={servers} 
                currentServerId={currentServerId} 
                onSelectServer={handleSelectServer} 
                onOpenAddModal={handleOpenAddServerModal}
            />

            <div className="content-area">
                <div className="content-header">
                    <div className="d-flex align-items-center gap-2">
                        <div className="btn-group" role="group">
                            {/* Ícones/Botões mantidos no App.jsx, classes Bootstrap e ícones SVG inline estão OK. */}
                            <button type="button" className="btn btn-outline-secondary" disabled={!currentServerId}>
                                <PlusIcon className="me-1" style={{ width: '1rem', height: '1rem' }} /> {currentServer.name}
                            </button>
                            <button type="button" className="btn btn-outline-secondary" disabled={!currentServerId}>
                                <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                            </button>
                            <button type="button" className="btn btn-outline-secondary" disabled={!currentServerId || servers.length <= 1}>
                                <TrashIcon className="me-1" style={{ width: '1rem', height: '1rem' }} /> 
                            </button>
                        </div>
                        <button type="button" className="btn btn-outline-secondary" disabled={!currentServerId}>
                            <CheckSquareIcon className="me-1" style={{ width: '1rem', height: '1rem' }} /> Selecionar
                        </button>
                        
                        <button 
                            type="button" 
                            className="btn btn-primary"
                            onClick={handleOpenAccountModal}
                            disabled={!currentServerId}
                        >
                            <PlusIcon className="me-1" style={{ width: '1rem', height: '1rem' }} /> Adicionar conta
                        </button>
                    </div>
                </div>

                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3 card-grid-container">
                    
                    {/* Placeholder para Servidor Não Selecionado ou Sem Contas */}
                    {!currentServerId ? (
                         <div className="placeholder-message">
                            <FolderOpenIcon className="placeholder-icon" />
                            <p className="fs-5 fw-semibold">Selecione ou Adicione um servidor para começar.</p>
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="placeholder-message">
                            <FolderOpenIcon className="placeholder-icon" />
                            <p className="fs-5 fw-semibold">Nenhuma conta salva para {currentServer.name}.</p>
                            <p>Clique em "Adicionar conta" para começar.</p>
                        </div>
                    ) : (
                        accounts.map(acc => {
                            const runningInstance = runningAccounts.find(r => r.accountId === acc.id);
                            const isRunning = !!runningInstance;
                            const pid = runningInstance?.pid;
                            const status = runningInstance?.status;
                            
                            return (
                                <div key={acc.id} className="col">
                                    <ServerCard 
                                        charName={acc.charName} 
                                        charClass={acc.charClass} 
                                        charAvatarBg={acc.charAvatarBg} 
                                        isRunning={isRunning}
                                        pid={pid}
                                        status={status}
                                        onOpen={handleOpenAccount}
                                        onClose={handleCloseAccount}
                                        accountData={acc}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            
            <BottomBar runningCount={runningAccounts.length} />

            <AccountModal 
                show={isAccountModalOpen} 
                onClose={handleCloseAccountModal} 
                serverName={currentServer.name}
                onSaveAccount={handleSaveNewAccount} 
            />
            
            <AddServerModal
                show={isAddServerModalOpen}
                onClose={handleCloseAddServerModal}
                onSaveServer={handleSaveNewServer}
            />
        </div>
    );
};

export default App;
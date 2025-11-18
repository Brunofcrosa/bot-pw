import React, { useState, useEffect, useMemo } from 'react'; 
import ServerList from './componentes/server/ServerList';
import AccountModal from './componentes/account/AccountModal'; 
import AccountsListModal from './componentes/account/AccountsListModal';
import AddServerModal from './componentes/server/AddServerModal'; 
import ServerCard from './componentes/server/ServerCard'; 
import BottomBar from './componentes/server/BottomBar'; 
import './App.css'; 

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
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2.1 0 0 1-2-2V5a2 2.1 0 0 1 2-2h11"></path></svg>
);
const FolderOpenIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
);


const App = () => {
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isAddServerModalOpen, setIsAddServerModalOpen] = useState(false);
    const [isAccountsListModalOpen, setIsAccountsListModalOpen] = useState(false);
    
    const [servers, setServers] = useState([]);
    const [currentServerId, setCurrentServerId] = useState(null); 

    const [runningAccounts, setRunningAccounts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [accountToEdit, setAccountToEdit] = useState(null); 

    const currentServer = useMemo(() => {
        return servers.find(s => s.id === currentServerId) || { id: '', name: 'Selecionar Servidor' };
    }, [servers, currentServerId]);

    const openedAccounts = useMemo(() => {
        const runningIds = new Set(runningAccounts.map(r => r.accountId));
        
        const filteredAccounts = accounts.filter(acc => runningIds.has(acc.id));

        return filteredAccounts.map(acc => {
            const runningInstance = runningAccounts.find(r => r.accountId === acc.id);
            return {
                ...acc,
                pid: runningInstance?.pid,
                status: runningInstance?.status,
            };
        });
    }, [accounts, runningAccounts]);


    useEffect(() => {
        const loadServersAndSelectFirst = async () => {
            const loadedServers = await window.electronAPI.invoke('load-servers'); 
            
            if (Array.isArray(loadedServers) && loadedServers.length > 0) {
                setServers(loadedServers);
                
                if (currentServerId === null || !loadedServers.some(s => s.id === currentServerId)) {
                    setCurrentServerId(loadedServers[0].id);
                }
            } else {
                setServers([]);
                setCurrentServerId(null); 
            }
        };

        const loadPersistedAccounts = async () => {
            if (currentServerId) {
                const persistedAccounts = await window.electronAPI.invoke('load-accounts', currentServerId); 
                if (Array.isArray(persistedAccounts)) {
                    setAccounts(persistedAccounts);
                } else {
                    setAccounts([]);
                }
            } else {
                setAccounts([]);
            }
        };

        
        if (servers.length === 0 && currentServerId === null) {
            loadServersAndSelectFirst();
        } else {
            
            loadPersistedAccounts();
        }
        
        window.electronAPI.on('element-opened', (data) => {
            if (data.success) {
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
                setRunningAccounts(prev => prev.filter(acc => acc.accountId !== data.accountId));
            }
        });

    }, [currentServerId, servers.length]); 

    

    const handleOpenAddServerModal = () => {
        
        setIsAddServerModalOpen(true);
    };
    const handleCloseAddServerModal = () => setIsAddServerModalOpen(false);

    const handleSaveNewServer = (newServer) => {
        const serverExists = servers.some(s => s.id === newServer.id);
        if (serverExists) {
            
            
            return;
        }

        setServers(prevServers => {
            const updatedServers = [...prevServers, newServer];
            
            window.electronAPI.invoke('save-servers', updatedServers)
                .then(result => {
                    if (!result.success) {
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

    const handleEditServerName = async () => {
        if (!currentServerId) return;

        const newName = window.prompt(`Novo nome para o servidor '${currentServer.name}':`, currentServer.name);
        
        if (newName && newName.trim() !== currentServer.name) {
            const updatedServer = { ...currentServer, name: newName.trim() };
            const updatedServers = servers.map(s => s.id === currentServerId ? updatedServer : s);

            const result = await window.electronAPI.invoke('save-servers', updatedServers);
            
            if (result.success) {
                setServers(updatedServers);
            } else {
                console.error('[React] Falha ao atualizar nome do servidor:', result.error);
            }
        }
    };

    const handleDeleteServer = async (serverIdToDelete) => {
        if (!window.confirm("Tem certeza que deseja excluir este servidor e todas as contas associadas?")) {
            return;
        }

        const updatedServers = servers.filter(s => s.id !== serverIdToDelete);
        
        const result = await window.electronAPI.invoke('save-servers', updatedServers);
        
        if (result.success) {
            
            
            setServers(updatedServers);
            
            
            if (serverIdToDelete === currentServerId) {
                
                const nextServerId = updatedServers.length > 0 ? updatedServers[0].id : null;
                setCurrentServerId(nextServerId); 
            }
            
            
            setAccounts([]);
            
            setRunningAccounts([]); 

            
            await window.electronAPI.invoke('delete-accounts-file', serverIdToDelete);
            
        } else {
            console.error('[React] Falha ao excluir servidor:', result.error);
        }
    };

    const handleSelectServer = (serverId) => {
        if (serverId !== currentServerId) {
            setCurrentServerId(serverId);
        }
    };
    
    

    const handleOpenAddAccountModal = () => {
        if (!currentServerId) {
            console.warn('[React] Nenhum servidor selecionado.');
            return;
        }
        setAccountToEdit(null); 
        setIsAccountModalOpen(true);
    }
    
    const handleOpenEditAccountModal = (accountData) => {
        if (!currentServerId) {
            console.warn('[React] Nenhum servidor selecionado.');
            return;
        }
        setAccountToEdit(accountData); 
        setIsAccountModalOpen(true);
    };

    const handleCloseAccountModal = () => {
        setAccountToEdit(null); 
        setIsAccountModalOpen(false);
    };

    const handleSaveOrUpdateAccount = (accountData) => {
        setAccounts(prevAccounts => {
            const isEditing = prevAccounts.some(acc => acc.id === accountData.id);
            let updatedAccounts;
            
            if (isEditing) {
                updatedAccounts = prevAccounts.map(acc => acc.id === accountData.id ? accountData : acc);
            } else {
                updatedAccounts = [...prevAccounts, accountData];
            }

            window.electronAPI.invoke('save-accounts', currentServerId, updatedAccounts)
                .then(result => {
                    if (!result.success) {
                        console.error('[React] Falha ao salvar/atualizar contas:', result.error);
                    }
                })
                .catch(error => {
                    console.error('[React] Erro de IPC ao salvar/atualizar contas:', error);
                });

            return updatedAccounts;
        });
    };

    const handleOpenAccount = async (accountData) => {
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
        }
    };

    const handleCloseAccount = async (pid) => {
        if (!pid) {
            console.warn('[React] PID inválido, não é possível fechar.');
            return;
        }
        const result = await window.electronAPI.invoke('close-element', pid);
        
        if (!result.success) {
            console.error(`[React] Falha ao fechar PID ${pid}:`, result.error);
            setRunningAccounts(prev => prev.filter(acc => acc.pid !== pid));
        }
    };
    
    const handleDeleteAccount = (accountId) => {
        if (!currentServerId) return;
        if (!window.confirm("Tem certeza que deseja excluir esta conta?")) return;
        
        setAccounts(prevAccounts => {
            const updatedAccounts = prevAccounts.filter(acc => acc.id !== accountId);

            window.electronAPI.invoke('save-accounts', currentServerId, updatedAccounts)
                .then(result => {
                    if (!result.success) {
                        console.error('[React] Falha ao salvar contas após exclusão:', result.error);
                    } else {
                        const runningInstance = runningAccounts.find(r => r.accountId === accountId);
                        if (runningInstance && runningInstance.pid) {
                            handleCloseAccount(runningInstance.pid); 
                        } else if (runningInstance) {
                            setRunningAccounts(prev => prev.filter(r => r.accountId !== accountId));
                        }
                    }
                })
                .catch(error => {
                    console.error('[React] Erro de IPC ao salvar contas após exclusão:', error);
                });
            
            return updatedAccounts;
        });
    };
    
    
    const handleOpenAccountsListModal = () => setIsAccountsListModalOpen(true);
    const handleCloseAccountsListModal = () => setIsAccountsListModalOpen(false);


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
                        <span className="server-indicator badge bg-primary" title="Servidor Ativo">
                            {currentServer.name}
                        </span>
                        
                        <div className="btn-group" role="group">
                            <button 
                                type="button" 
                                className="btn btn-outline-secondary" 
                                onClick={handleEditServerName} 
                                disabled={!currentServerId} 
                                title="Editar Servidor"
                            >
                                <PencilIcon style={{ width: '1rem', height: '1rem' }} /> 
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-outline-secondary" 
                                onClick={() => handleDeleteServer(currentServerId)} 
                                disabled={!currentServerId || servers.length <= 1} 
                                title="Excluir Servidor"
                            >
                                <TrashIcon style={{ width: '1rem', height: '1rem' }} /> 
                            </button>
                        </div>
                        
                        <button 
                            type="button" 
                            className="btn btn-primary"
                            onClick={handleOpenAddAccountModal} 
                            disabled={!currentServerId}
                        >
                            <PlusIcon className="me-1" style={{ width: '1rem', height: '1rem' }} /> Adicionar conta
                        </button>
                    </div>
                </div>

                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3 card-grid-container">
                    
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
                                        onEdit={handleOpenEditAccountModal} 
                                        onDelete={handleDeleteAccount} 
                                    />
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            
            <BottomBar 
                runningCount={runningAccounts.length} 
                onOpenAccountsList={handleOpenAccountsListModal}
            />

            <AccountModal 
                show={isAccountModalOpen} 
                onClose={handleCloseAccountModal} 
                serverName={currentServer.name}
                onSaveAccount={handleSaveOrUpdateAccount} 
                accountToEdit={accountToEdit} 
            />
            
            <AddServerModal
                show={isAddServerModalOpen}
                onClose={handleCloseAddServerModal}
                onSaveServer={handleSaveNewServer}
            />

            <AccountsListModal
                show={isAccountsListModalOpen}
                onClose={handleCloseAccountsListModal}
                serverName={currentServer.name}
                accounts={openedAccounts} 
            />
        </div>
    );
};

export default App;
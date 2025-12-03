import React, { useState, useEffect, useMemo } from 'react';
import ServerList from './componentes/server/ServerList';
import AccountModal from './componentes/account/AccountModal';
import ActiveInstancesModal from './componentes/account/ActiveInstancesModal';
import AddServerModal from './componentes/server/AddServerModal';
import SettingsModal from './componentes/settings/SettingsModal';
import ServerCard from './componentes/server/ServerCard';
import BottomBar from './componentes/server/BottomBar';
import { FaCog, FaPlus, FaFolderOpen } from 'react-icons/fa';
import './App.css';

const App = () => {
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isAddServerModalOpen, setIsAddServerModalOpen] = useState(false);
    const [isAccountsListModalOpen, setIsAccountsListModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const [servers, setServers] = useState([]);
    const [currentServerId, setCurrentServerId] = useState(null);

    const [runningAccounts, setRunningAccounts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [accountToEdit, setAccountToEdit] = useState(null);

    const currentServer = useMemo(() => {
        return servers.find(s => s.id === currentServerId) || { id: '', name: 'Selecionar Servidor' };
    }, [servers, currentServerId]);

    useEffect(() => {
        const init = async () => {
            const loadedServers = await window.electronAPI.invoke('load-servers');
            if (Array.isArray(loadedServers) && loadedServers.length > 0) {
                setServers(loadedServers);
                if (!currentServerId) setCurrentServerId(loadedServers[0].id);
            }
        };
        init();

        window.electronAPI.on('element-opened', (data) => {
            if (data.success) {
                setRunningAccounts(prev => [
                    ...prev.filter(acc => acc.accountId !== data.accountId),
                    { accountId: data.accountId, pid: data.pid, status: 'running' }
                ]);
            }
        });

        window.electronAPI.on('element-closed', (data) => {
            if (data.success) {
                setRunningAccounts(prev => prev.filter(acc => acc.pid !== data.pid));
            }
        });
    }, []);

    useEffect(() => {
        const loadAccounts = async () => {
            if (currentServerId) {
                const accs = await window.electronAPI.invoke('load-accounts', currentServerId);
                setAccounts(Array.isArray(accs) ? accs : []);
            }
        };
        loadAccounts();
    }, [currentServerId]);

    const handleSaveNewServer = (srv) => {
        const newServers = [...servers, srv];
        setServers(newServers);
        window.electronAPI.invoke('save-servers', newServers);
        setCurrentServerId(srv.id);
        setIsAddServerModalOpen(false);
    };

    const handleSaveAccount = (accData) => {
        const newAccounts = accountToEdit
            ? accounts.map(a => a.id === accData.id ? accData : a)
            : [...accounts, accData];

        setAccounts(newAccounts);
        window.electronAPI.invoke('save-accounts', currentServerId, newAccounts);
    };

    const handleDeleteAccount = (id) => {
        if (!confirm("Deletar conta?")) return;
        const newAccounts = accounts.filter(a => a.id !== id);
        setAccounts(newAccounts);
        window.electronAPI.invoke('save-accounts', currentServerId, newAccounts);
    };

    const handleOpenGame = async (acc) => {
        setRunningAccounts(prev => [...prev, { accountId: acc.id, status: 'starting' }]);
        await window.electronAPI.invoke('open-element', {
            id: acc.id,
            exePath: acc.exePath,
            login: acc.login,
            password: acc.password,
            characterName: acc.charName
        });
    };

    const handleCloseGame = async (pid) => {
        await window.electronAPI.invoke('close-element', pid);
    };

    return (
        <div className="main-layout">
            <ServerList
                servers={servers}
                currentServerId={currentServerId}
                onSelectServer={setCurrentServerId}
                onOpenAddModal={() => setIsAddServerModalOpen(true)}
            />

            <div className="content-area">
                <div className="content-header">
                    <div className="d-flex align-items-center gap-3">
                        <span className="server-indicator badge bg-primary">
                            {currentServer.name}
                        </span>

                        <button className="btn btn-primary" onClick={() => { setAccountToEdit(null); setIsAccountModalOpen(true); }} disabled={!currentServerId}>
                            <FaPlus className="me-1" /> Conta
                        </button>

                        <button className="btn btn-outline-secondary" onClick={() => setIsSettingsModalOpen(true)} title="Configurações Globais">
                            <FaCog />
                        </button>
                    </div>
                </div>

                <div className="card-grid-container">
                    {accounts.length === 0 ? (
                        <div className="placeholder-message">
                            <FaFolderOpen size={40} />
                            <p>Sem contas neste servidor.</p>
                        </div>
                    ) : (
                        accounts.map(acc => {
                            const run = runningAccounts.find(r => r.accountId === acc.id);
                            return (
                                <ServerCard
                                    key={acc.id}
                                    charName={acc.charName}
                                    charClass={acc.charClass}
                                    isRunning={!!run}
                                    pid={run?.pid}
                                    status={run?.status}
                                    accountData={acc}
                                    onOpen={handleOpenGame}
                                    onClose={handleCloseGame}
                                    onEdit={(a) => { setAccountToEdit(a); setIsAccountModalOpen(true); }}
                                    onDelete={handleDeleteAccount}
                                />
                            );
                        })
                    )}
                </div>
            </div>

            <BottomBar
                runningCount={runningAccounts.filter(r => r.pid).length}
                onOpenAccountsList={() => setIsAccountsListModalOpen(true)}
            />

            <AccountModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                onSave={handleSaveAccount}
                accountToEdit={accountToEdit}
            />

            <AddServerModal
                show={isAddServerModalOpen}
                onClose={() => setIsAddServerModalOpen(false)}
                onSaveServer={handleSaveNewServer}
            />

            <ActiveInstancesModal
                isOpen={isAccountsListModalOpen}
                onClose={() => setIsAccountsListModalOpen(false)}
                runningAccounts={runningAccounts}
                accounts={accounts}
            />

            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />
        </div>
    );
};

export default App;
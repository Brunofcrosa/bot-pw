import React, { useState, useEffect, useMemo } from 'react';
import ServerList from './componentes/server/ServerList';
import AccountModal from './componentes/account/AccountModal';
import ActiveInstancesModal from './componentes/account/ActiveInstancesModal';
import AddServerModal from './componentes/server/AddServerModal';
import SettingsModal from './componentes/settings/SettingsModal';
import AccountsView from './componentes/accounts/AccountsView';
import GroupsView from './componentes/groups/GroupsView';
import GroupControlModal from './componentes/groups/GroupControlModal';
import BottomBar from './componentes/server/BottomBar';
import { FaCog, FaPlus, FaUsers, FaUser } from 'react-icons/fa';
import './App.css';

const App = () => {
    console.log('[App] Componente App iniciando...');

    // Verifica se está em modo overlay
    const searchParams = new URLSearchParams(window.location.search);
    const isOverlay = searchParams.get('overlay') === 'true';
    const overlayGroupId = searchParams.get('groupId');

    const [activeTab, setActiveTab] = useState('accounts');
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isAddServerModalOpen, setIsAddServerModalOpen] = useState(false);
    const [isAccountsListModalOpen, setIsAccountsListModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [serverToEdit, setServerToEdit] = useState(null);

    const [servers, setServers] = useState([]);
    const [currentServerId, setCurrentServerId] = useState(null);

    const [runningAccounts, setRunningAccounts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [accountToEdit, setAccountToEdit] = useState(null);

    const currentServer = useMemo(() => {
        return servers.find(s => s.id === currentServerId) || { id: '', name: 'Selecionar Servidor' };
    }, [servers, currentServerId]);

    useEffect(() => {
        const init = async () => {
            const loadedServers = await window.electronAPI.invoke('load-servers');
            if (Array.isArray(loadedServers) && loadedServers.length > 0) {
                setServers(loadedServers);
                // Se estiver em overlay, precisamos carregar o servidor correto para o grupo
                // Mas como groups são salvos por servidor, precisamos iterar ou assumir o padrão
                // Simplificação: carrega o último servidor usado ou salvar o serverId na URL também
                if (!currentServerId) setCurrentServerId(loadedServers[0].id);
            }

            // Carregar contas rodando
            // ... (lógica existente)
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
        const loadData = async () => {
            if (currentServerId) {
                const accs = await window.electronAPI.invoke('load-accounts', currentServerId);
                setAccounts(Array.isArray(accs) ? accs : []);

                const grps = await window.electronAPI.invoke('load-groups', currentServerId);
                setGroups(Array.isArray(grps) ? grps : []);
            }
        };
        loadData();
    }, [currentServerId]);

    const handleSaveServer = (srv) => {
        if (serverToEdit) {
            const updatedServers = servers.map(s => s.id === srv.id ? srv : s);
            setServers(updatedServers);
            window.electronAPI.invoke('save-servers', updatedServers);
        } else {
            const newServers = [...servers, srv];
            setServers(newServers);
            window.electronAPI.invoke('save-servers', newServers);
            setCurrentServerId(srv.id);
        }
        setServerToEdit(null);
        setIsAddServerModalOpen(false);
    };

    const handleSaveGroups = (updatedGroups) => {
        setGroups(updatedGroups);
        window.electronAPI.invoke('save-groups', currentServerId, updatedGroups);
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
        const exePath = acc.exePath || currentServer.exePath || '';
        await window.electronAPI.invoke('open-element', {
            id: acc.id,
            exePath: exePath,
            login: acc.login,
            password: acc.password,
            characterName: acc.charName
        });
    };

    const handleCloseGame = async (pid) => {
        await window.electronAPI.invoke('close-element', pid);
    };

    const handleOpenGroup = async (groupAccounts) => {
        for (const acc of groupAccounts) {
            await handleOpenGame(acc);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    };

    return (
        <div className="main-layout">
            <ServerList
                servers={servers}
                currentServerId={currentServerId}
                onSelectServer={setCurrentServerId}
                onOpenAddModal={() => { setServerToEdit(null); setIsAddServerModalOpen(true); }}
                onEditServer={(server) => { setServerToEdit(server); setIsAddServerModalOpen(true); }}
            />

            <div className="content-area">
                <div className="content-header-new">
                    <div className="tabs-navigation">
                        <div className="tabs-left">
                            <button
                                className={`tab-button ${activeTab === 'accounts' ? 'active' : ''}`}
                                onClick={() => setActiveTab('accounts')}
                            >
                                <FaUser /> Contas
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'groups' ? 'active' : ''}`}
                                onClick={() => setActiveTab('groups')}
                            >
                                <FaUsers /> Grupos
                            </button>
                        </div>

                        <div className="header-actions">
                            {activeTab === 'accounts' && (
                                <button
                                    className="btn-add-account"
                                    onClick={() => { setAccountToEdit(null); setIsAccountModalOpen(true); }}
                                    disabled={!currentServerId}
                                >
                                    <FaPlus /> Nova Conta
                                </button>
                            )}

                            <button
                                className="btn-settings"
                                onClick={() => setIsSettingsModalOpen(true)}
                                title="Configurações"
                            >
                                <FaCog />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="tab-content">
                    {activeTab === 'accounts' ? (
                        <AccountsView
                            accounts={accounts}
                            runningAccounts={runningAccounts}
                            onOpenGame={handleOpenGame}
                            onCloseGame={handleCloseGame}
                            onEdit={(a) => { setAccountToEdit(a); setIsAccountModalOpen(true); }}
                            onDelete={handleDeleteAccount}
                        />
                    ) : (
                        <GroupsView
                            accounts={accounts}
                            groups={groups}
                            runningAccounts={runningAccounts}
                            onSaveGroups={handleSaveGroups}
                            onOpenGroup={handleOpenGroup}
                        />
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
                onClose={() => { setServerToEdit(null); setIsAddServerModalOpen(false); }}
                onSaveServer={handleSaveServer}
                serverToEdit={serverToEdit}
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
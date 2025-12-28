import React, { useState, useMemo, useCallback } from 'react';
import { useBotData } from './hooks/useBotData';
import { useRunningInstances } from './hooks/useRunningInstances';
import ServerList from './components/server/ServerList';
import AccountModal from './components/modals/AccountModal';
import ActiveInstancesModal from './components/modals/ActiveInstancesModal';
import AddServerModal from './components/modals/AddServerModal';
import SettingsModal from './components/modals/SettingsModal';
import ConfirmModal from './components/modals/ConfirmModal';
import AccountsView from './components/views/AccountsView';
import GroupsView from './components/views/GroupsView';
import AutoForgeView from './components/views/AutoForgeView';
import BottomBar from './components/server/BottomBar';
import OverlayView from './components/views/OverlayView';
import { FaUser, FaUsers, FaPlus, FaCog, FaHammer } from 'react-icons/fa';
import './App.css';

const App = () => {
    // Verifica se está em modo overlay
    const searchParams = new URLSearchParams(window.location.search);
    const isOverlay = searchParams.get('overlay') === 'true';
    const overlayGroupId = searchParams.get('groupId');

    React.useEffect(() => {
        if (isOverlay) {
            document.body.style.backgroundColor = 'transparent';
            document.getElementById('root').style.backgroundColor = 'transparent';
        }
    }, [isOverlay]);

    // Hooks de Dados e Processos
    const {
        servers,
        currentServerId,
        setCurrentServerId,
        accounts,
        groups,
        saveServers,
        saveAccounts,
        saveGroups
    } = useBotData();

    const {
        runningAccounts,
        registerStartingInstance,
        removeInstance
    } = useRunningInstances();

    // Estado da UI
    const [activeTab, setActiveTab] = useState('accounts');
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isAddServerModalOpen, setIsAddServerModalOpen] = useState(false);
    const [isAccountsListModalOpen, setIsAccountsListModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const [serverToEdit, setServerToEdit] = useState(null);
    const [accountToEdit, setAccountToEdit] = useState(null);

    // Estado para modal de confirmação
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'warning'
    });

    const showConfirm = useCallback((title, message, onConfirm, type = 'warning') => {
        setConfirmModal({ isOpen: true, title, message, onConfirm, type });
    }, []);

    const hideConfirm = useCallback(() => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }, []);

    const currentServer = useMemo(() => {
        return servers.find(s => s.id === currentServerId) || { id: '', name: 'Selecionar Servidor' };
    }, [servers, currentServerId]);

    const handleSaveServer = useCallback(async (srv) => {
        try {
            if (serverToEdit) {
                const updatedServers = servers.map(s => s.id === srv.id ? srv : s);
                saveServers(updatedServers);
            } else {
                const newServers = [...servers, srv];
                saveServers(newServers);
                setCurrentServerId(srv.id);
            }
            setServerToEdit(null);
            setIsAddServerModalOpen(false);
        } catch (error) {
            showConfirm('Erro', 'Falha ao salvar servidor: ' + error.message, hideConfirm, 'danger');
        }
    }, [servers, serverToEdit, saveServers, setCurrentServerId, showConfirm, hideConfirm]);

    const handleSaveAccount = useCallback(async (accData) => {
        try {
            const newAccounts = accountToEdit
                ? accounts.map(a => a.id === accData.id ? accData : a)
                : [...accounts, accData];

            saveAccounts(newAccounts);
        } catch (error) {
            showConfirm('Erro', 'Falha ao salvar conta: ' + error.message, hideConfirm, 'danger');
        }
    }, [accounts, accountToEdit, saveAccounts, showConfirm, hideConfirm]);

    const handleDeleteAccount = (id) => {
        showConfirm(
            'Deletar Conta',
            'Tem certeza que deseja deletar esta conta? Esta ação não pode ser desfeita.',
            () => {
                const newAccounts = accounts.filter(a => a.id !== id);
                saveAccounts(newAccounts);
                hideConfirm();
            },
            'danger'
        );
    };

    const handleOpenGame = useCallback(async (acc) => {
        try {
            registerStartingInstance(acc.id);
            const exePath = acc.exePath || currentServer.exePath || '';
            const result = await window.electronAPI.invoke('open-element', {
                id: acc.id,
                exePath: exePath,
                login: acc.login,
                password: acc.password,
                characterName: acc.charName,
                simpleLaunch: acc.simpleLaunch,
                argument: acc.argument
            });

            if (!result || !result.success) {
                throw new Error(result?.error || 'Falha desconhecida ao iniciar jogo');
            }
        } catch (error) {
            showConfirm(
                'Erro ao Iniciar',
                `Não foi possível iniciar o jogo para ${acc.charName || acc.login}: ${error.message}`,
                hideConfirm,
                'danger'
            );
            removeInstance(acc.id);
        }
    }, [currentServer.exePath, registerStartingInstance, removeInstance, showConfirm, hideConfirm]);

    const handleExportAccounts = useCallback(async () => {
        try {
            if (accounts.length === 0) {
                showConfirm('Exportar', 'Não há contas para exportar.', hideConfirm, 'warning');
                return;
            }
            await window.electronAPI.invoke('export-accounts', accounts);
        } catch (error) {
            showConfirm('Erro na Exportação', error.message, hideConfirm, 'danger');
        }
    }, [accounts, showConfirm, hideConfirm]);

    const handleImportAccounts = useCallback(async () => {
        try {
            const result = await window.electronAPI.invoke('import-accounts');
            if (result.success && result.accounts) {
                // Merge logic: avoid duplicates based on ID or Login?
                // Simple approach: verify if ID exists. If yes, update? Or skip?
                // Let's create new IDs to avoid conflicts if they come from another machine?
                // But user might want to restore backups.
                // Strategy: Merge. If ID exists, overwrite. If not, add.
                const mergedAccounts = [...accounts];
                let count = 0;
                result.accounts.forEach(imported => {
                    const index = mergedAccounts.findIndex(a => a.id === imported.id);
                    if (index >= 0) {
                        mergedAccounts[index] = imported;
                    } else {
                        mergedAccounts.push(imported);
                    }
                    count++;
                });
                saveAccounts(mergedAccounts);
                showConfirm('Importação', `${count} contas importadas/atualizadas com sucesso.`, hideConfirm, 'success');
            } else if (result.error) {
                showConfirm('Erro na Importação', result.error, hideConfirm, 'danger');
            }
        } catch (error) {
            showConfirm('Erro na Importação', error.message, hideConfirm, 'danger');
        }
    }, [accounts, saveAccounts, showConfirm, hideConfirm]);

    const handleCloseGame = useCallback(async (pid) => {
        try {
            const result = await window.electronAPI.invoke('close-element', pid);
            if (result && result.success) {
                // Atualiza UI imediatamente para melhor responsividade
                const account = runningAccounts.find(r => r.pid === pid);
                if (account) {
                    removeInstance(account.accountId);
                }
            }
        } catch (error) {
            // Silently fail - user will notice window didn't close
        }
    }, [runningAccounts, removeInstance]);

    const handleOpenGroup = useCallback(async (group) => {
        try {
            if (!group || !group.id) {
                showConfirm('Erro', 'Grupo inválido', hideConfirm, 'danger');
                return;
            }

            // Busca as contas do grupo
            const groupAccounts = accounts.filter(acc => group.accountIds.includes(acc.id));

            if (groupAccounts.length === 0) {
                showConfirm('Erro', 'Nenhuma conta encontrada neste grupo', hideConfirm, 'warning');
                return;
            }

            // Inicia cada conta do grupo
            for (const account of groupAccounts) {
                await handleOpenGame(account);
                // Pequeno delay entre inicializações
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        } catch (error) {
            showConfirm(
                'Erro',
                'Falha ao abrir grupo: ' + error.message,
                hideConfirm,
                'danger'
            );
        }
    }, [accounts, handleOpenGame, showConfirm, hideConfirm]);

    const handleStopGroup = useCallback(async (group) => {
        try {
            if (!group || !group.id) return;
            await window.electronAPI.invoke('stop-group-accounts', {
                serverName: currentServerId,
                groupId: group.id
            });
        } catch (error) {
            showConfirm('Erro', 'Falha ao parar grupo: ' + error.message, hideConfirm, 'danger');
        }
    }, [currentServerId, showConfirm, hideConfirm]);

    if (isOverlay) {
        return (
            <OverlayView
                groupId={overlayGroupId}
                groups={groups}
                accounts={accounts}
                runningAccounts={runningAccounts}
            />
        );
    }

    if (!window.electronAPI) {
        return (
            <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>
                <h1>Erro Crítico</h1>
                <p>A API do Electron não foi carregada corretamente.</p>
                <p>Verifique o preload.js ou o console de erros (Ctrl+Shift+I).</p>
            </div>
        );
    }

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
                            <button
                                className={`tab-button ${activeTab === 'autoforge' ? 'active' : ''}`}
                                onClick={() => setActiveTab('autoforge')}
                            >
                                <FaHammer /> Auto Forja
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
                    {activeTab === 'accounts' && (
                        <AccountsView
                            accounts={accounts}
                            runningAccounts={runningAccounts}
                            onOpenGame={handleOpenGame}
                            onCloseGame={handleCloseGame}
                            onEdit={(a) => { setAccountToEdit(a); setIsAccountModalOpen(true); }}
                            onDelete={handleDeleteAccount}
                            onExport={handleExportAccounts}
                            onImport={handleImportAccounts}
                        />
                    )}
                    {activeTab === 'groups' && (
                        <GroupsView
                            accounts={accounts}
                            groups={groups}
                            runningAccounts={runningAccounts}
                            currentServerId={currentServerId}
                            onSaveGroups={saveGroups}
                            onOpenGroup={(group) => handleOpenGroup(group)}
                            onStopGroup={(group) => handleStopGroup(group)}
                            showConfirm={showConfirm}
                            hideConfirm={hideConfirm}
                        />
                    )}
                    {activeTab === 'autoforge' && <AutoForgeView />}
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
                showConfirm={showConfirm}
                hideConfirm={hideConfirm}
            />

            <ActiveInstancesModal
                isOpen={isAccountsListModalOpen}
                onClose={() => setIsAccountsListModalOpen(false)}
                runningAccounts={runningAccounts}
                accounts={accounts}
                showConfirm={showConfirm}
                hideConfirm={hideConfirm}
            />

            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                showConfirm={showConfirm}
                hideConfirm={hideConfirm}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={hideConfirm}
                type={confirmModal.type}
            />
        </div>
    );

};

export default App;
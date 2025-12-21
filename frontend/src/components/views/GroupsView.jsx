import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaPlus, FaUsers } from 'react-icons/fa';
import GroupCard from '../groups/GroupCard';
import './GroupsView.css';

const GroupsView = ({
    accounts = [],
    groups = [],
    runningAccounts = [],
    currentServerId,
    onSaveGroups,
    onOpenGroup,
    showConfirm,
    hideConfirm
}) => {
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    const [editingGroup, setEditingGroup] = useState(null);

    const handleOpenGroupEditor = (group = null) => {
        if (group) {
            // Modo edição
            setEditingGroup(group);
            setNewGroupName(group.name);
            setSelectedAccounts(group.accountIds);
        } else {
            // Modo criação
            setEditingGroup(null);
            setNewGroupName('');
            setSelectedAccounts([]);
        }
        setIsCreatingGroup(true);
    };

    const handleCreateGroup = () => {
        if (!newGroupName.trim() || selectedAccounts.length === 0) {
            showConfirm(
                'Campos Inválidos',
                'Preencha o nome do grupo e selecione pelo menos uma conta.',
                hideConfirm,
                'warning'
            );
            return;
        }

        if (editingGroup) {
            // Modo edição - atualiza grupo existente
            const updatedGroups = groups.map(g =>
                g.id === editingGroup.id
                    ? { ...g, name: newGroupName, accountIds: selectedAccounts }
                    : g
            );
            onSaveGroups(updatedGroups);
        } else {
            // Modo criação - cria novo grupo
            const newGroup = {
                id: Date.now().toString(),
                name: newGroupName,
                accountIds: selectedAccounts,
                color: 'var(--accent-secondary)'
            };
            const updatedGroups = [...groups, newGroup];
            onSaveGroups(updatedGroups);
        }

        setNewGroupName('');
        setSelectedAccounts([]);
        setEditingGroup(null);
        setIsCreatingGroup(false);
    };

    const handleDeleteGroup = (groupId) => {
        showConfirm(
            'Deletar Grupo',
            'Tem certeza que deseja deletar este grupo?',
            () => {
                const updatedGroups = groups.filter(g => g.id !== groupId);
                onSaveGroups(updatedGroups);
                hideConfirm();
            },
            'danger'
        );
    };

    const toggleAccountSelection = (accountId) => {
        setSelectedAccounts(prev =>
            prev.includes(accountId)
                ? prev.filter(id => id !== accountId)
                : [...prev, accountId]
        );
    };

    return (
        <div className="groups-view">
            <div className="groups-header">
                <h2><FaUsers /> Grupos de Contas</h2>
                <button
                    className="btn-create-group"
                    onClick={() => handleOpenGroupEditor()}
                >
                    <FaPlus /> Novo Grupo
                </button>
            </div>

            {isCreatingGroup && (
                <div className="group-creator-backdrop" onClick={(e) => {
                    if (e.target.className === 'group-creator-backdrop') setIsCreatingGroup(false);
                }}>
                    <div className="group-creator">
                        <div className="creator-header">
                            <h3>{editingGroup ? 'Editar Grupo' : 'Criar Novo Grupo'}</h3>
                            <button onClick={() => { setIsCreatingGroup(false); setEditingGroup(null); }}>✕</button>
                        </div>

                        <input
                            type="text"
                            placeholder="Nome do grupo"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="group-name-input"
                            autoFocus
                        />

                        <div className="accounts-selector">
                            <h4>Selecione as contas:</h4>
                            <div className="accounts-list">
                                {accounts.map(acc => (
                                    <label key={acc.id} className="account-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedAccounts.includes(acc.id)}
                                            onChange={() => toggleAccountSelection(acc.id)}
                                        />
                                        <span>{acc.charName || acc.login}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            className="btn-save-group"
                            onClick={handleCreateGroup}
                        >
                            {editingGroup ? 'Salvar Alterações' : 'Criar Grupo'}
                        </button>
                    </div>
                </div>
            )}

            <div className="groups-grid">
                {groups.length === 0 ? (
                    <div className="empty-groups">
                        <FaUsers size={60} />
                        <p>Nenhum grupo criado ainda</p>
                        <small>Crie grupos para iniciar várias contas de uma vez</small>
                    </div>
                ) : (
                    groups.map(group => {
                        const groupAccounts = accounts.filter(acc =>
                            group.accountIds.includes(acc.id)
                        );

                        return (
                            <GroupCard
                                key={group.id}
                                group={group}
                                groupAccounts={groupAccounts}
                                onOpenGroup={onOpenGroup}
                                onEditGroup={handleOpenGroupEditor}
                                onOpenOverlay={(groupId) => window.electronAPI.invoke('open-group-overlay', groupId, currentServerId)}
                                onDeleteGroup={handleDeleteGroup}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};

GroupsView.propTypes = {
    accounts: PropTypes.array,
    groups: PropTypes.array,
    runningAccounts: PropTypes.array,
    currentServerId: PropTypes.string,
    onSaveGroups: PropTypes.func.isRequired,
    onOpenGroup: PropTypes.func.isRequired,
    showConfirm: PropTypes.func.isRequired,
    hideConfirm: PropTypes.func.isRequired
};

export default GroupsView;

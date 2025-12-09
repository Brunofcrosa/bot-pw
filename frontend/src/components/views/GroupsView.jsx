import React, { useState } from 'react';
import { FaPlus, FaUsers, FaPlay, FaTrash, FaGamepad, FaExternalLinkAlt } from 'react-icons/fa';
import GroupControlModal from '../modals/GroupControlModal';
import './GroupsView.css';

const GroupsView = ({ accounts = [], groups = [], runningAccounts = [], onSaveGroups, onOpenGroup }) => {
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    const [controlGroup, setControlGroup] = useState(null);

    const handleCreateGroup = () => {
        if (!newGroupName.trim() || selectedAccounts.length === 0) {
            alert('Preencha o nome e selecione pelo menos uma conta');
            return;
        }

        const newGroup = {
            id: Date.now().toString(),
            name: newGroupName,
            accountIds: selectedAccounts,
            accountIds: selectedAccounts,
            color: 'var(--accent-secondary)'
        };

        const updatedGroups = [...groups, newGroup];
        onSaveGroups(updatedGroups);
        setNewGroupName('');
        setSelectedAccounts([]);
        setIsCreatingGroup(false);
    };

    const handleDeleteGroup = (groupId) => {
        if (confirm('Deseja deletar este grupo?')) {
            const updatedGroups = groups.filter(g => g.id !== groupId);
            onSaveGroups(updatedGroups);
        }
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
                    onClick={() => setIsCreatingGroup(true)}
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
                            <h3>Criar Novo Grupo</h3>
                            <button onClick={() => setIsCreatingGroup(false)}>✕</button>
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

                        <button className="btn-save-group" onClick={handleCreateGroup}>
                            Criar Grupo
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
                            <div key={group.id} className="group-card">
                                <div
                                    className="group-header-bar"
                                    style={{ backgroundColor: group.color }}
                                />

                                <div className="group-content">
                                    <h3>{group.name}</h3>
                                    <p className="group-count">
                                        {groupAccounts.length} conta(s)
                                    </p>

                                    <div className="group-accounts-preview">
                                        {groupAccounts.slice(0, 3).map(acc => (
                                            <div key={acc.id} className="preview-account">
                                                {acc.charName || acc.login}
                                            </div>
                                        ))}
                                        {groupAccounts.length > 3 && (
                                            <div className="preview-more">
                                                +{groupAccounts.length - 3}
                                            </div>
                                        )}
                                    </div>

                                    <div className="group-actions">
                                        <button
                                            className="btn-play-group"
                                            onClick={() => onOpenGroup(groupAccounts)}
                                        >
                                            <FaPlay /> Iniciar
                                        </button>
                                        <button
                                            className="btn-control-group"
                                            onClick={() => setControlGroup(group)}
                                            title="Painel de Controle"
                                        >
                                            <FaGamepad />
                                        </button>
                                        <button
                                            className="btn-control-group"
                                            onClick={() => window.electronAPI.invoke('open-group-overlay', group.id)}
                                            title="Abrir Painel Flutuante"
                                            style={{ marginLeft: '0.5rem' }}
                                        >
                                            <FaExternalLinkAlt />
                                        </button>
                                        <button
                                            className="btn-icon-action"
                                            onClick={() => handleDeleteGroup(group.id)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <GroupControlModal
                isOpen={!!controlGroup}
                onClose={() => setControlGroup(null)}
                group={controlGroup}
                accounts={accounts}
                runningAccounts={runningAccounts}
            />
        </div>
    );
};

export default GroupsView;

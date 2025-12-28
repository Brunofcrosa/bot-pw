import React, { memo } from 'react';
import PropTypes from 'prop-types';
import ServerCard from '../server/ServerCard';
import { FaFolderOpen, FaFileExport, FaFileImport } from 'react-icons/fa';
import './AccountsView.css';

const AccountsView = ({
    accounts,
    runningAccounts,
    onOpenGame,
    onCloseGame,
    onEdit,
    onDelete,
    onExport,
    onImport
}) => {
    return (
        <div className="accounts-view">
            <div className="accounts-header-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '15px' }}>
                <button className="btn-action-secondary" onClick={onImport} title="Importar Contas">
                    <FaFileImport /> Importar
                </button>
                <button className="btn-action-secondary" onClick={onExport} title="Exportar Contas">
                    <FaFileExport /> Exportar
                </button>
            </div>
            {accounts.length === 0 ? (
                <div className="empty-accounts">
                    <FaFolderOpen size={60} />
                    <p>Sem contas neste servidor.</p>
                    <small>Adicione contas para começar</small>
                </div>
            ) : (
                <div className="accounts-grid">
                    {accounts.map(acc => {
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
                                onOpen={onOpenGame}
                                onClose={onCloseGame}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

AccountsView.propTypes = {
    accounts: PropTypes.array.isRequired,
    runningAccounts: PropTypes.array.isRequired,
    onOpenGame: PropTypes.func.isRequired,
    onCloseGame: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onExport: PropTypes.func,
    onImport: PropTypes.func
};

export default memo(AccountsView);

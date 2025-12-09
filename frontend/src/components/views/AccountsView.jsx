import React from 'react';
import ServerCard from '../server/ServerCard';
import { FaFolderOpen } from 'react-icons/fa';
import './AccountsView.css';

const AccountsView = ({
    accounts,
    runningAccounts,
    onOpenGame,
    onCloseGame,
    onEdit,
    onDelete
}) => {
    return (
        <div className="accounts-view">
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

export default AccountsView;

import React from 'react';
import { FaGamepad, FaTimes } from 'react-icons/fa';
import './css/GroupControlModal.css';

const GroupControlModal = ({ isOpen, onClose, group, accounts, runningAccounts, isOverlayMode = false }) => {
    if (!isOpen || !group) return null;

    const groupAccounts = accounts.filter(acc => group.accountIds.includes(acc.id));

    // Se estiver em modo overlay, mostra apenas as contas que estão rodando
    const displayedAccounts = isOverlayMode
        ? groupAccounts.filter(acc => runningAccounts.some(r => r.accountId === acc.id && r.pid))
        : groupAccounts;

    const handleFocus = async (accountId) => {
        const running = runningAccounts.find(r => r.accountId === accountId);
        if (running && running.pid) {
            await window.electronAPI.invoke('focus-window', running.pid);
        } else {
            // Em modo overlay, talvez não queiramos alertas intrusivos
            if (!isOverlayMode) alert('Esta conta não parece estar rodando.');
        }
    };

    // Função para obter iniciais ou ícone baseado na classe
    const getClassDisplay = (charClass) => {
        if (!charClass) return '?';
        return charClass.substring(0, 2).toUpperCase();
    };

    const containerClass = isOverlayMode ? 'group-control-modal overlay-mode' : 'group-control-modal';
    const overlayClass = isOverlayMode ? 'group-control-overlay overlay-mode' : 'group-control-overlay';

    return (
        <div className={overlayClass}>
            <div className={containerClass}>
                <div className="control-header">
                    <h3>{group.name}</h3>
                    <button onClick={onClose} className="btn-close"><FaTimes /></button>
                </div>

                <div className="control-grid">
                    {displayedAccounts.length === 0 && isOverlayMode && (
                        <div style={{ color: '#aaa', textAlign: 'center', width: '100%' }}>
                            Nenhuma conta rodando neste grupo.
                        </div>
                    )}
                    {displayedAccounts.map(acc => {
                        const running = runningAccounts.find(r => r.accountId === acc.id);
                        const isRunning = running && running.pid;

                        return (
                            <button
                                key={acc.id}
                                className={`control-btn ${isRunning ? 'running' : 'stopped'}`}
                                onClick={() => handleFocus(acc.id)}
                                title={`${acc.charName} (${acc.charClass}) - ${isRunning ? 'Online' : 'Offline'}`}
                                disabled={!isRunning}
                            >
                                <div className="class-icon">
                                    {getClassDisplay(acc.charClass)}
                                </div>
                                <span className="char-name">{acc.charName || acc.login}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GroupControlModal;

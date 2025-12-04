import React from 'react';
import { FaGamepad, FaTimes } from 'react-icons/fa';
import './css/GroupControlModal.css';

const GroupControlModal = ({ isOpen, onClose, group, accounts, runningAccounts, isOverlayMode = false }) => {
    if (!isOpen || !group) return null;

    const groupAccounts = accounts.filter(acc => group.accountIds.includes(acc.id));

    // No modo overlay, mostra todas as contas do grupo
    // (as que não estão rodando ficam desabilitadas)
    const displayedAccounts = groupAccounts;

    const handleFocus = async (accountId) => {
        const running = runningAccounts.find(r => r.accountId === accountId);
        console.log('[GroupControlModal] handleFocus called', { accountId, running, isOverlayMode });

        if (running && running.pid) {
            try {
                console.log('[GroupControlModal] Attempting to focus window with PID:', running.pid);
                await window.electronAPI.invoke('focus-window', running.pid);
                console.log('[GroupControlModal] Focus command sent successfully');
            } catch (error) {
                console.error('[GroupControlModal] Error focusing window:', error);
                if (!isOverlayMode) alert('Erro ao focar janela: ' + error.message);
            }
        } else {
            console.warn('[GroupControlModal] Account not running or no PID');
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

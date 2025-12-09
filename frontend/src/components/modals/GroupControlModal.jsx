import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { FaGamepad, FaTimes } from 'react-icons/fa';
import { getClassDisplay } from '../../utils/utils';
import './GroupControlModal.css';

const GroupControlModal = ({ isOpen, onClose, group, accounts, runningAccounts, isOverlayMode = false }) => {
    if (!isOpen || !group) return null;

    const groupAccounts = accounts.filter(acc => group.accountIds.includes(acc.id));

    // No modo overlay, mostra todas as contas do grupo
    // (as que não estão rodando ficam desabilitadas)
    const displayedAccounts = groupAccounts;

    const handleFocus = async (accountId) => {
        const running = runningAccounts.find(r => r.accountId === accountId);

        if (running && running.pid) {
            try {
                await window.electronAPI.invoke('focus-window', running.pid);
            } catch (error) {
                // Erro silencioso em modo overlay para não atrapalhar UX
            }
        }
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

GroupControlModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    group: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        accountIds: PropTypes.array
    }),
    accounts: PropTypes.array.isRequired,
    runningAccounts: PropTypes.array.isRequired,
    isOverlayMode: PropTypes.bool
};

GroupControlModal.defaultProps = {
    isOverlayMode: false,
    group: null
};

export default memo(GroupControlModal);

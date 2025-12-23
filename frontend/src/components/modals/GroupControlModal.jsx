import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { FaTimes, FaGripVertical, FaCog, FaCheck } from 'react-icons/fa';
import { getClassDisplay } from '../../utils/utils';
import './GroupControlModal.css';

const GroupControlModal = ({ isOpen, onClose, group, accounts, runningAccounts, isOverlayMode = false }) => {
    if (!isOpen || !group) return null;

    const [isConfigMode, setIsConfigMode] = React.useState(false);
    const [hotkeys, setHotkeys] = React.useState({});

    React.useEffect(() => {
        // Load existing hotkeys
        window.electronAPI.invoke('load-settings').then(settings => {
            if (settings && settings.hotkeys && settings.hotkeys.accounts) {
                setHotkeys(settings.hotkeys.accounts);
            }
        });
    }, []);

    const handleSetHotkey = async (accountId, key) => {
        // Optimistic update
        const newHotkeys = { ...hotkeys };
        if (key) newHotkeys[accountId] = key.toUpperCase();
        else delete newHotkeys[accountId];
        setHotkeys(newHotkeys);

        await window.electronAPI.invoke('set-focus-hotkey', { accountId, key: key ? key.toUpperCase() : null });
    };

    const groupAccounts = accounts.filter(acc => group.accountIds.includes(acc.id));

    // No modo overlay, mostra apenas as contas que estão rodando
    // No modo normal, mostra todas as contas do grupo
    const displayedAccounts = isOverlayMode
        ? groupAccounts.filter(acc => runningAccounts.some(r => r.accountId === acc.id && r.pid))
        : groupAccounts;

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
                    <button onClick={onClose} className="btn-close" aria-label="Fechar modal">
                        <FaTimes />
                    </button>
                </div>

                <div className="control-grid">
                    {isOverlayMode && (
                        <>
                            <div className="drag-handle" title="Arrastar">
                                <FaGripVertical />
                            </div>
                            <button
                                className={`config-btn ${isConfigMode ? 'active' : ''}`}
                                onClick={() => setIsConfigMode(!isConfigMode)}
                                title="Configurar Atalhos de Foco"
                            >
                                <FaCog />
                            </button>
                        </>
                    )}
                    {displayedAccounts.length === 0 && isOverlayMode && (
                        <div style={{ color: '#aaa', textAlign: 'center', width: '100%' }}>
                            Nenhuma conta rodando neste grupo.
                        </div>
                    )}
                    {displayedAccounts.map(acc => {
                        const running = runningAccounts.find(r => r.accountId === acc.id);
                        const isRunning = running && running.pid;

                        return (

                            <div key={acc.id} className="control-btn-wrapper">
                                <button
                                    className={`control-btn ${isRunning ? 'running' : 'stopped'}`}
                                    onClick={() => handleFocus(acc.id)}
                                    disabled={isConfigMode}
                                    title={`${acc.charName} (${acc.charClass}) - ${isRunning ? 'Online' : 'Offline'}`}>

                                    <div className="class-icon">
                                        {acc.icon ? (
                                            acc.icon.endsWith('.ico') ? (
                                                <img
                                                    src={acc.icon}
                                                    alt="Class icon"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'contain'
                                                    }}
                                                />
                                            ) : (
                                                <span style={{ fontSize: isOverlayMode ? '1.2rem' : '1.5rem' }}>{acc.icon}</span>
                                            )
                                        ) : (
                                            getClassDisplay(acc.charClass)
                                        )}
                                    </div>
                                    <span className="char-name">{acc.charName || acc.login}</span>
                                </button>
                                {isConfigMode && (
                                    <input
                                        className="hotkey-input"
                                        value={hotkeys[acc.id] || ''}
                                        placeholder=""
                                        maxLength={3}
                                        onChange={(e) => handleSetHotkey(acc.id, e.target.value)}
                                    />
                                )}
                            </div>
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

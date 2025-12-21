import React, { useState, memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import './ActiveInstancesModal.css';
import { FaKeyboard, FaRunning, FaRobot, FaTimes, FaTrash, FaList } from 'react-icons/fa';

const ActiveInstancesModal = ({ isOpen, onClose, runningAccounts, accounts, showConfirm, hideConfirm }) => {
    const [selectedInstance, setSelectedInstance] = useState(null);
    const [macroConfig, setMacroConfig] = useState({ trigger: 'F12', sequence: '', interval: 200 });
    const [macroList, setMacroList] = useState([]);

    const loadMacros = useCallback(async () => {
        try {
            const macros = await window.electronAPI.invoke('list-macros');
            setMacroList(Array.isArray(macros) ? macros : []);
        } catch (err) {
            // Failed to load macros - will show empty list
        }
    }, []);

    React.useEffect(() => {
        if (isOpen) {
            loadMacros();
        }
    }, [isOpen, loadMacros]);

    if (!isOpen) return null;

    const activeInstances = runningAccounts.map(run => {
        const accDetails = accounts.find(a => a.id === run.accountId);
        return {
            ...run,
            ...accDetails,
        };
    });

    const handleOpenConfig = (instance) => {
        setSelectedInstance(instance);
        setMacroConfig({ trigger: 'F12', sequence: '', interval: 200 });
    };

    const handleSaveMacro = async () => {
        if (!selectedInstance || !selectedInstance.pid) return;

        const sequenceArray = macroConfig.sequence.split(',').map(s => s.trim());

        const result = await window.electronAPI.invoke('register-macro', {
            pid: selectedInstance.pid,
            triggerKey: macroConfig.trigger,
            sequence: sequenceArray
        });

        if (result && result.success) {
            showConfirm(
                'Combo Ativado!',
                `Combo ativado para ${selectedInstance.charName || 'Personagem'}! Use a tecla ${macroConfig.trigger}.`,
                hideConfirm,
                'info'
            );
            setSelectedInstance(null);
            loadMacros(); // Recarrega a lista
        } else {
            showConfirm(
                'Erro',
                'Erro ao registrar macro: ' + (result?.error || 'Desconhecido'),
                hideConfirm,
                'danger'
            );
        }
    };

    const handleClearAllMacros = async () => {
        showConfirm(
            'Limpar Todas Macros',
            'Tem certeza que deseja remover todas as macros ativas?',
            async () => {
                try {
                    await window.electronAPI.invoke('unregister-all-macros');
                    await loadMacros();
                    hideConfirm();
                } catch (err) {
                    // Failed to clear macros
                    hideConfirm();
                }
            },
            'warning'
        );
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container instance-modal">
                <div className="modal-header">
                    <h2><FaRobot className="me-2" /> Instâncias Ativas</h2>
                    {macroList.length > 0 && (
                        <button
                            className="btn-clear-macros"
                            onClick={handleClearAllMacros}
                            title="Limpar Todas Macros"
                            style={{ marginRight: '10px', padding: '6px 12px', fontSize: '0.85rem', background: 'var(--accent-danger)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            <FaTrash /> Limpar Macros ({macroList.length})
                        </button>
                    )}
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body-split">
                    <div className="instance-list">
                        {activeInstances.length > 0 ? (
                            <table className="dark-table">
                                <thead>
                                    <tr>
                                        <th>PID</th>
                                        <th>Personagem</th>
                                        <th>Servidor</th>
                                        <th>Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeInstances.map((inst) => (
                                        <tr key={inst.pid} className={selectedInstance?.pid === inst.pid ? 'selected-row' : ''}>
                                            <td className="pid-cell">{inst.pid}</td>
                                            <td>
                                                <div className="char-info-cell">
                                                    <span className="status-dot online"></span>
                                                    {inst.charName || inst.login || 'Desconhecido'}
                                                </div>
                                            </td>
                                            <td>{inst.server || '-'}</td>
                                            <td>
                                                <button
                                                    className="btn-config-macro"
                                                    onClick={() => handleOpenConfig(inst)}
                                                >
                                                    <FaKeyboard /> Configurar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state">
                                <FaRunning size={40} />
                                <p>Nenhum jogo aberto no momento.</p>
                            </div>
                        )}

                        {macroList.length > 0 && (
                            <div style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                                    <FaList /> Macros Ativas ({macroList.length})
                                </h4>
                                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                    {macroList.map((macro, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                padding: '8px',
                                                marginBottom: '6px',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '4px',
                                                borderLeft: '3px solid var(--accent-primary)',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            <strong>PID {macro.pid}</strong> - Tecla: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px' }}>{macro.triggerKey}</code>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedInstance && (
                        <div className="macro-config-panel">
                            <div className="panel-header">
                                <h3>Configurar Combo</h3>
                                <button className="btn-close-panel" onClick={() => setSelectedInstance(null)}><FaTimes /></button>
                            </div>

                            <p className="target-info">
                                Alvo: <strong>{selectedInstance.charName || selectedInstance.login}</strong>
                                <br />
                                <span className="pid-badge">PID: {selectedInstance.pid}</span>
                            </p>

                            <div className="form-group">
                                <label>Tecla de Ativação (Gatilho)</label>
                                <input
                                    type="text"
                                    className="dark-input"
                                    value={macroConfig.trigger}
                                    onChange={(e) => setMacroConfig({ ...macroConfig, trigger: e.target.value.toUpperCase() })}
                                    placeholder="Ex: F12"
                                />
                                <small>Tecla global que inicia o combo.</small>
                            </div>

                            <div className="form-group">
                                <label>Sequência (Skills/Teclas)</label>
                                <input
                                    type="text"
                                    className="dark-input"
                                    value={macroConfig.sequence}
                                    onChange={(e) => setMacroConfig({ ...macroConfig, sequence: e.target.value })}
                                    placeholder="Ex: 1, 2, F1, 3"
                                />
                                <small>Separe as teclas por vírgula.</small>
                            </div>

                            <div className="form-group">
                                <label>Intervalo entre teclas (ms)</label>
                                <input
                                    type="number"
                                    className="dark-input"
                                    value={macroConfig.interval}
                                    onChange={(e) => setMacroConfig({ ...macroConfig, interval: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="panel-actions">
                                <button className="btn-save" onClick={handleSaveMacro}>Ativar Combo</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

ActiveInstancesModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    runningAccounts: PropTypes.array.isRequired,
    accounts: PropTypes.array.isRequired,
    showConfirm: PropTypes.func.isRequired,
    hideConfirm: PropTypes.func.isRequired
};

export default memo(ActiveInstancesModal);
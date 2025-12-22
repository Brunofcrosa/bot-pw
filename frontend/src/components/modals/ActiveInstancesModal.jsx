import React, { useState, memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ActiveInstancesModal.css';
import { FaPlus, FaTrash, FaArrowLeft, FaCog, FaKeyboard, FaLayerGroup, FaInfoCircle, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const ActiveInstancesModal = ({ isOpen, onClose, runningAccounts, accounts, showConfirm, hideConfirm }) => {
    // VIEW STATE: 'DASHBOARD' | 'EDITOR'
    const [viewMode, setViewMode] = useState('DASHBOARD');

    // DATA STATE
    const [presets, setPresets] = useState([]); // Array<{ id, name, triggerKey, commands: [] }>
    const [activePresetId, setActivePresetId] = useState(null); // ID of the preset being edited
    const [backgroundMacroEnabled, setBackgroundMacroEnabled] = useState(false);
    const [activeMacroTriggers, setActiveMacroTriggers] = useState([]); // List of TriggerKeys currently registered

    // Initial Load
    useEffect(() => {
        if (isOpen) {
            window.electronAPI.invoke('load-settings').then(settings => {
                const loadedPresets = settings?.macro?.presets || [];
                setPresets(loadedPresets);
                setBackgroundMacroEnabled(settings?.macro?.backgroundMacro ?? false);

                // Initialize editor with first preset if exists
                if (loadedPresets.length > 0) {
                    setActivePresetId(loadedPresets[0].id);
                }
            }).catch(() => { });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // --- PERSISTENCE ---
    const saveSettings = async (updatedPresets, bgEnabled) => {
        try {
            const currentSettings = await window.electronAPI.invoke('load-settings');
            const newSettings = {
                ...currentSettings,
                macro: {
                    ...currentSettings.macro,
                    presets: updatedPresets,
                    backgroundMacro: bgEnabled
                }
            };
            await window.electronAPI.invoke('save-settings', newSettings);
        } catch (error) {
            console.error("Failed to save settings", error);
        }
    };

    // --- DASHBOARD ACTIONS ---

    const togglePreset = async (preset) => {
        // Check if active
        const isActive = activeMacroTriggers.includes(preset.triggerKey);

        if (isActive) {
            // Stop
            await window.electronAPI.invoke('unregister-macro', preset.triggerKey);
            setActiveMacroTriggers(prev => prev.filter(k => k !== preset.triggerKey));
        } else {
            // Start
            if (!preset.triggerKey || preset.commands.length === 0) {
                showConfirm('Erro', 'Este macro está incompleto (sem tecla ou comandos).', hideConfirm, 'warning');
                return;
            }

            // Map commands to use current PIDs
            const validCommands = preset.commands.map(cmd => {
                const run = runningAccounts.find(r => r.accountId === cmd.accountId);
                if (!run) return null;
                return {
                    pid: run.pid,
                    accountId: cmd.accountId, // kept for reference if needed
                    actionKey: cmd.key.toUpperCase(),
                    delay: cmd.delay
                };
            }).filter(c => c !== null);

            if (validCommands.length === 0) {
                showConfirm('Erro', 'As contas cadastradas neste macro não estão abertas.', hideConfirm, 'danger');
                return;
            }

            await window.electronAPI.invoke('register-macro', {
                triggerKey: preset.triggerKey,
                commands: validCommands,
                loop: preset.loop || false
            });
            setActiveMacroTriggers(prev => [...prev, preset.triggerKey]);
        }
    };

    const goToEditor = () => {
        if (presets.length === 0) {
            addNewPreset();
        } else if (!activePresetId && presets.length > 0) {
            setActivePresetId(presets[0].id);
        }
        setViewMode('EDITOR');
    };

    // --- EDITOR ACTIONS ---
    const addNewPreset = () => {
        const newPreset = {
            id: Date.now(),
            name: `Novo Macro ${presets.length + 1}`,
            triggerKey: '',
            loop: false,
            commands: []
        };
        const updated = [...presets, newPreset];
        setPresets(updated);
        setActivePresetId(newPreset.id);
        saveSettings(updated, backgroundMacroEnabled);
    };

    const deletePreset = (id) => {
        const updated = presets.filter(p => p.id !== id);
        setPresets(updated);
        saveSettings(updated, backgroundMacroEnabled);

        if (activePresetId === id) {
            setActivePresetId(updated.length > 0 ? updated[0].id : null);
        }
    };

    const updatePreset = (id, field, value) => {
        const updated = presets.map(p => p.id === id ? { ...p, [field]: value } : p);
        setPresets(updated);
    };

    // Command Management
    const getActivePreset = () => presets.find(p => p.id === activePresetId);

    const addCommand = () => {
        if (!activePresetId) return;
        const current = getActivePreset();
        const newCmd = {
            id: Date.now(),
            accountId: runningAccounts.length > 0 ? runningAccounts[0].accountId : '',
            key: '',
            delay: 200
        };
        updatePreset(activePresetId, 'commands', [...current.commands, newCmd]);
    };

    const updateCommand = (cmdId, field, value) => {
        if (!activePresetId) return;
        const current = getActivePreset();
        const newCmds = current.commands.map(c => c.id === cmdId ? { ...c, [field]: value } : c);
        updatePreset(activePresetId, 'commands', newCmds);
    };

    const removeCommand = (cmdId) => {
        if (!activePresetId) return;
        const current = getActivePreset();
        updatePreset(activePresetId, 'commands', current.commands.filter(c => c.id !== cmdId));
    };

    const handleBackToDashboard = () => {
        saveSettings(presets, backgroundMacroEnabled);
        setViewMode('DASHBOARD');
    };


    // Helper for merged accounts display
    const mergedAccounts = runningAccounts.map(run => {
        const details = accounts.find(a => a.id === run.accountId);
        return { ...run, ...details };
    });

    return (
        <div className="modal-overlay">
            <div className="modal-container instance-modal">
                <div className="modal-header">
                    <h2><FaLayerGroup /> {viewMode === 'DASHBOARD' ? 'Central de Macros' : 'Editor de Macros'}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                {viewMode === 'DASHBOARD' && (
                    <div className="dashboard-view">
                        <div>
                            <div className="dashboard-section-title">Contas em Execução {mergedAccounts.length > 0 && `(${mergedAccounts.length})`}</div>
                            <div className="running-accounts-grid">
                                {mergedAccounts.length === 0 && <span className="empty-state-text">Nenhuma conta detectada.</span>}
                                {mergedAccounts.map(acc => (
                                    <div key={acc.pid} className="account-card">
                                        <div className="account-card-icon">
                                            {acc.icon && acc.icon.endsWith('.ico')
                                                ? <img src={acc.icon} alt="" />
                                                : <span>{acc.icon || '🎮'}</span>
                                            }
                                        </div>
                                        <div className="account-card-info">
                                            <span className="account-card-name">{acc.charName || acc.login}</span>
                                            <span className="account-card-pid">PID: {acc.pid}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="macro-controls-section">
                            <div className="macro-controls-header">
                                <div className="dashboard-section-title no-margin">Listagem de Macros</div>
                            </div>

                            <div className="help-banner">
                                <FaInfoCircle style={{ fontSize: '1.2rem' }} />
                                <div>
                                    Para utilizar, <strong>ative a chave</strong> do macro desejado abaixo.
                                    Quando estiver ativo, basta pressionar a <strong>Tecla de Ativação</strong> no teclado para executar.
                                </div>
                            </div>

                            <div className="macro-list">
                                {presets.length === 0 && (
                                    <div className="macro-list-empty">
                                        Nenhum macro criado.<br />
                                        Clique em <strong>Configurar Macros</strong> para criar o primeiro.
                                    </div>
                                )}
                                {presets.map(preset => {
                                    const isActive = activeMacroTriggers.includes(preset.triggerKey);
                                    return (
                                        <div key={preset.id} className={`macro-item ${isActive ? 'active' : ''}`}>
                                            <div className="macro-info-group">
                                                <span className="macro-name">{preset.name}</span>
                                                <div className="macro-status-row">
                                                    <span className="key-badge">{preset.triggerKey || '?'}</span>
                                                    {isActive ? (
                                                        <span className="status-text active"><FaCheckCircle /> Aguardando Tecla... {preset.loop && '(Loop)'}</span>
                                                    ) : (
                                                        <span className="status-text inactive"><FaExclamationCircle /> Inativo</span>
                                                    )}
                                                </div>
                                            </div>
                                            <label className="macro-toggle">
                                                <input
                                                    type="checkbox"
                                                    checked={isActive}
                                                    onChange={() => togglePreset(preset)}
                                                    disabled={!preset.triggerKey}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="dashboard-actions">
                                <button className="btn-large-primary" onClick={goToEditor}>
                                    <FaCog /> Configurar Macros
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'EDITOR' && (
                    <div className="editor-view">
                        <div className="tabs-bar">
                            {presets.map(p => (
                                <button
                                    key={p.id}
                                    className={`tab ${activePresetId === p.id ? 'active' : ''}`}
                                    onClick={() => setActivePresetId(p.id)}
                                >
                                    {p.name}
                                </button>
                            ))}
                            <button className="tab-add" onClick={addNewPreset}><FaPlus /></button>
                        </div>

                        <div className="editor-body">
                            {activePresetId ? (
                                <>
                                    {/* Left: Commands */}
                                    <div className="commands-panel">
                                        <div className="panel-header">
                                            <span className="panel-title">Sequência de Comandos</span>
                                            <button className="tab-add tab-add-btn-small" onClick={addCommand}>
                                                <FaPlus style={{ marginRight: 6 }} /> Add
                                            </button>
                                        </div>
                                        <div className="commands-list">
                                            {getActivePreset()?.commands.map((cmd, idx) => (
                                                <div key={cmd.id} className="command-row">
                                                    <div className="cmd-index">{idx + 1}</div>
                                                    <select
                                                        className="cmd-select"
                                                        value={cmd.accountId}
                                                        onChange={e => updateCommand(cmd.id, 'accountId', e.target.value)}
                                                    >
                                                        <option value="">Selecione Conta...</option>
                                                        {mergedAccounts.map(acc => (
                                                            <option key={acc.accountId} value={acc.accountId}>
                                                                {acc.charName || acc.login} (PID: {acc.pid})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        className="cmd-key"
                                                        placeholder="KEY"
                                                        maxLength={3}
                                                        value={cmd.key}
                                                        onChange={e => updateCommand(cmd.id, 'key', e.target.value)}
                                                    />
                                                    <div className="cmd-delay-wrapper">
                                                        <input
                                                            type="number"
                                                            className="cmd-delay"
                                                            placeholder="0"
                                                            value={cmd.delay}
                                                            onChange={e => updateCommand(cmd.id, 'delay', e.target.value)}
                                                        />
                                                        <span className="cmd-delay-unit">ms</span>
                                                    </div>
                                                    <div className="cmd-actions">
                                                        <button onClick={() => removeCommand(cmd.id)}><FaTrash /></button>
                                                    </div>
                                                </div>
                                            ))}
                                            {getActivePreset()?.commands.length === 0 && (
                                                <div className="commands-list-empty">
                                                    Adicione comandos para este macro.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Settings */}
                                    <div className="settings-panel">
                                        <div className="settings-header">DETALHES DO MACRO {getActivePreset()?.name}</div>

                                        <div className="settings-group">
                                            <label>Nome do Preset</label>
                                            <input
                                                className="settings-input"
                                                value={getActivePreset()?.name}
                                                onChange={e => updatePreset(activePresetId, 'name', e.target.value)}
                                                placeholder="Ex: Combo Guerreiro"
                                            />
                                        </div>
                                        <div className="settings-group">
                                            <label><FaKeyboard style={{ marginRight: 6 }} /> Tecla de Ativação (Gatilho)</label>
                                            <input
                                                className="settings-input trigger-input"
                                                value={getActivePreset()?.triggerKey}
                                                onChange={e => updatePreset(activePresetId, 'triggerKey', e.target.value.toUpperCase())}
                                                maxLength={3}
                                                placeholder="F1"
                                            />
                                            <small className="trigger-help-text">
                                                Essa é a tecla que você aperta para <strong>rodar</strong> o macro.
                                            </small>
                                        </div>

                                        <div className="settings-group">
                                            <label>Opções de Execução</label>
                                            <div className="checkbox-group">
                                                <label className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={getActivePreset()?.loop || false}
                                                        onChange={e => updatePreset(activePresetId, 'loop', e.target.checked)}
                                                    />
                                                    <span>Repetir em Loop (Execução Contínua)</span>
                                                </label>
                                            </div>
                                        </div>

                                        <button
                                            className="delete-btn"
                                            onClick={() => deletePreset(activePresetId)}
                                        >
                                            <FaTrash /> Excluir Preset
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="editor-empty-state">
                                    Selecione ou crie um novo macro.
                                </div>
                            )}
                        </div>

                        <div className="editor-footer">
                            <button className="back-btn" onClick={handleBackToDashboard}>
                                <FaArrowLeft /> Salvar & Voltar
                            </button>
                        </div>
                    </div>
                )}
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
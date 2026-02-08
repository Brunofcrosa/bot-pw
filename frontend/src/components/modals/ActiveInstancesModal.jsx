import React, { useState, memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ActiveInstancesModal.css';
import { FaPlus, FaTrash, FaArrowLeft, FaCog, FaKeyboard, FaLayerGroup, FaInfoCircle, FaCheckCircle, FaExclamationCircle, FaStop, FaPlayCircle } from 'react-icons/fa';

const KEY_TO_VK = {
    'F1': 0x70, 'F2': 0x71, 'F3': 0x72, 'F4': 0x73,
    'F5': 0x74, 'F6': 0x75, 'F7': 0x76, 'F8': 0x77,
    'F9': 0x78, 'F10': 0x79, 'F11': 0x7A, 'F12': 0x7B,
    '0': 0x30, '1': 0x31, '2': 0x32, '3': 0x33, '4': 0x34,
    '5': 0x35, '6': 0x36, '7': 0x37, '8': 0x38, '9': 0x39,
    'ENTER': 0x0D, 'ESCAPE': 0x1B, 'SPACE': 0x20, 'TAB': 0x09,
    'A': 0x41, 'B': 0x42, 'C': 0x43, 'D': 0x44, 'E': 0x45,
    'F': 0x46, 'G': 0x47, 'H': 0x48, 'I': 0x49, 'J': 0x4A,
    'K': 0x4B, 'L': 0x4C, 'M': 0x4D, 'N': 0x4E, 'O': 0x4F,
    'P': 0x50, 'Q': 0x51, 'R': 0x52, 'S': 0x53, 'T': 0x54,
    'U': 0x55, 'V': 0x56, 'W': 0x57, 'X': 0x58, 'Y': 0x59, 'Z': 0x5A
};

const ActiveInstancesModal = ({ isOpen, onClose, runningAccounts, accounts, showConfirm, hideConfirm }) => {
    // VIEW STATE: 'DASHBOARD' | 'EDITOR'
    const [viewMode, setViewMode] = useState('DASHBOARD');

    // DATA STATE
    const [presets, setPresets] = useState([]); // Array<{ id, name, triggerKey, commands: [] }>
    const [activePresetId, setActivePresetId] = useState(null); // ID of the preset being edited
    const [backgroundMacroEnabled, setBackgroundMacroEnabled] = useState(false);
    const [activeMacroTriggers, setActiveMacroTriggers] = useState([]); // List of TriggerKeys currently registered

    // --- DRAGGABLE LOGIC ---
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!isOpen) {
            setPosition({ x: 0, y: 0 }); // Reset on close/open
        }
    }, [isOpen]);

    const handleMouseDown = (e) => {
        // Only allow dragging from header
        if (e.target.closest('.close-btn')) return; // Don't drag if clicking close
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    // Load Presets & Listen for Updates
    useEffect(() => {
        if (isOpen) {
            // Load Settings
            window.electronAPI.invoke('load-settings').then(settings => {
                const loadedPresets = settings?.macro?.presets || [];
                setPresets(loadedPresets);
                setBackgroundMacroEnabled(settings?.macro?.backgroundMacro ?? false);

                // Initialize editor with first preset if exists
                if (loadedPresets.length > 0) {
                    setActivePresetId(loadedPresets[0].id);
                }
            }).catch(() => { });

            // Initial Active State
            window.electronAPI.invoke('macro-get-active').then((activeKeys) => {
                setActiveMacroTriggers(activeKeys || []);
            });

            // Listen for updates from backend
            const removeListener = window.electronAPI.on('macro-status-update', (activeKeys) => {
                setActiveMacroTriggers(activeKeys);
            });

            return () => {
                removeListener();
            };
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
                loop: preset.loop || false,
                mode: preset.mode || 'pw'
            });
            setActiveMacroTriggers(prev => [...prev, preset.triggerKey]);

            // Auto-Start immediately
            window.electronAPI.invoke('execute-macro', preset.triggerKey);
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
            mode: 'seiya',
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
        // Auto-stop if running to prevent ghosting
        const preset = presets.find(p => p.id === id);
        if (preset) {
            const isActive = activeMacroTriggers.includes(preset.triggerKey);
            if (isActive) {
                togglePreset(preset); // Force stop to apply changes next time
            }
        }

        const updated = presets.map(p => p.id === id ? { ...p, [field]: value } : p);
        setPresets(updated);
        saveSettings(updated, backgroundMacroEnabled);
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
            <div
                className="modal-container instance-modal"
                style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            >
                <div
                    className="modal-header"
                    onMouseDown={handleMouseDown}
                    style={{ cursor: 'move', userSelect: 'none' }}
                >
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
                                    const isActive = activeMacroTriggers.includes(KEY_TO_VK[preset.triggerKey] || 0);
                                    console.log('Rendering Preset:', preset.id, 'Active:', isActive);

                                    return (
                                        <div key={preset.id} className={`macro-item ${isActive ? 'active' : ''}`}>

                                            {/* LEFT: TOGGLE BUTTON */}
                                            <div className="macro-toggle-section">
                                                {isActive && (
                                                    <button
                                                        className="stop-macro-btn"
                                                        title="Parar Macro"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            togglePreset(preset);
                                                        }}
                                                    >
                                                        <FaStop />
                                                    </button>
                                                )}
                                                <label className="switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={isActive}
                                                        onChange={() => togglePreset(preset)}
                                                    />
                                                    <span className="slider round"></span>
                                                </label>
                                            </div>

                                            {/* CENTER: INFORMATION */}
                                            <div className="macro-info-section">
                                                <div className="macro-header-row">
                                                    <span className="macro-name">{preset.name || 'Macro Sem Nome'}</span>
                                                </div>

                                                <div className="macro-detail-row">
                                                    <span className="detail-label">Tecla:</span>
                                                    <span className="key-box">{preset.triggerKey || '?'}</span>

                                                    <div className="macro-status">
                                                        {isActive
                                                            ? <span className="status-running"><FaPlayCircle style={{ fontSize: '0.8rem' }} /> Rodando</span>
                                                            : <span className="status-stopped">Parado</span>
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RIGHT: CONFIG & LOOP */}
                                            <div className="macro-actions-section">
                                                <label className={`loop-option ${preset.loop ? 'checked' : ''}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={preset.loop || false}
                                                        onChange={(e) => {
                                                            const newValue = e.target.checked;
                                                            updatePreset(preset.id, 'loop', newValue);
                                                            const updatedPresets = presets.map(p => p.id === preset.id ? { ...p, loop: newValue } : p);
                                                            saveSettings(updatedPresets, backgroundMacroEnabled);
                                                        }}
                                                    />
                                                    <span className="loop-icon">↻</span>
                                                    <span className="loop-label">Loop</span>
                                                </label>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="dashboard-actions">
                                <button className="btn-large-primary" onClick={goToEditor}>
                                    <FaCog /> Configurar Macros
                                </button>
                            </div>
                        </div >
                    </div >
                )}

                {
                    viewMode === 'EDITOR' && (
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
                                                <label>Tecla Detonadora (Trigger)</label>
                                                <input
                                                    className="settings-input"
                                                    value={getActivePreset()?.triggerKey || ''}
                                                    maxLength={3}
                                                    style={{ textTransform: 'uppercase', textAlign: 'center', fontWeight: 'bold' }}
                                                    onChange={e => updatePreset(activePresetId, 'triggerKey', e.target.value.toUpperCase())}
                                                    placeholder="Ex: F1"
                                                />
                                            </div>

                                            <div className="settings-group">
                                                <label>Modo de Envio</label>
                                                <select
                                                    className="settings-input"
                                                    value={getActivePreset()?.mode || 'pw'}
                                                    onChange={e => updatePreset(activePresetId, 'mode', e.target.value)}
                                                >
                                                    <option value="seiya">Método 1</option>
                                                </select>
                                                <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                                                    {getActivePreset()?.mode === 'seiya'
                                                        ? 'Método padrão: Foca a janela rapidamente para enviar teclas, compatível com Perfect World e Saint Seiya.'
                                                        : 'Envia teclas em segundo plano sem focar.'}
                                                </small>
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
                    )
                }
            </div >
        </div >
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
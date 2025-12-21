import React, { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { FaKeyboard, FaRobot, FaSave, FaTimes, FaCog, FaDownload, FaUpload } from 'react-icons/fa';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('hotkeys');
    const [cycleHotkey, setCycleHotkey] = useState('Control+Shift+T');
    const [toggleHotkey, setToggleHotkey] = useState('');
    const [macroHotkey, setMacroHotkey] = useState('');
    const [macroKeys, setMacroKeys] = useState('');
    const [focusOnMacro, setFocusOnMacro] = useState(true);
    const [backgroundMacro, setBackgroundMacro] = useState(false);
    const [autoBackup, setAutoBackup] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadSettings();
            setMessage('');
        }
    }, [isOpen]);

    const loadSettings = async () => {
        try {
            if (!window.electronAPI) {
                return;
            }
            const settings = await window.electronAPI.invoke('load-settings');
            if (settings) {
                setCycleHotkey(settings.hotkeys?.cycle || 'Control+Shift+T');
                setToggleHotkey(settings.hotkeys?.toggle || '');
                setMacroHotkey(settings.hotkeys?.macro || '');
                setMacroKeys(settings.macro?.keys?.join(', ') || '');
                setFocusOnMacro(settings.macro?.focusOnMacro ?? true);
                setBackgroundMacro(settings.macro?.backgroundMacro ?? false);
                setAutoBackup(settings.general?.autoBackup ?? true);
            }
        } catch (err) {
            // Failed to load settings - will show empty
            setMessage('Erro ao carregar configurações.');
        }
    };

    if (!isOpen) return null;

    const handleSave = async () => {
        try {
            const keysArray = macroKeys.split(',').map(k => k.trim().toUpperCase()).filter(k => k);

            const settings = {
                hotkeys: { cycle: cycleHotkey, toggle: toggleHotkey, macro: macroHotkey },
                macro: { keys: keysArray, focusOnMacro, backgroundMacro },
                general: { autoBackup }
            };

            await window.electronAPI.invoke('save-settings', settings);

            // Aplica as configurações imediatamente
            if (cycleHotkey) await window.electronAPI.invoke('set-cycle-hotkey', cycleHotkey);
            if (toggleHotkey) await window.electronAPI.invoke('set-toggle-hotkey', toggleHotkey);
            if (macroHotkey) await window.electronAPI.invoke('set-macro-hotkey', macroHotkey);
            if (keysArray.length > 0) await window.electronAPI.invoke('set-macro-keys', keysArray);
            await window.electronAPI.invoke('set-focus-on-macro', focusOnMacro);
            await window.electronAPI.invoke('set-background-macro', backgroundMacro);

            setMessage('Configurações salvas!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(`Erro: ${err.message}`);
        }
    };

    const handleExport = async () => {
        try {
            const backup = await window.electronAPI.invoke('export-backup');
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setMessage('Backup exportado com sucesso!');
        } catch (err) {
            setMessage(`Erro: ${err.message}`);
        }
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const backup = JSON.parse(text);
                if (confirm('Tem certeza? Isso irá sobrescrever todos os dados atuais.')) {
                    await window.electronAPI.invoke('import-backup', backup, { overwrite: true });
                    setMessage('Dados importados! Reinicie a aplicação.');
                }
            } catch (err) {
                setMessage('Arquivo de backup inválido.');
            }
        };
        input.click();
    };

    return (
        <div className="modal-overlay">
            <div className="settings-modal-container">
                <div className="settings-sidebar">
                    <div className="sidebar-header">
                        <h2><FaCog /> Ajustes</h2>
                    </div>
                    <nav className="sidebar-nav">
                        <button
                            className={`nav-item ${activeTab === 'hotkeys' ? 'active' : ''}`}
                            onClick={() => setActiveTab('hotkeys')}
                        >
                            <FaKeyboard className="nav-icon" /> Atalhos
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'macro' ? 'active' : ''}`}
                            onClick={() => setActiveTab('macro')}
                        >
                            <FaRobot className="nav-icon" /> Macros
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'backup' ? 'active' : ''}`}
                            onClick={() => setActiveTab('backup')}
                        >
                            <FaSave className="nav-icon" /> Backup
                        </button>
                    </nav>
                </div>

                <div className="settings-content">
                    <div className="content-header">
                        <h3>
                            {activeTab === 'hotkeys' && 'Atalhos Globais'}
                            {activeTab === 'macro' && 'Configuração de Macros'}
                            {activeTab === 'backup' && 'Gerenciamento de Dados'}
                        </h3>
                        <button className="close-button" onClick={onClose}><FaTimes /></button>
                    </div>

                    <div className="content-body">
                        {message && (
                            <div style={{ padding: '10px', marginBottom: '15px', background: message.includes('Erro') ? '#442222' : '#224422', borderRadius: '4px', color: 'white' }}>
                                {message}
                            </div>
                        )}

                        {activeTab === 'hotkeys' && (
                            <>
                                <div className="settings-group">
                                    <label className="control-label">Ciclar Janelas (Cycle)</label>
                                    <input
                                        type="text"
                                        className="control-input"
                                        value={cycleHotkey}
                                        onChange={e => setCycleHotkey(e.target.value)}
                                        placeholder="Ex: Control+Shift+T"
                                    />
                                    <span className="control-hint">Alterna para a próxima janela do PW em sequência.</span>
                                </div>
                                <div className="settings-group">
                                    <label className="control-label">Alternar Última (Toggle)</label>
                                    <input
                                        type="text"
                                        className="control-input"
                                        value={toggleHotkey}
                                        onChange={e => setToggleHotkey(e.target.value)}
                                        placeholder="Ex: Control+Shift+Y"
                                    />
                                    <span className="control-hint">Alterna entre as duas últimas janelas focadas.</span>
                                </div>
                                <div className="settings-group">
                                    <label className="control-label">Executar Macro</label>
                                    <input
                                        type="text"
                                        className="control-input"
                                        value={macroHotkey}
                                        onChange={e => setMacroHotkey(e.target.value)}
                                        placeholder="Ex: Control+Shift+M"
                                    />
                                    <span className="control-hint">Dispara a macro configurada.</span>
                                </div>
                            </>
                        )}

                        {activeTab === 'macro' && (
                            <>
                                <div className="settings-group">
                                    <label className="control-label">Sequência de Teclas</label>
                                    <input
                                        type="text"
                                        className="control-input"
                                        value={macroKeys}
                                        onChange={e => setMacroKeys(e.target.value)}
                                        placeholder="F1, F2, 1, 2"
                                    />
                                    <span className="control-hint">Teclas separadas por vírgula.</span>
                                </div>

                                <div className="toggle-control" onClick={() => setFocusOnMacro(!focusOnMacro)}>
                                    <div className="toggle-info">
                                        <div className="toggle-title">Focar Janela</div>
                                        <div className="toggle-desc">Traz a janela para frente antes de enviar teclas</div>
                                    </div>
                                    <label className="checkbox-wrapper">
                                        <input type="checkbox" checked={focusOnMacro} readOnly />
                                        <span className="slider"></span>
                                    </label>
                                </div>

                                <div className="toggle-control" onClick={() => setBackgroundMacro(!backgroundMacro)}>
                                    <div className="toggle-info">
                                        <div className="toggle-title">Modo Background</div>
                                        <div className="toggle-desc">Envia teclas sem focar (experimental)</div>
                                    </div>
                                    <label className="checkbox-wrapper">
                                        <input type="checkbox" checked={backgroundMacro} readOnly />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                            </>
                        )}

                        {activeTab === 'backup' && (
                            <>
                                <div className="toggle-control" onClick={() => setAutoBackup(!autoBackup)}>
                                    <div className="toggle-info">
                                        <div className="toggle-title">Backup Automático</div>
                                        <div className="toggle-desc">Criar backup ao iniciar o aplicativo</div>
                                    </div>
                                    <label className="checkbox-wrapper">
                                        <input type="checkbox" checked={autoBackup} readOnly />
                                        <span className="slider"></span>
                                    </label>
                                </div>

                                <div className="action-buttons">
                                    <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FaDownload /> Exportar Dados
                                    </button>
                                    <button className="btn btn-secondary" onClick={handleImport} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FaUpload /> Importar Dados
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="content-footer">
                        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleSave}>Salvar Alterações</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

SettingsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};

export default memo(SettingsModal);
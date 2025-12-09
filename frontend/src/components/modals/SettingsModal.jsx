import React, { useState, useEffect } from 'react';
import './AccountModal.css';

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
            console.error('Erro ao carregar settings:', err);
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
            if (cycleHotkey) await window.electronAPI.invoke('set-cycle-hotkey', cycleHotkey);
            if (toggleHotkey) await window.electronAPI.invoke('set-toggle-hotkey', toggleHotkey);
            if (macroHotkey) await window.electronAPI.invoke('set-macro-hotkey', macroHotkey);
            if (keysArray.length > 0) await window.electronAPI.invoke('set-macro-keys', keysArray);
            await window.electronAPI.invoke('set-focus-on-macro', focusOnMacro);
            await window.electronAPI.invoke('set-background-macro', backgroundMacro);

            setMessage('✅ Configurações salvas!');
            setTimeout(() => onClose(), 1000);
        } catch (err) {
            setMessage(`❌ Erro: ${err.message}`);
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
            setMessage('✅ Backup exportado!');
        } catch (err) {
            setMessage(`❌ ${err.message}`);
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
                if (confirm('Sobrescrever dados existentes?')) {
                    await window.electronAPI.invoke('import-backup', backup, { overwrite: true });
                    setMessage('✅ Importado! Reinicie o app.');
                }
            } catch (err) {
                setMessage('❌ Arquivo inválido');
            }
        };
        input.click();
    };

    const tabStyle = (tab) => ({
        padding: '8px 16px',
        background: activeTab === tab ? 'var(--accent-primary, #5e72e4)' : 'transparent',
        color: activeTab === tab ? 'white' : 'var(--text-secondary, #888)',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 600,
        marginRight: '8px'
    });

    return (
        <div className="modal-overlay">
            <div className="modal-container form-modal" style={{ width: '500px', maxWidth: '95%' }}>
                <div className="modal-header">
                    <h2>⚙️ Configurações</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color, #333)' }}>
                    <button style={tabStyle('hotkeys')} onClick={() => setActiveTab('hotkeys')}>Atalhos</button>
                    <button style={tabStyle('macro')} onClick={() => setActiveTab('macro')}>Macros</button>
                    <button style={tabStyle('backup')} onClick={() => setActiveTab('backup')}>Backup</button>
                </div>

                <div className="modal-body">
                    {message && <div style={{ padding: '8px', marginBottom: '12px', background: 'var(--bg-hover, #333)', borderRadius: '4px' }}>{message}</div>}

                    {activeTab === 'hotkeys' && (
                        <>
                            <div className="form-group">
                                <label>Ciclar Janelas</label>
                                <input className="form-input" value={cycleHotkey} onChange={e => setCycleHotkey(e.target.value)} placeholder="Control+Shift+T" />
                            </div>
                            <div className="form-group">
                                <label>Alternar Última Janela</label>
                                <input className="form-input" value={toggleHotkey} onChange={e => setToggleHotkey(e.target.value)} placeholder="Control+Shift+Y" />
                            </div>
                            <div className="form-group">
                                <label>Ativar Macro</label>
                                <input className="form-input" value={macroHotkey} onChange={e => setMacroHotkey(e.target.value)} placeholder="Control+Shift+M" />
                            </div>
                            <small style={{ color: 'var(--text-muted, #666)' }}>Formato: Control+T, Alt+F1, etc.</small>
                        </>
                    )}

                    {activeTab === 'macro' && (
                        <>
                            <div className="form-group">
                                <label>Teclas a Enviar (separadas por vírgula)</label>
                                <input className="form-input" value={macroKeys} onChange={e => setMacroKeys(e.target.value)} placeholder="F1, F2, F3, 1, 2" />
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="checkbox" checked={focusOnMacro} onChange={e => setFocusOnMacro(e.target.checked)} id="focusCheck" />
                                <label htmlFor="focusCheck" style={{ margin: 0, cursor: 'pointer' }}>Focar janela ao enviar</label>
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="checkbox" checked={backgroundMacro} onChange={e => setBackgroundMacro(e.target.checked)} id="bgCheck" />
                                <label htmlFor="bgCheck" style={{ margin: 0, cursor: 'pointer' }}>Enviar em background</label>
                            </div>
                        </>
                    )}

                    {activeTab === 'backup' && (
                        <>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="checkbox" checked={autoBackup} onChange={e => setAutoBackup(e.target.checked)} id="autoCheck" />
                                <label htmlFor="autoCheck" style={{ margin: 0, cursor: 'pointer' }}>Backup automático na inicialização</label>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                                <button className="btn-confirm" onClick={handleExport}>📤 Exportar</button>
                                <button className="btn-confirm" onClick={handleImport}>📥 Importar</button>
                            </div>
                            <small style={{ color: 'var(--text-muted, #666)', marginTop: '12px', display: 'block' }}>
                                Backups salvos em: backend/data/backups/
                            </small>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancelar</button>
                    <button className="btn-confirm" onClick={handleSave}>Salvar</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
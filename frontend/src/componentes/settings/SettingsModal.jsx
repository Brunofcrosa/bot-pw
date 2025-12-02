import React, { useState, useEffect } from 'react';
import { FaCog, Fahdd, FaTools, FaPlay, FaUndo, FaSave, FaTrash } from 'react-icons/fa';
import '../account/css/AccountModal.css';
import './css/SettingsModal.css';

const SettingsModal = ({ show, onClose }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState(null);
    const [backups, setBackups] = useState([]);
    const [loadingBackup, setLoadingBackup] = useState(false);
    const [backupPath, setBackupPath] = useState('');

    useEffect(() => {
        if (show) {
            loadSettings();
            loadBackups();
        }
    }, [show]);

    const loadSettings = async () => {
        const result = await window.electronAPI.invoke('get-settings');
        if (result.success) setSettings(result.response);
    };

    const loadBackups = async () => {
        const pathRes = await window.electronAPI.invoke('get-backup-default-path');
        if (pathRes.success) {
            setBackupPath(pathRes.response);
            const listRes = await window.electronAPI.invoke('get-backups-list', pathRes.response);
            if (listRes.success) setBackups(listRes.response);
        }
    };

    const handleCreateBackup = async () => {
        setLoadingBackup(true);
        const timestamp = new Date().toISOString();
        await window.electronAPI.invoke('backup', { 
            backupPath, 
            timestamp, 
            maxBackups: 10 
        });
        await loadBackups();
        setLoadingBackup(false);
    };

    const handleRestore = async (backupName) => {
        if (!confirm('Atenção: Isso sobrescreverá os dados atuais. Continuar?')) return;
        
        const options = {
            servers: true,
            accountGroups: true,
            parties: true,
            accounts: true
        };
        
        await window.electronAPI.invoke('restore', backupName, options, backupPath);
        alert('Backup restaurado. O aplicativo pode precisar ser reiniciado.');
        window.location.reload();
    };

    const toggleStartWithWindows = (e) => {
        const enable = e.target.checked;
        if (enable) window.electronAPI.send('enable-start-with-windows');
        else window.electronAPI.send('disable-start-with-windows');
        
        setSettings(prev => ({ ...prev, startWithWindows: enable }));
    };

    if (!show) return null;

    return (
        <div className="account-modal-backdrop" style={{ zIndex: 1070 }}>
            <div className="account-modal-dialog modal-dialog-centered" style={{ maxWidth: '700px' }}>
                <div className="account-modal-content">
                    <div className="modal-header border-bottom p-3">
                        <h5 className="modal-title fs-5 text-info">
                            <FaCog className="me-2" /> Painel de Controle
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    <div className="modal-body p-0 d-flex" style={{ height: '500px' }}>
                        <div className="settings-sidebar p-3 border-end border-secondary">
                            <button 
                                className={`btn btn-link nav-link-custom ${activeTab === 'general' ? 'active' : ''}`}
                                onClick={() => setActiveTab('general')}
                            >
                                <FaTools className="me-2" /> Geral
                            </button>
                            <button 
                                className={`btn btn-link nav-link-custom ${activeTab === 'tools' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tools')}
                            >
                                <FaPlay className="me-2" /> Ferramentas
                            </button>
                            <button 
                                className={`btn btn-link nav-link-custom ${activeTab === 'backup' ? 'active' : ''}`}
                                onClick={() => setActiveTab('backup')}
                            >
                                <Fahdd className="me-2" /> Backups
                            </button>
                        </div>

                        <div className="settings-content p-4 w-100 overflow-auto">
                            {activeTab === 'general' && settings && (
                                <div>
                                    <h6 className="text-warning mb-3">Configurações do Aplicativo</h6>
                                    <div className="form-check form-switch mb-3">
                                        <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            id="startWindows"
                                            checked={settings.startWithWindows || false}
                                            onChange={toggleStartWithWindows}
                                        />
                                        <label className="form-check-label text-light" htmlFor="startWindows">
                                            Iniciar junto com o Windows
                                        </label>
                                    </div>
                                    <div className="alert alert-secondary text-small">
                                        Versão do App: {settings.version || 'Dev'}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tools' && (
                                <div className="d-grid gap-3">
                                    <h6 className="text-warning">Módulos Externos</h6>
                                    <button className="btn btn-outline-info text-start p-3" onClick={() => window.electronAPI.send('open-parties-window')}>
                                        <div className="fw-bold">Modo Grupo (Party)</div>
                                        <div className="small text-muted">Gerenciar grupos e presets de teclas.</div>
                                    </button>
                                    <button className="btn btn-outline-warning text-start p-3" onClick={() => window.electronAPI.send('open-auto-forja')}>
                                        <div className="fw-bold">Auto Forja</div>
                                        <div className="small text-muted">Automação de forja de equipamentos.</div>
                                    </button>
                                    <button className="btn btn-outline-light text-start p-3" onClick={() => window.electronAPI.send('open-toolbar')}>
                                        <div className="fw-bold">Barra de Ferramentas (Toolbar)</div>
                                        <div className="small text-muted">Barra flutuante para acesso rápido.</div>
                                    </button>
                                </div>
                            )}

                            {activeTab === 'backup' && (
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h6 className="text-warning m-0">Gerenciador de Backups</h6>
                                        <button className="btn btn-sm btn-primary" onClick={handleCreateBackup} disabled={loadingBackup}>
                                            <FaSave className="me-1" /> {loadingBackup ? 'Criando...' : 'Novo Backup'}
                                        </button>
                                    </div>
                                    
                                    <div className="list-group">
                                        {backups.length === 0 ? (
                                            <p className="text-muted text-center">Nenhum backup encontrado.</p>
                                        ) : (
                                            backups.map((bkp, idx) => (
                                                <div key={idx} className="list-group-item bg-dark border-secondary text-light d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <div className="fw-bold">{bkp.backup}</div>
                                                        <div className="small text-muted">
                                                            Contas: {bkp.accounts} | Servidores: {bkp.servers}
                                                        </div>
                                                    </div>
                                                    <button 
                                                        className="btn btn-sm btn-outline-warning"
                                                        onClick={() => handleRestore(bkp.backup)}
                                                        title="Restaurar este backup"
                                                    >
                                                        <FaUndo />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './AccountModal.css';

const SettingsModal = ({ isOpen, onClose, showConfirm, hideConfirm }) => {
    const [cycleHotkey, setCycleHotkey] = useState('Control+Shift+T');

    useEffect(() => {
        if (isOpen) {
            window.electronAPI.invoke('load-settings').then(settings => {
                if (settings && settings.hotkeys && settings.hotkeys.cycle) {
                    setCycleHotkey(settings.hotkeys.cycle);
                }
            }).catch(err => console.error('Erro ao carregar settings:', err));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        try {
            await window.electronAPI.invoke('set-cycle-hotkey', cycleHotkey);
            await window.electronAPI.invoke('save-settings', {
                hotkeys: { cycle: cycleHotkey, toggle: '', macro: '' },
                macro: { keys: [], focusOnMacro: true, backgroundMacro: false },
                general: { autoBackup: true }
            });
            showConfirm(
                'Sucesso',
                'Atalhos atualizados com sucesso!',
                () => {
                    hideConfirm();
                    onClose();
                },
                'info'
            );
        } catch (err) {
            showConfirm('Erro', `Falha: ${err.message}`, hideConfirm, 'danger');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container form-modal">
                <div className="modal-header">
                    <h2>Configurações Globais</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>Atalho para Alternar Janelas (Cycle)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={cycleHotkey}
                            onChange={(e) => setCycleHotkey(e.target.value)}
                            placeholder="Ex: Control+Shift+T"
                        />
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Use formato Electron: 'Control+T', 'Alt+F1', etc.
                        </small>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancelar</button>
                    <button className="btn-confirm" onClick={handleSave}>Salvar</button>
                </div>
            </div>
        </div>
    );
};

SettingsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    showConfirm: PropTypes.func.isRequired,
    hideConfirm: PropTypes.func.isRequired
};

export default SettingsModal;
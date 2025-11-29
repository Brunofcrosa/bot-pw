import React, { useState } from 'react';
import '../account/css/AccountModal.css'; // Reusa CSS do modal padrão

const SettingsModal = ({ isOpen, onClose }) => {
    const [cycleHotkey, setCycleHotkey] = useState('Control+Shift+T');

    if (!isOpen) return null;

    const handleSave = async () => {
        // Chama o backend para atualizar a hotkey global
        await window.electronAPI.invoke('set-cycle-hotkey', cycleHotkey);
        alert('Atalhos atualizados!');
        onClose();
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
                        <small style={{color:'#72767d', fontSize:'0.8rem'}}>
                            Use formato Electron: 'Control+T', 'Alt+F1', etc.
                        </small>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Cancelar</button>
                    <button className="btn-primary" onClick={handleSave}>Salvar</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
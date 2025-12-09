import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaServer, FaFolder } from 'react-icons/fa';
import './AccountModal.css';

const AddServerModal = ({ show, onClose, onSaveServer, serverToEdit, showConfirm, hideConfirm }) => {
    const [serverName, setServerName] = useState('');
    const [exePath, setExePath] = useState('');

    useEffect(() => {
        if (show && serverToEdit) {
            setServerName(serverToEdit.name || '');
            setExePath(serverToEdit.exePath || '');
        } else if (show) {
            setServerName('');
            setExePath('');
        }
    }, [show, serverToEdit]);

    if (!show) {
        return null;
    }

    const handleSelectExe = async () => {
        const selectedPath = await window.electronAPI.invoke('select-exe-file');
        if (selectedPath) {
            setExePath(selectedPath);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!serverName.trim()) {
            showConfirm(
                'Campo Obrigatório',
                'O nome do servidor não pode ser vazio.',
                hideConfirm,
                'warning'
            );
            return;
        }

        // Gera ID único usando crypto.randomUUID ou fallback
        const generateId = () => {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                return crypto.randomUUID();
            }
            return 'srv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        };

        const serverData = {
            id: serverToEdit ? serverToEdit.id : generateId(),
            name: serverName.trim(),
            exePath: exePath || ''
        };

        onSaveServer(serverData);


        setServerName('');
        setExePath('');
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container form-modal">
                <div className="modal-header">
                    <h2>
                        <FaServer className="me-2" style={{ marginRight: '8px' }} />
                        {serverToEdit ? 'Editar Servidor' : 'Adicionar Novo Servidor'}
                    </h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Nome do Servidor*</label>
                            <input
                                type="text"
                                className="form-input"
                                value={serverName}
                                onChange={(e) => setServerName(e.target.value)}
                                placeholder="Ex: Novo PW"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Caminho do Executável (Combine com ElementClient.exe)</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={exePath}
                                    onChange={(e) => setExePath(e.target.value)}
                                    placeholder="Selecione o executável do jogo"
                                    style={{ flex: 1 }}
                                />
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleSelectExe}
                                    style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <FaFolder /> Procurar
                                </button>
                            </div>
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                                Opcional: Selecione o ElementClient.exe para este servidor
                            </small>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary">
                            {serverToEdit ? 'Salvar Alterações' : 'Adicionar Servidor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

AddServerModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSaveServer: PropTypes.func.isRequired,
    serverToEdit: PropTypes.object,
    showConfirm: PropTypes.func.isRequired,
    hideConfirm: PropTypes.func.isRequired
};

export default AddServerModal;
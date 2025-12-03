import React, { useState, useEffect } from 'react';
import { FaServer, FaFolder } from 'react-icons/fa';
import '../account/css/AccountModal.css';

const AddServerModal = ({ show, onClose, onSaveServer, serverToEdit }) => {
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
            alert('O nome do servidor não pode ser vazio.');
            return;
        }

        const serverData = {
            id: serverToEdit ? serverToEdit.id : serverName.trim().toLowerCase().replace(/[^a-z0-9]/gi, '_'),
            name: serverName.trim(),
            exePath: exePath || ''
        };

        onSaveServer(serverData);

        setServerName('');
        setExePath('');
        onClose();
    };

    return (
        <div className="account-modal-backdrop" style={{ zIndex: 1060 }}>
            <div className="account-modal-dialog modal-dialog-centered" style={{ margin: '10rem auto', maxWidth: '500px' }}>
                <div className="account-modal-content">

                    <div className="modal-header border-bottom p-3">
                        <h5 className="modal-title fs-5 text-info">
                            <FaServer className="me-2" /> {serverToEdit ? 'Editar Servidor' : 'Adicionar Novo Servidor'}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4">

                            <div className="mb-3">
                                <label className="form-label small">Nome do Servidor*</label>
                                <input
                                    type="text"
                                    className="form-control form-control-custom-dark"
                                    value={serverName}
                                    onChange={(e) => setServerName(e.target.value)}
                                    placeholder="Ex: Novo PW"
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label small">Caminho do Executável (ElementClient.exe)</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        className="form-control form-control-custom-dark"
                                        value={exePath}
                                        onChange={(e) => setExePath(e.target.value)}
                                        placeholder="Selecione o executável do jogo"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={handleSelectExe}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        <FaFolder /> Procurar
                                    </button>
                                </div>
                                <small style={{ color: '#888', fontSize: '0.85rem' }}>
                                    Opcional: Selecione o ElementClient.exe para este servidor
                                </small>
                            </div>
                        </div>

                        <div className="modal-footer border-top p-3">
                            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
                            <button type="submit" className="btn btn-primary">
                                {serverToEdit ? 'Salvar Alterações' : 'Adicionar Servidor'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddServerModal;
import React, { useState } from 'react';
import { FaServer } from 'react-icons/fa';
import '../account/css/AccountModal.css'; 

const AddServerModal = ({ show, onClose, onSaveServer }) => {
    const [serverName, setServerName] = useState('');

    if (!show) {
        return null;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!serverName.trim()) {
            // NOTE: Replace alert() with a custom modal/notification system for production use.
            alert('O nome do servidor não pode ser vazio.');
            return;
        }

        const safeId = serverName.trim().toLowerCase().replace(/[^a-z0-9]/gi, '_');
        
        onSaveServer({
            id: safeId,
            name: serverName.trim()
        });
        
        setServerName('');
        onClose();
    };

    return (
        <div className="account-modal-backdrop" style={{zIndex: 1060}}> 
            <div className="account-modal-dialog modal-dialog-centered" style={{margin: '10rem auto', maxWidth: '400px'}}> 
                <div className="account-modal-content">
                    
                    <div className="modal-header border-bottom p-3">
                        <h5 className="modal-title fs-5 text-info">
                            <FaServer className="me-2" /> Adicionar Novo Servidor
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
                        </div>
                        
                        <div className="modal-footer border-top p-3">
                            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
                            <button type="submit" className="btn btn-primary">Salvar Servidor</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddServerModal;
import React, { useState } from 'react';
import { FaFolderOpen } from 'react-icons/fa'; 
import './css/AccountModal.css';

const AccountModal = ({ show, onClose, onSaveAccount, serverName }) => {
    const [charName, setCharName] = useState('');
    const [charClass, setCharClass] = useState('');
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [exePath, setExePath] = useState('');

    if (!show) {
        return null;
    }

    const handleBrowseExe = async () => {
        const path = await window.electronAPI.invoke('select-exe-file');
        if (path) {
            setExePath(path);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!login || !password || !exePath || !charName) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }

        onSaveAccount({
            id: `acc-${Date.now()}`,
            charName,
            charClass,
            login,
            password,
            exePath,
            charAvatarBg: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}` 
        });

        setCharName('');
        setCharClass('');
        setLogin('');
        setPassword('');
        setExePath('');
        onClose();
    };

    return (
        <div className="account-modal-backdrop">
            <div className="account-modal-dialog modal-dialog-centered"> 
                <div className="account-modal-content">
                    
                    <div className="modal-header border-bottom p-3">
                        <h5 className="modal-title fs-5 text-warning">
                            ✨ Adicionar Conta - **{serverName}**
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4 account-modal-body-scroll">
                            
                            <div className="mb-3">
                                <label className="form-label small">Nome do Personagem*</label>
                                <input 
                                    type="text" 
                                    className="form-control form-control-custom-dark"
                                    value={charName}
                                    onChange={(e) => setCharName(e.target.value)}
                                    placeholder="Ex: Ryuzaki-"
                                    required
                                />
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label small">Classe</label>
                                <input 
                                    type="text" 
                                    className="form-control form-control-custom-dark"
                                    value={charClass}
                                    onChange={(e) => setCharClass(e.target.value)}
                                    placeholder="Ex: Arqueiro, Feiticeira"
                                />
                            </div>
                             
                             <hr className="my-4"/>

                             <div className="mb-3">
                                <label className="form-label small">Login (Conta do Jogo)*</label>
                                <input 
                                    type="text" 
                                    className="form-control form-control-custom-dark" 
                                    value={login}
                                    onChange={(e) => setLogin(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label small">Senha*</label>
                                <input 
                                    type="password" 
                                    className="form-control form-control-custom-dark"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                             
                             <hr className="my-4"/>

                             <div className="mb-3">
                                <label className="form-label small">Caminho do Jogo (ElementClient.exe)*</label>
                                <div className="input-group">
                                    <input 
                                        type="text" 
                                        className="form-control form-control-custom-readonly" 
                                        value={exePath}
                                        readOnly 
                                        placeholder="Selecione o ElementClient_64.exe"
                                        required
                                    />
                                    <button 
                                        className="btn btn-outline-info" 
                                        type="button" 
                                        onClick={handleBrowseExe}
                                    >
                                        <FaFolderOpen className="me-1" /> Procurar...
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-footer border-top p-3">
                            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
                            <button type="submit" className="btn btn-primary">Salvar Conta</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AccountModal;
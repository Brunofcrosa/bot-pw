import React, { useState, useEffect } from 'react';
import { FaFolderOpen } from 'react-icons/fa'; 
import './css/AccountModal.css';

// Adicionado accountToEdit
const AccountModal = ({ show, onClose, onSaveAccount, serverName, accountToEdit }) => {
    const isEditing = !!accountToEdit;

    // Inicializa o estado com os dados da conta se estiver editando
    const [charName, setCharName] = useState(accountToEdit?.charName || '');
    const [charClass, setCharClass] = useState(accountToEdit?.charClass || '');
    const [login, setLogin] = useState(accountToEdit?.login || '');
    const [password, setPassword] = useState(accountToEdit?.password || '');
    const [exePath, setExePath] = useState(accountToEdit?.exePath || '');
    
    // Atualiza o estado interno quando o prop accountToEdit muda
    useEffect(() => {
        setCharName(accountToEdit?.charName || '');
        setCharClass(accountToEdit?.charClass || '');
        setLogin(accountToEdit?.login || '');
        setPassword(accountToEdit?.password || '');
        setExePath(accountToEdit?.exePath || '');
    }, [accountToEdit]);

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
        
        // Determina o ID e a cor de fundo (mantém a existente se estiver editando)
        const accountData = {
            id: isEditing ? accountToEdit.id : `acc-${Date.now()}`,
            charName,
            charClass,
            login,
            password,
            exePath,
            charAvatarBg: isEditing 
                ? accountToEdit.charAvatarBg 
                : `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}` 
        };

        onSaveAccount(accountData);

        // Reseta o estado apenas se estiver adicionando uma nova conta
        if (!isEditing) {
            setCharName('');
            setCharClass('');
            setLogin('');
            setPassword('');
            setExePath('');
        }
        
        onClose();
    };

    return (
        <div className="account-modal-backdrop">
            <div className="account-modal-dialog modal-dialog-centered"> 
                <div className="account-modal-content">
                    
                    <div className="modal-header border-bottom p-3">
                        <h5 className="modal-title fs-5 text-warning">
                            {/* Título dinâmico */}
                            {isEditing ? `✏️ Editar Conta - **${serverName}**` : `✨ Adicionar Conta - **${serverName}**`}
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
                            {/* Texto do botão dinâmico */}
                            <button type="submit" className="btn btn-primary">{isEditing ? 'Salvar Alterações' : 'Salvar Conta'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AccountModal;
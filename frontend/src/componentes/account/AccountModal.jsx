import React, { useState } from 'react';
import { FaFolderOpen } from 'react-icons/fa'; 
import './AccountModal.css'; 

// --- ESTILOS DE CONTAINER (RESTO DOS ESTILOS NO CSS) ---
const modalStyle = {
    display: 'block',
    position: 'fixed',
    zIndex: 1050,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.85)', 
    backdropFilter: 'blur(5px)', 
};

const modalDialog = {
    position: 'relative',
    margin: '3rem auto', 
    maxWidth: '550px',
};

// Componente
const AccountModal = ({ show, onClose, onSaveAccount, serverName }) => {
    // 1. ESTADOS
    const [charName, setCharName] = useState('');
    const [charClass, setCharClass] = useState('');
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [exePath, setExePath] = useState('');

    if (!show) {
        return null;
    }

    // 2. FUNÇÕES DE LÓGICA (Definidas antes do uso no JSX)

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
            // Gerar uma cor de avatar consistente
            charAvatarBg: `#${Math.floor(Math.random()*16777215).toString(16)}` 
        });

        setCharName('');
        setCharClass('');
        setLogin('');
        setPassword('');
        setExePath('');
        onClose();
    };

    // 3. RENDERIZAÇÃO (Onde handleSubmit é USADO)
    return (
        <div className="account-modal-backdrop" style={modalStyle}>
            <div className="account-modal-dialog modal-dialog-centered" style={modalDialog}> 
                {/* O restante do estilo vem do AccountModal.css */}
                <div className="account-modal-content">
                    
                    {/* Header com correção de cor do texto e botão de fechar */}
                    <div className="modal-header border-bottom border-secondary bg-dark text-light p-3">
                        <h5 className="modal-title fs-5 text-warning">
                            ✨ Adicionar Conta - **{serverName}**
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        {/* Body com correção de cor do texto (text-light) */}
                        <div className="modal-body p-4 bg-dark text-light" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                            
                            {/* Rótulos corrigidos para text-light */}
                            <div className="mb-3">
                                <label className="form-label small text-light">Nome do Personagem*</label>
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
                                <label className="form-label small text-light">Classe</label>
                                <input 
                                    type="text" 
                                    className="form-control form-control-custom-dark"
                                    value={charClass}
                                    onChange={(e) => setCharClass(e.target.value)}
                                    placeholder="Ex: Arqueiro, Feiticeira"
                                />
                            </div>
                             
                             <hr className="my-4 border-secondary"/>

                             <div className="mb-3">
                                <label className="form-label small text-light">Login (Conta do Jogo)*</label>
                                <input 
                                    type="text" 
                                    className="form-control form-control-custom-dark" 
                                    value={login}
                                    onChange={(e) => setLogin(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label small text-light">Senha*</label>
                                <input 
                                    type="password" 
                                    className="form-control form-control-custom-dark"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                             
                             <hr className="my-4 border-secondary"/>

                             <div className="mb-3">
                                <label className="form-label small text-light">Caminho do Jogo (ElementClient.exe)*</label>
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
                        
                        <div className="modal-footer border-top border-secondary bg-dark p-3">
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
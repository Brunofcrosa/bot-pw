import React, { useState } from 'react';

const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
};

const modalContentStyle = {
    backgroundColor: 'var(--color-bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '500px',
    color: 'var(--color-text-primary)',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
};

const modalHeaderStyle = {
    borderBottom: '1px solid var(--border-color)', 
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

const modalBodyStyle = {
    padding: '1rem'
};

const modalFooterStyle = {
    borderTop: '1px solid var(--border-color)', 
    padding: '1rem', 
    display: 'flex', 
    justifyContent: 'flex-end', 
    gap: '0.5rem'
};

const AccountModal = ({ show, onClose, serverName }) => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [charName, setCharName] = useState('');
    const [savePassword, setSavePassword] = useState(false);

    if (!show) {
        return null;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log({ login, password, charName, savePassword, serverName });
        
        handleClose(); 
    };

    const handleClose = () => {
        setLogin('');
        setPassword('');
        setCharName('');
        setSavePassword(false);
        onClose(); 
    };

    return (
        <div style={modalOverlayStyle} onClick={handleClose}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                
                <div style={modalHeaderStyle}>
                    <h5 className="modal-title">Adicionar nova conta</h5>
                    <button type="button" className="btn-close" onClick={handleClose}></button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div style={modalBodyStyle}>
                        <p className="mb-3">Servidor: <strong>{serverName}</strong></p>
                        
                        <div className="mb-3">
                            <label htmlFor="login" className="form-label">Login</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                id="login"
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">Senha</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                id="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="charName" className="form-label">Personagem (Opcional)</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                id="charName"
                                value={charName}
                                onChange={(e) => setCharName(e.target.value)}
                            />
                        </div>
                        <div className="form-check">
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                id="savePassword"
                                checked={savePassword}
                                onChange={(e) => setSavePassword(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="savePassword">
                                Salvar senha
                            </label>
                        </div>
                    </div>
                    
                    <div style={modalFooterStyle}>
                        <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Adicionar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountModal;
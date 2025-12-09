import React, { useState, useEffect } from 'react';
import './AccountModal.css';

const AccountModal = ({ isOpen, onClose, onSave, accountToEdit }) => {
    const [formData, setFormData] = useState({
        login: '',
        password: '',
        charName: '',
        charClass: '',
        exePath: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (accountToEdit) {
                setFormData({
                    login: accountToEdit.login || '',
                    password: accountToEdit.password || '',
                    charName: accountToEdit.charName || '',
                    charClass: accountToEdit.charClass || '',
                    exePath: accountToEdit.exePath || ''
                });
            } else {
                setFormData({ login: '', password: '', charName: '', charClass: '', exePath: '' });
            }
            setShowPassword(false);
        }
    }, [isOpen, accountToEdit]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectExe = async () => {
        const selectedPath = await window.electronAPI.invoke('select-exe-file');
        if (selectedPath) {
            setFormData(prev => ({ ...prev, exePath: selectedPath }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, id: accountToEdit?.id });
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container form-modal">
                <div className="modal-header">
                    <h2>{accountToEdit ? 'Editar Conta' : 'Nova Conta'}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label htmlFor="login">Login <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
                            <input
                                type="text"
                                id="login"
                                name="login"
                                value={formData.login}
                                onChange={handleChange}
                                placeholder="Digite o login"
                                required
                                className="form-input"
                                autoComplete="off"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Senha <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Digite a senha"
                                    required
                                    className="form-input"
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    className="icon-btn input-icon"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex="-1"
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label htmlFor="charName">Personagem</label>
                                <input
                                    type="text"
                                    id="charName"
                                    name="charName"
                                    value={formData.charName}
                                    onChange={handleChange}
                                    placeholder="Nome (Opcional)"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label htmlFor="charClass">Classe</label>
                                <input
                                    type="text"
                                    id="charClass"
                                    name="charClass"
                                    value={formData.charClass}
                                    onChange={handleChange}
                                    placeholder="Ex: Merc"
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="exePath">Executável Específico</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    id="exePath"
                                    name="exePath"
                                    value={formData.exePath}
                                    onChange={handleChange}
                                    placeholder="Padrão do servidor (vazio)"
                                    className="form-input"
                                    style={{ flex: 1 }}
                                />
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={handleSelectExe}
                                    style={{ padding: '0 12px' }}
                                    title="Selecionar arquivo"
                                >
                                    📂
                                </button>
                            </div>
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '5px', display: 'block' }}>
                                Apenas se diferente do servidor.
                            </small>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-confirm">
                            {accountToEdit ? 'Salvar Alterações' : 'Adicionar Conta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountModal;
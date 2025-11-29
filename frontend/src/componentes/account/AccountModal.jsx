import React, { useState, useEffect } from 'react';
import './css/AccountModal.css';

const AccountModal = ({ isOpen, onClose, onSave, accountToEdit }) => {
    const [formData, setFormData] = useState({
        server: '',
        login: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    // Reseta ou popula o formulário quando o modal abre/fecha ou quando o modo de edição muda
    useEffect(() => {
        if (isOpen) {
            if (accountToEdit) {
                setFormData({
                    server: accountToEdit.server || '',
                    login: accountToEdit.login || '',
                    password: accountToEdit.password || ''
                });
            } else {
                setFormData({ server: '', login: '', password: '' });
            }
            setShowPassword(false);
        }
    }, [isOpen, accountToEdit]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                            <label htmlFor="server">Servidor</label>
                            <input
                                type="text"
                                id="server"
                                name="server"
                                value={formData.server}
                                onChange={handleChange}
                                placeholder="Ex: Servidor Global"
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="login">Login</label>
                            <input
                                type="text"
                                id="login"
                                name="login"
                                value={formData.login}
                                onChange={handleChange}
                                placeholder="Digite o login"
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Senha</label>
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
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary">
                            {accountToEdit ? 'Salvar Alterações' : 'Adicionar Conta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountModal;
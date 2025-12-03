import React, { useState } from 'react';
import './css/AccountModal.css';

const AccountsListModal = ({ isOpen, onClose, accounts, onEdit, onDelete }) => {
    const [showPassword, setShowPassword] = useState({});

    if (!isOpen) return null;

    const togglePassword = (id) => {
        setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container list-modal">
                <div className="modal-header">
                    <h2>Gerenciar Contas</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {accounts && accounts.length > 0 ? (
                        <table className="accounts-table">
                            <thead>
                                <tr>
                                    <th>Servidor</th>
                                    <th>Login</th>
                                    <th>Senha</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((account, index) => (
                                    <tr key={account.id || index}>
                                        <td>
                                            <span className="server-badge">
                                                {account.server || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="text-with-copy">
                                                {account.login}
                                                <button
                                                    className="icon-btn small"
                                                    onClick={() => copyToClipboard(account.login)}
                                                    title="Copiar Login"
                                                >
                                                    📋
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="password-field">
                                                <span>
                                                    {showPassword[account.id] ? account.password : '••••••••'}
                                                </span>
                                                <button
                                                    className="icon-btn small"
                                                    onClick={() => togglePassword(account.id)}
                                                >
                                                    {showPassword[account.id] ? '🙈' : '👁️'}
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-edit"
                                                    onClick={() => onEdit(account)}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => onDelete(account.id)}
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <p>Nenhuma conta cadastrada.</p>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default AccountsListModal;
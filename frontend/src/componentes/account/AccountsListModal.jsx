import React from 'react';
import './css/AccountModal.css'; 

const AccountsListModal = ({ show, onClose, serverName, accounts }) => {
    if (!show) {
        return null;
    }

    // --- FUNÇÃO ATUALIZADA ---
    // Atualizado para chamar 'focus-window-by-pid'
    const handleFocusAccount = (pid) => {
        if (pid) {
            console.log(`[React] Solicitando foco para PID: ${pid}`);
            // Usa o novo handler 'focus-window-by-pid' que espera um PID
            window.electronAPI.invoke('focus-window-by-pid', pid);
            
            // Opcional: fechar o modal após clicar
            onClose(); 
        } else {
            console.warn('[React] Tentativa de focar conta sem PID.');
        }
    };
    // --- FIM DA ATUALIZAÇÃO ---

    return (
        <div className="account-modal-backdrop">
            <div className="account-modal-dialog modal-dialog-centered"> 
                <div className="account-modal-content">
                    
                    <div className="modal-header border-bottom p-3">
                        <h5 className="modal-title fs-5 text-warning">
                            Contas Abertas - **{serverName}**
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
                    </div>
                    
                    <div className="modal-body p-4 account-modal-body-scroll">
                        {accounts && accounts.length > 0 ? (
                            <ul className="list-group list-group-flush">
                                {accounts.map((account) => (
                                    <li 
                                        key={account.id} 
                                        className="list-group-item d-flex justify-content-between align-items-center form-control-custom-dark mb-2 p-3"
                                        
                                        // --- ADIÇÕES DE INTERATIVIDADE ---
                                        onClick={() => handleFocusAccount(account.pid)}
                                        style={{ cursor: 'pointer' }} 
                                        title={`Clique para focar ${account.charName} (PID: ${account.pid})`}
                                        // --- FIM DAS ADIÇÕES ---
                                    >
                                        <div className="d-flex align-items-center gap-3">
                                            
                                            <div 
                                                className="rounded-circle text-uppercase d-flex align-items-center justify-content-center text-white fw-bold fs-5"
                                                style={{ 
                                                    backgroundColor: account.charAvatarBg || '#6c757d',
                                                    width: '3rem', 
                                                    height: '3rem',
                                                    minWidth: '3rem'
                                                }}
                                            >
                                                {account.charName.charAt(0).toUpperCase()} 
                                            </div>
                                            
                                            <div>
                                                <div className="fw-bold text-light fs-6">{account.charName}</div>
                                                <div className="small text-muted">{account.charClass || 'Sem Classe'}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="d-flex flex-column align-items-end text-end">
                                            <span className={`badge mb-1 ${account.status === 'starting' ? 'text-bg-warning' : 'text-bg-success'}`}>
                                                {account.status === 'starting' ? 'INICIANDO...' : 'RODANDO'}
                                            </span>
                                            <span className="small text-muted">PID: {account.pid || 'N/A'}</span>
                                        </div>

                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-muted">Nenhuma conta está rodando neste momento para o servidor **{serverName}**.</p>
                        )}
                    </div>

                    <div className="modal-footer border-top p-3">
                        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountsListModal;
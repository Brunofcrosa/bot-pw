import React from 'react';
import './css/ServerCard.css'; 

// Ícones copiados do App.jsx para uso local
const PencilIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);
const TrashIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);

// Adicionado onEdit e onDelete para as ações de conta
const ServerCard = ({ charName, charClass, charAvatarBg, isRunning, pid, status, onOpen, onClose, accountData, onEdit, onDelete }) => {
    const statusClass = isRunning ? (status === 'starting' ? 'bg-warning' : 'bg-success') : 'bg-danger';
    const statusText = isRunning ? (status === 'starting' ? 'INICIANDO...' : 'RODANDO') : 'OFFLINE';

    return (
        <div className="server-card h-100">
            <div className="card-content">
                <div className="card-header-info">
                    
                    <div 
                        className="card-avatar"
                        style={{ backgroundColor: charAvatarBg || '#6c757d' }}
                    >
                        {charName.charAt(0).toUpperCase()}
                    </div>
                    
                    <div>
                        <h3 className="char-name">{charName}</h3>
                        <p className="char-class">{charClass || 'Sem Classe'}</p>
                    </div>
                </div>
                
                <div className="card-details">
                    <div className="detail-row">
                        <span className="detail-label">Status:</span>
                        <span className={`badge badge-status ${statusClass}`}>
                            {statusText}
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Login:</span>
                        <span className="detail-value-monospace">{accountData.login}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">PID:</span>
                        <span className="detail-value-monospace">{pid || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div className="card-footer d-flex justify-content-between align-items-center">
                
                {/* Botões de Ação da Conta: Editar e Remover */}
                <div className="btn-group me-2" role="group">
                    <button 
                        className="btn btn-sm btn-outline-info" 
                        onClick={() => onEdit(accountData)}
                        title="Editar Conta"
                        disabled={isRunning}
                    >
                        <PencilIcon style={{ width: '0.8rem', height: '0.8rem' }} /> 
                    </button>
                    <button 
                        className="btn btn-sm btn-outline-danger" 
                        onClick={() => onDelete(accountData.id)}
                        title="Excluir Conta"
                        disabled={isRunning}
                    >
                        <TrashIcon style={{ width: '0.8rem', height: '0.8rem' }} />
                    </button>
                </div>
                
                {isRunning ? (
                    <button 
                        className="btn btn-danger btn-close-game" 
                        onClick={() => onClose(pid)}
                        disabled={!pid || status === 'starting'}
                    >
                        {status === 'starting' ? 'Iniciando...' : `Fechar (PID: ${pid})`}
                    </button>
                ) : (
                    <button 
                        className="btn btn-success btn-open" 
                        onClick={() => onOpen(accountData)}
                    >
                        Abrir
                    </button>
                )}
            </div>
        </div>
    );
};

export default ServerCard;
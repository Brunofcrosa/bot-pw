import React from 'react';
import './css/ServerCard.css'; 

const ServerCard = ({ charName, charClass, charAvatarBg, isRunning, pid, status, onOpen, onClose, accountData }) => {
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
            
            <div className="card-footer">
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
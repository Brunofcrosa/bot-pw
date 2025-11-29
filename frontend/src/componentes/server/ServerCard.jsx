import React from 'react';
import './css/ServerCard.css';
import { FaPlay, FaStop, FaEdit, FaTrash } from 'react-icons/fa';

const ServerCard = ({ 
    charName, 
    charClass, 
    isRunning, 
    pid, 
    status, 
    onOpen, 
    onClose, 
    accountData, 
    onEdit, 
    onDelete 
}) => {
    
    // Define a cor do status
    const statusColor = isRunning 
        ? (status === 'running' ? '#43b581' : '#faa61a') // Verde (Rodando) ou Laranja (Iniciando)
        : '#747f8d'; // Cinza (Parado)

    const handlePlayStop = (e) => {
        e.stopPropagation();
        if (isRunning) {
            onClose(pid);
        } else {
            onOpen(accountData);
        }
    };

    return (
        <div className={`account-card ${isRunning ? 'running' : ''}`}>
            <div className="card-status-bar" style={{ backgroundColor: statusColor }}></div>
            
            <div className="card-content">
                <div className="card-header">
                    <div className="char-avatar">
                        {charName ? charName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="char-info">
                        <h4 className="char-name">{charName || 'Desconhecido'}</h4>
                        <span className="char-class">{charClass || 'Sem Classe'}</span>
                    </div>
                    <div className="status-dot" style={{ backgroundColor: statusColor }} title={isRunning ? "Online" : "Offline"}></div>
                </div>

                <div className="card-actions">
                    <button 
                        className={`btn-control ${isRunning ? 'stop' : 'start'}`}
                        onClick={handlePlayStop}
                        title={isRunning ? "Parar" : "Iniciar"}
                    >
                        {isRunning ? <FaStop /> : <FaPlay />}
                        <span>{isRunning ? 'Parar' : 'Iniciar'}</span>
                    </button>

                    <div className="secondary-actions">
                        <button 
                            className="btn-icon" 
                            onClick={(e) => { e.stopPropagation(); onEdit(accountData); }}
                            title="Editar"
                        >
                            <FaEdit />
                        </button>
                        <button 
                            className="btn-icon delete" 
                            onClick={(e) => { e.stopPropagation(); onDelete(accountData.id); }}
                            title="Excluir"
                        >
                            <FaTrash />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServerCard;
import React, { memo } from 'react';
import PropTypes from 'prop-types';
import './ServerCard.css';
import { FaPlay, FaStop, FaEdit, FaTrash } from 'react-icons/fa';
import { getClassDisplay } from '../../utils/utils';

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

    const statusColor = isRunning
        ? (status === 'running' ? '#43b581' : '#5e72e4')
        : '#747f8d';

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
                        {accountData.icon ? (
                            accountData.icon.endsWith('.ico') ? (
                                <img src={accountData.icon} alt="Class icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                                <span style={{ fontSize: '1.5rem' }}>{accountData.icon}</span>
                            )
                        ) : (
                            getClassDisplay(charClass)
                        )}
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

ServerCard.propTypes = {
    charName: PropTypes.string,
    charClass: PropTypes.string,
    isRunning: PropTypes.bool,
    pid: PropTypes.number,
    status: PropTypes.string,
    onOpen: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    accountData: PropTypes.object.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired
};

ServerCard.defaultProps = {
    charName: '',
    charClass: '',
    isRunning: false,
    pid: null,
    status: ''
};

export default memo(ServerCard);
import React from 'react';
import { FaPlus, FaServer, FaCog } from 'react-icons/fa'; 
import './css/ServerList.css';

const ServerItem = ({ server, isActive, onSelect }) => (
    <button 
        className={`server-item ${isActive ? 'active' : ''}`}
        onClick={() => onSelect(server.id)}
    >
        <FaServer className="me-2" /> 
        {server.name}
    </button>
);

const ServerList = ({ servers, currentServerId, onSelectServer, onOpenAddModal, onOpenSettings }) => (
    <div className="server-list-container d-flex flex-column">
        <h5 className="server-list-title">Servidores</h5>
        <div className="server-item-group flex-grow-1">
            <button 
                className="btn btn-sm btn-outline-info btn-add-server-custom" 
                onClick={onOpenAddModal}
            >
                <FaPlus className="me-1" /> Adicionar Novo Servidor
            </button>

            {servers.map(server => (
                <ServerItem 
                    key={server.id}
                    server={server}
                    isActive={server.id === currentServerId}
                    onSelect={onSelectServer}
                />
            ))}
        </div>
        
        <div className="mt-3 pt-3 border-top border-secondary">
            <button 
                className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center"
                onClick={onOpenSettings}
            >
                <FaCog className="me-2" /> Configurações
            </button>
        </div>
    </div>
);

export default ServerList;
import React from 'react';
import { FaPlus, FaServer } from 'react-icons/fa'; 
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

const ServerList = ({ servers, currentServerId, onSelectServer, onOpenAddModal }) => (
    <div className="server-list-container">
        <h5 className="server-list-title">Servidores</h5>
        <div className="server-item-group">
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
    </div>
);

export default ServerList;
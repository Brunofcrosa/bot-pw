import React from 'react';
import { FaPlus, FaServer, FaEdit } from 'react-icons/fa';
import './ServerList.css';

const ServerItem = ({ server, isActive, onSelect, onEdit }) => (
    <div className={`server-item-wrapper ${isActive ? 'active' : ''}`}>
        <button
            className="server-item"
            onClick={() => onSelect(server.id)}
        >
            <FaServer className="me-2" />
            {server.name}
        </button>
        {isActive && (
            <button
                className="btn-edit-server"
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(server);
                }}
                title="Editar servidor"
            >
                <FaEdit />
            </button>
        )}
    </div>
);

const ServerList = ({ servers, currentServerId, onSelectServer, onOpenAddModal, onEditServer }) => (
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
                    onEdit={onEditServer}
                />
            ))}
        </div>
    </div>
);

export default ServerList;
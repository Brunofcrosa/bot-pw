import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { FaPlus, FaServer, FaEdit } from 'react-icons/fa';
import './ServerList.css';

const ServerItem = memo(({ server, isActive, onSelect, onEdit }) => (
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
));

ServerItem.displayName = 'ServerItem';

ServerItem.propTypes = {
    server: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
    }).isRequired,
    isActive: PropTypes.bool.isRequired,
    onSelect: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired
};

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

ServerList.propTypes = {
    servers: PropTypes.array.isRequired,
    currentServerId: PropTypes.string,
    onSelectServer: PropTypes.func.isRequired,
    onOpenAddModal: PropTypes.func.isRequired,
    onEditServer: PropTypes.func.isRequired
};

export default memo(ServerList);

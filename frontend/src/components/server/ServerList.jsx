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
        {/* Title removed or styled better via CSS, but let's keep checks */}
        <h5 className="server-list-title">Servidores</h5>

        {/* Direct children for Flex container? Or group? 
            If we crowd everything in server-item-group, the title is outside.
            .server-list-container is flex. 
            So Title (flex-child) + Group (flex-child).
            Inside Group -> Button + List.
        */}
        <div className="server-item-group">
            <button
                className="btn-add-server-custom"
                onClick={onOpenAddModal}
            >
                <FaPlus className="me-1" /> Novo
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

import React from 'react';
import { FaPlus, FaServer } from 'react-icons/fa'; 
import './css/ServerList.css'; // Path corrigido para o CSS

// Componente individual de item da lista
const ServerItem = ({ server, isActive, onSelect }) => {
    
    // As cores e estilos agora são definidos na classe 'server-item' e 'server-item.active' no CSS.
    return (
        <button 
            className={`server-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(server.id)}
        >
            <FaServer className="me-2" /> 
            {server.name}
        </button>
    );
};

const ServerList = ({ servers, currentServerId, onSelectServer, onOpenAddModal }) => {
    return (
        // Substitui o estilo inline 'sidebarStyle' pela classe CSS
        <div className="server-list-container">
            {/* Aplica a classe para o título */}
            <h5 className="server-list-title">Servidores</h5>
            {/* Aplica a classe para o grupo de itens */}
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
};

export default ServerList;
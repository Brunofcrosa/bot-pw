import React from 'react';

const sidebarStyle = {
    padding: '1rem',
    backgroundColor: 'var(--color-bg-sidebar)',
    borderRight: '1px solid var(--border-color)',
    height: '100%',
    overflowY: 'auto'
};

const ServerList = () => {
    return (
        <div style={sidebarStyle}>
            <h5>Servidores</h5>
            <p>(Lista de Servidores)</p>
        </div>
    );
};

export default ServerList;
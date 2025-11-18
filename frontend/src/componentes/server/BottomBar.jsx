import React from 'react';
import './css/BottomBar.css';
import { FaUsers } from 'react-icons/fa'; 

const BottomBar = ({ runningCount, onOpenAccountsList }) => { 
    return (
        <div className="bottom-bar">
            <div>
                <span className="running-count-label">Contas Rodando:</span> 
                <span className="running-count-value">{runningCount}</span>
            </div>
            
            <button 
                className="btn btn-sm btn-outline-info ms-3" 
                onClick={onOpenAccountsList} 
                title="Ver Lista de Contas Abertas"
            >
                <FaUsers className="me-1" />
                Listar Contas
            </button>
        </div>
    );
};

export default BottomBar;
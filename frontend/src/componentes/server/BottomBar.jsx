import React from 'react';
import './css/BottomBar.css'; // Path corrigido

const BottomBar = ({ runningCount }) => {
    return (
        <div className="bottom-bar">
            <div>
                <span className="running-count-label">Contas Rodando:</span> 
                <span className="running-count-value">{runningCount}</span>
            </div>
            <div className="macro-key-info">
                Macro Global: 
                <span className="macro-key-value">Ctrl+Shift+T</span>
            </div>
        </div>
    );
};

export default BottomBar;
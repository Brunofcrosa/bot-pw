import React from 'react';
import './css/BottomBar.css';

const BottomBar = ({ runningCount }) => {
    return (
        <div className="bottom-bar">
            <div>
                <span className="running-count-label">Contas Rodando:</span> 
                <span className="running-count-value">{runningCount}</span>
            </div>
        </div>
    );
};

export default BottomBar;
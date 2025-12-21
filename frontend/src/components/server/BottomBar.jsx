import React, { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './BottomBar.css';
import { FaUsers } from 'react-icons/fa';

const BottomBar = ({ runningCount, onOpenAccountsList }) => {
    const [appVersion, setAppVersion] = useState('');

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const version = await window.electronAPI.invoke('get-app-version');
                setAppVersion(version || '1.0.0');
            } catch (err) {
                // Failed to load version - will show unknown
            }
        };
        fetchVersion();
    }, []);

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

            {appVersion && (
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    v{appVersion}
                </span>
            )}
        </div>
    );
};

BottomBar.propTypes = {
    runningCount: PropTypes.number.isRequired,
    onOpenAccountsList: PropTypes.func.isRequired
};

export default memo(BottomBar);

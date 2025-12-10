import React from 'react';
import PropTypes from 'prop-types';
import { FaPlay, FaGamepad, FaExternalLinkAlt, FaTrash } from 'react-icons/fa';

const GroupCard = ({
    group,
    groupAccounts,
    onOpenGroup,
    onControlGroup,
    onOpenOverlay,
    onDeleteGroup
}) => {
    return (
        <div className="group-card">
            <div
                className="group-header-bar"
                style={{ backgroundColor: group.color }}
            />

            <div className="group-content">
                <h3>{group.name}</h3>
                <p className="group-count">
                    {groupAccounts.length} conta(s)
                </p>

                <div className="group-accounts-preview">
                    {groupAccounts.slice(0, 3).map(acc => (
                        <div key={acc.id} className="preview-account">
                            {acc.charName || acc.login}
                        </div>
                    ))}
                    {groupAccounts.length > 3 && (
                        <div className="preview-more">
                            +{groupAccounts.length - 3}
                        </div>
                    )}
                </div>

                <div className="group-actions">
                    <button
                        className="btn-play-group"
                        onClick={() => onOpenGroup(groupAccounts)}
                    >
                        <FaPlay /> Iniciar
                    </button>
                    <button
                        className="btn-control-group"
                        onClick={() => onControlGroup(group)}
                        title="Painel de Controle"
                    >
                        <FaGamepad />
                    </button>
                    <button
                        className="btn-control-group"
                        onClick={() => onOpenOverlay(group.id)}
                        title="Abrir Painel Flutuante"
                        style={{ marginLeft: '0.5rem' }}
                    >
                        <FaExternalLinkAlt />
                    </button>
                    <button
                        className="btn-icon-action"
                        onClick={() => onDeleteGroup(group.id)}
                    >
                        <FaTrash />
                    </button>
                </div>
            </div>
        </div>
    );
};

GroupCard.propTypes = {
    group: PropTypes.object.isRequired,
    groupAccounts: PropTypes.array.isRequired,
    onOpenGroup: PropTypes.func.isRequired,
    onControlGroup: PropTypes.func.isRequired,
    onOpenOverlay: PropTypes.func.isRequired,
    onDeleteGroup: PropTypes.func.isRequired
};

export default GroupCard;

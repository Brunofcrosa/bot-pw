import React from 'react';
import PropTypes from 'prop-types';
import { FaPlay, FaStop, FaGamepad, FaList, FaTrash, FaEdit } from 'react-icons/fa';

const GroupCard = ({
    group,
    groupAccounts,
    onOpenGroup,
    onStopGroup,
    onEditGroup,
    onOpenOverlay,
    onShowInstances,
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
                        onClick={() => onOpenGroup(group)}
                    >
                        <FaPlay /> Iniciar
                    </button>
                    <button
                        className="btn-stop-group"
                        onClick={() => onStopGroup && onStopGroup(group)}
                        title="Parar todas as contas do grupo"
                        style={{ marginLeft: '0.5rem', backgroundColor: '#e74c3c' }}
                    >
                        <FaStop />
                    </button>
                    <button
                        className="btn-control-group"
                        onClick={() => onOpenOverlay(group.id)}
                        title="Modo Gaming (Overlay)"
                    >
                        <FaGamepad />
                    </button>
                    <button
                        className="btn-control-group"
                        onClick={() => onShowInstances(group.id)}
                        title="Listar Contas Abertas"
                        style={{ marginLeft: '0.5rem' }}
                    >
                        <FaList />
                    </button>

                    <button
                        className="btn-icon-action"
                        onClick={() => onEditGroup(group)}
                        title="Editar Grupo"
                        style={{ marginLeft: '0.5rem' }}
                    >
                        <FaEdit />
                    </button>
                    <button
                        className="btn-icon-action"
                        onClick={() => onDeleteGroup(group.id)}
                        title="Deletar Grupo"
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
    onStopGroup: PropTypes.func,
    onEditGroup: PropTypes.func.isRequired,
    onOpenOverlay: PropTypes.func.isRequired,
    onShowInstances: PropTypes.func.isRequired,
    onDeleteGroup: PropTypes.func.isRequired
};



export default GroupCard;

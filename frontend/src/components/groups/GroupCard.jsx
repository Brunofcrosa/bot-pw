import React from 'react';
import PropTypes from 'prop-types';
import { FaPlay, FaStop, FaGamepad, FaList, FaTrash, FaEdit } from 'react-icons/fa';

const GroupCard = ({
    group,
    groupAccounts,
    runningAccounts = [],
    onOpenGroup,
    onStopGroup,
    onEditGroup,
    onOpenOverlay,
    onShowInstances,
    onDeleteGroup
}) => {
    // Check if any account in this group is currently running
    const isRunning = groupAccounts.some(acc =>
        runningAccounts.some(run => run.accountId === acc.id)
    );

    return (
        <div className="group-card">
            <div
                className="group-header-bar"
                style={{ backgroundColor: group.color }}
            />

            <div className="secondary-actions">
                <button
                    className="btn-icon"
                    onClick={() => onEditGroup(group)}
                    title="Editar Grupo"
                >
                    <FaEdit />
                </button>
                <button
                    className="btn-icon delete"
                    onClick={() => onDeleteGroup(group.id)}
                    title="Deletar Grupo"
                >
                    <FaTrash />
                </button>
            </div>

            <div className="group-content">
                <div className="group-info-header">
                    <h3>{group.name}</h3>
                </div>

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
                    {isRunning ? (
                        <button
                            className="btn-stop-group"
                            onClick={() => onStopGroup && onStopGroup(group)}
                            title="Parar todas as contas deste grupo"
                            style={{ flex: 1 }} // Make it fill the space like Start button
                        >
                            <FaStop /> Parar
                        </button>
                    ) : (
                        <button
                            className="btn-play-group"
                            onClick={() => onOpenGroup(group)}
                        >
                            <FaPlay /> Iniciar
                        </button>
                    )}
                </div>

                <div className="group-sub-actions">
                    <button
                        className="btn-sub-action"
                        onClick={() => onOpenOverlay(group.id)}
                        title="Modo Gaming (Overlay)"
                    >
                        <FaGamepad /> Overlay
                    </button>
                    <button
                        className="btn-sub-action"
                        onClick={() => onShowInstances(group.id)}
                        title="Listar Contas Abertas"
                    >
                        <FaList /> Macros
                    </button>
                </div>
            </div>
        </div>
    );
};

GroupCard.propTypes = {
    group: PropTypes.object.isRequired,
    groupAccounts: PropTypes.array.isRequired,
    runningAccounts: PropTypes.array,
    onOpenGroup: PropTypes.func.isRequired,
    onStopGroup: PropTypes.func,
    onEditGroup: PropTypes.func.isRequired,
    onOpenOverlay: PropTypes.func.isRequired,
    onShowInstances: PropTypes.func.isRequired,
    onDeleteGroup: PropTypes.func.isRequired
};



export default GroupCard;

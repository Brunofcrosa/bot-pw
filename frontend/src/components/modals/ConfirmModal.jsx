import React, { memo } from 'react';
import PropTypes from 'prop-types';
import './ConfirmModal.css';

const ConfirmModal = ({
    isOpen,
    title = 'Confirmar',
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'warning' // 'warning', 'danger', 'info'
}) => {
    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div className="confirm-modal-overlay" onClick={handleOverlayClick}>
            <div className={`confirm-modal-container ${type}`}>
                <div className="confirm-modal-icon">
                    {type === 'danger' && '⚠️'}
                    {type === 'warning' && '❓'}
                    {type === 'info' && 'ℹ️'}
                </div>
                <h3 className="confirm-modal-title">{title}</h3>
                <p className="confirm-modal-message">{message}</p>
                <div className="confirm-modal-actions">
                    <button
                        className="confirm-btn cancel"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`confirm-btn confirm ${type}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

ConfirmModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    title: PropTypes.string,
    message: PropTypes.string.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    type: PropTypes.oneOf(['warning', 'danger', 'info'])
};

export default memo(ConfirmModal);

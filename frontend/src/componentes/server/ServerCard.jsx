import React from 'react';
import { FaUserAstronaut } from 'react-icons/fa'; 

const cardStyle = {
    backgroundColor: 'var(--color-bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    overflow: 'hidden',
    color: 'var(--color-text-primary)'
};

const avatarStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100px',
    fontSize: '3rem',
    color: 'white',
};

const cardBodyStyle = {
    padding: '1rem'
};

const ServerCard = ({ charName, charClass, charAvatarBg }) => {
    
    const dynamicAvatarStyle = {
        ...avatarStyle,
        backgroundColor: charAvatarBg || '#6c757d'
    };

    return (
        <div className="col">
            <div style={cardStyle}>
                <div style={dynamicAvatarStyle}>
                    <FaUserAstronaut />
                </div>
                <div style={cardBodyStyle}>
                    <h5 style={{marginBottom: '0.25rem'}}>{charName}</h5>
                    <p style={{marginBottom: '0'}}>{charClass}</p>
                </div>
            </div>
        </div>
    );
};

export default ServerCard;
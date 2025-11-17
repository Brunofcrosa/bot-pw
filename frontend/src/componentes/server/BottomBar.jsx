import React from 'react';

const barStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1rem',
    backgroundColor: 'var(--color-bg-bottombar)',
    borderTop: '1px solid var(--border-color)',
    zIndex: 1000
};

const BottomBar = () => {
    return (
        <div style={barStyle}>
            <div>Status: Online</div>
            <div>(Barra Inferior)</div>
        </div>
    );
};

export default BottomBar;
import React, { useState } from 'react'; 


import ServerList from './componentes/server/ServerList';
import ServerCard from './componentes/server/ServerCard';
import BottomBar from './componentes/server/BottomBar';
import AccountModal from './componentes/account/AccountModal'; 

import { FaPlus, FaPencilAlt, FaTrash, FaCheckSquare } from 'react-icons/fa';
import '../index.css'; 


const mainLayout = {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gridTemplateRows: '1fr',
    minHeight: '100vh',
    paddingBottom: '50px', 
    backgroundColor: 'var(--color-bg-body)'
};

const contentArea = {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: 'var(--color-bg-body)'
};

const contentHeader = {
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid var(--border-color)', 
    flexShrink: 0,
};

const cardGrid = {
    flexGrow: 1,
    overflowY: 'auto',
    margin: '0',
    paddingBottom: '10px',
};


const App = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [currentServerName, setCurrentServerName] = useState('classic pw');

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    return (
        <>
            <div style={mainLayout}>
                <ServerList />

                <div style={contentArea}>
                    <div style={contentHeader}>
                        <div className="d-flex align-items-center gap-2">
                            <div className="btn-group" role="group">
                                <button type="button" className="btn btn-outline-secondary">
                                    <FaPlus className="me-1" /> {currentServerName}
                                </button>
                                <button type="button" className="btn btn-outline-secondary">
                                    <FaPencilAlt />
                                </button>
                                <button type="button" className="btn btn-outline-secondary">
                                    <FaTrash />
                                </button>
                            </div>
                            <button type="button" className="btn btn-outline-secondary">
                                <FaCheckSquare className="me-1" /> Selecionar
                            </button>
                            
                            <button 
                                type="button" 
                                className="btn btn-primary"
                                onClick={handleOpenModal} 
                            >
                                <FaPlus className="me-1" /> Adicionar conta
                            </button>
                        </div>
                    </div>

                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3" style={cardGrid}>
                        <ServerCard 
                            charName="Ryuzaki-" 
                            charClass="Arqueiro" 
                            charAvatarBg="#ffd600" 
                        />
                         <ServerCard 
                            charName="Aetherius" 
                            charClass="Feiticeira" 
                            charAvatarBg="#17a2b8" 
                        />
                         <ServerCard 
                            charName="Belzebu-" 
                            charClass="Guerreiro" 
                            charAvatarBg="#dc3545" 
                        />
                    </div>
                </div>
            </div>
            
            <BottomBar />

            <AccountModal 
                show={isModalOpen} 
                onClose={handleCloseModal} 
                serverName={currentServerName}
            />
        </>
    );
};

export default App;
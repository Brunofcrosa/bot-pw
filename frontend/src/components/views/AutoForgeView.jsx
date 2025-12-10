import React, { useState, useEffect } from 'react';
import { FaHammer, FaStop, FaPlay, FaCrosshairs, FaCheckCircle, FaSync } from 'react-icons/fa';

const DEFAULT_CONFIG = {
    loop: true,
    delay: 500,
    slot: 1
};

const AutoForgeView = () => {
    const [configJson, setConfigJson] = useState(JSON.stringify(DEFAULT_CONFIG, null, 2));
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState([]);

    // Novas estatísticas
    const [stats, setStats] = useState({
        cycles: 0,
        matches: 0,
        lastAction: 'Aguardando...',
        currentSlot: '-'
    });

    useEffect(() => {
        try {
            if (!window.electronAPI) return;

            window.electronAPI.on('auto-forge-event', (event) => {
                try {
                    // Log
                    const msg = typeof event === 'object' ? JSON.stringify(event) : String(event);
                    setLogs(prev => [`[EVENT] ${msg}`, ...prev].slice(0, 50));

                    // Parse stats
                    if (event && event.event) {
                        const type = event.event;
                        setStats(prev => {
                            const newStats = { ...prev };

                            if (type === 'cycle-start') {
                                newStats.cycles += 1;
                                newStats.lastAction = 'Iniciando Ciclo';
                            } else if (type === 'match') {
                                newStats.matches += 1;
                                newStats.lastAction = 'MATCH ENCONTRADO!';
                            } else if (type === 'slot-identified') {
                                newStats.currentSlot = event.slot || prev.currentSlot;
                                newStats.lastAction = `Slot ${event.slot} Identificado`;
                            } else if (type === 'slot-hover') {
                                newStats.lastAction = 'Verificando Slot...';
                            } else if (type === 'clicked-start') {
                                newStats.lastAction = 'Clicou Iniciar';
                            }

                            return newStats;
                        });
                    }
                } catch (e) {
                    console.error('Error handling event stats', e);
                }
            });

            window.electronAPI.on('auto-forge-stop', (event) => {
                setIsRunning(false);
                setStats(prev => ({ ...prev, lastAction: 'Parado.' }));
                setLogs(prev => [`[STOPPED]`, ...prev].slice(0, 50));
            });
        } catch (err) {
            console.error('Error in AutoForgeView useEffect', err);
        }
    }, []);

    const handleStart = async () => {
        try {
            const config = JSON.parse(configJson);
            const success = await window.electronAPI.invoke('start-auto-forge', config);
            if (success) {
                setIsRunning(true);
                setStats({ cycles: 0, matches: 0, lastAction: 'Iniciando...', currentSlot: '-' });
                setLogs(prev => ['[STARTED] Iniciando auto-forge...', ...prev]);
            }
        } catch (e) {
            alert('JSON Inválido: ' + e.message);
        }
    };

    const handleStop = async () => {
        await window.electronAPI.invoke('stop-auto-forge');
        setIsRunning(false);
    };

    const handleCapture = async () => {
        setLogs(prev => ['[INFO] Clique na janela do jogo...', ...prev]);
        const result = await window.electronAPI.invoke('capture-coordinates', null);
        if (result && result.success) {
            const { x, y } = result.data.client;
            alert(`Coordenada: X=${x}, Y=${y}`);
            setLogs(prev => [`[CAPTURED] X: ${x}, Y: ${y}`, ...prev]);
        }
    };

    return (
        <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2><FaHammer /> Auto Forja</h2>
                <div style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    background: isRunning ? 'var(--accent-success)' : '#444',
                    color: 'white',
                    fontWeight: 'bold'
                }}>
                    {isRunning ? 'EXECUTANDO' : 'PARADO'}
                </div>
            </div>

            {/* Dashboard Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <StatCard icon={<FaSync />} label="Ciclos" value={stats.cycles} />
                <StatCard icon={<FaCheckCircle />} label="Encontrados" value={stats.matches} color="var(--accent-success)" />
                <StatCard icon={<FaCrosshairs />} label="Slot Atual" value={stats.currentSlot} />
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Status</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.lastAction}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                    <h3>Configuração</h3>
                    <textarea
                        value={configJson}
                        onChange={(e) => setConfigJson(e.target.value)}
                        style={{
                            width: '100%',
                            height: '300px',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '1rem',
                            fontFamily: 'monospace',
                            marginBottom: '1rem'
                        }}
                    />

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {!isRunning ? (
                            <button onClick={handleStart} className="btn-primary" style={{ padding: '0.8rem 2rem', background: 'var(--accent-primary)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaPlay /> Iniciar
                            </button>
                        ) : (
                            <button onClick={handleStop} className="btn-danger" style={{ padding: '0.8rem 2rem', background: 'var(--accent-danger)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaStop /> Parar
                            </button>
                        )}
                        <button onClick={handleCapture} style={{ padding: '0.8rem 1rem', background: '#444', border: '1px solid #666', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
                            Capturar Coord.
                        </button>
                    </div>
                </div>

                <div>
                    <h3>Logs Detalhados</h3>
                    <div style={{
                        height: '350px',
                        overflowY: 'auto',
                        background: '#111',
                        color: '#0f0',
                        padding: '1rem',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        border: '1px solid #333'
                    }}>
                        {logs.map((log, i) => (
                            <div key={i} style={{ marginBottom: '4px', borderBottom: '1px solid #222' }}>{log}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div style={{
        background: 'var(--bg-card)',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
    }}>
        <div style={{ fontSize: '1.5rem', color: color || 'var(--text-secondary)' }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</div>
        </div>
    </div>
);

export default AutoForgeView;

import { useState, useEffect, useCallback } from 'react';

export const useBotData = () => {
    const [servers, setServers] = useState([]);
    const [currentServerId, setCurrentServerId] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Carregar servidores ao iniciar
    useEffect(() => {
        const fetchServers = async () => {
            try {
                const loadedServers = await window.electronAPI.invoke('load-servers');
                if (Array.isArray(loadedServers) && loadedServers.length > 0) {
                    setServers(loadedServers);
                    if (!currentServerId) setCurrentServerId(loadedServers[0].id);
                }
            } catch (err) {
                console.error('Erro ao carregar servidores:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchServers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Carregar contas e grupos quando o servidor muda
    useEffect(() => {
        const loadServerData = async () => {
            if (currentServerId) {
                try {
                    const accs = await window.electronAPI.invoke('load-accounts', currentServerId);
                    setAccounts(Array.isArray(accs) ? accs : []);

                    const grps = await window.electronAPI.invoke('load-groups', currentServerId);
                    setGroups(Array.isArray(grps) ? grps : []);
                } catch (err) {
                    console.error('Erro ao carregar dados do servidor:', err);
                }
            }
        };
        loadServerData();
    }, [currentServerId]);

    const saveServers = useCallback(async (updatedServers) => {
        setServers(updatedServers);
        await window.electronAPI.invoke('save-servers', updatedServers);
    }, []);

    const saveAccounts = useCallback(async (updatedAccounts) => {
        setAccounts(updatedAccounts);
        await window.electronAPI.invoke('save-accounts', currentServerId, updatedAccounts);
    }, [currentServerId]);

    const saveGroups = useCallback(async (updatedGroups) => {
        setGroups(updatedGroups);
        await window.electronAPI.invoke('save-groups', currentServerId, updatedGroups);
    }, [currentServerId]);

    return {
        servers,
        currentServerId,
        setCurrentServerId,
        accounts,
        groups,
        saveServers,
        saveAccounts,
        saveGroups,
        isLoading
    };
};

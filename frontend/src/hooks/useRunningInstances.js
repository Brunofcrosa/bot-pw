import { useState, useEffect, useCallback } from 'react';

export const useRunningInstances = () => {
    const [runningAccounts, setRunningAccounts] = useState([]);

    useEffect(() => {
        const handleElementOpened = (data) => {
            if (data.success) {
                setRunningAccounts(prev => [
                    ...prev.filter(acc => acc.accountId !== data.accountId),
                    { accountId: data.accountId, pid: data.pid, status: 'running' }
                ]);
            }
        };

        const handleElementClosed = (data) => {
            if (data.success) {
                setRunningAccounts(prev => prev.filter(acc => acc.pid !== data.pid));
            }
        };

        if (window.electronAPI) {
            window.electronAPI.on('element-opened', handleElementOpened);
            window.electronAPI.on('element-closed', handleElementClosed);
        }

        // Cleanup listener não é estritamente necessário se o App não desmontar, 
        // mas boa prática seria remover listener. Porém, API do electronAPI.on pode não retornar off.
        // Assumindo que App.jsx monta uma vez.
    }, []);

    const registerStartingInstance = useCallback((accountId) => {
        setRunningAccounts(prev => [...prev, { accountId, status: 'starting' }]);
    }, []);

    const removeInstance = useCallback((accountId) => {
        setRunningAccounts(prev => prev.filter(acc => acc.accountId !== accountId));
    }, []);

    return {
        runningAccounts,
        setRunningAccounts,
        registerStartingInstance,
        removeInstance
    };
};

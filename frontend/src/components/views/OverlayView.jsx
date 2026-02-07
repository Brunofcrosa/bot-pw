import React, { useMemo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import GroupControlModal from '../modals/GroupControlModal';

const OverlayView = ({ groupId, groups: initialGroups, accounts: initialAccounts, runningAccounts }) => {
    const [groups, setGroups] = useState(initialGroups);
    const [accounts, setAccounts] = useState(initialAccounts);
    const [runningInstances, setRunningInstances] = useState(runningAccounts || []);

    useEffect(() => {
        const refreshData = async () => {
            try {
                const searchParams = new URLSearchParams(window.location.search);
                const currentServerId = searchParams.get('serverId');

                if (currentServerId) {
                    const accs = await window.electronAPI.invoke('load-accounts', currentServerId);
                    setAccounts(Array.isArray(accs) ? accs : []);
                    const grps = await window.electronAPI.invoke('load-groups', currentServerId);
                    setGroups(Array.isArray(grps) ? grps : []);
                }

                const instances = await window.electronAPI.invoke('get-running-instances');
                setRunningInstances(Array.isArray(instances) ? instances : []);
            } catch (err) {
            }
        };

        refreshData();

        const intervalId = setInterval(refreshData, 2000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const rect = entry.target.getBoundingClientRect();
                const w = Math.ceil(rect.width);
                const h = Math.ceil(rect.height);

                if (w > 0 && h > 0) {
                    window.electronAPI.invoke('resize-overlay', { width: w, height: h });
                }
            }
        });

        const target = document.querySelector('.group-control-modal.overlay-mode');
        if (target) {
            resizeObserver.observe(target);
        } else {
            // Retry after render
            setTimeout(() => {
                const t = document.querySelector('.group-control-modal.overlay-mode');
                if (t) resizeObserver.observe(t);
            }, 500);
        }

        return () => resizeObserver.disconnect();
    }, [groups, accounts, runningInstances, groupId]);

    const overlayGroup = useMemo(() => {
        if (!groups.length) return null;
        return groups.find(g => String(g.id) === String(groupId));
    }, [groups, groupId]);

    if (!overlayGroup) return <div style={{ color: 'white', padding: '10px' }}>Carregando grupo...</div>;

    return (
        <GroupControlModal
            isOpen={true}
            onClose={() => window.close()}
            group={overlayGroup}
            accounts={accounts}
            runningAccounts={runningInstances}
            isOverlayMode={true}
        />
    );

};

OverlayView.propTypes = {
    groupId: PropTypes.string,
    groups: PropTypes.array.isRequired,
    accounts: PropTypes.array.isRequired,
    runningAccounts: PropTypes.array.isRequired
};

export default OverlayView;

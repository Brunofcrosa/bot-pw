import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import GroupControlModal from '../modals/GroupControlModal';

const OverlayView = ({ groupId, groups, accounts, runningAccounts }) => {
    const overlayGroup = useMemo(() => {
        if (!groups.length) return null;
        return groups.find(g => g.id === groupId);
    }, [groups, groupId]);

    if (!overlayGroup) return <div style={{ color: 'white', padding: '10px' }}>Carregando grupo...</div>;

    return (
        <GroupControlModal
            isOpen={true}
            onClose={() => window.close()}
            group={overlayGroup}
            accounts={accounts}
            runningAccounts={runningAccounts}
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

export async function preventReload(event, input) {
    const isReload = (
        input.key === 'r' && input.control || // Ctrl+R
        input.key === 'r' && input.meta ||    // Cmd+R (macOS)
        input.key === 'F5'
    );

    if (isReload) {
        event.preventDefault();
    }
};

export default {};
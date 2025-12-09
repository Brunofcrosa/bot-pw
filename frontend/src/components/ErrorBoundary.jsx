import React, { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * Error Boundary para capturar erros React e exibir fallback amigável
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });

        // Log do erro (pode ser enviado para um serviço de monitoramento)
        console.error('[ErrorBoundary] Erro capturado:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={styles.container}>
                    <div style={styles.card}>
                        <div style={styles.icon}>⚠️</div>
                        <h2 style={styles.title}>Algo deu errado</h2>
                        <p style={styles.message}>
                            Ocorreu um erro inesperado. Por favor, tente recarregar a página.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details style={styles.details}>
                                <summary style={styles.summary}>Detalhes do erro</summary>
                                <pre style={styles.errorText}>
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                        <button style={styles.button} onClick={this.handleReload}>
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'var(--bg-body, #f4f6f9)',
        padding: '20px'
    },
    card: {
        backgroundColor: 'var(--bg-card, #ffffff)',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '500px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    },
    icon: {
        fontSize: '4rem',
        marginBottom: '16px'
    },
    title: {
        color: 'var(--text-primary, #212529)',
        marginBottom: '12px',
        fontSize: '1.5rem'
    },
    message: {
        color: 'var(--text-secondary, #495057)',
        marginBottom: '24px'
    },
    button: {
        backgroundColor: 'var(--accent-primary, #5e72e4)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600'
    },
    details: {
        textAlign: 'left',
        marginBottom: '20px',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: '6px',
        padding: '10px'
    },
    summary: {
        cursor: 'pointer',
        fontWeight: '600',
        color: 'var(--text-primary, #212529)'
    },
    errorText: {
        fontSize: '0.75rem',
        overflow: 'auto',
        maxHeight: '200px',
        color: 'var(--accent-danger, #f5365c)'
    }
};

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired
};

export default ErrorBoundary;

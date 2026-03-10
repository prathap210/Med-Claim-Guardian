import React from 'react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Prevents entire app from crashing due to a single component error
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Optional: Log error to error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.errorBox}>
            <h2 style={styles.title}>⚠️ Something went wrong</h2>
            <p style={styles.message}>
              We encountered an unexpected error. Please try refreshing the page or contact support.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details (Development Only)</summary>
                <pre style={styles.stackTrace}>
                  {this.state.error && this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <button onClick={this.handleReset} style={styles.button}>
              Try Again
            </button>
            <button 
              onClick={() => window.location.href = '/'} 
              style={{ ...styles.button, marginLeft: '10px' }}
            >
              Go to Home
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
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  errorBox: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    maxWidth: '600px',
    textAlign: 'center'
  },
  title: {
    color: '#d32f2f',
    fontSize: '24px',
    marginBottom: '16px',
    fontWeight: 'bold'
  },
  message: {
    color: '#666',
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '20px'
  },
  details: {
    marginTop: '20px',
    marginBottom: '20px',
    textAlign: 'left',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    padding: '12px'
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#666',
    padding: '8px'
  },
  stackTrace: {
    backgroundColor: '#f5f5f5',
    padding: '12px',
    borderRadius: '4px',
    overflow: 'auto',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#333',
    marginTop: '8px'
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#1976d2',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  }
};

export default ErrorBoundary;

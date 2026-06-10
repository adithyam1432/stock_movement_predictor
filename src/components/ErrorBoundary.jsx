import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-red-950/20 border border-red-900/40 rounded-2xl max-w-2xl mx-auto my-10 text-center space-y-4 animate-in fade-in duration-500">
          <div className="p-4 bg-red-900/20 rounded-full text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-200">Something went wrong</h2>
          <p className="text-sm text-red-300 max-w-md">
            The application crashed while rendering this section. Below are the details of the error.
          </p>
          <div className="w-full text-left bg-black/40 p-4 rounded-xl border border-red-950 font-mono text-xs text-red-400 overflow-auto max-h-60 custom-scrollbar">
            <div className="font-bold text-red-300 mb-1">{this.state.error && this.state.error.toString()}</div>
            <div className="whitespace-pre text-[10px] opacity-80">{this.state.errorInfo && this.state.errorInfo.componentStack}</div>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem('candleminer_data');
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-red-200 font-semibold rounded-xl text-sm transition-all shadow-lg"
          >
            Clear Cache & Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

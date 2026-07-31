import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportClientError } from '../utils/errorLog';

/* Catches React render errors anywhere below it — reports to the backend (self-hosted
   error monitoring) and shows a friendly fallback instead of a white screen. */
interface Props { children: ReactNode; }
interface State { hasError: boolean; }

class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError({
      message: error?.message || 'React render error',
      stack: `${error?.stack || ''}\n---\n${info?.componentStack || ''}`,
      source: 'react',
      url: window.location.pathname,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center dark:bg-gray-900">
          <div className="text-5xl">⚠️</div>
          <h1 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">काहीतरी चूक झाली</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Something went wrong. कृपया पुन्हा प्रयत्न करा.</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => window.location.reload()} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">पुन्हा लोड करा</button>
            <button onClick={() => { window.location.href = '/'; }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300">मुख्यपृष्ठ</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;

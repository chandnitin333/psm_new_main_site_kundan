import { useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { LoadingProvider } from './contexts/LoadingContext';
import { createRouter } from './routes';

function App() {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const router = useMemo(() => createRouter(handleLogout), []);

  return (
    <ThemeProvider>
      <LoadingProvider>
        <RouterProvider router={router} />
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;

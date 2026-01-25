import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { LoadingProvider } from './contexts/LoadingContext';
import { createRouter } from './routes';

function App() {
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const router = createRouter(handleLogout);

  return (
    <ThemeProvider>
      <LoadingProvider>
        <RouterProvider router={router} />
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;

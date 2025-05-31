import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CircularProgress, Box, PaletteMode } from '@mui/material';
import Layout from './components/Layout';

// Lazy load components
const HabitList = React.lazy(() => import('./components/HabitList'));
const TodoList = React.lazy(() => import('./components/TodoList'));
const RoutinesPage = React.lazy(() => import('./components/RoutinesPage'));

// Loading component
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>
);

const App: React.FC = () => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    // Check localStorage for saved theme preference
    const savedMode = localStorage.getItem('themeMode') as PaletteMode;
    if (savedMode) {
      return savedMode;
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  useEffect(() => {
    // Handle unhandled promise rejections (like Web Share API errors)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Check if it's a Web Share API AbortError
      if (event.reason?.name === 'AbortError' || 
          event.reason?.message?.includes('Share canceled') ||
          event.reason?.message?.includes('canceled')) {
        // Prevent the error from being logged to console
        event.preventDefault();
        console.log('Share operation was cancelled by user');
        return;
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#2196f3' : '#90caf9',
      },
      secondary: {
        main: mode === 'light' ? '#f50057' : '#f48fb1',
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      text: {
        primary: mode === 'light' ? '#000000' : '#ffffff',
        secondary: mode === 'light' ? '#666666' : '#aaaaaa',
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
            borderRadius: 12,
            boxShadow: mode === 'light' 
              ? '0 2px 8px rgba(0,0,0,0.1)' 
              : '0 2px 8px rgba(0,0,0,0.3)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#2196f3' : '#1976d2',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#e3f2fd' : '#263238',
            color: mode === 'light' ? '#1976d2' : '#90caf9',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Layout mode={mode} toggleTheme={toggleTheme} />}>
              <Route index element={<Navigate to="/habits" replace />} />
              <Route path="habits" element={<HabitList />} />
              <Route path="tasks" element={<TodoList />} />
              <Route path="routines" element={<RoutinesPage />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
};

export default App;

import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CircularProgress, Box } from '@mui/material';
import Layout from './components/Layout';

// Lazy load components
const HabitList = React.lazy(() => import('./components/HabitList'));
const TodoList = React.lazy(() => import('./components/TodoList'));

// Loading component
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>
);

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/habits" replace />} />
              <Route path="habits" element={<HabitList />} />
              <Route path="tasks" element={<TodoList />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
};

export default App;

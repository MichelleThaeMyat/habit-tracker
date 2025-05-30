import React, { Suspense } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  CssBaseline, 
  Tabs, 
  Tab, 
  CircularProgress, 
  IconButton,
  Tooltip,
  PaletteMode 
} from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const LoadingSpinner = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
    <CircularProgress />
  </Box>
);

interface LayoutProps {
  mode: PaletteMode;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ mode, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Personal Tracker
          </Typography>
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton color="inherit" onClick={toggleTheme}>
              {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
            </IconButton>
          </Tooltip>
        </Toolbar>
        <Tabs
          value={location.pathname.split('/')[1] || 'habits'}
          onChange={handleTabChange}
          textColor="inherit"
          sx={{
            '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
            '& .Mui-selected': { color: 'white' },
            bgcolor: 'primary.dark',
          }}
        >
          <Tab label="Habits" value="habits" />
          <Tab label="Tasks" value="tasks" />
        </Tabs>
      </AppBar>
      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>
      </Container>
    </Box>
  );
};

export default Layout;
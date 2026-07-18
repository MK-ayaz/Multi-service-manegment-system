import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography,
  IconButton, Tooltip, Avatar, Chip, Menu, MenuItem, Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon, Inventory as InventoryIcon, ShoppingCart as SalesIcon,
  People as CustomersIcon, LocalShipping as SuppliersIcon, Assessment as ReportsIcon,
  Settings as SettingsIcon, Brightness4, Brightness7, Store as StoreIcon,
  Minimize as MinimizeIcon, CropSquare as CropSquareIcon, Close as CloseIcon, AccountCircle,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useThemeMode } from '../../context/ThemeContext';
import { storeService } from '../../services/api';

const DRAWER_WIDTH = 250;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
  { text: 'Point of Sale', icon: <SalesIcon />, path: '/sales' },
  { text: 'Customers', icon: <CustomersIcon />, path: '/customers' },
  { text: 'Suppliers', icon: <SuppliersIcon />, path: '/suppliers' },
  { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: DRAWER_WIDTH,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box',
    backgroundColor: theme.palette.mode === 'dark' ? '#161b22' : '#0d1b2a',
    color: '#fff',
    borderRight: 'none',
  },
}));

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const themeMode = useThemeMode();
  const [store, setStore] = useState(null);
  const [storeMenu, setStoreMenu] = useState(null);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    storeService.get().then(setStore).catch(() => {});
  }, []);

  useEffect(() => {
    const onMax = () => setMaximized(true);
    const onUnmax = () => setMaximized(false);
    window.electron?.window?.onMaximized?.(onMax);
    window.electron?.window?.onUnmaximized?.(onUnmax);
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <StyledDrawer variant="permanent">
        <Toolbar sx={{ display: 'flex', gap: 1.5, background: 'rgba(255,255,255,0.04)' }}>
          <StoreIcon sx={{ color: '#90caf9' }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              {store?.name || 'Store'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Management System
            </Typography>
          </Box>
        </Toolbar>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <List sx={{ px: 1 }}>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.text}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': { backgroundColor: 'primary.main', color: '#fff' },
                '&.Mui-selected:hover': { backgroundColor: 'primary.dark' },
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
            </ListItemButton>
          ))}
        </List>
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Chip
            icon={<AccountCircle />}
            label={store?.type || 'retail'}
            size="small"
            sx={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff' }}
          />
        </Box>
      </StyledDrawer>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Toolbar
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            gap: 2,
            background: (t) => (t.palette.mode === 'dark' ? '#1e1e1e' : '#fff'),
            WebkitAppRegion: 'drag',
            '& .MuiIconButton-root': { WebkitAppRegion: 'no-drag' },
          }}
        >
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {menuItems.find((m) => m.path === location.pathname)?.text || 'Dashboard'}
          </Typography>

          <Tooltip title={themeMode?.mode === 'dark' ? 'Light mode' : 'Dark mode'}>
            <IconButton onClick={() => themeMode?.toggleTheme()}>
              {themeMode?.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>
          <IconButton onClick={() => window.electron?.window?.minimize?.()} size="small">
            <MinimizeIcon />
          </IconButton>
          <IconButton onClick={() => window.electron?.window?.maximize?.()} size="small">
            {maximized ? <CropSquareIcon /> : <CropSquareIcon />}
          </IconButton>
          <IconButton onClick={() => window.electron?.window?.close?.()} size="small" sx={{ '&:hover': { backgroundColor: 'error.main' } }}>
            <CloseIcon />
          </IconButton>
        </Toolbar>

        <Box sx={{ flex: 1, overflow: 'auto', p: 3, background: (t) => t.palette.background.default }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

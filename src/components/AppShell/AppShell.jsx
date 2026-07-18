import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  ShoppingCart as SalesIcon,
  People as CustomersIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Brightness4,
  Brightness7,
  Logout,
  AccountCircle,
  SwapHoriz,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';

const DRAWER_WIDTH = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Stores', icon: <StoreIcon />, path: '/stores' },
  { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
  { text: 'Sales', icon: <SalesIcon />, path: '/sales' },
  { text: 'Customers', icon: <CustomersIcon />, path: '/customers' },
  { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: DRAWER_WIDTH,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box',
    backgroundColor: theme.palette.mode === 'dark' ? '#1b1b1b' : '#0d1b2a',
    color: '#fff',
  },
}));

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, tenant, tenants, switchTenant, logout } = useAuth();
  const themeMode = useThemeMode();
  const [anchorEl, setAnchorEl] = useState(null);

  const onTenantChange = async (e) => {
    try {
      await switchTenant(e.target.value);
    } catch {}
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <StyledDrawer variant="permanent">
        <Toolbar sx={{ background: 'rgba(255,255,255,0.05)' }}>
          <StoreIcon sx={{ mr: 1 }} />
          <Typography variant="h6" noWrap>MSM</Typography>
        </Toolbar>
        <List>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.text}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                '&.Mui-selected': { backgroundColor: 'rgba(255,255,255,0.12)' },
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
              }}
            >
              <ListItemIcon sx={{ color: '#fff', minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>
      </StyledDrawer>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Toolbar
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            gap: 2,
            background: (t) => (t.palette.mode === 'dark' ? '#1e1e1e' : '#fff'),
          }}
        >
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {tenant?.name || 'Workspace'}
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              ({tenant?.plan})
            </Typography>
          </Typography>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="tenant-label"><SwapHoriz fontSize="small" /> Tenant</InputLabel>
            <Select
              labelId="tenant-label"
              value={tenant?.id || ''}
              label="Tenant"
              onChange={onTenantChange}
              input={<OutlinedInput label="Tenant" />}
            >
              {tenants.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tooltip title="Toggle theme">
            <IconButton onClick={() => themeMode?.toggleTheme()}>
              {themeMode?.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user?.name?.[0] || 'U'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>
              <AccountCircle sx={{ mr: 1 }} /> {user?.name} ({user?.role})
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); logout(); }}>
              <Logout sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>

        <Box sx={{ flex: 1, overflow: 'auto', p: 3, background: (t) => t.palette.background.default }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

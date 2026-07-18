import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../../context/AuthContext';

const DEMO = [
  { email: 'admin@acme.com', password: 'admin123', label: 'Acme Admin' },
  { email: 'manager@healthplus.com', password: 'manager123', label: 'HealthPlus Manager' },
  { email: 'demo@demo.com', password: 'demo123', label: 'Demo Admin' },
];

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@acme.com');
  const [password, setPassword] = useState('admin123');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)',
        p: 2,
      }}
    >
      <Card sx={{ width: 400, maxWidth: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <StorefrontIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ mt: 1 }}>
              Multi Store Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your workspace
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={submit}>
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><PersonOutlineIcon /></InputAdornment>) }}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (<InputAdornment position="start"><LockOutlinedIcon /></InputAdornment>),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShow((s) => !s)} edge="end" size="small">
                      {show ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 2 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Demo accounts (click to fill):
            </Typography>
            {DEMO.map((d) => (
              <Button
                key={d.email}
                size="small"
                sx={{ mr: 1, mt: 1 }}
                variant="outlined"
                onClick={() => { setEmail(d.email); setPassword(d.password); }}
              >
                {d.label}
              </Button>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

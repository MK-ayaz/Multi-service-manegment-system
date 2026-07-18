import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Switch, List, ListItem, ListItemText, ListItemSecondaryAction,
  Divider, FormControl, InputLabel, Select, MenuItem, TextField, Button, Alert,
} from '@mui/material';
import { settingsService } from '../../services/api';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    settingsService.get().then(setSettings).catch((e) => setError(e.message));
  }, []);

  const toggle = (key) => setSettings((s) => ({ ...s, [key]: !s[key] }));
  const change = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  const save = async () => {
    try { await settingsService.save(settings); setSuccess('Settings saved'); setTimeout(() => setSuccess(''), 2500); }
    catch (e) { setError(e.message); }
  };

  if (!settings) return null;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      <Paper sx={{ p: 3 }}>
        <List>
          <ListItem>
            <ListItemText primary="Dark Mode" secondary="Enable dark theme" />
            <ListItemSecondaryAction><Switch edge="end" checked={settings.darkMode} onChange={() => toggle('darkMode')} /></ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="Notifications" secondary="Desktop notifications" />
            <ListItemSecondaryAction><Switch edge="end" checked={settings.notifications} onChange={() => toggle('notifications')} /></ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="Language" />
            <ListItemSecondaryAction>
              <FormControl sx={{ minWidth: 120 }}>
                <Select value={settings.language} onChange={(e) => change('language', e.target.value)} size="small">
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                </Select>
              </FormControl>
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="Currency" />
            <ListItemSecondaryAction>
              <FormControl sx={{ minWidth: 120 }}>
                <Select value={settings.currency} onChange={(e) => change('currency', e.target.value)} size="small">
                  <MenuItem value="USD">USD ($)</MenuItem>
                  <MenuItem value="EUR">EUR (€)</MenuItem>
                  <MenuItem value="GBP">GBP (£)</MenuItem>
                </Select>
              </FormControl>
            </ListItemSecondaryAction>
          </ListItem>
        </List>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={save}>Save Settings</Button>
        </Box>
      </Paper>
    </Box>
  );
}

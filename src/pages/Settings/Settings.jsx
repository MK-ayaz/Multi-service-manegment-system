import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Switch, List, ListItem, ListItemText, ListItemSecondaryAction,
  Divider, FormControl, InputLabel, Select, MenuItem, TextField, Button, Alert,
} from '@mui/material';
import { storeService, settingsService } from '../../services/api';

export default function Settings() {
  const [store, setStore] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([storeService.get(), settingsService.get()])
      .then(([s, set]) => { setStore(s); setSettings(set); })
      .catch((e) => setError(e.message));
  }, []);

  const toggle = (k) => setSettings((s) => ({ ...s, [k]: !s[k] }));
  const change = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const changeStore = (k, v) => setStore((s) => ({ ...s, [k]: v }));

  const save = async () => {
    try {
      await storeService.update(store);
      await settingsService.save(settings);
      setSuccess('Settings saved');
      setTimeout(() => setSuccess(''), 2500);
    } catch (e) { setError(e.message); }
  };

  if (!store || !settings) return null;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Store Profile</Typography>
        <TextField fullWidth margin="normal" label="Store Name" value={store.name} onChange={(e) => changeStore('name', e.target.value)} />
        <TextField fullWidth margin="normal" label="Type" value={store.type} onChange={(e) => changeStore('type', e.target.value)} />
        <TextField fullWidth margin="normal" label="Location" value={store.location} onChange={(e) => changeStore('location', e.target.value)} />
        <TextField fullWidth margin="normal" label="Phone" value={store.phone} onChange={(e) => changeStore('phone', e.target.value)} />
        <TextField fullWidth margin="normal" label="Email" value={store.email} onChange={(e) => changeStore('email', e.target.value)} />
        <TextField fullWidth margin="normal" label="Tax ID" value={store.taxId} onChange={(e) => changeStore('taxId', e.target.value)} />
      </Paper>

      <Paper sx={{ p: 3 }}>
        <List>
          <ListItem>
            <ListItemText primary="Dark Mode" secondary="Enable dark theme" />
            <ListItemSecondaryAction><Switch edge="end" checked={settings.darkMode} onChange={() => toggle('darkMode')} /></ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="Low Stock Alerts" secondary="Notify on low/out-of-stock items" />
            <ListItemSecondaryAction><Switch edge="end" checked={settings.lowStockAlerts} onChange={() => toggle('lowStockAlerts')} /></ListItemSecondaryAction>
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

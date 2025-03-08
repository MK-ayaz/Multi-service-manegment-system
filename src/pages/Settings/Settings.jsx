import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
} from '@mui/material';

const Settings = () => {
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    autoBackup: true,
    language: 'en',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    backupLocation: 'C:/backups',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleSave = async () => {
    try {
      // Save settings to electron store
      await window.api.settings.save(settings);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <List>
          <ListItem>
            <ListItemText 
              primary="Dark Mode" 
              secondary="Enable dark theme for the application"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={settings.darkMode}
                onChange={() => handleToggle('darkMode')}
              />
            </ListItemSecondaryAction>
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemText 
              primary="Notifications" 
              secondary="Enable desktop notifications for important events"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={settings.notifications}
                onChange={() => handleToggle('notifications')}
              />
            </ListItemSecondaryAction>
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemText 
              primary="Automatic Backup" 
              secondary="Enable automatic data backup"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={settings.autoBackup}
                onChange={() => handleToggle('autoBackup')}
              />
            </ListItemSecondaryAction>
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemText 
              primary="Language" 
              secondary="Select application language"
            />
            <ListItemSecondaryAction>
              <FormControl sx={{ minWidth: 120 }}>
                <Select
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  size="small"
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                </Select>
              </FormControl>
            </ListItemSecondaryAction>
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemText 
              primary="Currency" 
              secondary="Select default currency"
            />
            <ListItemSecondaryAction>
              <FormControl sx={{ minWidth: 120 }}>
                <Select
                  value={settings.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  size="small"
                >
                  <MenuItem value="USD">USD ($)</MenuItem>
                  <MenuItem value="EUR">EUR (€)</MenuItem>
                  <MenuItem value="GBP">GBP (£)</MenuItem>
                </Select>
              </FormControl>
            </ListItemSecondaryAction>
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemText 
              primary="Date Format" 
              secondary="Select preferred date format"
            />
            <ListItemSecondaryAction>
              <FormControl sx={{ minWidth: 120 }}>
                <Select
                  value={settings.dateFormat}
                  onChange={(e) => handleChange('dateFormat', e.target.value)}
                  size="small"
                >
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </Select>
              </FormControl>
            </ListItemSecondaryAction>
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemText 
              primary="Backup Location" 
              secondary="Set the backup directory path"
            />
            <ListItemSecondaryAction>
              <TextField
                value={settings.backupLocation}
                onChange={(e) => handleChange('backupLocation', e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            onClick={handleSave}
          >
            Save Settings
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings; 
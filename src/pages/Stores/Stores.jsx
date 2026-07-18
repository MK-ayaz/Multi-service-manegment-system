import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, Grid, IconButton, MenuItem, CircularProgress, Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { storeService } from '../../services/api';

const STORE_TYPES = [
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'retail', label: 'Retail Store' },
  { value: 'supermarket', label: 'Supermarket' },
];

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', type: '', location: '' });

  const load = async () => {
    setLoading(true);
    try { setStores(await storeService.list()); } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openDialog = (store = null) => {
    setEditing(store);
    setForm(store ? { name: store.name, type: store.type, location: store.location } : { name: '', type: '', location: '' });
    setOpen(true);
  };
  const close = () => { setOpen(false); setEditing(null); setForm({ name: '', type: '', location: '' }); };

  const submit = async () => {
    try {
      if (editing) await storeService.update(editing.id, form);
      else await storeService.create(form);
      close(); await load();
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this store?')) return;
    try { await storeService.remove(id); await load(); } catch (e) { setError(e.message); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Stores</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>Add Store</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Grid container spacing={3}>
        {stores.map((s) => (
          <Grid item xs={12} sm={6} md={4} key={s.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6">{s.name}</Typography>
                    <Typography variant="body2" color="text.secondary">Type: {s.type}</Typography>
                    <Typography variant="body2" color="text.secondary">Location: {s.location}</Typography>
                  </Box>
                  <Box>
                    <IconButton onClick={() => openDialog(s)} size="small"><EditIcon /></IconButton>
                    <IconButton onClick={() => remove(s.id)} size="small" color="error"><DeleteIcon /></IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Store' : 'Add New Store'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" label="Store Name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField fullWidth select margin="normal" label="Store Type" name="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {STORE_TYPES.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
          <TextField fullWidth margin="normal" label="Location" name="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button onClick={submit} variant="contained">{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

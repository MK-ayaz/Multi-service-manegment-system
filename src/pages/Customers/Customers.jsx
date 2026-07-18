import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Typography, IconButton, CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { customerService } from '../../services/api';

export default function Customers() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

  const load = async () => {
    setLoading(true);
    try { setCustomers(await customerService.list()); } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openDialog = (c = null) => {
    setEditing(c);
    setForm(c ? { name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '' }
      : { name: '', email: '', phone: '', address: '' });
    setOpen(true);
  };
  const close = () => { setOpen(false); setEditing(null); setForm({ name: '', email: '', phone: '', address: '' }); };

  const submit = async () => {
    try {
      if (editing) await customerService.update(editing.id, form);
      else await customerService.create(form);
      close(); await load();
    } catch (e) { setError(e.message); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try { await customerService.remove(id); await load(); } catch (e) { setError(e.message); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Customers</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>Add Customer</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Address</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.email || '-'}</TableCell>
                <TableCell>{c.phone || '-'}</TableCell>
                <TableCell>{c.address || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openDialog(c)} size="small"><EditIcon /></IconButton>
                  <IconButton onClick={() => remove(c.id)} size="small" color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextField fullWidth margin="normal" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField fullWidth margin="normal" label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField fullWidth margin="normal" label="Address" multiline rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button onClick={submit} variant="contained">{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

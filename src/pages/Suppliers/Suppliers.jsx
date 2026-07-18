import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Typography, IconButton, CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Alert, Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, LocalShipping as ShipIcon } from '@mui/icons-material';
import { supplierService } from '../../services/api';

export default function Suppliers() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', contact: '', phone: '', email: '', leadTimeDays: 3 });

  const load = async () => {
    setLoading(true);
    try { setRows(await supplierService.list()); } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openDialog = (s = null) => {
    setEditing(s);
    setForm(s ? { name: s.name, contact: s.contact || '', phone: s.phone || '', email: s.email || '', leadTimeDays: s.leadTimeDays || 3 }
      : { name: '', contact: '', phone: '', email: '', leadTimeDays: 3 });
    setOpen(true);
  };
  const close = () => { setOpen(false); setEditing(null); setForm({ name: '', contact: '', phone: '', email: '', leadTimeDays: 3 }); };

  const submit = async () => {
    try {
      if (editing) await supplierService.update(editing.id, form);
      else await supplierService.create(form);
      close(); await load();
    } catch (e) { setError(e.message); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    try { await supplierService.remove(id); await load(); } catch (e) { setError(e.message); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Suppliers</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>Add Supplier</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Lead Time</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell><ShipIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />{s.name}</TableCell>
                <TableCell>{s.contact || '-'}</TableCell>
                <TableCell>{s.phone || '-'}</TableCell>
                <TableCell>{s.email || '-'}</TableCell>
                <TableCell align="right"><Chip size="small" label={`${s.leadTimeDays || 0} d`} /></TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openDialog(s)} size="small"><EditIcon /></IconButton>
                  <IconButton onClick={() => remove(s.id)} size="small" color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextField fullWidth margin="normal" label="Contact Person" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <TextField fullWidth margin="normal" label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField fullWidth margin="normal" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField fullWidth margin="normal" label="Lead Time (days)" type="number" value={form.leadTimeDays} onChange={(e) => setForm({ ...form, leadTimeDays: parseInt(e.target.value, 10) || 0 })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button onClick={submit} variant="contained">{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

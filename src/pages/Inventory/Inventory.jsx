import React, { useState, useEffect } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography,
  IconButton, MenuItem, CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, FormControl, InputLabel, Select, Alert, Stack,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Warning as WarningIcon } from '@mui/icons-material';
import { storeService, productService, inventoryService } from '../../services/api';

export default function Inventory() {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ productId: '', quantity: '', minQuantity: '', maxQuantity: '' });

  const loadInitial = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([storeService.list(), productService.list()]);
      setStores(s); setProducts(p);
      if (s[0]) setSelectedStore(s[0].id);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { loadInitial(); }, []);

  const loadInventory = async () => {
    if (!selectedStore) return;
    try { setInventory(await inventoryService.list(selectedStore)); } catch (e) { setError(e.message); }
  };
  useEffect(() => { loadInventory(); }, [selectedStore]);

  const openDialog = (item = null) => {
    setEditing(item);
    setForm(item
      ? { productId: item.productId, quantity: item.quantity, minQuantity: item.minQuantity, maxQuantity: item.maxQuantity }
      : { productId: '', quantity: '', minQuantity: '', maxQuantity: '' });
    setOpen(true);
  };
  const close = () => { setOpen(false); setEditing(null); setForm({ productId: '', quantity: '', minQuantity: '', maxQuantity: '' }); };

  const submit = async () => {
    try {
      const data = {
        storeId: selectedStore,
        productId: form.productId,
        quantity: parseInt(form.quantity, 10),
        minQuantity: parseInt(form.minQuantity, 10),
        maxQuantity: parseInt(form.maxQuantity, 10),
      };
      await inventoryService.upsert(data);
      close(); await loadInventory();
    } catch (e) { setError(e.message); }
  };

  const remove = async (storeId, productId) => {
    if (!window.confirm('Remove this item from inventory?')) return;
    try { await inventoryService.remove(storeId, productId); await loadInventory(); } catch (e) { setError(e.message); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Inventory Management</Typography>
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel>Select Store</InputLabel>
          <Select label="Select Store" value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
            {stores.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Min</TableCell>
              <TableCell align="right">Max</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map((i) => {
              const low = i.quantity <= i.minQuantity;
              const over = i.quantity >= i.maxQuantity;
              return (
                <TableRow key={i.productId}>
                  <TableCell>{i.productName}</TableCell>
                  <TableCell>{i.category}</TableCell>
                  <TableCell align="right">{i.quantity}</TableCell>
                  <TableCell align="right">{i.minQuantity}</TableCell>
                  <TableCell align="right">{i.maxQuantity}</TableCell>
                  <TableCell align="right">${Number(i.unitPrice).toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" justifyContent="center">
                      {low && <WarningIcon color="error" titleAccess="Low Stock" />}
                      {over && <WarningIcon color="warning" titleAccess="Over Stock" />}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => openDialog(i)} size="small"><EditIcon /></IconButton>
                    <IconButton onClick={() => remove(i.storeId, i.productId)} size="small" color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Inventory' : 'Add Inventory'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Product</InputLabel>
            <Select label="Product" name="productId" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} disabled={!!editing}>
              {products.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth margin="normal" label="Quantity" type="number" name="quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <TextField fullWidth margin="normal" label="Minimum Quantity" type="number" name="minQuantity" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} />
          <TextField fullWidth margin="normal" label="Maximum Quantity" type="number" name="maxQuantity" value={form.maxQuantity} onChange={(e) => setForm({ ...form, maxQuantity: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button onClick={submit} variant="contained">{editing ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

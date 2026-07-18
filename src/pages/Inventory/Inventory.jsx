import React, { useState, useEffect } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography,
  IconButton, MenuItem, CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, FormControl, InputLabel, Select, Alert, Stack, Chip, Tooltip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Warning as WarningIcon, RemoveCircleOutline, AddCircleOutline } from '@mui/icons-material';
import { productService, inventoryService } from '../../services/api';

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function Inventory() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [adjust, setAdjust] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ productId: '', quantity: '', minQuantity: '', maxQuantity: '' });

  const loadProducts = async () => { try { setProducts(await productService.list()); } catch (e) { setError(e.message); } };
  const loadInventory = async () => { try { setInventory(await inventoryService.list()); } catch (e) { setError(e.message); } };

  useEffect(() => { loadProducts().then(loadInventory).finally(() => setLoading(false)); }, []);

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
      await inventoryService.upsert({
        productId: form.productId,
        quantity: parseInt(form.quantity, 10),
        minQuantity: parseInt(form.minQuantity, 10),
        maxQuantity: parseInt(form.maxQuantity, 10),
      });
      close(); await loadInventory();
    } catch (e) { setError(e.message); }
  };

  const openAdjust = (item) => { setAdjust({ item, delta: 1 }); };
  const submitAdjust = async () => {
    try {
      await inventoryService.adjust(adjust.item.productId, parseInt(adjust.delta, 10), adjust.reason);
      setAdjust(null); await loadInventory();
    } catch (e) { setError(e.message); }
  };

  const remove = async (productId) => {
    if (!window.confirm('Remove this product from inventory?')) return;
    try { await inventoryService.remove(productId); await loadInventory(); } catch (e) { setError(e.message); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Inventory</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>Add Item</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">On Hand</TableCell>
              <TableCell align="right">Min</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map((i) => {
              const low = i.quantity <= i.minQuantity;
              const out = i.quantity === 0;
              return (
                <TableRow key={i.productId}>
                  <TableCell>{i.productName}</TableCell>
                  <TableCell>{i.sku}</TableCell>
                  <TableCell>{i.category}</TableCell>
                  <TableCell align="right">{i.quantity}</TableCell>
                  <TableCell align="right">{i.minQuantity}</TableCell>
                  <TableCell align="right">{fmt(i.unitPrice)}</TableCell>
                  <TableCell align="center">
                    {out ? <Chip size="small" color="error" label="Out of stock" />
                      : low ? <Chip size="small" color="warning" icon={<WarningIcon />} label="Low" />
                      : <Chip size="small" color="success" label="OK" />}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Adjust stock"><IconButton size="small" onClick={() => openAdjust(i)}><EditIcon /></IconButton></Tooltip>
                    <Tooltip title="Remove"><IconButton size="small" color="error" onClick={() => remove(i.productId)}><DeleteIcon /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Product</InputLabel>
            <Select label="Product" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} disabled={!!editing}>
              {products.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth margin="normal" label="Quantity On Hand" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <TextField fullWidth margin="normal" label="Minimum Quantity" type="number" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} />
          <TextField fullWidth margin="normal" label="Maximum Quantity" type="number" value={form.maxQuantity} onChange={(e) => setForm({ ...form, maxQuantity: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button onClick={submit} variant="contained">{editing ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!adjust} onClose={() => setAdjust(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Adjust Stock — {adjust?.item?.productName}</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <TextField type="number" label="Delta (+/-)" value={adjust?.delta ?? 1}
              onChange={(e) => setAdjust({ ...adjust, delta: e.target.value })} fullWidth />
          </Stack>
          <TextField fullWidth margin="normal" label="Reason (optional)" value={adjust?.reason || ''}
            onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })} />
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button startIcon={<AddCircleOutline />} onClick={() => setAdjust({ ...adjust, delta: Math.abs(adjust.delta || 1) })}>Restock</Button>
            <Button startIcon={<RemoveCircleOutline />} color="warning" onClick={() => setAdjust({ ...adjust, delta: -Math.abs(adjust.delta || 1) })}>Reduce</Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjust(null)}>Cancel</Button>
          <Button onClick={submitAdjust} variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

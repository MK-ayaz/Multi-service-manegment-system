import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Typography, Grid, IconButton, MenuItem, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel, Select, Alert, Tabs, Tab,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, ShoppingCart as CartIcon, Receipt as ReceiptIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { productService, customerService, saleService } from '../../services/api';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'transfer', label: 'Bank Transfer' },
];
const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function Sales() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [sales, setSales] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const loadInitial = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([productService.list(), customerService.list()]);
      setProducts(p); setCustomers(c);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { loadInitial(); }, []);

  const loadSales = async () => { try { setSales(await saleService.list()); } catch (e) { setError(e.message); } };
  useEffect(() => { loadSales(); }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.productId === product.id);
      if (ex) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice } : i);
      return [...prev, { productId: product.id, productName: product.name, quantity: 1, unitPrice: product.unitPrice, totalPrice: product.unitPrice }];
    });
  };
  const updateQty = (id, change) => setCart((prev) => prev.map((i) => i.productId === id
    ? { ...i, quantity: Math.max(0, i.quantity + change), totalPrice: Math.max(0, i.quantity + change) * i.unitPrice } : i).filter((i) => i.quantity > 0));
  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.productId !== id));
  const total = cart.reduce((s, i) => s + i.totalPrice, 0);

  const checkout = async () => {
    if (!cart.length) { setError('Cart is empty'); return; }
    try {
      await saleService.create({ items: cart, totalAmount: total, paymentMethod, customerId: selectedCustomer?.id });
      setCart([]); setSelectedCustomer(null); setPaymentMethod('cash'); await loadSales();
    } catch (e) { setError(e.message); }
  };
  const voidSale = async (id) => {
    if (!window.confirm('Void this sale?')) return;
    try { await saleService.void(id); await loadSales(); } catch (e) { setError(e.message); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Point of Sale" />
          <Tab label="Sales History" />
        </Tabs>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {activeTab === 0 ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Products</Typography>
              <Grid container spacing={2}>
                {products.map((p) => (
                  <Grid item xs={12} sm={6} md={4} key={p.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{p.name}</Typography>
                        <Typography color="text.secondary">{fmt(p.unitPrice)}</Typography>
                        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => addToCart(p)} sx={{ mt: 1 }}>Add</Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Cart</Typography>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Customer (optional)</InputLabel>
                <Select label="Customer (optional)" value={selectedCustomer?.id || ''} onChange={(e) => setSelectedCustomer(customers.find((c) => c.id === e.target.value) || null)}>
                  <MenuItem value=""><em>Walk-in</em></MenuItem>
                  {customers.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
              {cart.map((i) => (
                <Box key={i.productId} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography>{i.productName}</Typography>
                    <Box>
                      <IconButton size="small" onClick={() => updateQty(i.productId, -1)}><RemoveIcon fontSize="small" /></IconButton>
                      <Typography component="span" sx={{ mx: 1 }}>{i.quantity}</Typography>
                      <IconButton size="small" onClick={() => updateQty(i.productId, 1)}><AddIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => removeFromCart(i.productId)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">{fmt(i.totalPrice)}</Typography>
                </Box>
              ))}
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Payment Method</InputLabel>
                <Select label="Payment Method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                </Select>
              </FormControl>
              <Typography variant="h6" sx={{ mt: 2 }}>Total: {fmt(total)}</Typography>
              <Button variant="contained" fullWidth startIcon={<CartIcon />} sx={{ mt: 1 }} onClick={checkout} disabled={!cart.length}>Checkout</Button>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{new Date(s.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{s.items?.length || 0}</TableCell>
                  <TableCell align="right">{fmt(s.totalAmount)}</TableCell>
                  <TableCell>{PAYMENT_METHODS.find((m) => m.value === s.paymentMethod)?.label}</TableCell>
                  <TableCell>{s.status}</TableCell>
                  <TableCell align="right"><IconButton size="small" onClick={() => voidSale(s.id)} disabled={s.status === 'voided'}><ReceiptIcon /></IconButton></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

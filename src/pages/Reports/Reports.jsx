import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { inventoryService, saleService } from '../../services/api';
const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    Promise.all([inventoryService.list(), saleService.list()])
      .then(([inv, s]) => { setInventory(inv); setSales(s); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  const completed = sales.filter((s) => s.status !== 'voided');
  const totalRevenue = completed.reduce((a, s) => a + s.totalAmount, 0);
  const alerts = inventory.filter((i) => i.quantity <= i.minQuantity || i.quantity === 0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Reports & Analytics</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Total Sales</Typography><Typography variant="h5">{completed.length}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Total Revenue</Typography><Typography variant="h5">{fmt(totalRevenue)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Stock Alerts</Typography><Typography variant="h5">{alerts.length}</Typography></CardContent></Card></Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Recent Sales</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Items</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sales.slice(0, 25).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="right">{s.items?.length || 0}</TableCell>
                      <TableCell align="right">{fmt(s.totalAmount)}</TableCell>
                      <TableCell>{s.paymentMethod}</TableCell>
                      <TableCell>{s.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Inventory Alerts</Typography>
            <Grid container spacing={2}>
              {alerts.map((i) => (
                <Grid item xs={12} sm={6} md={4} key={i.productId}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <WarningIcon color={i.quantity === 0 ? 'error' : 'warning'} sx={{ mr: 1 }} />
                        <Typography variant="h6">{i.productName}</Typography>
                      </Box>
                      <Typography color="text.secondary">On hand: {i.quantity}</Typography>
                      <Typography color="text.secondary">{i.quantity === 0 ? 'Out of stock' : `Low (min ${i.minQuantity})`}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {alerts.length === 0 && <Grid item><Typography color="text.secondary">No stock alerts. 🎉</Typography></Grid>}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

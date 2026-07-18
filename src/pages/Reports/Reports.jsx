import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { storeService, inventoryService, saleService } from '../../services/api';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [sales, setSales] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    storeService.list().then((s) => { setStores(s); if (s[0]) setSelectedStore(s[0].id); }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedStore) return;
    setLoading(true);
    Promise.all([saleService.list({ storeId: selectedStore }), inventoryService.list(selectedStore)])
      .then(([s, inv]) => {
        setSales(s);
        setAlerts(inv.filter((i) => i.quantity <= i.minQuantity || i.quantity >= i.maxQuantity));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedStore]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Reports & Analytics</Typography>
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel>Select Store</InputLabel>
          <Select label="Select Store" value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
            {stores.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Sales</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Items</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="right">{s.items?.length || 0}</TableCell>
                      <TableCell align="right">${Number(s.totalAmount).toFixed(2)}</TableCell>
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
                        <WarningIcon color={i.quantity <= i.minQuantity ? 'error' : 'warning'} sx={{ mr: 1 }} />
                        <Typography variant="h6">{i.productName}</Typography>
                      </Box>
                      <Typography color="text.secondary">Current: {i.quantity}</Typography>
                      <Typography color="text.secondary">
                        {i.quantity <= i.minQuantity ? `Low Stock (Min: ${i.minQuantity})` : `Over Stock (Max: ${i.maxQuantity})`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  LocalShipping as ShippingIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [salesData, setSalesData] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      fetchStoreData();
    }
  }, [selectedStore]);

  const fetchInitialData = async () => {
    try {
      const storesList = await window.api.stores.getAll();
      setStores(storesList);
      if (storesList.length > 0) {
        setSelectedStore(storesList[0].id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load initial data');
      setLoading(false);
    }
  };

  const fetchStoreData = async () => {
    try {
      // Fetch sales data
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const endDate = today.toISOString();
      
      const sales = await window.api.sales.getByStore(selectedStore, {
        startDate,
        endDate,
      });

      setSalesData(sales);

      // Fetch inventory alerts
      const inventory = await window.api.inventory.get(selectedStore);
      const alerts = inventory.filter(item => 
        item.quantity <= item.min_quantity || 
        item.quantity >= item.max_quantity
      );
      
      setInventoryAlerts(alerts);
    } catch (error) {
      console.error('Error fetching store data:', error);
      setError('Failed to load store data');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Reports & Analytics
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Select Store</InputLabel>
          <Select
            value={selectedStore}
            label="Select Store"
            onChange={(e) => setSelectedStore(e.target.value)}
          >
            {stores.map((store) => (
              <MenuItem key={store.id} value={store.id}>
                {store.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Sales Overview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sales Overview
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Items</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salesData.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {new Date(sale.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {sale.customer_name || 'Walk-in Customer'}
                      </TableCell>
                      <TableCell align="right">
                        {sale.items?.length || 0}
                      </TableCell>
                      <TableCell align="right">
                        ${sale.total_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{sale.payment_method}</TableCell>
                      <TableCell>{sale.status || 'completed'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Inventory Alerts */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Inventory Alerts
            </Typography>
            <Grid container spacing={2}>
              {inventoryAlerts.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.product_id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <WarningIcon 
                          color={item.quantity <= item.min_quantity ? 'error' : 'warning'} 
                          sx={{ mr: 1 }} 
                        />
                        <Typography variant="h6">
                          {item.product_name}
                        </Typography>
                      </Box>
                      <Typography color="text.secondary" gutterBottom>
                        Current Quantity: {item.quantity}
                      </Typography>
                      <Typography color="text.secondary">
                        {item.quantity <= item.min_quantity 
                          ? `Low Stock (Min: ${item.min_quantity})`
                          : `Over Stock (Max: ${item.max_quantity})`
                        }
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
};

export default Reports; 
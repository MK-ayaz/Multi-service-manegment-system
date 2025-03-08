import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Grid,
  IconButton,
  MenuItem,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Tabs,
  Tab,
  Autocomplete,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Receipt as ReceiptIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'transfer', label: 'Bank Transfer' },
];

const Sales = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [sales, setSales] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [storesList, productsList, customersList] = await Promise.all([
          window.api.stores.getAll(),
          window.api.products.getAll(),
          window.api.customers.getAll(),
        ]);

        setStores(storesList);
        if (storesList.length > 0) {
          setSelectedStore(storesList[0].id);
        }
        setProducts(productsList);
        setCustomers(customersList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Failed to load initial data');
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      fetchSales();
    }
  }, [selectedStore]);

  const fetchSales = async () => {
    try {
      const salesList = await window.api.sales.getByStore(selectedStore);
      setSales(salesList);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setError('Failed to load sales data');
    }
  };

  const handleStoreChange = (event) => {
    setSelectedStore(event.target.value);
    setCart([]);
  };

  const handleAddToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }

      return [...prevCart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.unit_price,
        totalPrice: product.unit_price,
      }];
    });
  };

  const handleUpdateQuantity = (productId, change) => {
    setCart(prevCart => {
      const newCart = prevCart.map(item => {
        if (item.productId === productId) {
          const newQuantity = Math.max(0, item.quantity + change);
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * item.unitPrice,
          };
        }
        return item;
      });

      return newCart.filter(item => item.quantity > 0);
    });
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    try {
      const saleData = {
        storeId: selectedStore,
        customerId: selectedCustomer?.id || null,
        items: cart,
        totalAmount: calculateTotal(),
        paymentMethod,
      };

      await window.api.sales.create(saleData);
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod('cash');
      fetchSales();
    } catch (error) {
      console.error('Error creating sale:', error);
      setError('Failed to process sale');
    }
  };

  const handleVoidSale = async (saleId) => {
    if (window.confirm('Are you sure you want to void this sale?')) {
      try {
        await window.api.sales.void(saleId);
        fetchSales();
      } catch (error) {
        console.error('Error voiding sale:', error);
        setError('Failed to void sale');
      }
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
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Point of Sale" />
          <Tab label="Sales History" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Select Store</InputLabel>
          <Select
            value={selectedStore}
            label="Select Store"
            onChange={handleStoreChange}
          >
            {stores.map((store) => (
              <MenuItem key={store.id} value={store.id}>
                {store.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {activeTab === 0 ? (
        // Point of Sale View
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Products
              </Typography>
              <Grid container spacing={2}>
                {products.map((product) => (
                  <Grid item xs={12} sm={6} md={4} key={product.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {product.name}
                        </Typography>
                        <Typography color="text.secondary">
                          ${product.unit_price.toFixed(2)}
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddToCart(product)}
                          sx={{ mt: 1 }}
                        >
                          Add to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Shopping Cart
              </Typography>

              <Autocomplete
                options={customers}
                getOptionLabel={(customer) => customer.name}
                value={selectedCustomer}
                onChange={(_, newValue) => setSelectedCustomer(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer (Optional)"
                    margin="normal"
                    fullWidth
                  />
                )}
              />

              <Box sx={{ my: 2 }}>
                {cart.map((item) => (
                  <Box key={item.productId} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1">
                        {item.productName}
                      </Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateQuantity(item.productId, -1)}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography component="span" sx={{ mx: 1 }}>
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateQuantity(item.productId, 1)}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveFromCart(item.productId)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      ${item.totalPrice.toFixed(2)}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                  </Box>
                ))}
              </Box>

              <FormControl fullWidth margin="normal">
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  label="Payment Method"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <MenuItem key={method.value} value={method.value}>
                      {method.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Total: ${calculateTotal().toFixed(2)}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CartIcon />}
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                >
                  Checkout
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        // Sales History View
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="right">Total Amount</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    {new Date(sale.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{sale.customer_name || 'Walk-in Customer'}</TableCell>
                  <TableCell>{sale.items?.length || 0}</TableCell>
                  <TableCell align="right">
                    ${sale.total_amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {PAYMENT_METHODS.find(m => m.value === sale.payment_method)?.label}
                  </TableCell>
                  <TableCell>{sale.status || 'completed'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleVoidSale(sale.id)}
                      disabled={sale.status === 'voided'}
                    >
                      <ReceiptIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Sales; 
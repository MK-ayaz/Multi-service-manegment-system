import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const Inventory = () => {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    minQuantity: '',
    maxQuantity: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const storesList = await window.api.stores.getAll();
        setStores(storesList);
        
        if (storesList.length > 0) {
          setSelectedStore(storesList[0].id);
        }
        
        const productsList = await window.api.products.getAll();
        setProducts(productsList);
        
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
      fetchInventory();
    }
  }, [selectedStore]);

  const fetchInventory = async () => {
    try {
      const inventoryList = await window.api.inventory.get(selectedStore);
      setInventory(inventoryList);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Failed to load inventory data');
    }
  };

  const handleStoreChange = (event) => {
    setSelectedStore(event.target.value);
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        productId: item.product_id,
        quantity: item.quantity,
        minQuantity: item.min_quantity,
        maxQuantity: item.max_quantity,
      });
    } else {
      setEditingItem(null);
      setFormData({
        productId: '',
        quantity: '',
        minQuantity: '',
        maxQuantity: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setFormData({
      productId: '',
      quantity: '',
      minQuantity: '',
      maxQuantity: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const data = {
        storeId: selectedStore,
        productId: formData.productId,
        quantity: parseInt(formData.quantity),
        minQuantity: parseInt(formData.minQuantity),
        maxQuantity: parseInt(formData.maxQuantity),
      };

      if (editingItem) {
        await window.api.inventory.update(data);
      } else {
        await window.api.inventory.add(data);
      }

      handleCloseDialog();
      fetchInventory();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      setError('Failed to save inventory item');
    }
  };

  const handleDeleteItem = async (storeId, productId) => {
    if (window.confirm('Are you sure you want to remove this item from inventory?')) {
      try {
        await window.api.inventory.remove(storeId, productId);
        fetchInventory();
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        setError('Failed to delete inventory item');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Inventory Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={!selectedStore}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Min Quantity</TableCell>
              <TableCell align="right">Max Quantity</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map((item) => {
              const isLowStock = item.quantity <= item.min_quantity;
              const isOverStock = item.quantity >= item.max_quantity;
              
              return (
                <TableRow key={item.product_id}>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{item.min_quantity}</TableCell>
                  <TableCell align="right">{item.max_quantity}</TableCell>
                  <TableCell align="right">${item.unit_price.toFixed(2)}</TableCell>
                  <TableCell align="center">
                    {isLowStock && (
                      <WarningIcon color="error" titleAccess="Low Stock" />
                    )}
                    {isOverStock && (
                      <WarningIcon color="warning" titleAccess="Over Stock" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(item)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDeleteItem(selectedStore, item.product_id)} 
                      size="small" 
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Product</InputLabel>
              <Select
                name="productId"
                value={formData.productId}
                onChange={handleInputChange}
                label="Product"
              >
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Minimum Quantity"
              name="minQuantity"
              type="number"
              value={formData.minQuantity}
              onChange={handleInputChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Maximum Quantity"
              name="maxQuantity"
              type="number"
              value={formData.maxQuantity}
              onChange={handleInputChange}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory; 
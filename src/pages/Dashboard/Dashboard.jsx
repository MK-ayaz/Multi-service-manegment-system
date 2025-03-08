import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  ShoppingCart as SalesIcon,
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ 
          backgroundColor: `${color}15`, 
          borderRadius: '50%',
          p: 1,
          mr: 2 
        }}>
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ mb: 1 }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStores: 0,
    totalProducts: 0,
    totalSales: 0,
    revenue: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stores count
        const stores = await window.api.stores.getAll();
        
        // Fetch total products (sum of all store inventories)
        const inventoryQuery = 'SELECT SUM(quantity) as total FROM inventory';
        const [inventoryResult] = await window.api.db.query(inventoryQuery);
        
        // Fetch total sales for today
        const today = new Date().toISOString().split('T')[0];
        const salesQuery = `
          SELECT COUNT(*) as count, SUM(total_amount) as total 
          FROM sales 
          WHERE date(created_at) = date('${today}')
        `;
        const [salesResult] = await window.api.db.query(salesQuery);

        setStats({
          totalStores: stores.length,
          totalProducts: inventoryResult?.total || 0,
          totalSales: salesResult?.count || 0,
          revenue: salesResult?.total || 0,
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Stores"
            value={stats.totalStores}
            icon={<StoreIcon sx={{ color: '#1976d2' }} />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<InventoryIcon sx={{ color: '#2e7d32' }} />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Sales"
            value={stats.totalSales}
            icon={<SalesIcon sx={{ color: '#ed6c02' }} />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Revenue"
            value={`$${stats.revenue.toFixed(2)}`}
            icon={<TrendingUpIcon sx={{ color: '#9c27b0' }} />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Add more dashboard content here */}
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Recent Activity
          </Typography>
          {/* Add recent activity list or table here */}
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard; 
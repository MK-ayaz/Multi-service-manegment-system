import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Store as StoreIcon,
  Inventory as InventoryIcon,
  ShoppingCart as SalesIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { analyticsService } from '../../services/api';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box sx={{ bgcolor: `${color}20`, color, borderRadius: 2, p: 1.2 }}>{icon}</Box>
        <Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h5">{value}</Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.dashboard().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Stores" value={stats.totalStores} icon={<StoreIcon />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Products" value={stats.totalProducts} icon={<InventoryIcon />} color="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Today's Sales" value={stats.todaySales} icon={<SalesIcon />} color="#ed6c02" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Low Stock" value={stats.lowStock} icon={<WarningIcon />} color="#d32f2f" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Revenue (last 14 days)</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats.revenueSeries}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#1976d2" fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Sales by Store</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.byStore}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="store" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#1976d2" />
                  <Bar dataKey="revenue" fill="#dc004e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

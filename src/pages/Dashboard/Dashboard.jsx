import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, CircularProgress, Stack, Divider,
} from '@mui/material';
import {
  Inventory as InventoryIcon, ShoppingCart as SalesIcon, Warning as WarningIcon,
  AttachMoney as MoneyIcon, People as PeopleIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { analyticsService } from '../../services/api';

const COLORS = ['#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#7b1fa2'];

const StatCard = ({ title, value, icon, color, sub }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box sx={{ bgcolor: `${color}1A`, color, borderRadius: 2, p: 1.2 }}>{icon}</Box>
        <Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h5">{value}</Typography>
          {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const fmt = (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.dashboard().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  const stockPie = [
    { name: 'Healthy', value: stats.totalProducts - stats.lowStock - stats.outOfStock },
    { name: 'Low', value: stats.lowStock },
    { name: 'Out', value: stats.outOfStock },
  ].filter((d) => d.value > 0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Inventory Value" value={fmt(stats.totalInventoryValue)} icon={<InventoryIcon />} color="#1976d2" sub={`${stats.totalProducts} products`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Today's Revenue" value={fmt(stats.todayRevenue)} icon={<MoneyIcon />} color="#2e7d32" sub={`${stats.todaySales} sales`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Low / Out of Stock" value={stats.lowStock + stats.outOfStock} icon={<WarningIcon />} color="#d32f2f" sub={`${stats.outOfStock} out`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Customers" value={stats.totalCustomers} icon={<PeopleIcon />} color="#ed6c02" />
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
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="#1976d2" fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Stock Health</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={stockPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
                    {stockPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Top Inventory by Value</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={140} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Bar dataKey="revenue" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

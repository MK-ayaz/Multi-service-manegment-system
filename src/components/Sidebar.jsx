import { useState } from 'react';
import { List, ListItem, ListItemIcon, ListItemText, Collapse } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/',
  },
  {
    text: 'Stores',
    icon: <StoreIcon />,
    path: '/stores',
  },
  {
    text: 'Inventory',
    icon: <InventoryIcon />,
    path: '/inventory',
  },
  {
    text: 'Sales',
    icon: <PointOfSaleIcon />,
    path: '/sales',
  },
  {
    text: 'Customers',
    icon: <PeopleIcon />,
    path: '/customers',
  },
  {
    text: 'Reports',
    icon: <AnalyticsIcon />,
    path: '/reports',
  },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <div className="sidebar">
      <List>
        {menuItems.map((item) => (
          <ListItem button key={item.text} component={Link} to={item.path}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );
} 
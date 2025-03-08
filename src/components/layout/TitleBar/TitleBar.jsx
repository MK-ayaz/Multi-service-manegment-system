import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import MinimizeIcon from '@mui/icons-material/Minimize';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import CloseIcon from '@mui/icons-material/Close';
import WebAssetIcon from '@mui/icons-material/WebAsset';
import StorefrontIcon from '@mui/icons-material/Storefront';

const TitleBarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '32px',
  backgroundColor: theme.palette.primary.main,
  WebkitAppRegion: 'drag',
  color: theme.palette.primary.contrastText,
  padding: '0 16px',
}));

const WindowControls = styled(Box)({
  display: 'flex',
  WebkitAppRegion: 'no-drag',
  '& .MuiIconButton-root': {
    padding: '4px',
    borderRadius: 0,
    color: 'inherit',
  },
});

const MenuArea = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  WebkitAppRegion: 'no-drag',
});

const TitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Listen for window state changes
    window.api.window.onMaximized(() => setIsMaximized(true));
    window.api.window.onUnmaximized(() => setIsMaximized(false));
  }, []);

  const handleMinimize = () => {
    window.api.window.minimize();
  };

  const handleMaximize = () => {
    window.api.window.maximize();
  };

  const handleClose = () => {
    window.api.window.close();
  };

  return (
    <TitleBarContainer>
      <MenuArea>
        <StorefrontIcon sx={{ fontSize: 20 }} />
        <Typography variant="subtitle2">Multi Store Management</Typography>
      </MenuArea>
      
      <WindowControls>
        <Tooltip title="Minimize">
          <IconButton onClick={handleMinimize} size="small">
            <MinimizeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title={isMaximized ? 'Restore' : 'Maximize'}>
          <IconButton onClick={handleMaximize} size="small">
            {isMaximized ? <WebAssetIcon fontSize="small" /> : <CropSquareIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Close">
          <IconButton 
            onClick={handleClose}
            size="small"
            sx={{ '&:hover': { backgroundColor: 'error.main' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </WindowControls>
    </TitleBarContainer>
  );
};

export default TitleBar; 
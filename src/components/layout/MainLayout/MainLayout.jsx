import React from 'react';
import { Box, styled } from '@mui/material';
import TitleBar from '../TitleBar/TitleBar';
import Sidebar from '../Sidebar/Sidebar';

const LayoutRoot = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflow: 'hidden',
});

const LayoutContent = styled(Box)({
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
  marginTop: '32px', // Height of TitleBar
});

const MainContent = styled(Box)({
  flex: 1,
  overflow: 'auto',
  padding: '24px',
});

const MainLayout = ({ children }) => {
  return (
    <LayoutRoot>
      <TitleBar />
      <LayoutContent>
        <Sidebar />
        <MainContent>
          {children}
        </MainContent>
      </LayoutContent>
    </LayoutRoot>
  );
};

export default MainLayout; 
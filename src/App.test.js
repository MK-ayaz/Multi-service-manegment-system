import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.api = {
    settings: { get: jest.fn().mockResolvedValue({}) },
    theme: { set: jest.fn().mockResolvedValue(true) },
    stores: { getAll: jest.fn().mockResolvedValue([]) },
    dashboard: { stats: jest.fn().mockResolvedValue({ totalProducts: 0, totalSales: 0, revenue: 0 }) },
    window: {
      minimize: jest.fn(),
      maximize: jest.fn(),
      close: jest.fn(),
      onMaximized: jest.fn(),
      onUnmaximized: jest.fn(),
    },
  };
});

test('renders the application shell with title', () => {
  render(<App />);
  expect(screen.getByText('Multi Store Management')).toBeInTheDocument();
});

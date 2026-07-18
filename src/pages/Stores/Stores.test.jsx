import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Stores from './Stores';

const mockStores = [
  { id: 1, name: 'Downtown', type: 'pharmacy', location: 'NYC' },
  { id: 2, name: 'Uptown', type: 'retail', location: 'LA' },
];

const apiMock = {
  stores: {
    getAll: jest.fn().mockResolvedValue(mockStores),
    create: jest.fn().mockResolvedValue({ id: 3 }),
    update: jest.fn().mockResolvedValue({ id: 1 }),
    delete: jest.fn().mockResolvedValue({}),
  },
};

beforeEach(() => {
  window.api = apiMock;
  jest.clearAllMocks();
});

test('renders stores list from API', async () => {
  render(
    <MemoryRouter>
      <Stores />
    </MemoryRouter>
  );
  expect(await screen.findByText('Downtown')).toBeInTheDocument();
  expect(screen.getByText('Uptown')).toBeInTheDocument();
});

test('opens add dialog and creates a store', async () => {
  render(
    <MemoryRouter>
      <Stores />
    </MemoryRouter>
  );
  await screen.findByText('Downtown');

  fireEvent.click(screen.getByText('Add Store'));
  const nameInput = await screen.findByLabelText(/Store Name/i);
  fireEvent.change(nameInput, { target: { name: 'name', value: 'New Store' } });

  const typeSelect = screen.getByLabelText(/Store Type/i);
  fireEvent.mouseDown(typeSelect);
  fireEvent.click(await screen.findByText('Pharmacy'));

  fireEvent.click(screen.getByText(/Create/));
  await waitFor(() => expect(apiMock.stores.create).toHaveBeenCalled());
});

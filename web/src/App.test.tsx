import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Perses title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Perses/i);
  expect(titleElement).toBeInTheDocument();
});

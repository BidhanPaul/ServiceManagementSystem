import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./api/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

test('renders the login page for unauthenticated users', () => {
  window.history.pushState({}, '', '/login');
  render(<App />);
  expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
});

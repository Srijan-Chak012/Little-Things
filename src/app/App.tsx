import { RouterProvider, createBrowserRouter, Navigate } from 'react-router';
import HomePage from './pages/HomePage';
import DrawingPage from './pages/DrawingPage';
import { AuthProvider } from './context/AuthContext';

const router = createBrowserRouter([
  {
    path: "/",
    element: <DrawingPage />,
  },
  {
    path: "/home",
    element: <HomePage />,
  },
  {
    path: "/draw",
    element: <Navigate to="/" replace />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { RequireAdmin, RequireAuth, RequireGuest } from './components/RouteGuards';
import { LoginPage } from './pages/LoginPage';
import { NewProductPage, ProductDetailsPage } from './pages/ProductPage';
import { ProductsPage } from './pages/ProductsPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminUserPage, ProfilePage } from './pages/UserPage';
import { UsersPage } from './pages/UsersPage';
import { SessionProvider } from './session/SessionProvider';

export function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route element={<RequireGuest />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/cadastro" element={<RegisterPage />} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/produtos" element={<ProductsPage />} />
              <Route path="/produtos/:id" element={<ProductDetailsPage />} />
              <Route element={<RequireAdmin />}>
                <Route path="/produtos/novo" element={<NewProductPage />} />
                <Route path="/usuarios" element={<UsersPage />} />
                <Route path="/usuarios/:id" element={<AdminUserPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/perfil" replace />} />
          </Route>
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}

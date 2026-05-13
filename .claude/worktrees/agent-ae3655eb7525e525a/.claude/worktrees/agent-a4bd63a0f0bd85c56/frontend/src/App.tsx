import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ExpensesPage from './pages/ExpensesPage';
import ExpenseDetailPage from './pages/ExpenseDetailPage';
import ExpenseFormPage from './pages/ExpenseFormPage';
import CategoriesPage from './pages/CategoriesPage';
import AnalyticsPage from './pages/AnalyticsPage';

function RequireAuth({ children }: { children: React.ReactElement }) {
  return localStorage.getItem('auth_token') ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/expenses"          element={<RequireAuth><ExpensesPage /></RequireAuth>} />
        <Route path="/expenses/new"      element={<RequireAuth><ExpenseFormPage mode="create" /></RequireAuth>} />
        <Route path="/expenses/:id"      element={<RequireAuth><ExpenseDetailPage /></RequireAuth>} />
        <Route path="/expenses/:id/edit" element={<RequireAuth><ExpenseFormPage mode="edit" /></RequireAuth>} />
        <Route path="/categories" element={<RequireAuth><CategoriesPage /></RequireAuth>} />
        <Route path="/analytics"  element={<RequireAuth><AnalyticsPage /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

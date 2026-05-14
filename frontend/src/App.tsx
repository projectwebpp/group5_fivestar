import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ExpensesPage from "./pages/ExpensesPage";
import ExpenseDetailPage from "./pages/ExpenseDetailPage";
import ExpenseFormPage from "./pages/ExpenseFormPage";
import CategoriesPage from "./pages/CategoriesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import BudgetPage from "./pages/BudgetPage";
import RecurringPage from "./pages/RecurringPage";
import Layout from "./components/Layout";

function RequireAuth({ children }: { children: React.ReactElement }) {
  return localStorage.getItem("auth_token") ? (
    <Layout>{children}</Layout>
  ) : (
    <Navigate to="/auth" replace />
  );
}

function RedirectIfAuth({ children }: { children: React.ReactElement }) {
  return localStorage.getItem("auth_token") ? (
    <Navigate to="/expenses" replace />
  ) : (
    children
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route
          path="/auth"
          element={
            <RedirectIfAuth>
              <AuthPage />
            </RedirectIfAuth>
          }
        />
        <Route
          path="/expenses"
          element={<RequireAuth><ExpensesPage /></RequireAuth>}
        />
        <Route
          path="/expenses/new"
          element={<RequireAuth><ExpenseFormPage mode="create" /></RequireAuth>}
        />
        <Route
          path="/expenses/:id"
          element={<RequireAuth><ExpenseDetailPage /></RequireAuth>}
        />
        <Route
          path="/expenses/:id/edit"
          element={<RequireAuth><ExpenseFormPage mode="edit" /></RequireAuth>}
        />
        <Route
          path="/categories"
          element={<RequireAuth><CategoriesPage /></RequireAuth>}
        />
        <Route
          path="/analytics"
          element={<RequireAuth><AnalyticsPage /></RequireAuth>}
        />
        <Route
          path="/budget"
          element={<RequireAuth><BudgetPage /></RequireAuth>}
        />
        <Route
          path="/recurring"
          element={<RequireAuth><RecurringPage /></RequireAuth>}
        />
      </Routes>
    </BrowserRouter>
  );
}

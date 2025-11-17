import * as React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import DashboardPage from "@/pages/Dashboard";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Items pages
import { ItemsPage } from "@/pages/Items";
import { ItemCreatePage } from "@/pages/ItemCreate";
import { ItemViewPage } from "@/pages/ItemView";
import { ItemEditPage } from "@/pages/ItemEdit";

// Requests pages
import { RequestsPage } from "@/pages/Requests";
import { RequestCreatePage } from "@/pages/RequestCreate";
import { RequestViewPage } from "@/pages/RequestView";

// Issuances pages
import { IssuancesPage } from "@/pages/Issuances";
import { IssuanceCreatePage } from "@/pages/IssuanceCreate";
import { IssuanceViewPage } from "@/pages/IssuanceView";

// Employees
import { EmployeesPage } from "@/pages/Employees";
import { EmployeeCreatePage } from "@/pages/EmployeeCreate";
import { EmployeeViewPage } from "@/pages/EmployeeView";
import { EmployeeEditPage } from "@/pages/EmployeeEdit";

// Directorates
import { DirectoratesPage } from "@/pages/Directorates";
import { DirectorateCreatePage } from "@/pages/DirectorateCreate";
import { DirectorateViewPage } from "@/pages/DirectorateView";
import { DirectorateEditPage } from "@/pages/DirectorateEdit";

// Customers
import { CustomersPage } from "@/pages/Customers";
import { CustomerCreatePage } from "@/pages/CustomerCreate";
import { CustomerViewPage } from "@/pages/CustomerView";
import { CustomerEditPage } from "@/pages/CustomerEdit";

// Warehouses
import { WarehousesPage } from "@/pages/Warehouses";
import { WarehouseCreatePage } from "@/pages/WarehouseCreate";

// Categories
import { CategoriesPage } from "@/pages/Categories";
import { CategoryCreatePage } from "@/pages/CategoryCreate";

// (Optional) Login page
// import { LoginPage } from "@/pages/Login";

const queryClient = new QueryClient();

const AuthContext = React.createContext<{ user: User | null }>({ user: null });

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            {/* <Route path="/login" element={<LoginPage />} /> */}

            {/* Protected app */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard */}
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />

              {/* Items */}
              <Route path="items" element={<ItemsPage />} />
              <Route path="items/create" element={<ItemCreatePage />} />
              <Route path="items/view/:id" element={<ItemViewPage />} />
              <Route path="items/edit/:id" element={<ItemEditPage />} />

              {/* Requests */}
              <Route path="requests" element={<RequestsPage />} />
              <Route path="requests/create" element={<RequestCreatePage />} />
              <Route path="requests/view/:id" element={<RequestViewPage />} />

              {/* Issuances */}
              <Route path="issuances" element={<IssuancesPage />} />
              <Route
                path="issuances/create"
                element={<IssuanceCreatePage />}
              />
              <Route
                path="issuances/view/:id"
                element={<IssuanceViewPage />}
              />

              {/* Employees */}
              <Route path="employees" element={<EmployeesPage />} />
              <Route
                path="employees/create"
                element={<EmployeeCreatePage />}
              />
              <Route
                path="employees/view/:id"
                element={<EmployeeViewPage />}
              />
              <Route
                path="employees/edit/:id"
                element={<EmployeeEditPage />}
              />

              {/* Directorates */}
              <Route
                path="directorates"
                element={<DirectoratesPage />}
              />
              <Route
                path="directorates/create"
                element={<DirectorateCreatePage />}
              />
              <Route
                path="directorates/view/:id"
                element={<DirectorateViewPage />}
              />
              <Route
                path="directorates/edit/:id"
                element={<DirectorateEditPage />}
              />

              {/* Customers */}
              <Route path="customers" element={<CustomersPage />} />
              <Route
                path="customers/create"
                element={<CustomerCreatePage />}
              />
              <Route
                path="customers/view/:id"
                element={<CustomerViewPage />}
              />
              <Route
                path="customers/edit/:id"
                element={<CustomerEditPage />}
              />

              {/* Warehouses */}
              <Route path="warehouses" element={<WarehousesPage />} />
              <Route
                path="warehouses/create"
                element={<WarehouseCreatePage />}
              />
              {/* Optionally add view/edit similar to customers */}

              {/* Categories */}
              <Route path="categories" element={<CategoriesPage />} />
              <Route
                path="categories/create"
                element={<CategoryCreatePage />}
              />
              {/* Optionally add view/edit */}

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

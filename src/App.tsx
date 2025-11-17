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

// (Optional) Login page if you have it
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
            {/* Public routes like login */}
            {/* <Route path="/login" element={<LoginPage />} /> */}

            {/* Protected application routes */}
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

              {/* Fallback to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

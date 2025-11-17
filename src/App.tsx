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

// NEW: import Items pages
import { ItemsPage as Items } from "@/pages/Items";
import { ItemCreatePage as ItemCreate } from "@/pages/ItemCreate";
import { ItemViewPage as ItemView } from "@/pages/ItemView";
import { ItemEditPage as ItemEdit } from "@/pages/ItemEdit";

import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

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
            {/* Public routes like login can go here */}
            {/* <Route path="/login" element={<LoginPage />} /> */}

            {/* Protected app routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />

              {/* NEW: Items routes */}
              <Route path="items" element={<Items />} />
              <Route path="items/create" element={<ItemCreate />} />
              <Route path="items/view/:id" element={<ItemView />} />
              <Route path="items/edit/:id" element={<ItemEdit />} />

              {/* other routes (requests, issuances, etc.) remain here */}
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

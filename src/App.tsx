// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout'; // Import your main layout component
import Dashboard from './pages/Dashboard'; // Import the Dashboard page you created
// Import other pages as you create them, e.g.:
// import Items from './pages/Items';
// import Requests from './pages/Requests';
// import Issuances from './pages/Issuances';
// ... import other pages ...

function App() {
  return (
    // Wrap the entire application with the Router
    <Router>
      {/* The Layout component provides the sidebar, header, etc., and renders children inside */}
      <Layout>
        {/* Define the routes */}
        <Routes>
          {/* The Dashboard will be the default page when the path is exactly "/" */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Add other routes here as you create the pages */}
          {/* <Route path="/items" element={<Items />} /> */}
          {/* <Route path="/requests" element={<Requests />} /> */}
          {/* <Route path="/issuances" element={<Issuances />} /> */}
          {/* Example nested routes could go here if needed */}
          {/* <Route path="/items/:id" element={<ItemView />} /> */}
          {/* <Route path="/items/create" element={<ItemCreate />} /> */}
          {/* ... add more routes ... */}
          
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

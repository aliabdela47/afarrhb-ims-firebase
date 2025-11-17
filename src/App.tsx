// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout'; // Import the Layout component
import Dashboard from './pages/Dashboard'; // Import the Dashboard page

function App() {
  return (
    <Router>
      {/* Wrap the Routes with the Layout component */}
      <Layout>
        <Routes>
          {/* The Dashboard will be the default page when the path is exactly "/" */}
          <Route path="/" element={<Dashboard />} />
          {/* Add other routes here as you create the pages */}
          {/* <Route path="/items" element={<Items />} /> */}
          {/* <Route path="/requests" element={<Requests />} /> */}
          {/* <Route path="/issuances" element={<Issuances />} /> */}
          {/* ... add more routes ... */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

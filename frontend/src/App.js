import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";
import ServiceOfferList from "./pages/ServiceOfferList";
import ServiceOfferForm from "./pages/ServiceOfferForm";
import Notifications from "./pages/Notifications";
import ServiceRequests from "./pages/ServiceRequests";
import RequestDetails from "./pages/RequestDetails";
import Settings from "./pages/Settings";
import OrdersList from "./pages/OrdersList";
import OrderDetails from "./pages/OrderDetails";




function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute><AdminUsers /></PrivateRoute>} />
        <Route path="/requests" element={<PrivateRoute><ServiceRequests /></PrivateRoute>} />
        <Route path="/requests/:id" element={<PrivateRoute><RequestDetails /></PrivateRoute>} />
        <Route path="/service-offers" element={<PrivateRoute><ServiceOfferList /></PrivateRoute>} />
        <Route path="/create-service-offer" element={<PrivateRoute role="ADMIN"><ServiceOfferForm /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><OrdersList /></PrivateRoute>} />
        <Route path="/orders/:id" element={<PrivateRoute><OrderDetails /></PrivateRoute>} />
        <Route path="/unauthorized" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

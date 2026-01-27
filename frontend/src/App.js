import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Patient Pages
import PatientDashboard from './pages/Patient/Dashboard';
import PatientRecords from './pages/Patient/Records';
import PatientConsents from './pages/Patient/Consents';
import UploadEHR from './pages/Patient/UploadEHR';

// Doctor Pages
import DoctorDashboard from './pages/Doctor/Dashboard';
import DoctorPatients from './pages/Doctor/Patients';
import DoctorRecords from './pages/Doctor/Records';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import AdminAudit from './pages/Admin/Audit';
import AdminStats from './pages/Admin/Stats';
import FederatedLearning from './pages/Admin/FederatedLearning';

// Components
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

function App() {
    const { user } = useAuth();

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
                user ? <Navigate to={`/${user.role}`} replace /> : <Login />
            } />
            <Route path="/register" element={<Register />} />

            {/* Patient Routes */}
            <Route path="/patient" element={
                <PrivateRoute role="patient">
                    <Layout />
                </PrivateRoute>
            }>
                <Route index element={<PatientDashboard />} />
                <Route path="records" element={<PatientRecords />} />
                <Route path="consents" element={<PatientConsents />} />
                <Route path="upload" element={<UploadEHR />} />
            </Route>

            {/* Doctor Routes */}
            <Route path="/doctor" element={
                <PrivateRoute role="doctor">
                    <Layout />
                </PrivateRoute>
            }>
                <Route index element={<DoctorDashboard />} />
                <Route path="patients" element={<DoctorPatients />} />
                <Route path="patient/:patientId" element={<DoctorRecords />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
                <PrivateRoute role="admin">
                    <Layout />
                </PrivateRoute>
            }>
                <Route index element={<AdminDashboard />} />
                <Route path="audit" element={<AdminAudit />} />
                <Route path="audit" element={<AdminAudit />} />
                <Route path="stats" element={<AdminStats />} />
                <Route path="fl" element={<FederatedLearning />} />
            </Route>

            {/* Default Route */}
            <Route path="/" element={
                user ? <Navigate to={`/${user.role}`} replace /> : <Navigate to="/login" replace />
            } />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;

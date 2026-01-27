import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from './Dashboard';

// Stats page is same as Dashboard for now
// In production, this would have more detailed analytics
const AdminStats = () => {
    return <AdminDashboard />;
};

export default AdminStats;

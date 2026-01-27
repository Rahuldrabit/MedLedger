import React, { useState, useEffect } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    CircularProgress
} from '@mui/material';
import { Assessment, TrendingUp, Security } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

const AdminDashboard = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await adminAPI.getStats();
            setStats(response.data.data);
        } catch (error) {
            enqueueSnackbar('Failed to load statistics', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    // Prepare chart data
    const actionData = stats?.actionBreakdown ? Object.entries(stats.actionBreakdown).map(([action, count]) => ({
        action: action.replace(/_/g, ' '),
        count
    })) : [];

    const roleData = stats?.roleBreakdown ? Object.entries(stats.roleBreakdown).map(([role, count]) => ({
        role: role.charAt(0).toUpperCase() + role.slice(1),
        count
    })) : [];

    return (
        <Box>
            <Box mb={4}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Admin Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    System overview and statistics
                </Typography>
            </Box>

            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography color="text.secondary" variant="body2">
                                        Total Actions
                                    </Typography>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats?.totalActions || 0}
                                    </Typography>
                                </Box>
                                <Assessment sx={{ fontSize: 48, color: 'primary.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography color="text.secondary" variant="body2">
                                        Success Rate
                                    </Typography>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats?.successRate || 0}%
                                    </Typography>
                                </Box>
                                <TrendingUp sx={{ fontSize: 48, color: 'success.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography color="text.secondary" variant="body2">
                                        Action Types
                                    </Typography>
                                    <Typography variant="h3" fontWeight="bold">
                                        {Object.keys(stats?.actionBreakdown || {}).length}
                                    </Typography>
                                </Box>
                                <Security sx={{ fontSize: 48, color: 'secondary.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Actions by Type
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={actionData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="action" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#1976d2" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Actions by Role
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={roleData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="role" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#9c27b0" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Chip
} from '@mui/material';
import { People, CheckCircle, Assessment } from '@mui/icons-material';
import { doctorAPI } from '../../services/api';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';

const DoctorDashboard = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [stats, setStats] = useState({
        totalPatients: 0,
        activeConsents: 0,
        recentAccess: 0
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [patientsRes, consentsRes, activitiesRes] = await Promise.all([
                doctorAPI.getPatients(),
                doctorAPI.getConsents(),
                doctorAPI.getActivities()
            ]);

            const patients = patientsRes.data.data || [];
            const consents = consentsRes.data.data || [];
            const activities = activitiesRes.data.data || [];

            setStats({
                totalPatients: patients.length,
                activeConsents: consents.length,
                recentAccess: activities.slice(0, 5).length
            });

            setRecentActivities(activities.slice(0, 5));
        } catch (error) {
            enqueueSnackbar('Failed to load dashboard data', { variant: 'error' });
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

    return (
        <Box>
            <Box mb={4}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Doctor Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage patient access and records
                </Typography>
            </Box>

            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography color="text.secondary" variant="body2">
                                        Accessible Patients
                                    </Typography>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats.totalPatients}
                                    </Typography>
                                </Box>
                                <People sx={{ fontSize: 48, color: 'primary.main' }} />
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
                                        Active Consents
                                    </Typography>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats.activeConsents}
                                    </Typography>
                                </Box>
                                <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
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
                                        Recent Activities
                                    </Typography>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats.recentAccess}
                                    </Typography>
                                </Box>
                                <Assessment sx={{ fontSize: 48, color: 'secondary.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Recent Activities
                    </Typography>
                    {recentActivities.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            No recent activities
                        </Typography>
                    ) : (
                        <List>
                            {recentActivities.map((activity, index) => (
                                <ListItem key={index} divider={index < recentActivities.length - 1}>
                                    <ListItemText
                                        primary={activity.action}
                                        secondary={`${activity.recordId || 'N/A'} - ${format(new Date(activity.timestamp), 'PPpp')}`}
                                    />
                                    <Chip
                                        label={activity.success ? 'Success' : 'Failed'}
                                        color={activity.success ? 'success' : 'error'}
                                        size="small"
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default DoctorDashboard;

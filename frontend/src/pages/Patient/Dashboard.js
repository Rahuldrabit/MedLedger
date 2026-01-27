import React, { useState, useEffect } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    CircularProgress
} from '@mui/material';
import {
    Folder,
    Security,
    CloudUpload,
    Timeline
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { patientAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

const PatientDashboard = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [stats, setStats] = useState({
        totalRecords: 0,
        activeConsents: 0,
        recentUploads: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [recordsRes, consentsRes] = await Promise.all([
                patientAPI.getRecords(),
                patientAPI.getConsents()
            ]);

            const records = recordsRes.data.data || [];
            const consents = consentsRes.data.data || [];

            // Calculate stats
            const activeConsents = consents.filter(c =>
                c.granted && new Date(c.expiryDate) > new Date()
            ).length;

            // Records from last 7 days
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const recentUploads = records.filter(r =>
                new Date(r.timestamp) > weekAgo
            ).length;

            setStats({
                totalRecords: records.length,
                activeConsents,
                recentUploads
            });
        } catch (error) {
            enqueueSnackbar('Failed to load dashboard data', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, color, action }) => (
        <Card>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">
                            {title}
                        </Typography>
                        <Typography variant="h3" component="div" fontWeight="bold">
                            {value}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            bgcolor: `${color}.light`,
                            borderRadius: 2,
                            p: 1.5
                        }}
                    >
                        {React.cloneElement(icon, { sx: { color: `${color}.main`, fontSize: 32 } })}
                    </Box>
                </Box>
                {action && (
                    <Button
                        size="small"
                        onClick={action.onClick}
                        sx={{ mt: 2 }}
                    >
                        {action.label}
                    </Button>
                )}
            </CardContent>
        </Card>
    );

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
                    Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Welcome to your EHR portal
                </Typography>
            </Box>

            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Records"
                        value={stats.totalRecords}
                        icon={<Folder />}
                        color="primary"
                        action={{
                            label: 'View Records',
                            onClick: () => navigate('/patient/records')
                        }}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Active Consents"
                        value={stats.activeConsents}
                        icon={<Security />}
                        color="secondary"
                        action={{
                            label: 'Manage Consents',
                            onClick: () => navigate('/patient/consents')
                        }}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Recent Uploads"
                        value={stats.recentUploads}
                        icon={<Timeline />}
                        color="success"
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                        <CardContent>
                            <Box textAlign="center" py={2}>
                                <CloudUpload sx={{ fontSize: 48, mb: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Upload New Record
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => navigate('/patient/upload')}
                                    sx={{ mt: 1 }}
                                >
                                    Upload EHR
                                </Button>
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
                                Quick Actions
                            </Typography>
                            <Box display="flex" flexDirection="column" gap={1} mt={2}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => navigate('/patient/upload')}
                                    startIcon={<CloudUpload />}
                                >
                                    Upload Medical Record
                                </Button>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => navigate('/patient/consents')}
                                    startIcon={<Security />}
                                >
                                    Grant Doctor Access
                                </Button>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => navigate('/patient/records')}
                                    startIcon={<Folder />}
                                >
                                    View All Records
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                About Your EHR System
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Your Electronic Health Records are secured on the blockchain with end-to-end encryption.
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                • All files are encrypted before storage
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                • You control who can access your records
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                • Every access is logged and auditable
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PatientDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    CircularProgress,
    Button,
    Chip
} from '@mui/material';
import { Visibility, CheckCircle } from '@mui/icons-material';
import { format, isPast } from 'date-fns';
import { doctorAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

const DoctorPatients = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            const response = await doctorAPI.getPatients();
            setPatients(response.data.data || []);
        } catch (error) {
            enqueueSnackbar('Failed to load patients', { variant: 'error' });
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
                    My Patients
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {patients.length} patient{patients.length !== 1 ? 's' : ''} granted access
                </Typography>
            </Box>

            {patients.length === 0 ? (
                <Card>
                    <CardContent>
                        <Box textAlign="center" py={4}>
                            <Typography variant="h6" color="text.secondary">
                                No patients yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Patients will appear here once they grant you access
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {patients.map((patient) => {
                        const isExpired = patient.expiresAt && isPast(new Date(patient.expiresAt));

                        return (
                            <Grid item xs={12} md={6} key={patient.patientId}>
                                <Card>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                                            <Box>
                                                <Typography variant="h6" gutterBottom>
                                                    {patient.patientId}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Patient ID
                                                </Typography>
                                            </Box>
                                            <Chip
                                                icon={<CheckCircle />}
                                                label={isExpired ? 'Expired' : 'Active'}
                                                color={isExpired ? 'default' : 'success'}
                                                size="small"
                                            />
                                        </Box>

                                        <Box mb={2}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Access Granted
                                            </Typography>
                                            <Typography variant="body2">
                                                {format(new Date(patient.consentGranted), 'PPP')}
                                            </Typography>
                                        </Box>

                                        {patient.expiresAt && (
                                            <Box mb={2}>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Access Expires
                                                </Typography>
                                                <Typography variant="body2">
                                                    {format(new Date(patient.expiresAt), 'PPP')}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Button
                                            variant="contained"
                                            fullWidth
                                            startIcon={<Visibility />}
                                            onClick={() => navigate(`/doctor/patient/${patient.patientId}`)}
                                            disabled={isExpired}
                                        >
                                            View Records
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
};

export default DoctorPatients;

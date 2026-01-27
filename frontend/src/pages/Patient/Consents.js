import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    CircularProgress,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem
} from '@mui/material';
import { Add, Delete, CheckCircle, Cancel } from '@mui/icons-material';
import { format, isPast } from 'date-fns';
import { patientAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

const PatientConsents = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [consents, setConsents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        doctorId: '',
        recordId: '',
        expiryDays: 30
    });

    useEffect(() => {
        loadConsents();
    }, []);

    const loadConsents = async () => {
        try {
            const response = await patientAPI.getConsents();
            setConsents(response.data.data || []);
        } catch (error) {
            enqueueSnackbar('Failed to load consents', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleGrantConsent = async () => {
        try {
            await patientAPI.grantConsent(formData);
            enqueueSnackbar('Consent granted successfully!', { variant: 'success' });
            setDialogOpen(false);
            setFormData({ doctorId: '', recordId: '', expiryDays: 30 });
            loadConsents();
        } catch (error) {
            enqueueSnackbar(
                error.response?.data?.message || 'Failed to grant consent',
                { variant: 'error' }
            );
        }
    };

    const handleRevokeConsent = async (consentId) => {
        if (!window.confirm('Are you sure you want to revoke this consent?')) {
            return;
        }

        try {
            await patientAPI.revokeConsent(consentId);
            enqueueSnackbar('Consent revoked successfully', { variant: 'success' });
            loadConsents();
        } catch (error) {
            enqueueSnackbar('Failed to revoke consent', { variant: 'error' });
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
            <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="h4" gutterBottom fontWeight="bold">
                        Access Consents
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage who can access your medical records
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setDialogOpen(true)}
                >
                    Grant Access
                </Button>
            </Box>

            {consents.length === 0 ? (
                <Card>
                    <CardContent>
                        <Box textAlign="center" py={4}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No consents granted yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Grant access to doctors to share your medical records
                            </Typography>
                            <Button variant="contained" onClick={() => setDialogOpen(true)}>
                                Grant First Consent
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {consents.map((consent) => {
                        const isExpired = isPast(new Date(consent.expiryDate));
                        const isActive = consent.granted && !isExpired;

                        return (
                            <Grid item xs={12} md={6} key={consent.consentId}>
                                <Card>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                                            <Box>
                                                <Typography variant="h6" gutterBottom>
                                                    {consent.doctorId}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {consent.recordId === '*' ? 'All Records' : `Record: ${consent.recordId}`}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                icon={isActive ? <CheckCircle /> : <Cancel />}
                                                label={isActive ? 'Active' : isExpired ? 'Expired' : 'Revoked'}
                                                color={isActive ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </Box>

                                        <Box mb={2}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Granted On
                                            </Typography>
                                            <Typography variant="body2">
                                                {format(new Date(consent.timestamp), 'PPP')}
                                            </Typography>
                                        </Box>

                                        <Box mb={2}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Expires On
                                            </Typography>
                                            <Typography variant="body2">
                                                {format(new Date(consent.expiryDate), 'PPP')}
                                            </Typography>
                                        </Box>

                                        {isActive && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                startIcon={<Delete />}
                                                fullWidth
                                                onClick={() => handleRevokeConsent(consent.consentId)}
                                            >
                                                Revoke Access
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Grant Consent Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Grant Doctor Access</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Doctor ID"
                        value={formData.doctorId}
                        onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                        helperText="Enter the doctor's user ID"
                    />

                    <TextField
                        margin="normal"
                        fullWidth
                        label="Record ID (Optional)"
                        value={formData.recordId}
                        onChange={(e) => setFormData({ ...formData, recordId: e.target.value })}
                        helperText="Leave empty to grant access to all records"
                    />

                    <TextField
                        margin="normal"
                        fullWidth
                        select
                        label="Expiry Duration"
                        value={formData.expiryDays}
                        onChange={(e) => setFormData({ ...formData, expiryDays: parseInt(e.target.value) })}
                    >
                        <MenuItem value={7}>7 days</MenuItem>
                        <MenuItem value={30}>30 days</MenuItem>
                        <MenuItem value={90}>90 days</MenuItem>
                        <MenuItem value={180}>180 days</MenuItem>
                        <MenuItem value={365}>1 year</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleGrantConsent} variant="contained" disabled={!formData.doctorId}>
                        Grant Consent
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PatientConsents;

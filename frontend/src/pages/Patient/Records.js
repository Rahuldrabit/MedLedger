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
    IconButton
} from '@mui/material';
import { Visibility, Timeline } from '@mui/icons-material';
import { format } from 'date-fns';
import { patientAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

const PatientRecords = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        try {
            const response = await patientAPI.getRecords();
            setRecords(response.data.data || []);
        } catch (error) {
            enqueueSnackbar('Failed to load records', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleViewAuditLog = async (recordId) => {
        try {
            const response = await patientAPI.getAuditLogs(recordId);
            console.log('Audit logs:', response.data.data);
            enqueueSnackbar(`${response.data.count} access logs found`, { variant: 'info' });
        } catch (error) {
            enqueueSnackbar('Failed to load audit logs', { variant: 'error' });
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
                        My Records
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {records.length} encrypted medical record{records.length !== 1 ? 's' : ''}
                    </Typography>
                </Box>
            </Box>

            {records.length === 0 ? (
                <Card>
                    <CardContent>
                        <Box textAlign="center" py={4}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No records yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Upload your first medical record to get started
                            </Typography>
                            <Button variant="contained" href="/patient/upload">
                                Upload EHR
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {records.map((record) => (
                        <Grid item xs={12} md={6} key={record.recordId}>
                            <Card>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                                        <Box>
                                            <Typography variant="h6" gutterBottom>
                                                {record.recordType}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Record ID: {record.recordId}
                                            </Typography>
                                        </Box>
                                        <Chip label="Encrypted" color="success" size="small" />
                                    </Box>

                                    <Box mb={2}>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Upload Date
                                        </Typography>
                                        <Typography variant="body2">
                                            {format(new Date(record.timestamp), 'PPpp')}
                                        </Typography>
                                    </Box>

                                    <Box mb={2}>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            IPFS Hash
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                            {record.ipfsHash.substring(0, 20)}...
                                        </Typography>
                                    </Box>

                                    <Box mb={2}>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Checksum
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                            {record.checksum.substring(0, 16)}...
                                        </Typography>
                                    </Box>

                                    <Box display="flex" gap={1}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<Visibility />}
                                            fullWidth
                                        >
                                            View Details
                                        </Button>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleViewAuditLog(record.recordId)}
                                            color="primary"
                                        >
                                            <Timeline />
                                        </IconButton>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default PatientRecords;

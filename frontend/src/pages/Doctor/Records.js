import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { Download, Folder } from '@mui/icons-material';
import { format } from 'date-fns';
import { doctorAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

const DoctorRecords = () => {
    const { patientId } = useParams();
    const { enqueueSnackbar } = useSnackbar();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecords();
    }, [patientId]);

    const loadRecords = async () => {
        try {
            const response = await doctorAPI.getPatientRecords(patientId);
            setRecords(response.data.data || []);
        } catch (error) {
            enqueueSnackbar('Failed to load records', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (recordId) => {
        try {
            const response = await doctorAPI.downloadEHR(recordId);

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${recordId}.enc`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            enqueueSnackbar('File downloaded successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to download file', { variant: 'error' });
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
                    Patient Records
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Patient: {patientId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {records.length} accessible record{records.length !== 1 ? 's' : ''}
                </Typography>
            </Box>

            {records.length === 0 ? (
                <Card>
                    <CardContent>
                        <Box textAlign="center" py={4}>
                            <Typography variant="h6" color="text.secondary">
                                No accessible records
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                This patient hasn't shared any records with you
                            </Typography>
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
                                            <Typography variant="caption" color="text.secondary">
                                                {record.recordId}
                                            </Typography>
                                        </Box>
                                        <Chip icon={<Folder />} label="EHR" color="primary" size="small" />
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
                                            {record.ipfsHash.substring(0, 24)}...
                                        </Typography>
                                    </Box>

                                    <Button
                                        variant="contained"
                                        fullWidth
                                        startIcon={<Download />}
                                        onClick={() => handleDownload(record.recordId)}
                                    >
                                        Download Encrypted File
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default DoctorRecords;

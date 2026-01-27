import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    TextField,
    MenuItem,
    Grid
} from '@mui/material';
import { format } from 'date-fns';
import { adminAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

const AdminAudit = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadLogs();
    }, [filter]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            let response;
            if (filter === 'all') {
                response = await adminAPI.getAllAuditLogs();
            } else {
                response = await adminAPI.getLogsByAction(filter);
            }
            setLogs(response.data.data || []);
        } catch (error) {
            enqueueSnackbar('Failed to load audit logs', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const actionTypes = [
        'all',
        'CREATE_EHR',
        'QUERY_EHR',
        'GRANT_CONSENT',
        'REVOKE_CONSENT',
        'CHECK_CONSENT'
    ];

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
                    Audit Logs
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Complete system activity trail
                </Typography>
            </Box>

            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        select
                        label="Filter by Action"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        {actionTypes.map((action) => (
                            <MenuItem key={action} value={action}>
                                {action === 'all' ? 'All Actions' : action.replace(/_/g, ' ')}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
            </Grid>

            <Card>
                <CardContent>
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Timestamp</strong></TableCell>
                                    <TableCell><strong>Action</strong></TableCell>
                                    <TableCell><strong>Actor</strong></TableCell>
                                    <TableCell><strong>Role</strong></TableCell>
                                    <TableCell><strong>Record ID</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            No audit logs found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.slice(0, 100).map((log, index) => (
                                        <TableRow key={log.logId || index} hover>
                                            <TableCell>
                                                {format(new Date(log.timestamp), 'PPpp')}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.action.replace(/_/g, ' ')}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{log.actorId}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.actorRole}
                                                    size="small"
                                                    color={
                                                        log.actorRole === 'admin' ? 'error' :
                                                            log.actorRole === 'doctor' ? 'secondary' : 'default'
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                {log.recordId ? log.recordId.substring(0, 16) + '...' : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.success ? 'Success' : 'Failed'}
                                                    size="small"
                                                    color={log.success ? 'success' : 'error'}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {logs.length > 100 && (
                        <Box mt={2} textAlign="center">
                            <Typography variant="caption" color="text.secondary">
                                Showing first 100 of {logs.length} logs
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default AdminAudit;

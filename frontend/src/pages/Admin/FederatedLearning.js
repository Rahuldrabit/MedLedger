import React, { useState, useEffect } from 'react';
import {
    Container, Grid, Paper, Typography, Box,
    Card, CardContent, Button, LinearProgress, Chip
} from '@mui/material';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Science, TrendingUp, Computer, Gavel } from '@mui/icons-material';

const FederatedLearning = () => {
    // Mock Data
    const [round, setRound] = useState(5);
    const [status, setStatus] = useState("TRAINING");
    const [performanceData] = useState([
        { round: 1, accuracy: 0.65, loss: 0.9 },
        { round: 2, accuracy: 0.72, loss: 0.7 },
        { round: 3, accuracy: 0.78, loss: 0.5 },
        { round: 4, accuracy: 0.81, loss: 0.4 },
        { round: 5, accuracy: 0.84, loss: 0.35 },
    ]);
    const [nodes] = useState([
        { id: "hospital1", status: "Active", contributions: 5 },
        { id: "hospital2", status: "Active", contributions: 5 },
        { id: "hospital3", status: "Offline", contributions: 3 },
    ]);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" gutterBottom component="div">
                    Federated Learning Dashboard
                </Typography>
                <Chip
                    label={status}
                    color={status === "TRAINING" ? "success" : "warning"}
                    icon={<Science />}
                />
            </Box>

            <Grid container spacing={3}>
                {/* Status Cards */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <Science color="primary" sx={{ mr: 1 }} />
                                <Typography color="textSecondary">Current Round</Typography>
                            </Box>
                            <Typography variant="h3">{round}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <Computer color="primary" sx={{ mr: 1 }} />
                                <Typography color="textSecondary">Active Nodes</Typography>
                            </Box>
                            <Typography variant="h3">{nodes.filter(n => n.status === "Active").length}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <TrendingUp color="primary" sx={{ mr: 1 }} />
                                <Typography color="textSecondary">Global Accuracy</Typography>
                            </Box>
                            <Typography variant="h3">{(performanceData[performanceData.length - 1].accuracy * 100).toFixed(1)}%</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Performance Chart */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 320 }}>
                        <Typography variant="h6" gutterBottom>Model Performance History</Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="round" label={{ value: 'Round', position: 'insideBottom', offset: -5 }} />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="#8884d8" name="Accuracy" />
                                <Line yAxisId="right" type="monotone" dataKey="loss" stroke="#82ca9d" name="Loss" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Governance Actions */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 320 }}>
                        <Typography variant="h6" gutterBottom>
                            <Gavel sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Governance
                        </Typography>
                        <Box mt={2}>
                            <Button variant="contained" fullWidth sx={{ mb: 2 }}>
                                Trigger Aggregation
                            </Button>
                            <Button variant="outlined" color="error" fullWidth sx={{ mb: 2 }}>
                                Stop Training
                            </Button>
                            <Typography variant="subtitle2" gutterBottom>
                                Node Status:
                            </Typography>
                            {nodes.map(node => (
                                <Box key={node.id} display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2">{node.id}</Typography>
                                    <Chip
                                        size="small"
                                        label={node.status}
                                        color={node.status === "Active" ? "success" : "default"}
                                    />
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default FederatedLearning;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { enqueueSnackbar } = useSnackbar();

    const [formData, setFormData] = useState({
        userId: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(formData.userId, formData.password);

        if (result.success) {
            enqueueSnackbar('Login successful!', { variant: 'success' });
            // Navigation handled by App.js
        } else {
            setError(result.message);
            enqueueSnackbar(result.message, { variant: 'error' });
        }

        setLoading(false);
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <Box
                            sx={{
                                bgcolor: 'primary.main',
                                borderRadius: '50%',
                                p: 2,
                                mb: 2
                            }}
                        >
                            <LockOutlined sx={{ color: 'white', fontSize: 40 }} />
                        </Box>
                        <Typography component="h1" variant="h5" fontWeight="bold">
                            EHR Blockchain System
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Sign in to your account
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="userId"
                            label="User ID"
                            name="userId"
                            autoComplete="username"
                            autoFocus
                            value={formData.userId}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleChange}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>

                        <Box sx={{ textAlign: 'center' }}>
                            <Link to="/register" style={{ textDecoration: 'none' }}>
                                <Typography variant="body2" color="primary">
                                    Don't have an account? Register
                                </Typography>
                            </Link>
                        </Box>

                        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                <strong>Demo Accounts:</strong><br />
                                Patient: patient123 / password<br />
                                Doctor: doctor456 / password<br />
                                Admin: admin789 / password
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    MenuItem,
    Alert
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { enqueueSnackbar } = useSnackbar();

    const [formData, setFormData] = useState({
        userId: '',
        password: '',
        confirmPassword: '',
        role: 'patient',
        name: '',
        email: ''
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
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        const { confirmPassword, ...registerData } = formData;
        const result = await register(registerData);

        if (result.success) {
            enqueueSnackbar(result.message, { variant: 'success' });
            setTimeout(() => navigate('/login'), 2000);
        } else {
            setError(result.message);
            enqueueSnackbar(result.message, { variant: 'error' });
        }

        setLoading(false);
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ marginTop: 8 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ bgcolor: 'secondary.main', borderRadius: '50%', p: 2, mb: 2 }}>
                            <PersonAdd sx={{ color: 'white', fontSize: 40 }} />
                        </Box>
                        <Typography component="h1" variant="h5" fontWeight="bold">
                            Create Account
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
                            label="User ID"
                            name="userId"
                            value={formData.userId}
                            onChange={handleChange}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Full Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            select
                            label="Role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <MenuItem value="patient">Patient</MenuItem>
                            <MenuItem value="doctor">Doctor</MenuItem>
                            <MenuItem value="admin">Administrator</MenuItem>
                        </TextField>

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            helperText="At least 8 characters"
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Register'}
                        </Button>

                        <Box sx={{ textAlign: 'center' }}>
                            <Link to="/login" style={{ textDecoration: 'none' }}>
                                <Typography variant="body2" color="primary">
                                    Already have an account? Sign in
                                </Typography>
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Register;

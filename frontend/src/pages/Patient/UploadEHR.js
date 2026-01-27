import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    TextField,
    CircularProgress
} from '@mui/material';
import { CloudUpload, CheckCircle } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { patientAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

const UploadEHR = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const [file, setFile] = useState(null);
    const [recordType, setRecordType] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        },
        maxSize: 10485760, // 10MB
        multiple: false
    });

    const handleUpload = async () => {
        if (!file || !recordType) {
            enqueueSnackbar('Please select a file and enter record type', { variant: 'warning' });
            return;
        }

        setUploading(true);
        setUploadProgress(25);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('recordType', recordType);

            setUploadProgress(50);

            const response = await patientAPI.uploadEHR(formData);

            setUploadProgress(100);

            enqueueSnackbar('EHR uploaded successfully!', { variant: 'success' });

            setTimeout(() => {
                navigate('/patient/records');
            }, 1500);
        } catch (error) {
            enqueueSnackbar(
                error.response?.data?.message || 'Upload failed',
                { variant: 'error' }
            );
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Box mb={4}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Upload EHR
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Upload and encrypt your medical records
                </Typography>
            </Box>

            <Paper sx={{ p: 4 }}>
                <Box
                    {...getRootProps()}
                    sx={{
                        border: '2px dashed',
                        borderColor: isDragActive ? 'primary.main' : 'grey.300',
                        borderRadius: 2,
                        p: 4,
                        textAlign: 'center',
                        cursor: 'pointer',
                        bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                        transition: 'all 0.3s',
                        mb: 3
                    }}
                >
                    <input {...getInputProps()} />
                    {file ? (
                        <Box>
                            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                {file.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                            <Button
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFile(null);
                                }}
                                sx={{ mt: 2 }}
                            >
                                Remove
                            </Button>
                        </Box>
                    ) : (
                        <Box>
                            <CloudUpload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                {isDragActive ? 'Drop file here' : 'Drag & drop file here'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                or click to browse
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                                Supported: PDF, JPG, PNG (max 10MB)
                            </Typography>
                        </Box>
                    )}
                </Box>

                <TextField
                    fullWidth
                    label="Record Type"
                    placeholder="e.g., Lab Report, X-Ray, Prescription"
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value)}
                    sx={{ mb: 3 }}
                    helperText="Describe the type of medical record"
                />

                {uploading && (
                    <Box sx={{ mb: 3 }}>
                        <Box display="flex" alignItems="center" gap={2} mb={1}>
                            <CircularProgress size={24} variant="determinate" value={uploadProgress} />
                            <Typography variant="body2">
                                {uploadProgress < 100 ? 'Encrypting and uploading...' : 'Complete!'}
                            </Typography>
                        </Box>
                    </Box>
                )}

                <Box display="flex" gap={2}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleUpload}
                        disabled={!file || !recordType || uploading}
                    >
                        {uploading ? 'Uploading...' : 'Upload & Encrypt'}
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/patient/records')}
                        disabled={uploading}
                    >
                        Cancel
                    </Button>
                </Box>

                <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                    <Typography variant="body2" color="info.dark">
                        <strong>Security Note:</strong> Your file will be encrypted with AES-256 before
                        upload. Only you and authorized doctors can decrypt it.
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default UploadEHR;

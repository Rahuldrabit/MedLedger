import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Patient API calls
export const patientAPI = {
    // Get all records
    getRecords: () => axios.get(`${API_URL}/patient/ehr`),

    // Get specific record
    getRecord: (recordId) => axios.get(`${API_URL}/patient/ehr/${recordId}`),

    // Upload EHR
    uploadEHR: (formData) => axios.post(`${API_URL}/patient/ehr/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // Get consents
    getConsents: () => axios.get(`${API_URL}/patient/consent`),

    // Grant consent
    grantConsent: (data) => axios.post(`${API_URL}/patient/consent/grant`, data),

    // Revoke consent
    revokeConsent: (consentId) => axios.delete(`${API_URL}/patient/consent/${consentId}`),

    // Get audit logs
    getAuditLogs: (recordId) => axios.get(`${API_URL}/patient/audit/${recordId}`)
};

// Doctor API calls
export const doctorAPI = {
    // Get accessible patients
    getPatients: () => axios.get(`${API_URL}/doctor/patients`),

    // Get patient records
    getPatientRecords: (patientId) => axios.get(`${API_URL}/doctor/patient/${patientId}/records`),

    // Get EHR metadata
    getEHR: (recordId) => axios.get(`${API_URL}/doctor/ehr/${recordId}`),

    // Download EHR file
    downloadEHR: (recordId) => axios.get(`${API_URL}/doctor/ehr/${recordId}/download`, {
        responseType: 'blob'
    }),

    // Get active consents
    getConsents: () => axios.get(`${API_URL}/doctor/consent/active`),

    // Get my activities
    getActivities: () => axios.get(`${API_URL}/doctor/audit/my-activities`)
};

// Admin API calls
export const adminAPI = {
    // Get all audit logs
    getAllAuditLogs: () => axios.get(`${API_URL}/admin/audit/all`),

    // Get logs by action
    getLogsByAction: (action) => axios.get(`${API_URL}/admin/audit/action/${action}`),

    // Get logs by user
    getLogsByUser: (userId) => axios.get(`${API_URL}/admin/audit/user/${userId}`),

    // Get logs by record
    getLogsByRecord: (recordId) => axios.get(`${API_URL}/admin/audit/record/${recordId}`),

    // Get system stats
    getStats: () => axios.get(`${API_URL}/admin/stats`)
};

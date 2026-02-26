import { Navigate } from 'react-router-dom';

// Unified login — redirect legacy route
const SuperAdminLogin = () => <Navigate to="/login" replace />;

export default SuperAdminLogin;

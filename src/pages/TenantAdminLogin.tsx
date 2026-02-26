import { Navigate } from 'react-router-dom';

// Unified login — redirect legacy route
const TenantAdminLogin = () => <Navigate to="/login" replace />;

export default TenantAdminLogin;

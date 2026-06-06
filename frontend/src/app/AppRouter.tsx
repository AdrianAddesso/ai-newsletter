import { Box } from '@mui/material'

import {
    BrowserRouter as Router,
    Navigate,
    Route,
    Routes,
} from 'react-router'

import { NotificationManager } from '../components/NotificationManager'
import { useNotification } from '../hooks/useNotification'
import { adminRoutes } from './routes/AdminRoutes'
import { protectedRoutes } from './routes/ProtectedRoutes'
import { publicRoutes } from './routes/PublicRoutes'

export function AppRouter() {
    const {
        notifications,
        removeNotification,
    } = useNotification()

    return (
        <Box sx={{ position: 'relative', }}>
            <Router>
                <Routes>
                    {publicRoutes}

                    {protectedRoutes}

                    {adminRoutes}

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Router>

            <NotificationManager
                notifications={notifications}
                onClose={removeNotification}
            />
        </Box>
    )
}

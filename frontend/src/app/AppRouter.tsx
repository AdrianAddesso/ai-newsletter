import { Box } from '@mui/material'

import {
    BrowserRouter as Router,
    Routes,
} from 'react-router'

import { NotificationManager } from '../components/NotificationManager'
import { useNotification } from '../hooks/useNotification'
import { adminRoutes } from './routes/AdminRoutes'
import { devRoutes } from './routes/DevRoutes'
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

                    {devRoutes}
                </Routes>
            </Router>

            <NotificationManager
                notifications={notifications}
                onClose={removeNotification}
            />
        </Box>
    )
}
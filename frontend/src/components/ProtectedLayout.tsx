import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import { Navigation } from './Navigation'

export function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation />
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
    </Box>
  )
}

import axios from 'axios'

import { useState } from 'react'

import { Button } from '@mui/material'
import { Chip } from '@mui/material'
import { Paper } from '@mui/material'
import { Stack } from '@mui/material'
import { Typography } from '@mui/material'

import {
  apiBaseUrl,
} from '../../../config/api'

type ApiHealth = {
  ok: boolean
  service: string
  timestamp: string
}

export function BackendConnectionDemo() {
  const [health, setHealth] =
    useState<ApiHealth | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  const [loading, setLoading] =
    useState(false)

  const testConnection =
    async () => {
      setLoading(true)
      setError(null)

      try {
        const response =
          await axios.get<ApiHealth>(
            '/health',
          )

        setHealth(response.data)
      } catch (connectionError) {
        setHealth(null)

        setError(
          connectionError instanceof Error
            ? connectionError.message
            : 'No se pudo conectar con el backend',
        )
      } finally {
        setLoading(false)
      }
    }

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: error
          ? 'error.main'
          : 'divider',
        p: 3,
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{
            xs: 'column',
            md: 'row',
          }}
          spacing={2}
          sx={{
            justifyContent:
              'space-between',
            alignItems: {
              xs: 'flex-start',
              md: 'center',
            },
          }}
        >
          <Stack spacing={0.75}>
            <Typography variant="overline">
              Backend connection
            </Typography>

            <Typography variant="h4">
              Axios health check
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              API base: {apiBaseUrl}
            </Typography>
          </Stack>

          <Button
            variant="contained"
            color="secondary"
            onClick={testConnection}
            disabled={loading}
          >
            {loading
              ? 'Conectando'
              : 'Probar conexion'}
          </Button>
        </Stack>

        {health && (
          <Stack
            direction={{
              xs: 'column',
              md: 'row',
            }}
            spacing={2}
          >
            <Chip
              label="Backend online"
              color="success"
            />

            <Typography variant="body2">
              {health.service}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {health.timestamp}
            </Typography>
          </Stack>
        )}

        {error && (
          <Typography
            variant="body2"
            color="error.main"
          >
            {error}
          </Typography>
        )}
      </Stack>
    </Paper>
  )
}
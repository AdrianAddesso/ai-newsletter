import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'

import {
  useMemo,
  useState,
} from 'react'

import type {
  User,
  CreateUserPayload,
} from '../types/users'

import {
  validateEmail,
  validateRequired,
} from '../utils/usersValidation'

type Props = {
  open: boolean
  user: User | null
  onClose: () => void
  onSubmit: (
    payload: CreateUserPayload,
  ) => Promise<void>
}

const getInitialForm = (
  user: User | null,
): CreateUserPayload => ({
  name:user?.name ?? '',
  last_name:user?.last_name ?? '',
  email:user?.email ?? '',
  role:user?.role ?? 'USER',
  state:user?.state ?? 'ACTIVE',
})

export function UserFormModal({
  open,
  user,
  onClose,
  onSubmit,
}: Props) {
  const [form,setForm] = useState(
    getInitialForm(user),
  )

  const [loading,setLoading] =
    useState(false)

  const [error,setError] =
    useState('')

  const handleChange = (
    key: keyof CreateUserPayload,
    value: string,
  ) => {
    setForm(prev => ({
      ...prev,
      [key]:value,
    }))
  }

  const isValid = useMemo(() => {
    return (
      validateRequired(form.name) &&
      validateRequired(
        form.last_name,
      ) &&
      validateEmail(form.email)
    )
  }, [form])

  const handleClose = () => {
    setForm(getInitialForm(user))

    setError('')

    onClose()
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      setError('')

      await onSubmit(form)

      handleClose()
    } catch (err: unknown) {
      const message =
        (
          err as {
            response?: { data?: { message?: string } }
          }
        )?.response?.data?.message ??
        'No se pudo guardar el usuario'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {user
          ? 'Editar usuario'
          : 'Nuevo usuario'}
      </DialogTitle>

      <DialogContent>
        <Stack
          spacing={2}
          sx={{ mt:1 }}
        >
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <TextField
            label="Nombre"
            value={form.name}
            error={
              !validateRequired(
                form.name,
              )
            }
            helperText={
              !validateRequired(
                form.name,
              )
                ? 'Campo requerido'
                : ''
            }
            onChange={e =>
              handleChange(
                'name',
                e.target.value,
              )
            }
          />

          <TextField
            label="Apellido"
            value={form.last_name}
            error={
              !validateRequired(
                form.last_name,
              )
            }
            helperText={
              !validateRequired(
                form.last_name,
              )
                ? 'Campo requerido'
                : ''
            }
            onChange={e =>
              handleChange(
                'last_name',
                e.target.value,
              )
            }
          />

          <TextField
            label="Email"
            value={form.email}
            error={
              !validateEmail(
                form.email,
              )
            }
            helperText={
              !validateEmail(
                form.email,
              )
                ? 'Email inválido'
                : ''
            }
            onChange={e =>
              handleChange(
                'email',
                e.target.value,
              )
            }
          />

          <TextField
            select
            label="Rol"
            value={form.role}
            onChange={e =>
              handleChange(
                'role',
                e.target.value,
              )
            }
          >
            <MenuItem value="ADMIN">
              Admin
            </MenuItem>

            <MenuItem value="FUNCTIONAL">
              Functional
            </MenuItem>

            <MenuItem value="USER">
              User
            </MenuItem>
          </TextField>

          <TextField
            select
            label="Estado"
            value={form.state}
            onChange={e =>
              handleChange(
                'state',
                e.target.value,
              )
            }
          >
            <MenuItem value="ACTIVE">
              Active
            </MenuItem>

            <MenuItem value="INACTIVE">
              Inactive
            </MenuItem>
          </TextField>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          disabled={
            !isValid || loading
          }
          onClick={() =>
            void handleSubmit()
          }
        >
          {loading
            ? 'Guardando...'
            : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
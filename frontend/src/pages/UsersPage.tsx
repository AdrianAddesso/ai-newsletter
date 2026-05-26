import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'

import {
  Add,
  DeleteOutlined,
} from '@mui/icons-material'

import EditIcon from '@mui/icons-material/Edit'

import {
  useMemo,
  useState,
} from 'react'

import SearchBar from '../components/SearchBar'
import { ModalDelete } from '../components/ModalDelete'

import { useUsers } from '../users/hooks/useUsers'

import { exportUsers } from '../users/utils/exportUsers'

import { UserFormModal } from '../users/components/UserFormModal'

import type { User } from '../users/types/users'

export function UsersPage() {
  const {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
  } = useUsers()

  const [search,setSearch] =
    useState('')

  const [deleteId,setDeleteId] =
    useState<string | null>(null)

  const [editingUser,setEditingUser] =
    useState<User | null>(null)

  const [creating,setCreating] =
    useState(false)

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      `${user.name} ${user.last_name} ${user.email}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
  }, [users,search])

  if (loading) {
    return (
      <Box
        sx={{
          display:'flex',
          justifyContent:'center',
          py:10,
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ py:4 }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <Stack
            direction="row"
            sx={{
              justifyContent:'space-between',
              alignItems:'center',
            }}
          >
            <Typography variant="h4">
              Usuarios
            </Typography>

            <Stack
              direction="row"
              spacing={2}
            >
              <Button
                variant="contained"
                onClick={() =>
                  exportUsers(users)
                }
              >
                Exportar lista
              </Button>

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() =>
                  setCreating(true)
                }
              >
                Nuevo usuario
              </Button>
            </Stack>
          </Stack>

          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar usuario"
          />

          <TableContainer
            component={Card}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    Nombre
                  </TableCell>

                  <TableCell>
                    Apellido
                  </TableCell>

                  <TableCell>
                    Email
                  </TableCell>

                  <TableCell>
                    Rol
                  </TableCell>

                  <TableCell>
                    Estado
                  </TableCell>

                  <TableCell>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow
                    key={user.id}
                  >
                    <TableCell>
                      {user.name}
                    </TableCell>

                    <TableCell>
                      {user.last_name}
                    </TableCell>

                    <TableCell>
                      {user.email}
                    </TableCell>

                    <TableCell>
                      {user.role}
                    </TableCell>

                    <TableCell>
                      {user.state}
                    </TableCell>

                    <TableCell>
                      <Stack direction="row">
                        <Tooltip title="Editar">
                          <IconButton
                            onClick={() =>
                              setEditingUser(user)
                            }
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Eliminar">
                          <IconButton
                            color="error"
                            onClick={() =>
                              setDeleteId(user.id)
                            }
                          >
                            <DeleteOutlined />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Container>

      <UserFormModal
        open={creating}
        user={null}
        onClose={() =>
          setCreating(false)
        }
        onSubmit={createUser}
      />

      <UserFormModal
        key={editingUser?.id}
        open={Boolean(editingUser)}
        user={editingUser}
        onClose={() =>
          setEditingUser(null)
        }
        onSubmit={payload =>
          editingUser
            ? updateUser(
                editingUser.id,
                payload,
              )
            : Promise.resolve()
        }
      />

      <ModalDelete
        open={Boolean(deleteId)}
        onClose={() =>
          setDeleteId(null)
        }
        onConfirm={() => {
          if (!deleteId) return

          void deleteUser(deleteId)

          setDeleteId(null)
        }}
      />
    </Box>
  )
}
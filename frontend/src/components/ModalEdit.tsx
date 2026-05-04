import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Box,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    FormControl
} from '@mui/material';

import { useForm, Controller } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';

import type { User } from '../contexts/AuthContext';

import { AreaName, AreaNameLabel } from '../../../packages/shared/src/enums/area-name.enum';
import { UserRole, UserRoleLabel } from '../../../packages/shared/src/enums/user-role.enum';
import { UserStatus, UserStatusLabel } from '../../../packages/shared/src/enums/user-status.enum';
import { enumToOptions } from '../../../packages/shared/src/utils/enum-to-options';

const STATE_OPTIONS = enumToOptions(UserStatus, UserStatusLabel);
const AREA_OPTIONS = enumToOptions(AreaName, AreaNameLabel);
const ROLE_OPTIONS = enumToOptions(UserRole, UserRoleLabel);

interface ModalEditProps {
    open: boolean;
    title?: string;
    user: User | null;
    description?: string;
    onClose: () => void;
    loading?: boolean;
    onSubmit?: (data: User) => void; // 👈 ahora es reutilizable
}

export function ModalEdit({
    open,
    title = "¿Confirmar edición?",
    description = "Esta acción guardará los cambios realizados.",
    onClose,
    user,
    loading = false,
    onSubmit
}: ModalEditProps) {

    const {
        control,
        handleSubmit,
        reset
    } = useForm<User>({
        defaultValues: user ?? undefined
    });

    // 🔥 resetear form cuando se abre o cambia user
    const handleEnter = () => {
        if (user) {
            reset(user);
        }
    };

    const submitHandler: SubmitHandler<User> = (data) => {
        console.log("Datos:", data);
        onSubmit?.(data);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            slotProps={{
                transition: {
                    onEnter: handleEnter,
                },
            }}
            fullWidth
            maxWidth="sm"
        >
            <form onSubmit={handleSubmit(submitHandler)}>
                <DialogTitle>{title}</DialogTitle>

                <DialogContent>
                    <DialogContentText>{description}</DialogContentText>

                    <Box
                        sx={{
                            mt: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2
                        }}
                    >
                        {/* Nombre */}
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Nombre"
                                    fullWidth
                                />
                            )}
                        />

                        {/* Email */}
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Email"
                                    fullWidth
                                />
                            )}
                        />

                        {/* Rol */}
                        <Controller
                            name="role"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth>
                                    <InputLabel>Rol</InputLabel>
                                    <Select {...field} label="Rol">
                                        {ROLE_OPTIONS.map(role => (
                                            <MenuItem key={role.value} value={role.value}>
                                                {role.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />

                        {/* Estado */}
                        <Controller
                            name="state"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth>
                                    <InputLabel>Estado</InputLabel>
                                    <Select {...field} label="Estado">
                                        {STATE_OPTIONS.map(state => (
                                            <MenuItem key={state.value} value={state.value}>
                                                {state.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />

                        {/* Área */}
                        <Controller
                            name="area"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth>
                                    <InputLabel>Área</InputLabel>
                                    <Select {...field} label="Área">
                                        {AREA_OPTIONS.map(area => (
                                            <MenuItem key={area.value} value={area.value}>
                                                {area.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ padding: '12px 24px', marginBottom: 2 }}>
                    <Button
                        onClick={onClose}
                        disabled={loading}
                        variant="outlined"
                    >
                        Cancelar
                    </Button>

                    <Button
                        color="success"
                        variant="contained"
                        disabled={loading}
                        type="submit"
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

import {
  Box,
  Button,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router'
import SearchIcon from '@mui/icons-material/Search'
import theme from '../../styles/appMuiTheme'
import AddIcon from "@mui/icons-material/Add";

interface ToolbarProps {
  canCreateNewsletter?: boolean
  search: string
  onSearchChange: (value: string) => void

  filter: 'ALL' | 'PENDING'
  onFilterChange: (value: 'ALL' | 'PENDING') => void
}

export function Toolbar({
  canCreateNewsletter = false,
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: ToolbarProps) {
  const navigate = useNavigate()

  const route = () => {
    navigate('/templates/biblioteca')
  }

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        p: 2,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h4">Newsletters</Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ alignItems: { xs: "stretch", sm: "center" } }}
        >
          {/*TOGGLE */}
          <ToggleButtonGroup
            exclusive
            size="small"
            value={filter}
            onChange={(_, value) => {
              if (value !== null) {
                onFilterChange(value);
              }
            }}
          >
            <ToggleButton value="ALL">Todos</ToggleButton>
            <ToggleButton value="PENDING">Pendientes</ToggleButton>
          </ToggleButtonGroup>
          {/*BUSCADOR */}
          <TextField
            size="small"
            placeholder="Buscar"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{
                        fontSize: 20,
                        color: theme.palette.error.main,
                      }}
                    />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ minWidth: { xs: "100%", sm: 220 } }}
          />

          {canCreateNewsletter && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={route} // Uses your existing route function
              sx={{ whiteSpace: "nowrap" }}
            >
              Nuevo Newsletter
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

export default Toolbar
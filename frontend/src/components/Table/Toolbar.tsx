import {
  Box,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router";
import SearchBar from "../SearchBar";

interface ToolbarProps {
  canCreateNewsletter?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  filter: "ALL" | "PENDING";
  onFilterChange: (value: "ALL" | "PENDING") => void;
}

export function Toolbar({
  canCreateNewsletter = false,
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: ToolbarProps) {
  const navigate = useNavigate();

  const route = () => {
    navigate("/templates/library");
  };

  return (
    <Stack
      sx={{
        display: "flex",
        flexDirection: {
          xs: "column",
          md: "row",
        },
        gap: 2,
        justifyContent: "space-between",
        alignItems: {
          xs: "flex-start",
          md: "center",
        },
      }}
    >
      <Stack spacing={1}>
        <Typography variant="h2">Newsletters</Typography>
        <Typography variant="body1" color="text.secondary">
          Gestioná tus newsletters y seguí su estado de revisión.
        </Typography>
      </Stack>

      <Box
        sx={{
          width: { xs: "100%", md: "auto" },
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          alignItems: { xs: "stretch", md: "center" },
        }}
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={filter}
          onChange={(_, value) => {
            if (value !== null) {
              onFilterChange(value);
            }
          }}
          sx={{
            width: { xs: "100%", md: "auto" },
            "& .MuiToggleButton-root": {
              flex: { xs: 1, md: "initial" },
            },
          }}
        >
          <ToggleButton value="ALL">Todos</ToggleButton>
          <ToggleButton value="PENDING">Pendientes</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display:"flex", flexDirection: { xs: "column", md: "row" }, width: "100%", gap:2}}>
          <SearchBar
            value={search}
            onChange={onSearchChange}
            placeholder="Buscar newsletter"
          />
          {canCreateNewsletter && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={route}
              sx={{ whiteSpace: "nowrap", width: { xs: "100%", md: "auto" } }}
            >
              Nuevo Newsletter
            </Button>
          )}
        </Box>
      </Box>
    </Stack>
  );
}

export default Toolbar;

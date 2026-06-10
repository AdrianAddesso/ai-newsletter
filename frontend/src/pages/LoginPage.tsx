import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import GoogleIcon from '@mui/icons-material/Google';
import lightBlue from "../assets/brand_shapes/isolated-by-brand/nestle-classic/light-blue.svg";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";

type LoginLocationState = {
  authError?: string;
  redirectPath?: string;
};

export function LoginPage() {
  const location = useLocation();
  const { startGoogleLogin, isAuthenticated, loading } = useAuth();
  const locationState = (location.state as LoginLocationState | null) ?? null;
  const redirectPath = locationState?.redirectPath || "/dashboard";
  const errorMessage = locationState?.authError || "";

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `url(${lightBlue}) no-repeat center center fixed`,
        backgroundSize: "cover",
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={4}>
          <Card elevation={8} sx={{ border: "1px solid", borderColor: "divider", p: { xs: 3, md: 4 } }}>
            <Stack spacing={3} sx={{ textAlign: "center", justifyContent: "center", alignItems: "center" }}>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                Bienvenido a Newsletters AI
              </Typography>
              {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
              <Button
                sx={{ alignItems: "center", justifyContent: "center", justifyItems: "center"}}
                variant="contained"
                color="primary"
                size="large"
                onClick={startGoogleLogin}
              >
                <GoogleIcon sx={{ mr: 1 }} />
                Continuar con Google
              </Button>
            </Stack>
          </Card>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
            Sistema de newsletters
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

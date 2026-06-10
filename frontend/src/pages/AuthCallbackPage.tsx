import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNotification } from "../hooks/useNotification";

export function AuthCallbackPage() {
  const { fetchMe } = useAuth();
  const navigate = useNavigate();
  const { error: notifyError } = useNotification();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const processCallback = async () => {
      try {
        await fetchMe();
        if (mounted) {
          navigate("/dashboard", { replace: true });
        }
      } catch {
        if (mounted) {
          const message = "No se pudo completar el inicio de sesion o no tienes acceso.";
          navigate("/login", {
            replace: true,
            state: {
              authError: message,
            },
          });
        }
      } finally {
        if (mounted) {
          setProcessing(false);
        }
      }
    };

    processCallback();

    return () => {
      mounted = false;
    };
  }, [fetchMe, navigate, notifyError]);

  if (processing) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Procesando inicio de sesion...</Typography>
      </Box>
    );
  }

  return null;
}

import { Alert, Stack } from "@mui/material";
import type { Notification } from "../hooks/useNotification";

interface NotificationManagerProps {
  notifications: Notification[];
  onClose: (id: string) => void;
}

export function NotificationManager({
  notifications,
  onClose,
}: NotificationManagerProps) {
  return (
    <Stack
      sx={{
        position: "fixed",
        bottom: { xs: 16, md: 24 },
        right: { xs: 16, md: 24 },
        left: { xs: 16, md: "auto" },
        zIndex: 9999,
        maxWidth: { xs: "calc(100% - 32px)", md: 400 },
        width: { xs: "auto", md: "auto" },
      }}
      spacing={1}
    >
      {notifications.map((notification) => (
        <Alert
          key={notification.id}
          onClose={() => onClose(notification.id)}
          severity={notification.type === "info" ? "info" : notification.type}
          variant="filled"
          sx={{ width: "100%", boxShadow: 3 }}
        >
          {notification.message}
        </Alert>
      ))}
    </Stack>
  );
}

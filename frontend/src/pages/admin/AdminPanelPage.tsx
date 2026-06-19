import {
  Box,
  Container,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  AutoAwesome as AiIcon,
  ImageOutlined as AssetsIcon,
  PaletteOutlined as BrandingIcon,
} from "@mui/icons-material";
import { useState } from "react";
import { AiConfig } from "../../components/admin/ai/AiConfig";
import { AssetsList } from "../../components/admin/assets/AssetsList";
import { BrandkitList } from "../../components/admin/branding/BrandkitList";


interface TabPanelProps {
    children: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
    return (
        <Box
        role="tabpanel"
        hidden={value !== index}
        id={`backoffice-tabpanel-${index}`}
        aria-labelledby={`backoffice-tab-${index}`}
        >
        {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </Box>
    );
    }

    function a11yProps(index: number) {
    return {
        id: `backoffice-tab-${index}`,
        "aria-controls": `backoffice-tabpanel-${index}`,
    };
    }

    // ---------------------------------------------------------------------------
    // Page
    // ---------------------------------------------------------------------------
export function BackofficePage() {
    const [tab, setTab] = useState(0);

    return (
      <Box
        sx={{
          py: 4,
          px: 3,
          bgcolor: "background.default",
          height: "100vh",
          overflowY: "auto",
          scrollbarGutter: "stable",
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Stack>
            {/* Page header */}
            <Stack spacing={1}>
              <Typography variant="h2">Admin Panel</Typography>
              <Typography variant="body1" color="text.secondary">
                Configuración global de IA, materiales y branding de la
                plataforma.
              </Typography>
            </Stack>

            {/* Tabs */}
            <Box data-onboarding="admin-content">
              <Box data-onboarding="admin-tabs" sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                  value={tab}
                  onChange={(_, newValue: number) => setTab(newValue)}
                  aria-label="secciones del backoffice"
                >
                  <Tab
                    icon={<AiIcon fontSize="small" />}
                    iconPosition="start"
                    label="Configuración de IA"
                    {...a11yProps(0)}
                  />
                  <Tab
                    icon={<AssetsIcon fontSize="small" />}
                    iconPosition="start"
                    label="Materiales"
                    {...a11yProps(1)}
                  />
                  <Tab
                    icon={<BrandingIcon fontSize="small" />}
                    iconPosition="start"
                    label="Branding"
                    {...a11yProps(2)}
                  />
                </Tabs>
              </Box>

              {/* AI section */}
              <TabPanel value={tab} index={0}>
                <AiConfig />
              </TabPanel>

              {/* Assets section */}
              <TabPanel value={tab} index={1}>
                <AssetsList />
              </TabPanel>

              {/* Branding section */}
              <TabPanel value={tab} index={2}>
                <BrandkitList />
              </TabPanel>
            </Box>
          </Stack>
        </Container>
      </Box>
    );
}

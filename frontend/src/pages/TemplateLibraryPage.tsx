import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router";
import { listTemplates } from "../api/templates";
import SearchBar from "../components/SearchBar";
import { TemplateCard } from "../components/TemplateCard";
import type { NewsletterTemplate } from "../types/newsletter";

const AREA_LABELS: Record<NewsletterTemplate["area"], string> = {
  COMUNICACION_INTERNA: "Comunicación Interna",
  COMUNICACION_CORPORATIVA: "Comunicación Corporativa",
};

const TEMPLATE_CARD_HEIGHT = 420;

type TemplateDisplay = Omit<NewsletterTemplate, "orientation"> & {
  area_id: NewsletterTemplate["area"];
  state_id: string;
  state_name: string;
  orientation: "Portrait" | "Landscape";
};

export function TemplateLibraryPage() {
    const theme = useTheme();
    const navigate = useNavigate();

    const [templates, setTemplates] = useState<TemplateDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [areaFilter, setAreaFilter] = useState("Todas");
    const [orientationFilter, setOrientationFilter] = useState("Todas");

    useEffect(() => {
        const fetchTemplates = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await listTemplates();
            const displayTemplates: TemplateDisplay[] = data.map((template) => ({
            ...template,
            area_id: template.area,
            state_id: template.stateCode,
            state_name: template.stateName,
            orientation:
                template.orientation === "PORTRAIT" ? "Portrait" : "Landscape",
            }));

            setTemplates(displayTemplates);
        } catch (err) {
            console.error("Error loading templates:", err);
            setError(
            "No se pudieron cargar las plantillas. Por favor, intentá más tarde.",
            );
        } finally {
            setLoading(false);
        }
        };

        void fetchTemplates();
    }, []);

    const uniqueAreas = useMemo(() => {
        return [
        "Todas",
        ...Array.from(new Set(templates.map((template) => template.area_id))),
        ];
    }, [templates]);

    const orientations: Array<"Todas" | "Portrait" | "Landscape"> = [
        "Todas",
        "Portrait",
        "Landscape",
    ];

    const filteredTemplates = useMemo(() => {
        return templates
        .filter((template) => {
            const matchesSearch =
            template.name.toLowerCase().includes(search.toLowerCase()) ||
            (template.description?.toLowerCase().includes(search.toLowerCase()) ??
                false);
            const matchesArea =
            areaFilter === "Todas" || template.area_id === areaFilter;
            const matchesOrientation =
            orientationFilter === "Todas" ||
            template.orientation === orientationFilter;

            return matchesSearch && matchesArea && matchesOrientation;
        })
        .filter((template) => template.stateCode !== "DRAFT");
    }, [templates, search, areaFilter, orientationFilter]);

    const handlePreview = (id: string) => {
        console.log("Preview del template:", id);
    };

    const handleSelect = (id: string) => {
        navigate(`/crearNewsletter/${id}`);
    };

    if (loading) {
        return (
        <Box
            sx={{
            py: theme.nestle?.page?.sectionPaddingY || 4,
            px: theme.nestle?.page?.sectionPaddingX || 2,
            bgcolor: "background.default",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            }}
        >
            <CircularProgress />
        </Box>
        );
    }

    if (error) {
        return (
        <Box
            sx={{
            py: theme.nestle?.page?.sectionPaddingY || 4,
            px: theme.nestle?.page?.sectionPaddingX || 2,
            bgcolor: "background.default",
            maxHeight: "100vh",
            }}
        >
            <Container maxWidth="lg" disableGutters>
            <Alert severity="error">{error}</Alert>
            </Container>
        </Box>
        );
    }

    return (
        <Box
        sx={{
            py: theme.nestle?.page?.sectionPaddingY || 4,
            px: theme.nestle?.page?.sectionPaddingX || 2,
            bgcolor: "background.default",
            minHeight: "100vh",
        }}
        >
        <Container maxWidth="lg" disableGutters>
            <Stack spacing={4}>
            <Stack spacing={1}>
                <Typography variant="h2">Biblioteca de Plantillas</Typography>
                <Typography variant="body1" color="text.secondary">
                Seleccioná el diseño ideal para tu próxima comunicación.
                </Typography>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <SearchBar value={search} onChange={setSearch} />

                <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Área</InputLabel>
                <Select
                    value={areaFilter}
                    label="Área"
                    onChange={(event: SelectChangeEvent) =>
                    setAreaFilter(event.target.value)
                    }
                >
                    {uniqueAreas.map((area) => (
                    <MenuItem key={area} value={area}>
                        {area === "Todas"
                        ? "Todas"
                        : AREA_LABELS[area as NewsletterTemplate["area"]] || area}
                    </MenuItem>
                    ))}
                </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Orientación</InputLabel>
                <Select
                    value={orientationFilter}
                    label="Orientación"
                    onChange={(event: SelectChangeEvent) =>
                    setOrientationFilter(event.target.value)
                    }
                >
                    {orientations.map((orientation) => (
                    <MenuItem key={orientation} value={orientation}>
                        {orientation}
                    </MenuItem>
                    ))}
                </Select>
                </FormControl>
            </Stack>

            {filteredTemplates.length === 0 ? (
                <Typography
                color="text.secondary"
                sx={{ textAlign: "center", py: 8 }}
                >
                No se encontraron plantillas con esos filtros.
                </Typography>
            ) : (
                <Box
                sx={{
                    display: "grid",
                    gap: 3,
                    gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                    },
                }}
                >
                {filteredTemplates.map((template) => (
                    <TemplateCard
                    key={template.id}
                    id={template.id}
                    name={template.name}
                    area_id={template.area_id}
                    state_code={template.state_id}
                    state_name={template.state_name}
                    description={template.description}
                    orientation={template.orientation}
                    layout={template.layout}
                    height={TEMPLATE_CARD_HEIGHT}
                    onPreview={() => handlePreview(template.id)}
                    onSelect={() => handleSelect(template.id)}
                    />
                ))}
                </Box>
            )}
            </Stack>
        </Container>
        </Box>
    );
}

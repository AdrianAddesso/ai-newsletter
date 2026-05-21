import { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { TemplateCarousel } from "./newsletter/components/TemplateCarousel";
import { GenerationForm } from "./newsletter/components/GenerationForm";
import CreationFlowStepper from "./newsletter/components/CreationFlowStepper";

import { generateNewsletter, type GenerateNewsletterRequest } from "../api/ai";
import type {
  NewsletterAssetSelection,
  NewsletterBlock,
  NewsletterTemplate,
} from "../types/newsletter";
import { createNewsletter, updateNewsletter } from "../api/newsletters";
import { listTemplates } from "../api/templates";

type BackState = {
  newsletterId?: string;
  templateId?: string;
  brandKitId?: string;
  generationRequest?: GenerateNewsletterRequest;
};

const emptyBackState: BackState = {};

function requestToFormValues(req: GenerateNewsletterRequest) {
  return {
    topic: req.topic,
    objective: req.objective,
    audience: req.audience,
    keyMessages: req.keyMessages.join("\n"),
    tone: req.tone,
    relevantDates: req.relevantDates ?? "",
    cta: req.cta ?? "",
    contact: req.contact ?? "",
    linksOrSources: (req.linksOrSources ?? []).join("\n"),
    additionalContext: req.additionalContext ?? "",
  };
}

function CreateNewsletterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { templateId: routeTemplateId } = useParams<{ templateId?: string }>();
  const backState = (location.state as BackState | null) ?? emptyBackState;
  const { user } = useAuth();
  const currentUserId = user?.id ?? "anonymous";

  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    routeTemplateId ?? backState.templateId ?? "",
  );
  const [selectedBrandKitId, setSelectedBrandKitId] = useState(
    backState.brandKitId ?? "",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadTemplates = async () => {
      setIsLoadingTemplates(true);
      setTemplatesError(null);

      try {
        const data = await listTemplates();
        if (mounted) {
          setTemplates(data);
          setSelectedTemplateId((current) => current || data[0]?.id || "");
        }
      } catch {
        if (mounted) {
          setTemplates([]);
          setTemplatesError(
            "No se pudieron obtener las plantillas disponibles.",
          );
        }
      } finally {
        if (mounted) {
          setIsLoadingTemplates(false);
        }
      }
    };

    void loadTemplates();

    return () => {
      mounted = false;
    };
  }, []);

  const effectiveSelectedTemplateId = routeTemplateId ?? selectedTemplateId;

  useEffect(() => {
    if (!selectedTemplateId || selectedTemplateId === routeTemplateId) {
      return;
    }

    navigate(`/crearNewsletter/${selectedTemplateId}`, {
      replace: true,
      state: {
        newsletterId: backState.newsletterId,
        templateId: selectedTemplateId,
        brandKitId: backState.brandKitId,
        generationRequest: backState.generationRequest,
      },
    });
  }, [
    backState.brandKitId,
    backState.generationRequest,
    backState.newsletterId,
    navigate,
    routeTemplateId,
    selectedTemplateId,
  ]);

  const selectedTemplate =
    templates.find((template) => template.id === effectiveSelectedTemplateId) ??
    null;

  const handleGenerate = useCallback(
    async (
      request: GenerateNewsletterRequest,
      assetSelection: NewsletterAssetSelection,
    ) => {
      setIsGenerating(true);
      setAiError(null);

      try {
        // 1. Generar bloques con IA
        const response = await generateNewsletter(request);

        const blocks: NewsletterBlock[] = response.blocks.map((block) => ({
          id: block.id,
          name: block.name,
          text: block.text,
          backgroundColor: block.backgroundColor,
          comment: null,
        }));

        // 2. Actualizar newsletter existente o crear uno nuevo
        let newsletterId: string;
        if (backState.newsletterId) {
          await updateNewsletter(backState.newsletterId, {
            templateId: request.templateId,
            brandKitId: request.brandKitId,
            blocks,
            generationRequest: request,
            assetSelection,
          });
          newsletterId = backState.newsletterId;
        } else {
          const created = await createNewsletter({
            creatorUserId: currentUserId,
            templateId: request.templateId,
            brandKitId: request.brandKitId,
            blocks,
            generationRequest: request,
            assetSelection,
          });
          newsletterId = created.id;
        }

        // 3. Navegar a EditNewsletterPage con el ID
        navigate(`/editarNewsletter/${newsletterId}`);
      } catch (error) {
        console.error("Error al generar newsletter:", error);
        setAiError("No se pudo generar el newsletter en este momento.");
      } finally {
        setIsGenerating(false);
      }
    },
    [backState.newsletterId, currentUserId, navigate],
  );

  if (isLoadingTemplates) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{ minHeight: "calc(100vh - 64px)", bgcolor: "background.default" }}
    >
      <CreationFlowStepper
        activeStep={0}
        newsletterId={undefined}
        userRole={user?.role ?? "USER"}
      />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 1fr) minmax(380px, 0.72fr)",
          },
        }}
      >
        <Box
          sx={{
            p: { xs: 2, md: 3 },
            borderRight: { lg: "1px solid" },
            borderBottom: { xs: "1px solid", lg: "none" },
            borderColor: "divider",
            minWidth: 0,
          }}
        >
          <TemplateCarousel
            selectedTemplateId={effectiveSelectedTemplateId}
            templates={templates}
            selectedBrandKitId={selectedBrandKitId}
            onSelectTemplate={setSelectedTemplateId}
            onSelectBrandKit={setSelectedBrandKitId}
          />
        </Box>

        <Box sx={{ p: { xs: 2, md: 3 }, minWidth: 0 }}>
          <Stack spacing={2}>
            <Typography variant="h4">Crear newsletter</Typography>
            {templatesError && <Alert severity="error">{templatesError}</Alert>}
            {!templatesError && templates.length === 0 && (
              <Alert severity="info">
                No hay plantillas disponibles en este momento.
              </Alert>
            )}
            {selectedTemplate && selectedBrandKitId && (
              <GenerationForm
                selectedTemplate={selectedTemplate}
                selectedBrandKitId={selectedBrandKitId}
                isGenerating={isGenerating}
                aiError={aiError}
                initialValues={
                  backState.generationRequest
                    ? requestToFormValues(backState.generationRequest)
                    : undefined
                }
                onGenerate={handleGenerate}
                onCancel={() => navigate("/dashboard")}
              />
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

export default CreateNewsletterPage;

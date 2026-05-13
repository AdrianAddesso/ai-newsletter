import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../contexts/AuthContext'
import { getNewsletter, updateNewsletter } from '../api/newsletters'
import { BlockList } from '../components/newsletter/BlockList'
import { EditPanel } from '../components/newsletter/EditPanel'
import { ReviewCommentControls } from '../components/newsletter/ReviewCommentControls'
import { GenerationForm } from '../components/newsletter/GenerationForm'
import { NewsletterStepper, getStepFromState } from '../components/newsletter/NewsletterStepper'
import { BrandKitResourcesPanel } from '../components/newsletter/BrandKitResourcesPanel'
import type {
  NewsletterAssetSelection,
  ExportFormat,
  ExportOption,
  Newsletter,
  NewsletterBlock,
  NewsletterState,
  NewsletterTemplate,
} from "../types/newsletter";
import {
  improveText,
  generateNewsletter,
  type GenerateNewsletterRequest,
} from "../api/ai";
import { listTemplates } from "../api/templates";
import {
  getBrandKitResources,
  listBrandKits,
  type BrandKit,
  type BrandKitResources,
} from "../api/brand-kits";
import { useNotification } from "../hooks/useNotification";

// ── Helpers ──────────────────────────────────────────────────────────────────

const emptyComment = (v: string | null) => !v || v.trim().length === 0;


function logStateChange(payload: unknown) {
  console.info("Newsletter state changed", payload);
}

async function renderNewsletterHtml(
  blocks: NewsletterBlock[],
): Promise<string> {
  await new Promise<void>((r) => window.setTimeout(r, 250));
  const sections = blocks
    .map(
      (b) => `
    <section style="padding:24px;background:${b.backgroundColor};">
      <h2 style="margin:0 0 8px;font-size:24px;">${b.name}</h2>
      <p style="margin:0;font-size:17px;line-height:1.5;">${b.text}</p>
    </section>
  `,
    )
    .join("");
  return `<!doctype html><html lang="es"><body style="margin:0;font-family:Arial,sans-serif;color:#30261D;background:#F8F5F2;"><main style="max-width:680px;margin:0 auto;background:#FFFFFF;border:1px solid #E7E1DC;">${sections}</main></body></html>`;
}

async function fetchExportOptions(): Promise<ExportOption[]> {
  await new Promise<void>((r) => window.setTimeout(r, 150));
  return [
    {
      id: "png",
      label: "Exportar a PNG",
      format: "PNG",
    },
    {
      id: "eml",
      label: "Exportar a EML",
      format: "EML",
    },
  ];
}

async function exportHtmlToPng(): Promise<void> {
  await new Promise<void>((r) => window.setTimeout(r, 250));
}

async function exportHtmlToEml(html: string): Promise<void> {
  const emlContent = [
    "X-Unsent: 1",
    "To: ",
    "Subject: Newsletter Nestlé",
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
  ].join("\r\n");

  const blob = new Blob([emlContent], { type: "message/rfc822" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "newsletter.eml";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ⚠️ ARREGLAR ⚠️ — reemplazar por improveText({ text }) de la API real
/*async function mockRegenerateBlock(block: NewsletterBlock): Promise<string> {
  await new Promise<void>((r) => window.setTimeout(r, 600))
  return `[IA] ${block.text} — versión mejorada.`
}

// ⚠️ ARREGLAR ⚠️ — reemplazar por generateNewsletterWithAi(request)
function buildMockBlocks(request: GenerateNewsletterRequest): NewsletterBlock[] {
  return [
    { id: 'header', name: 'Encabezado', text: request.topic, backgroundColor: '#FFFFFF', comment: null },
    { id: 'headline', name: 'Titulo principal', text: request.objective, backgroundColor: '#97CAEB', comment: null },
    { id: 'body', name: 'Cuerpo', text: request.keyMessages.join(' · '), backgroundColor: '#FFFFFF', comment: null },
    { id: 'cta', name: 'Llamado a la accion', text: request.cta ?? 'Conoce mas en el portal interno.', backgroundColor: '#FFC600', comment: null },
  ]
}*/

const fallbackHtml = `<!doctype html><html lang="es"><body style="margin:0;font-family:Arial,sans-serif;"><main style="max-width:680px;margin:0 auto;border:1px solid #E7E1DC;"><section style="padding:32px;background:#FF595A;color:#fff;"><h1 style="margin:0;">Newsletter Nestle</h1></section></main></body></html>`;

// ── Sub-components ────────────────────────────────────────────────────────────

function PermissionDenied() {
  return (
    <Alert severity="warning">
      No tenes permisos para ver esta instancia del flujo.
    </Alert>
  );
}

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

// ── EditNewsletterPage ──────────────────────────────────────────────────────────────────

function EditNewsletterPage() {
  const navigate = useNavigate();
  const { id: newsletterId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success: notifySuccess } = useNotification();

  const currentUserId: string = user?.id ?? "anonymous";
  const currentUserRole: UserRole = user?.role ?? "USER";

  // ── State ──
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [isLoadingNewsletter, setIsLoadingNewsletter] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [brandKitResources, setBrandKitResources] =
    useState<BrandKitResources | null>(null);
  const [isLoadingBrandKitResources, setIsLoadingBrandKitResources] =
    useState(false);
  const [brandKitResourcesError, setBrandKitResourcesError] = useState<
    string | null
  >(null);

  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [exportOptions, setExportOptions] = useState<ExportOption[]>([]);
  const [isRenderingHtml, setIsRenderingHtml] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(
    null,
  );
  const [isSendingForReview, setIsSendingForReview] = useState(false);
  const [regeneratingBlockId, setRegeneratingBlockId] = useState<string | null>(
    null,
  );
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [showRegenerationForm, setShowRegenerationForm] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // ── Fetch newsletter ──
  useEffect(() => {
    if (!newsletterId) {
      navigate("/editarNewsletter", { replace: true });
      return;
    }

    let mounted = true;

    const load = async () => {
      setIsLoadingNewsletter(true);
      setLoadError(null);

      try {
        const data = await getNewsletter(newsletterId);
        if (mounted) {
          setNewsletter(data);
          setSelectedBlockId(data.blocks[0]?.id ?? "");
        }
      } catch (error) {
        console.error("Error al cargar newsletter:", error);
        if (mounted) {
          setLoadError(
            "No se pudo cargar el newsletter. Verifica que el ID sea correcto.",
          );
        }
      } finally {
        if (mounted) setIsLoadingNewsletter(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [newsletterId, navigate]);

  useEffect(() => {
    let mounted = true;

    const loadCatalogs = async () => {
      try {
        const [templateData, brandKitData] = await Promise.all([
          listTemplates(),
          listBrandKits(),
        ]);

        if (mounted) {
          setTemplates(templateData);
          setBrandKits(brandKitData);
        }
      } catch {
        if (mounted) {
          setTemplates([]);
          setBrandKits([]);
        }
      }
    };

    void loadCatalogs();

    return () => {
      mounted = false;
    };
  }, []);

  // ── Derived ──
  const selectedBlock =
    newsletter?.blocks.find((b) => b.id === selectedBlockId) ??
    newsletter?.blocks[0];
  const selectedTemplate =
    templates.find((template) => template.id === newsletter?.templateId) ??
    null;
  const selectedBrandKitId = newsletter?.brandKitId ?? "";
  const selectedBrandKitLabel =
    brandKits.find((brandKit) => brandKit.id === selectedBrandKitId)?.name ??
    selectedBrandKitId;
  const selectedAssets = newsletter?.assetSelection?.selectedAssets ?? [];

  const allCommentaries = useMemo(() => {
    const comments: string[] = [
      ...(newsletter?.comment ? [newsletter.comment] : []),
      ...(newsletter?.blocks
        .map((b) => b.comment)
        .filter((c): c is string => !!c) ?? []),
    ];

    return comments.filter((c) => !emptyComment(c));
  }, [newsletter]);

  useEffect(() => {
    if (!selectedBrandKitId) {
      return;
    }

    let mounted = true;

    const loadBrandKitResources = async () => {
      setIsLoadingBrandKitResources(true);
      setBrandKitResourcesError(null);

      try {
        const resources = await getBrandKitResources(selectedBrandKitId);

        if (mounted) {
          setBrandKitResources(resources);
        }
      } catch {
        if (mounted) {
          setBrandKitResources(null);
          setBrandKitResourcesError(
            "No se pudieron cargar los recursos del brandkit.",
          );
        }
      } finally {
        if (mounted) {
          setIsLoadingBrandKitResources(false);
        }
      }
    };

    void loadBrandKitResources();

    return () => {
      mounted = false;
    };
  }, [selectedBrandKitId]);

  // ── State machine ──
  const transitionState = useCallback(
    async (newState: NewsletterState) => {
      if (!newsletter || !newsletterId) return;

      const previousState = newsletter.state;
      if (previousState === newState) return;

      logStateChange({
        newsletter_id: newsletterId,
        previous_state: previousState,
        new_state: newState,
        reviewed_by_user_id: currentUserId,
        all_commentaries: allCommentaries,
        created_at: new Date().toISOString(),
      });

      try {
        const updated = await updateNewsletter(newsletterId, {
          state: newState,
        });
        setNewsletter(updated);
      } catch (error) {
        console.error("Error al cambiar estado:", error);
        setAiError("No se pudo actualizar el estado del newsletter.");
      }
    },
    [allCommentaries, currentUserId, newsletter, newsletterId],
  );

  // ── Update blocks ──
  const updateBlocks = useCallback(
    async (newBlocks: NewsletterBlock[]) => {
      if (!newsletterId) return;
      try {
        const updated = await updateNewsletter(newsletterId, {
          blocks: newBlocks,
        });
        setNewsletter(updated);
      } catch (error) {
        console.error("Error al actualizar bloques:", error);
        setAiError("No se pudieron guardar los cambios.");
      }
    },
    [newsletterId],
  );

  // ── Render HTML ──
  const handleRenderHtml = useCallback(async () => {
    if (!newsletter || !newsletterId) return;

    setIsRenderingHtml(true);
    try {
      const html = await renderNewsletterHtml(newsletter.blocks);
      const updated = await updateNewsletter(newsletterId, {
        renderedHtml: html,
      });
      setNewsletter(updated);
    } catch (error) {
      console.error("Error al renderizar HTML:", error);
    } finally {
      setIsRenderingHtml(false);
    }
  }, [newsletter, newsletterId]);

  useEffect(() => {
    if (newsletter?.state !== "APPROVED") return;
    const id = window.setTimeout(() => {
      void handleRenderHtml();
    }, 0);
    void fetchExportOptions().then(setExportOptions);
    return () => window.clearTimeout(id);
  }, [handleRenderHtml, newsletter?.state]);

  // ── Actions ──
  const handleSendForReview = useCallback(async () => {
    setIsSendingForReview(true);
    try {
      await handleRenderHtml();
      await transitionState("IN_REVIEW");
      notifySuccess("Newsletter enviado con éxito");
      navigate("/dashboard");
    } catch {
      setAiError("No se pudo enviar a revisión. Intenta de nuevo.");
    } finally {
      setIsSendingForReview(false);
    }
  }, [handleRenderHtml, navigate, transitionState, notifySuccess]);

  const handleResubmit = useCallback(async () => {
    setIsSendingForReview(true)
    try {
      await handleRenderHtml()
      await transitionState('RESUBMITTED')
      notifySuccess('Newsletter reenviado con éxito')
      navigate('/dashboard')
    } catch {
      setAiError('No se pudo reenviar a revisión. Intenta de nuevo.')
    } finally {
      setIsSendingForReview(false)
    }
  }, [handleRenderHtml, navigate, transitionState, notifySuccess])

  const handleRegenerateBlock = useCallback(
    async (blockId: string) => {
      if (!newsletter) return;
      const target = newsletter.blocks.find((b) => b.id === blockId);
      if (!target) return;

      setRegeneratingBlockId(blockId);
      setAiError(null);

      try {
        // reemplazado por: const { improvedText } = await improveText({ text: target.text })
        //const improvedText = await mockRegenerateBlock(target)
        const response = await improveText({
          text: target.text,
        });

        const improvedText = response.improvedText;
        const newBlocks = newsletter.blocks.map((b) =>
          b.id === blockId ? { ...b, text: improvedText } : b,
        );
        await updateBlocks(newBlocks);
      } catch {
        setAiError("No se pudo regenerar el bloque. Intenta de nuevo.");
      } finally {
        setRegeneratingBlockId(null);
      }
    },
    [newsletter, updateBlocks],
  );

  const handleRegenerateAll = useCallback(
    async (
      request: GenerateNewsletterRequest,
      assetSelection: NewsletterAssetSelection,
    ) => {
      if (!newsletterId) return;

      setIsRegeneratingAll(true);
      setAiError(null);

      try {
        // reemplazado por: const response = await generateNewsletterWithAi(request)
        /*await new Promise<void>((r) => window.setTimeout(r, 400))
        const newBlocks = buildMockBlocks(request)*/

        const response = await generateNewsletter(request);

        const newBlocks: NewsletterBlock[] = response.blocks.map((block) => ({
          id: block.id,
          name: block.name,
          text: block.text,
          backgroundColor: block.backgroundColor,
          comment: null,
        }));

        const updated = await updateNewsletter(newsletterId, {
          blocks: newBlocks,
          generationRequest: request,
          assetSelection,
        });
        setNewsletter(updated);
        setSelectedBlockId(newBlocks[0].id);
        setShowRegenerationForm(false);
      } catch {
        setAiError("No se pudo regenerar el newsletter. Intenta de nuevo.");
      } finally {
        setIsRegeneratingAll(false);
      }
    },
    [newsletterId],
  );

  const handleSendFeedback = useCallback(async () => {
    await transitionState("CHANGES_REQUESTED");
    if (currentUserId !== newsletter?.creatorUserId) navigate("/dashboard");
  }, [currentUserId, navigate, newsletter?.creatorUserId, transitionState]);

  const handleExportToPng = useCallback(async () => {
    setExportingFormat("PNG");
    try {
      await exportHtmlToPng();
    } finally {
      setExportingFormat(null);
    }
  }, []);

  const handleExportToEml = useCallback(async () => {
    setExportingFormat("EML");
    try {
      await exportHtmlToEml(newsletter?.renderedHtml || fallbackHtml);
    } finally {
      setExportingFormat(null);
    }
  }, [newsletter]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      switch (format) {
        case "PNG":
          await handleExportToPng();
          break;
        case "EML":
          await handleExportToEml();
          break;
      }
    },
    [handleExportToPng, handleExportToEml],
  );

  const handleCancel = useCallback(async () => {
    await transitionState("DISCARDED");
    navigate("/dashboard");
  }, [navigate, transitionState]);

  // ── Derived states ──
  const isReviewState = newsletter?.state === 'IN_REVIEW' || newsletter?.state === 'RESUBMITTED'
  const isAdmin = currentUserRole === 'ADMIN'
  const canReview = currentUserRole === 'ADMIN' || currentUserRole === 'FUNCTIONAL'
  const isCreator = currentUserId === newsletter?.creatorUserId

  // Si el newsletter está en revisión y el usuario no puede revisar, ir al dashboard
  useEffect(() => {
    if (newsletter && isReviewState && !canReview) {
      navigate('/dashboard')
    }
  }, [newsletter, isReviewState, canReview, navigate])

  const submitLabel = newsletter?.state === 'CHANGES_REQUESTED' ? 'Reenviar a revision' : 'Enviar a revision'
  const handleSubmit =
    newsletter?.state === 'CHANGES_REQUESTED'
      ? () => void handleResubmit()
      : () => void handleSendForReview()

  const handleStepClick = useCallback((step: number) => {
    if (step === 1) void transitionState('CHANGES_REQUESTED')
  }, [transitionState])

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  const pageLayout = (left: React.ReactNode, right: React.ReactNode, showStepper = true) => (
    <Box component="main" sx={{ minHeight: 'calc(100vh - 64px)', bgcolor: 'background.default' }}>
      {showStepper && (
        <NewsletterStepper
          activeStep={Math.max(1, getStepFromState(newsletter?.state))}
          onStepClick={isReviewState ? handleStepClick : undefined}
        />
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(380px, 0.72fr)' },
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
        {left}
      </Box>
      <Box sx={{ p: { xs: 2, md: 3 }, minWidth: 0 }}>
        <Stack spacing={2}>
          <Stack spacing={0.75}>
            <Typography variant="overline">
              Estado: {newsletter?.state}
            </Typography>
            <Typography variant="h4">Builder de newsletter</Typography>
            {newsletter && selectedTemplate && (
              <Typography variant="body2" color="text.secondary">
                Plantilla: {selectedTemplate.name} · BrandKit:{" "}
                {selectedBrandKitLabel}
              </Typography>
            )}
          </Stack>
          {right}
        </Stack>
      </Box>
      </Box>
    </Box>
  );

  // ── Loading ──
  if (isLoadingNewsletter) {
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

  // ── Error ──
  if (loadError || !newsletter) {
    return (
      <Box component="main" sx={{ p: 4 }}>
        <Alert severity="error">
          {loadError ?? "Newsletter no encontrado."}
        </Alert>
        <Button
          variant="outlined"
          onClick={() => navigate("/dashboard")}
          sx={{ mt: 2 }}
        >
          Volver al inicio
        </Button>
      </Box>
    );
  }

  // ── DISCARDED ──
  if (newsletter.state === "DISCARDED") {
    return (
      <Box component="main" sx={{ p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h5">Proceso descartado</Typography>
          <Alert severity="info">
            La generacion del newsletter fue cancelada y quedo archivada como
            descartada.
          </Alert>
        </Stack>
      </Box>
    );
  }

  // ── APPROVED ──
  if (newsletter.state === "APPROVED") {
    return pageLayout(
      <Stack spacing={2}>
        <Typography variant="h5">Vista final</Typography>
        {isRenderingHtml && (
          <Alert severity="info">Preparando HTML aprobado...</Alert>
        )}
        <Box
          component="iframe"
          title="Newsletter aprobado"
          srcDoc={newsletter.renderedHtml || fallbackHtml}
          sx={{
            width: "100%",
            height: "calc(100vh - 220px)",
            minHeight: 520,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            pointerEvents: "none",
          }}
        />
      </Stack>,
      <Stack spacing={2}>
        <Tabs value={0}>
          <Tab label="Exportar" />
        </Tabs>
        <Typography variant="h5">Listo para publicacion</Typography>
        <Typography variant="body2" color="text.secondary">
          El newsletter aprobado ya esta renderizado y disponible para exportar.
        </Typography>
        {exportOptions.map((opt) => (
          <Button
            key={opt.id}
            variant="contained"
            disabled={exportingFormat !== null}
            onClick={() => void handleExport(opt.format)}
          >
            {exportingFormat === opt.format ? "Exportando..." : opt.label}
          </Button>
        ))}
      </Stack>,
      false,
    )
  }

  // ── IN_REVIEW / RESUBMITTED ──
  if (isReviewState) {
    return pageLayout(
      canReview ? (
        <BlockList
          blocks={newsletter.blocks}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          readOnly
        />
      ) : (
        <PermissionDenied />
      ),
      canReview && selectedBlock ? (
        <ReviewCommentControls
          key={selectedBlock.id}
          selectedBlock={selectedBlock}
          newsletterComment={newsletter.comment}
          onSaveNewsletterComment={async (v) => {
            const updated = await updateNewsletter(newsletterId!, {
              comment: v.trim() || null,
            });
            setNewsletter(updated);
          }}
          onSaveBlockComment={async (blockId, v) => {
            const newBlocks = newsletter.blocks.map((b) =>
              b.id === blockId ? { ...b, comment: v.trim() || null } : b,
            );
            await updateBlocks(newBlocks);
          }}
          onSendFeedback={handleSendFeedback}
          onApprove={() => void transitionState("APPROVED")}
        />
      ) : (
        <PermissionDenied />
      ),
    );
  }

  // ── DRAFT / CHANGES_REQUESTED ──
  const draftPermissionDenied = !isCreator && !isAdmin

  const leftPane = draftPermissionDenied ? (
    <PermissionDenied />
  ) : (
    <BlockList
      blocks={newsletter.blocks}
      selectedBlockId={selectedBlockId}
      onSelectBlock={setSelectedBlockId}
      readOnly={false}
    />
  )

  const rightPane = draftPermissionDenied ? (
    <PermissionDenied />
  ) : (
      <>
        <Tabs
          value={showRegenerationForm ? 0 : 1}
          onChange={(_, v) => setShowRegenerationForm(v === 0)}
        >
          <Tab label="Regenerar todo" />
          <Tab label="Editar" />
        </Tabs>
        <BrandKitResourcesPanel
          selectedAssets={selectedAssets}
          resources={brandKitResources}
          isLoading={isLoadingBrandKitResources}
          loadError={brandKitResourcesError}
          defaultCollapsed
        />

        {showRegenerationForm && selectedTemplate ? (
          <Stack spacing={1}>
            <Alert severity="info">
              Modificá los datos y volvé a generar. Los bloques actuales serán
              reemplazados.
            </Alert>
            <GenerationForm
              selectedTemplate={selectedTemplate}
              selectedBrandKitId={selectedBrandKitId}
              isGenerating={isRegeneratingAll}
              aiError={aiError}
              initialValues={
                newsletter.generationRequest
                  ? requestToFormValues(newsletter.generationRequest)
                  : undefined
              }
              initialAssetSelection={newsletter.assetSelection}
              onGenerate={handleRegenerateAll}
              onCancel={() => setShowRegenerationForm(false)}
              cancelLabel="Volver a editar"
            />
          </Stack>
        ) : showRegenerationForm ? (
          <Alert severity="warning">
            No se pudo cargar la plantilla asociada a este newsletter.
          </Alert>
        ) : selectedBlock ? (
          <EditPanel
            selectedBlock={selectedBlock}
            newsletterComment={newsletter.comment}
            newsletterState={newsletter.state}
            submitLabel={submitLabel}
            isSubmitting={isSendingForReview}
            isRegeneratingBlock={regeneratingBlockId === selectedBlock.id}
            aiError={aiError}
            onUpdateText={async (blockId, value) => {
              const newBlocks = newsletter.blocks.map((b) =>
                b.id === blockId ? { ...b, text: value } : b,
              );
              await updateBlocks(newBlocks);
            }}
            onUpdateBackground={async (blockId, value) => {
              const newBlocks = newsletter.blocks.map((b) =>
                b.id === blockId ? { ...b, backgroundColor: value } : b,
              );
              await updateBlocks(newBlocks);
            }}
            onRegenerateBlock={handleRegenerateBlock}
            onRegenerateAll={() => setShowRegenerationForm(true)}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        ) : null}
      </>
    );
  return pageLayout(leftPane, rightPane);
}

export default EditNewsletterPage;

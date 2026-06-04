import { useState, type ChangeEvent } from 'react'
import {
  Alert,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  areaLabels,
  generationFieldLabels,
} from '../../../utils/newsletterTemplates'
import type { GenerateNewsletterRequest } from '../../../api/ai'
import type { NewsletterTemplate } from '../../../types/newsletter'

type FormValues = {
  topic: string
  objective: string
  audience: string
  keyMessages: string
  tone: string
  relevantDates: string
  cta: string
  contact: string
  linksOrSources: string
  additionalContext: string
}

const splitLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

const isValidUrl = (link: string): boolean => {
  try {
    const url = new URL(link)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const validateLinks = (value: string): string | null => {
  const links = splitLines(value)

  return links.length > 0 && links.some((link) => !isValidUrl(link))
    ? 'Todos los links deben ser validos (http/https).'
    : null
}

const validateDate = (value: string): string | null =>
  value.trim() && Number.isNaN(Date.parse(value))
    ? 'Debe ser una fecha valida.'
    : null

const requiredBaseFields: Array<keyof FormValues> = [
  'topic',
  'objective',
  'audience',
  'keyMessages',
  'tone',
]

type Props = {
  selectedTemplate: NewsletterTemplate
  selectedBrandKitId: string
  isGenerating: boolean
  aiError: string | null
  initialValues?: Partial<FormValues>
  onGenerate: (request: GenerateNewsletterRequest) => Promise<void>
  onCancel: () => void
  cancelLabel?: string
}

export function GenerationForm({
  selectedTemplate,
  selectedBrandKitId,
  isGenerating,
  aiError,
  initialValues,
  onGenerate,
  onCancel,
  cancelLabel = 'Cancelar',
}: Props) {
  const [form, setForm] = useState<FormValues>({
    topic: initialValues?.topic ?? '',
    objective: initialValues?.objective ?? '',
    audience: initialValues?.audience ?? '',
    keyMessages: initialValues?.keyMessages ?? '',
    tone: initialValues?.tone ?? '',
    relevantDates: initialValues?.relevantDates ?? '',
    cta: initialValues?.cta ?? '',
    contact: initialValues?.contact ?? '',
    linksOrSources: initialValues?.linksOrSources ?? '',
    additionalContext: initialValues?.additionalContext ?? '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const visibleFields = new Set([
    ...selectedTemplate.requiredGenerationFields,
    ...selectedTemplate.optionalGenerationFields,
  ])

  const allRequiredFields = new Set<keyof FormValues>([
    ...requiredBaseFields,
    ...visibleFields,
  ])

  const isFieldComplete = (field: keyof FormValues): boolean => {
    if (field === 'keyMessages' || field === 'linksOrSources') {
      return splitLines(form[field]).length > 0
    }

    return form[field].trim().length > 0
  }

  const hasInvalidOptionalValues =
    validateLinks(form.linksOrSources) !== null ||
    validateDate(form.relevantDates) !== null

  const isGenerateDisabled =
    isGenerating ||
    !selectedBrandKitId.trim() ||
    [...allRequiredFields].some((field) => !isFieldComplete(field)) ||
    hasInvalidOptionalValues

  const update = (field: keyof FormValues, value: string): void => {
    setForm((current) => ({ ...current, [field]: value }))
    setFormErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!form.topic.trim()) errors.topic = 'El tema es obligatorio.'
    if (!form.objective.trim()) errors.objective = 'El objetivo es obligatorio.'
    if (!form.audience.trim()) errors.audience = 'La audiencia es obligatoria.'
    if (splitLines(form.keyMessages).length < 1) {
      errors.keyMessages = 'Ingresa al menos un mensaje clave.'
    }
    if (!form.tone.trim()) errors.tone = 'El tono deseado es obligatorio.'

    const linkError = validateLinks(form.linksOrSources)
    if (linkError) errors.linksOrSources = linkError

    const dateError = validateDate(form.relevantDates)
    if (dateError) errors.relevantDates = dateError

    selectedTemplate.requiredGenerationFields.forEach((field) => {
      if (!form[field]?.toString().trim()) {
        errors[field] = `${generationFieldLabels[field]} es obligatorio para esta plantilla.`
      }
    })

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const submit = async (): Promise<void> => {
    if (!validate()) return

    await onGenerate({
      area: selectedTemplate.area,
      templateId: selectedTemplate.id,
      brandKitId: selectedBrandKitId,
      topic: form.topic.trim(),
      objective: form.objective.trim(),
      audience: form.audience.trim(),
      keyMessages: splitLines(form.keyMessages),
      tone: form.tone.trim(),
      relevantDates: form.relevantDates.trim() || undefined,
      cta: form.cta.trim() || undefined,
      contact: form.contact.trim() || undefined,
      linksOrSources: splitLines(form.linksOrSources),
      additionalContext: form.additionalContext.trim() || undefined,
      assetIds: [],
    })
  }

  return (
    <Stack spacing={2}>
      {aiError && <Alert severity="error">{aiError}</Alert>}
      <Alert severity="info">
        Plantilla seleccionada: {selectedTemplate.name}
      </Alert>

      <TextField
        label="Departamento o area"
        value={areaLabels[selectedTemplate.area]}
        fullWidth
        disabled
      />
      <TextField
        label="Tema del newsletter"
        required
        slotProps={{ inputLabel: { required: false } }}
        value={form.topic}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          update("topic", event.target.value)
        }
        error={!!formErrors.topic}
        helperText={formErrors.topic}
        fullWidth
      />
      <TextField
        label="Objetivo"
        required
        slotProps={{ inputLabel: { required: false } }}
        value={form.objective}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          update("objective", event.target.value)
        }
        error={!!formErrors.objective}
        helperText={formErrors.objective}
        multiline
        minRows={2}
        fullWidth
      />
      <TextField
        label="Audiencia"
        required
        slotProps={{ inputLabel: { required: false } }}
        value={form.audience}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          update("audience", event.target.value)
        }
        error={!!formErrors.audience}
        helperText={formErrors.audience}
        fullWidth
      />
      <TextField
        label="Mensajes clave"
        required
        slotProps={{ inputLabel: { required: false } }}
        value={form.keyMessages}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          update("keyMessages", event.target.value)
        }
        error={!!formErrors.keyMessages}
        helperText={formErrors.keyMessages || "Escriba un mensaje por linea."}
        multiline
        minRows={3}
        fullWidth
      />
      <TextField
        label="Tono deseado"
        required
        slotProps={{ inputLabel: { required: false } }}
        value={form.tone}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          update("tone", event.target.value)
        }
        error={!!formErrors.tone}
        helperText={formErrors.tone}
        fullWidth
      />

      {selectedTemplate.requiredGenerationFields.length > 0 && (
        <Alert severity="warning">
          Esta plantilla requiere:{" "}
          {selectedTemplate.requiredGenerationFields
            .map((field) => generationFieldLabels[field])
            .join(", ")}
        </Alert>
      )}

      {visibleFields.has("relevantDates") && (
        <TextField
          label="Fecha CTA"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          value={form.relevantDates}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update("relevantDates", event.target.value)
          }
          error={!!formErrors.relevantDates}
          helperText={formErrors.relevantDates}
          fullWidth
        />
      )}
      {visibleFields.has("cta") && (
        <TextField
          label="Texto CTA"
          value={form.cta}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update("cta", event.target.value)
          }
          error={!!formErrors.cta}
          helperText={formErrors.cta}
          fullWidth
        />
      )}
      {visibleFields.has("contact") && (
        <TextField
          label="Contacto"
          value={form.contact}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update("contact", event.target.value)
          }
          error={!!formErrors.contact}
          helperText={formErrors.contact}
          fullWidth
        />
      )}
      {visibleFields.has("linksOrSources") && (
        <TextField
          label="Link CTA"
          type="url"
          value={form.linksOrSources}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            update("linksOrSources", event.target.value);
            const error = validateLinks(event.target.value);
            setFormErrors((current) => {
              const next = { ...current };
              if (error) next.linksOrSources = error;
              else delete next.linksOrSources;
              return next;
            });
          }}
          error={!!formErrors.linksOrSources}
          helperText={formErrors.linksOrSources || "Escribi un link por linea."}
          multiline
          minRows={2}
          fullWidth
        />
      )}

      {visibleFields.has("additionalContext") && (
        <Stack spacing={2}>
          <Typography variant="h6">Contexto adicional</Typography>
          <TextField
            label="Notas adicionales"
            value={form.additionalContext}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              update("additionalContext", event.target.value)
            }
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      )}

      <Divider />

      <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
        <Button
          sx={{ flex: 1 }}
          variant="outlined"
          color="error"
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
        <Button
          sx={{ flex: 1 }}
          variant="contained"
          disabled={isGenerateDisabled}
          onClick={() => void submit()}
        >
          {isGenerating ? "Generando..." : "Generar"}
        </Button>
      </Stack>
    </Stack>
  );
}

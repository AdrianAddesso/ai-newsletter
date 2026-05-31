import { useState } from "react";
import type { ChangeEvent } from "react";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  Divider,
} from "@mui/material";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import type {
  BlockDefinitionDTO,
  BlockInstance,
  BlockEditField,
} from "@shared/types/block.types";
import { parseContent, serializeContent } from "../../utils/blockContent";

interface BlockEditorProps {
  definition: BlockDefinitionDTO;
  block: BlockInstance;
  onSave: (updated: BlockInstance) => void;
  onCancel: () => void;
}

export function BlockEditor({
  definition,
  block,
  onSave,
  onCancel,
}: BlockEditorProps) {
  const [values, setValues] = useState<Record<string, string>>(
    parseContent(block.content) as Record<string, string>,
  );

  const set = (key: string, value: string): void =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSave = (): void =>
    onSave({ ...block, content: serializeContent(values) });

  const hasRequiredEmpty = definition.editFields
    .filter((field) => field.required)
    .some((field) => !values[field.key]?.trim());

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: 2,
        minWidth: 280,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {definition.label}
      </Typography>
      <Divider />

      {definition.editFields.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Este bloque no tiene campos editables.
        </Typography>
      )}

      {definition.editFields.map((field) => (
        <FieldInput
          key={field.key}
          field={field}
          value={values[field.key] ?? ""}
          onChange={(value) => set(field.key, value)}
        />
      ))}

      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", pt: 1 }}>
        <Button onClick={onCancel} size="small" variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          size="small"
          variant="contained"
          disabled={hasRequiredEmpty}
        >
          Guardar
        </Button>
      </Box>
    </Box>
  );
}

interface FieldInputProps {
  field: BlockEditField;
  value: string;
  onChange: (value: string) => void;
}

function FieldInput({ field, value, onChange }: FieldInputProps) {
  const commonProps = {
    label: field.label,
    value,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
    placeholder: field.placeholder,
    required: field.required,
    size: "small" as const,
    fullWidth: true,
  };

  if (field.type === "select" && field.options) {
    return (
      <TextField select {...commonProps}>
        {field.options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  if (field.type === "textarea") {
    return <TextField {...commonProps} multiline minRows={3} />;
  }

  if (field.type === "color") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <TextField {...commonProps} />
        <input
          type="color"
          value={value || "#ffffff"}
          onChange={(event) => onChange(event.target.value)}
          style={{
            width: 36,
            height: 36,
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
          }}
        />
      </Box>
    );
  }

  if (field.type === "font-size") {
    const sizes = [
      { label: "XS", value: "0.75rem" },
      { label: "S", value: "0.875rem" },
      { label: "M", value: "1rem" },
      { label: "L", value: "1.25rem" },
      { label: "XL", value: "1.5rem" },
      { label: "XXL", value: "2rem" },
    ];

    return (
      <TextField select {...commonProps}>
        {sizes.map((size) => (
          <MenuItem key={size.value} value={size.value}>
            {size.label} - {size.value}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  if (field.type === "font-style") {
    const active = value ? value.split(",").filter(Boolean) : [];

    return (
      <Box>
        <Typography
          variant="caption"
          sx={{ mb: 0.5, display: "block", color: "text.secondary" }}
        >
          {field.label}
        </Typography>
        <ToggleButtonGroup
          value={active}
          onChange={(_event, next: string[]) => onChange(next.join(","))}
          size="small"
          aria-label="text style"
        >
          <ToggleButton value="bold" aria-label="bold">
            <FormatBoldIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="italic" aria-label="italic">
            <FormatItalicIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    );
  }

  if (field.type === "font-family") {
    return <TextField {...commonProps} />;
  }

  return (
    <TextField
      {...commonProps}
      type={field.type === "url" ? "url" : "text"}
    />
  );
}

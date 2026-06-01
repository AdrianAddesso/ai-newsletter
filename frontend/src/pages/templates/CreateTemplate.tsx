import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import { useTemplateStore } from '../../stores/templates.store'
import { useNotification } from '../../hooks/useNotification'
import { Template } from '../../components/canvas/Template'
import { StructureControl } from '../../components/canvas/StructureControl'
import { EditorControl } from '../../components/canvas/EditorControl'
import { TAB_LABELS} from '@shared/enums/tab-enum'

export function CreateTemplate() {
  const navigate = useNavigate()
  const { success, error } = useNotification()
  const [activeTab, setActiveTab] = useState(0)

  const { isSkeletonView, setIsSkeletonView, saveTemplate, resetStore, rows } = useTemplateStore()

  useEffect(() => {
    resetStore({})
  }, [resetStore])

  const handleConfirmStructure = () => {
    setIsSkeletonView(false)
    setActiveTab(1)
  }

  const handleSaveTemplate = async () => {
    try {
      const res = await saveTemplate()
      success(res?.message || 'Template creado exitosamente')
      navigate("/templates");
    } catch (err:unknown) {
      if(err instanceof Error) {
        error(err.message || 'Error al guardar el template')
      }
    }
  }

  const isSaveDisabled = !rows.some(row => row.columns.some(col => col.type))
  
  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "calc(100vh - 64px)" }}>
      <Box
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid",
          borderColor: "divider",
          px: 3,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <IconButton
          size="small"
          onClick={() => navigate(-1)}
          sx={{ color: "text.secondary" }}
        >
          <ChevronLeftIcon />
        </IconButton>
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Nuevo Template</Typography>
          <Chip label="Borrador" size="small" variant="outlined" sx={{ color: "warning.dark", borderColor: "warning.main" }}/>
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          p: 2,
          height: "calc(100vh - 64px - 65px)",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            flex: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "grey.50",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {isSkeletonView ? "Diseño de Estructura" : "Edición de Contenido"}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: "auto", p: 4, bgcolor: "#E5E5E5" }}>
            <Template />
          </Box>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="fullWidth"
              sx={{
                "& .MuiTab-root": { fontWeight: 600, fontSize: 13 },
                "& .MuiTabs-indicator": { bgcolor: "brand.red" },
                "& .Mui-selected": { color: "brand.red !important" },
              }}
            >
              {TAB_LABELS.map((label: string, i: number) => (
                <Tab
                  key={label}
                  label={label}
                  value={i}
                  disabled={isSkeletonView && i === 1}
                />
              ))}
            </Tabs>
          </Box>
          <Box sx={{ flex: 1, overflow: "auto", p: 2.5 }}>
            {activeTab === 0 && (
              <StructureControl onConfirm={handleConfirmStructure} />
            )}
            {activeTab === 1 && <EditorControl />}
          </Box>
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
            }}
          >
            {!isSkeletonView && activeTab === 1 && (
              <Button
                variant="contained"
                fullWidth
                onClick={handleSaveTemplate}
                disabled={isSaveDisabled}
              >
                Guardar Template
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

import { useEffect,useState } from 'react'

import type {
  ExportOption,
  ExportFormat,
} from '../../../types/newsletter'

export function useNewsletterExport() {
  const [exportOptions,setExportOptions] =
    useState<ExportOption[]>([])

  const [exportingFormat,setExportingFormat] =
    useState<ExportFormat | null>(null)

  useEffect(() => {
    const loadOptions = async () => {
      const options: ExportOption[] = [
        {
          id:'png',
          label:'Exportar PNG',
          format:'PNG',
        },
        {
          id:'eml',
          label:'Exportar EML',
          format:'EML',
        },
      ]

      setExportOptions(options)
    }

    void loadOptions()
  }, [])

  return {
    exportOptions,
    exportingFormat,
    setExportingFormat,
  }
}
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
          id:'jpg',
          label:'Exportar JPG',
          format:'JPG',
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

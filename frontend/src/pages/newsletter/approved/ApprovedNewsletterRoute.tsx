import { ApprovedNewsletterPage } from './ApprovedNewsletterPage'

import { useNewsletterEditor } from '../hooks/useNewsletterEditor'

export function ApprovedNewsletterRoute() {
  const editor = useNewsletterEditor()

  if (!editor.newsletter) return null

  return (
    <ApprovedNewsletterPage
      newsletter={editor.newsletter}
      exportOptions={editor.exportOptions}
      exportingFormat={editor.exportingFormat}
      onExport={editor.handleExport}
    />
  )
}

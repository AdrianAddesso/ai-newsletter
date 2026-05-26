import { ApprovedNewsletterPage } from './ApprovedNewsletterPage'

import { useNewsletterEditor } from '../hooks/useNewsletterEditor'

export function ApprovedNewsletterRoute() {
  const vm = useNewsletterEditor()

  if (!vm.newsletter) return null

  return (
    <ApprovedNewsletterPage
      newsletter={vm.newsletter}
      exportOptions={vm.exportOptions}
      exportingFormat={vm.exportingFormat}
      onExport={vm.handleExport}
    />
  )
}
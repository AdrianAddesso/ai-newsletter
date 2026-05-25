import { useNewsletterEditor } from '../hooks/useNewsletterEditor'

import { NewsletterViewer } from '../viewer/NewsletterViewer'
import { NewsletterEditorLayout } from '../editor/NewsletterEditorLayout'
import { NewsletterEditorSidebar } from '../editor/NewsletterEditorSidebar'
import { NewsletterEditTabs } from '../editor/NewsletterEditTabs'

import { EditPanel } from '../components/EditPanel'
import { GenerationForm } from '../components/GenerationForm'
import type { GenerateNewsletterRequest } from '../../../api/ai'

type Props = {
  vm: ReturnType<typeof useNewsletterEditor>
}

export function DraftNewsletterPage({ vm }: Props) {
  if (!vm.newsletter) return null

  return (
    <NewsletterEditorLayout
      left={
        <NewsletterViewer
          newsletter={vm.newsletter}
          selectedBlockId={vm.selectedBlockId}
          onSelectBlock={vm.setSelectedBlockId}
        />
      }
      right={
        <NewsletterEditorSidebar>
          <NewsletterEditTabs
            showRegenerationForm={vm.showRegenerationForm}
            onChange={vm.setShowRegenerationForm}
          />

          {vm.showRegenerationForm && vm.selectedTemplate ? (
            <GenerationForm
              selectedTemplate={vm.selectedTemplate}
              selectedBrandKitId={vm.newsletter.brandKitId ?? ''}
              isGenerating={false}
              aiError={null}
              initialValues={
                vm.newsletter.generationContent?.originalContent
                  ? requestToFormValues(vm.newsletter.generationContent.originalContent)
                  : undefined
              }
              onGenerate={vm.handleGenerateAll}
              onCancel={() => vm.setShowRegenerationForm(false)}
            />
          ) : vm.showRegenerationForm ? (
            null
          ) : (
            vm.selectedBlock && (
              <EditPanel
                selectedBlock={vm.selectedBlock}
                brandKitResources={vm.brandKitResources}
                newsletterComment={vm.newsletter.comment}
                newsletterState={vm.newsletter.state}
                submitLabel="Enviar a revisión"
                isSubmitting={false}
                isSavingDraft={vm.isSavingDraft}
                isRegeneratingBlock={false}
                aiError={null}
                onUpdateBlock={(updatedBlock) => {
                  if (!vm.newsletter) return

                  vm.updateBlocks(
                    vm.newsletter.blocks.map((block) =>
                      block.id === updatedBlock.id ? updatedBlock : block,
                    ),
                  )
                }}
                onSaveDraft={vm.saveDraft}
                onRegenerateBlock={vm.handleRegenerateBlock}
                onRegenerateAll={() =>
                  vm.setShowRegenerationForm(true)
                }
                onSubmit={vm.handleSubmit}
                onCancel={() =>
                  void vm.transitionState('DISCARDED')
                }
              />
            )
          )}
        </NewsletterEditorSidebar>
      }
    />
  )
}

function requestToFormValues(req: GenerateNewsletterRequest) {
  return {
    topic: req.topic,
    objective: req.objective,
    audience: req.audience,
    keyMessages: req.keyMessages.join('\n'),
    tone: req.tone,
    relevantDates: req.relevantDates ?? '',
    cta: req.cta ?? '',
    contact: req.contact ?? '',
    linksOrSources: (req.linksOrSources ?? []).join('\n'),
    additionalContext: req.additionalContext ?? '',
  }
}

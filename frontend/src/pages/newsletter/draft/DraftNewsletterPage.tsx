import type { GenerateNewsletterRequest } from '../../../api/ai'
import { useNewsletterEditor } from '../hooks/useNewsletterEditor'

import { NewsletterViewer } from '../viewer/NewsletterViewer'
import { NewsletterEditorLayout } from '../editor/NewsletterEditorLayout'
import { NewsletterEditorSidebar } from '../editor/NewsletterEditorSidebar'
import { NewsletterEditTabs } from '../editor/NewsletterEditTabs'

import { EditPanel } from '../components/EditPanel'
import { GenerationForm } from '../components/GenerationForm'

type Props = {
  editor: ReturnType<typeof useNewsletterEditor>
}

export function DraftNewsletterPage({ editor }: Props) {
  if (!editor.newsletter) return null

  return (
    <NewsletterEditorLayout
      left={
        <NewsletterViewer
          newsletter={editor.newsletter}
          selectedBlockId={editor.selectedBlockId}
          onSelectBlock={editor.setSelectedBlockId}
        />
      }
      right={
        <NewsletterEditorSidebar>
          <NewsletterEditTabs
            showRegenerationForm={editor.showRegenerationForm}
            onChange={editor.setShowRegenerationForm}
          />

          {editor.showRegenerationForm && editor.selectedTemplate ? (
            <GenerationForm
              selectedTemplate={editor.selectedTemplate}
              selectedBrandKitId={editor.newsletter.brandKitId ?? ''}
              isGenerating={editor.isGeneratingAll}
              aiError={editor.aiError}
              initialValues={
                editor.newsletter.generationContent?.originalContent
                  ? requestToFormValues(editor.newsletter.generationContent.originalContent)
                  : undefined
              }
              onGenerate={editor.handleGenerateAll}
              onCancel={() => editor.setShowRegenerationForm(false)}
              cancelLabel="Volver"
            />
          ) : editor.showRegenerationForm ? (
            null
          ) : (
            editor.selectedBlock && (
              <EditPanel
                selectedBlock={editor.selectedBlock}
                brandKitResources={editor.brandKitResources}
                newsletterState={editor.newsletter.state}
                reviewHistory={editor.selectedBlockReviewHistory}
                submitLabel={
                  editor.newsletter.state === 'CHANGES_REQUESTED'
                    ? 'Reenviar a revisión'
                    : 'Enviar a revisión'
                }
                saveLabel={
                  editor.newsletter.state === 'CHANGES_REQUESTED'
                    ? 'Guardar cambios'
                    : 'Guardar borrador'
                }
                isSubmitting={false}
                isSavingDraft={editor.isSavingDraft}
                isRegeneratingBlock={editor.regeneratingBlockId === editor.selectedBlock.id}
                aiError={editor.aiError}
                onUpdateBlock={(updatedBlock) => {
                  if (!editor.newsletter) return

                  editor.updateBlocks(
                    editor.newsletter.blocks.map((block) =>
                      block.id === updatedBlock.id ? updatedBlock : block,
                    ),
                  )
                }}
                onSaveDraft={editor.saveDraft}
                onRegenerateBlock={editor.handleRegenerateBlock}
                onRegenerateAll={() => editor.setShowRegenerationForm(true)}
                onSubmit={editor.handleSubmit}
                onCancel={() => {
                  void (async () => {
                    try {
                      await editor.transitionState('DISCARDED')
                      editor.navigate('/dashboard')
                    } catch (error) {
                      console.error(error)
                    }
                  })()
                }}
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

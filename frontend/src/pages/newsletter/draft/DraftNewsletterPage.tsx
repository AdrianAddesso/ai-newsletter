import { useNewsletterEditor } from '../hooks/useNewsletterEditor'

import { NewsletterViewer } from '../viewer/NewsletterViewer'
import { NewsletterEditorLayout } from '../editor/NewsletterEditorLayout'
import { NewsletterEditorSidebar } from '../editor/NewsletterEditorSidebar'
import { NewsletterEditTabs } from '../editor/NewsletterEditTabs'

import { EditPanel } from '../components/EditPanel'
import { GenerationForm } from '../components/GenerationForm'

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

          {vm.showRegenerationForm ? (
            <GenerationForm
              selectedTemplate={vm.templates[0]}
              selectedBrandKitId={vm.newsletter.brandKitId ?? ''}
              isGenerating={false}
              aiError={null}
              onGenerate={vm.handleGenerateAll}
              onCancel={() => vm.setShowRegenerationForm(false)}
            />
          ) : (
            vm.selectedBlock && (
              <EditPanel
                selectedBlock={vm.selectedBlock}
                newsletterComment={vm.newsletter.comment}
                newsletterState={vm.newsletter.state}
                submitLabel="Enviar a revisión"
                isSubmitting={false}
                isRegeneratingBlock={false}
                aiError={null}
                onUpdateText={(blockId,value) => {
                  if (!vm.newsletter) return

                  vm.updateBlocks(
                    vm.newsletter.blocks.map(block =>
                      block.id === blockId
                        ? { ...block,text:value }
                        : block,
                    ),
                  )
                }}
                onUpdateBackground={(blockId,value) => {
                  if (!vm.newsletter) return

                  vm.updateBlocks(
                    vm.newsletter.blocks.map(block =>
                      block.id === blockId
                        ? {
                            ...block,
                            backgroundColor:value,
                          }
                        : block,
                    ),
                  )
                }}
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
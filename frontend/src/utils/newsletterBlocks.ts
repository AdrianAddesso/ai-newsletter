import type { GeneratedNewsletterBlock } from '../api/ai'
import type {
  NewsletterBlock,
  NewsletterBlockField,
  TemplateLayoutBlock,
} from '../types/newsletter'

const textFieldLabels = ['Texto principal', 'Texto secundario', 'Texto terciario']
const labelFieldLabels = ['Etiqueta principal', 'Etiqueta secundaria']
const assetFieldLabels = ['Asset principal', 'Asset secundario']

export function buildNewsletterBlocksFromTemplate(
  layout: TemplateLayoutBlock[] | null,
  aiBlocks: GeneratedNewsletterBlock[],
): NewsletterBlock[] {
  const sourceLayout =
    layout && layout.length > 0
      ? layout
      : aiBlocks.map((block, index) => ({
          type: null,
          block_type: 'textCenterBackgroundFull',
          content: block.text,
          row: index,
          grid_column: 0,
          display_order: index,
          mustFill: true,
        }))

  let textCursor = 0

  return sourceLayout.map((layoutBlock, index) => {
    const type = layoutBlock.type ?? layoutBlock.block_type ?? 'textCenterBackgroundFull'
    const fieldPlan = inferFieldPlan(type)
    const fields: NewsletterBlockField[] = []

    for (let i = 0; i < fieldPlan.text; i += 1) {
      const aiText = aiBlocks[textCursor % Math.max(aiBlocks.length, 1)]?.text
      fields.push({
        id: `${type}-${index}-text-${i}`,
        kind: 'text',
        label: textFieldLabels[i] ?? `Texto ${i + 1}`,
        value: layoutBlock.content ?? aiText ?? '',
      })
      textCursor += 1
    }

    for (let i = 0; i < fieldPlan.label; i += 1) {
      const aiText = aiBlocks[textCursor % Math.max(aiBlocks.length, 1)]?.name
      fields.push({
        id: `${type}-${index}-label-${i}`,
        kind: 'label',
        label: labelFieldLabels[i] ?? `Etiqueta ${i + 1}`,
        value: aiText ?? '',
      })
      textCursor += 1
    }

    for (let i = 0; i < fieldPlan.asset; i += 1) {
      fields.push({
        id: `${type}-${index}-asset-${i}`,
        kind: 'asset',
        label: assetFieldLabels[i] ?? `Asset ${i + 1}`,
        assetId: null,
        assetName: null,
        assetUrl: null,
        keywordText: null,
      })
    }

    const primaryText = fields.find((field) => field.kind !== 'asset')?.value ?? null

    return {
      id: `${type}-${layoutBlock.row}-${layoutBlock.grid_column}-${index}`,
      type,
      category: inferCategory(type),
      name: humanizeBlockType(type),
      content: primaryText,
      row: layoutBlock.row,
      gridColumn: layoutBlock.grid_column,
      displayOrder: layoutBlock.display_order,
      mustFill: layoutBlock.mustFill ?? true,
      comment: null,
      fields,
    }
  })
}

export function updateBlockField(
  block: NewsletterBlock,
  fieldId: string,
  value: Partial<NewsletterBlockField>,
): NewsletterBlock {
  const fields = block.fields.map((field) =>
    field.id === fieldId ? { ...field, ...value } : field,
  )
  const primaryText = fields.find((field) => field.kind !== 'asset')?.value ?? null

  return {
    ...block,
    content: primaryText,
    fields,
  }
}

function inferFieldPlan(type: string): { text: number; label: number; asset: number } {
  const lowerType = type.toLowerCase()
  const text = lowerType.includes('textdouble') ? 2 : lowerType.includes('text') || lowerType.includes('cta') || lowerType.includes('icon') || lowerType.includes('special') ? 1 : 0
  const label = lowerType.includes('labeltextlabel') ? 2 : lowerType.includes('label') ? 1 : 0
  const asset =
    lowerType === 'headerfull'
      ? 2
      : lowerType.includes('imagebackground') || lowerType.includes('special')
        ? 2
        : lowerType.includes('image') || lowerType.includes('header') || lowerType.includes('icon') || lowerType.includes('background')
          ? 1
          : 0

  if (text === 0 && label === 0 && asset === 0) {
    return { text: 1, label: 0, asset: 0 }
  }

  return { text, label, asset }
}

function inferCategory(type: string): string {
  const lowerType = type.toLowerCase()

  if (lowerType.includes('header')) return 'LAYOUT'
  if (lowerType.includes('image')) return 'MULTIMEDIA'
  if (lowerType.includes('icon')) return 'ICONS'
  if (lowerType.includes('cta')) return 'BASE'
  if (lowerType.includes('special')) return 'SPECIAL'

  return 'CONTENT'
}

function humanizeBlockType(type: string): string {
  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (value) => value.toUpperCase())
}

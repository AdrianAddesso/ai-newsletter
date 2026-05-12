export type DemoPage =
  | 'assets'
  | 'colors'
  | 'typography'
  | 'components'

export type Swatch = {
  name: string
  value: string
  text?: string
}

export const pageTabs: Array<{
  id: DemoPage
  label: string
}> = [
  {
    id: 'assets',
    label: 'Assets',
  },
  {
    id: 'colors',
    label: 'Color',
  },
  {
    id: 'typography',
    label: 'Tipografia',
  },
  {
    id: 'components',
    label: 'Componentes',
  },
]

export const sampleText =
  'Historias internas claras, consistentes y listas para publicarse.'
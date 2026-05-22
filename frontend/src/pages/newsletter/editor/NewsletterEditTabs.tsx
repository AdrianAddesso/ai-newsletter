import {
  Tab,
  Tabs,
} from '@mui/material'

type Props = {
  showRegenerationForm: boolean
  onChange: (show: boolean) => void
}

export function NewsletterEditTabs({
  showRegenerationForm,
  onChange,
}: Props) {
  return (
    <Tabs
      value={showRegenerationForm ? 0 : 1}
      onChange={(_, v) => onChange(v === 0)}
    >
      <Tab label="Regenerar todo" />
      <Tab label="Editar" />
    </Tabs>
  )
}
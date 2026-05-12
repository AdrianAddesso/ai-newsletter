import {
  Typography,
} from '@mui/material'

type Props = {
  title: string
}

export function UnderConstructionPage({
  title,
}: Props) {
  return (
    <Typography className="titulo-templates">
      Página de {title} en construcción
    </Typography>
  )
}
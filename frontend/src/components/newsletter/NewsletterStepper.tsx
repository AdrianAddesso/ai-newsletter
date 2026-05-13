import { Box, Step, StepLabel, Stepper } from '@mui/material'
import type { StepIconProps } from '@mui/material/StepIcon'
import type { NewsletterState } from '../../types/newsletter'

const STEPS = ['Borrador', 'Editar', 'En revisión']

export function getStepFromState(state: NewsletterState | undefined): number {
  switch (state) {
    case 'DRAFT': return 0
    case 'CHANGES_REQUESTED': return 1
    case 'IN_REVIEW':
    case 'RESUBMITTED': return 2
    default: return 0
  }
}

function StepNumberIcon({ active, completed, icon }: StepIconProps) {
  return (
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        bgcolor: active || completed ? 'primary.main' : 'grey.400',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: 600,
      }}
    >
      {icon}
    </Box>
  )
}

interface Props {
  activeStep: number
  onStepClick?: (step: number) => void
}

export function NewsletterStepper({ activeStep, onStepClick }: Props) {
  return (
    <Box
      sx={{
        px: { xs: 2, md: 4 },
        py: 1.5,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stepper activeStep={activeStep} alternativeLabel nonLinear>
        {STEPS.map((label, index) => {
          const clickable = !!onStepClick && index < activeStep
          return (
            <Step key={label} completed={index < activeStep}>
              <StepLabel
                slots={{ stepIcon: StepNumberIcon }}
                onClick={clickable ? () => onStepClick(index) : undefined}
                sx={clickable ? { cursor: 'pointer' } : undefined}
              >
                {label}
              </StepLabel>
            </Step>
          )
        })}
      </Stepper>
    </Box>
  )
}

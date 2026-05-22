import { useNavigate } from 'react-router';
import { Box, Stepper, Step, StepLabel, StepButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { StepIconProps } from '@mui/material/StepIcon';

type UserRole = 'ADMIN' | 'FUNCTIONAL' | 'USER';

interface CreationStepperProps {
  /** 0 = Generar | 1 = Editar | 2 = Exportar */
  activeStep: 0 | 1 | 2;
  /** ID del newsletter (necesario para navegar a /editarNewsletter/:id) */
  newsletterId?: string;
  /** Rol del usuario autenticado */
  userRole: UserRole;
  /** Callback opcional para override de navegacion */
  onStepClick?: (step: number) => void;
}

const CREATION_STEPS = [
  { label: 'Generar',  path: () => '/crearNewsletter' },
  { label: 'Editar',   path: (id?: string) => `/editarNewsletter/${id}` },
  { label: 'Exportar', path: (id?: string) => `/exportarNewsletter/${id}` },
];

const ROLES_WITH_EXPORT: UserRole[] = ['ADMIN', 'FUNCTIONAL'];

const StepIconRoot = styled('div')<{
  ownerState: { active: boolean; completed: boolean; disabled: boolean };
}>(({ ownerState }) => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'inherit',
  fontSize: '0.85rem',
  fontWeight: 700,
  transition: 'background 0.2s, color 0.2s',
  ...(ownerState.active && {
    backgroundColor: '#FF595A',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(255,89,90,0.35)',
  }),
  ...(ownerState.completed && {
    backgroundColor: '#FF595A',
    color: '#fff',
  }),
  ...(!ownerState.active && !ownerState.completed && {
    backgroundColor: '#E0E0E0',
    color: '#9E9E9E',
  }),
}));

function CustomStepIcon(props: StepIconProps) {
  const { active, completed, className, icon } = props;
  const disabled = !active && !completed;
  return (
    <StepIconRoot ownerState={{ active: !!active, completed: !!completed, disabled }} className={className}>
      {completed ? '✓' : icon}
    </StepIconRoot>
  );
}

export default function CreationFlowStepper({
  activeStep,
  newsletterId,
  userRole,
  onStepClick,
}: CreationStepperProps) {
  const navigate = useNavigate();
  const canExport = ROLES_WITH_EXPORT.includes(userRole);
  const steps = canExport ? CREATION_STEPS : CREATION_STEPS.slice(0, 2);

  const handleStepClick = (index: number) => {
    if (index > activeStep) return;
    if (index > 0 && !newsletterId) return;

    if (onStepClick) {
      onStepClick(index);
      return;
    }

    const targetPath = steps[index].path(newsletterId);
    navigate(targetPath);
  };

  return (
    <Box sx={{ width: '100%', borderBottom: '1px solid #EBEBEB', backgroundColor: '#fff', px: { xs: 2, md: 4 }, py: 2 }}>
      <Stepper
        activeStep={activeStep}
        nonLinear
        sx={{
          maxWidth: canExport ? 480 : 360,
          '& .MuiStepConnector-line': { borderColor: '#E0E0E0', borderTopWidth: 2 },
          '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': { borderColor: '#FF595A' },
        }}
      >
        {steps.map((step, index) => {
          const isCompleted = index < activeStep;
          const isActive = index === activeStep;
          const isDisabled = index > activeStep;
          return (
            <Step key={step.label} completed={isCompleted}>
              <StepButton
                onClick={() => handleStepClick(index)}
                disabled={isDisabled}
                sx={{ cursor: isDisabled ? 'default' : 'pointer', '&:hover': { backgroundColor: isDisabled ? 'transparent' : 'rgba(255,89,90,0.06)', borderRadius: 2 } }}
              >
                <StepLabel
                  slots={{ stepIcon: CustomStepIcon }}
                  sx={{ '& .MuiStepLabel-label': { fontWeight: isActive ? 700 : 400, fontSize: '0.875rem', color: isDisabled ? '#BDBDBD' : isActive ? '#FF595A' : '#30261D', transition: 'color 0.2s' } }}
                >
                  {step.label}
                </StepLabel>
              </StepButton>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
}

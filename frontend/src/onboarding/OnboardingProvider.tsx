/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import './onboarding.css'
import { useLocation } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { findTour } from './tourRegistry'

interface OnboardingContextValue {
  canStartCurrentTour: boolean
  currentTourTitle: string | null
  startCurrentTour: () => void
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const location = useLocation()
  const { user } = useAuth()
  const currentTour = user ? findTour(location.pathname, user.role) : null

  const startCurrentTour = useCallback((): void => {
    if (!currentTour) {
      return
    }

    const visibleSteps: DriveStep[] = currentTour.steps
      .filter((step) => document.querySelector(step.selector) !== null)
      .map((step) => ({
        element: step.selector,
        popover: {
          title: step.title,
          description: step.description,
          side: step.side,
          align: step.align,
        },
      }))

    if (visibleSteps.length === 0) {
      return
    }

    const tourDriver = driver({
      steps: visibleSteps,
      animate: true,
      allowClose: true,
      overlayClickBehavior: 'close',
      showProgress: true,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      progressText: '{{current}} de {{total}}',
      popoverClass: 'app-onboarding-popover',
    })

    window.requestAnimationFrame(() => tourDriver.drive())
  }, [currentTour])

  const value = useMemo<OnboardingContextValue>(() => ({
    canStartCurrentTour: currentTour !== null,
    currentTourTitle: currentTour?.title ?? null,
    startCurrentTour,
  }), [currentTour, startCurrentTour])

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext)

  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }

  return context
}

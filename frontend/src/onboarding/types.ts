import type { UserRole } from '../contexts/AuthContext'

export type TourId =
  | 'dashboard'
  | 'template-library'
  | 'newsletter-create'
  | 'newsletter-edit'
  | 'newsletter-export'
  | 'reviews'
  | 'review-detail'
  | 'templates'
  | 'template-create'
  | 'template-edit'
  | 'users'
  | 'analytics'
  | 'admin'
  | 'brandkit'

export interface TourStep {
  selector: string
  title: string
  description: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}

export interface TourDefinition {
  id: TourId
  title: string
  pathPattern: RegExp
  roles: UserRole[]
  steps: TourStep[]
}

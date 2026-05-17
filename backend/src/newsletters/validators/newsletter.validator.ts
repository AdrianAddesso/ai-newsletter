import { BadRequestException } from '@nestjs/common';
import { newsletter_state } from '@prisma/client';

interface LogDataInput {
  previousState?: newsletter_state;
  newState?: newsletter_state;
  allCommentaries?: string;
}

export function validateNewsletterStateLogTransition(
  currentNewsletterState: newsletter_state,
  logData: LogDataInput
): void {
  if (logData.newState === 'CHANGES_REQUESTED') {
    const allowedStates: newsletter_state[] = ['IN_REVIEW', 'RESUBMITTED'];
    
    if (!allowedStates.includes(currentNewsletterState)) {
      throw new BadRequestException(
        `Solo se pueden solicitar ajustes en estados IN_REVIEW o RESUBMITTED. Estado actual: ${currentNewsletterState}`
      );
    }
    if (!logData.allCommentaries || logData.allCommentaries.trim() === '') {
        throw new BadRequestException('Debe incluir los comentarios/motivos para solicitar ajustes.');
    }
    
  }


  // [TAREA 3]: Registrar cada exportación (APPROVED -> APPROVED)
  if (logData.previousState === 'APPROVED' && logData.newState === 'APPROVED') {
    if (currentNewsletterState !== 'APPROVED') {
      throw new BadRequestException(
        `No se puede registrar la exportación. El newsletter debe estar APPROVED (Estado actual: ${currentNewsletterState})`
      );
    }
  }
}
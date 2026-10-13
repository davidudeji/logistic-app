import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
    retryable: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class AlmErrorHandlerService {
  handleError(error: HttpErrorResponse): Observable<never> {
    let structuredError: ApiErrorResponse['error'];

    if (error.error && typeof error.error === 'object' && error.error.error) {
      structuredError = error.error.error;
    } else {
      let code = 'INTERNAL_ERROR';
      let retryable = false;

      if (error.status === 0) {
        code = 'NETWORK_UNAVAILABLE';
        retryable = true;
      } else if (error.status === 401) {
        code = 'UNAUTHORIZED';
      } else if (error.status === 403) {
        code = 'FORBIDDEN';
      } else if (error.status === 404) {
        code = 'NOT_FOUND';
      } else if (error.status === 429) {
        code = 'RATE_LIMIT_EXCEEDED';
        retryable = true;
      } else if (error.status >= 500) {
        code = 'SERVER_ERROR';
        retryable = true;
      }

      structuredError = {
        code,
        message: error.message || 'An unexpected error occurred in the ALM module.',
        requestId: `client_req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        retryable,
      };
    }

    return throwError(() => structuredError);
  }
}

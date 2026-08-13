export interface MonetizationDiagnostic {
  readonly severity: 'warning' | 'error';
  readonly code: string;
  readonly message: string;
  readonly target?: 'android' | 'ios';
  readonly productId?: string;
  readonly locale?: string;
}

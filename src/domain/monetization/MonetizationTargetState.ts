import type { MonetizationDiagnostic } from './MonetizationDiagnostic';
import type { MonetizationObservedProduct } from './MonetizationObservedProduct';

export interface MonetizationTargetState {
  readonly target: 'android' | 'ios';
  readonly products: readonly MonetizationObservedProduct[];
  readonly subscriptionFamilies: readonly string[];
  readonly diagnostics: readonly MonetizationDiagnostic[];
}

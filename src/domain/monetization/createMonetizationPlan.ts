import type { MonetizationDesiredState } from './MonetizationDesiredState';
import type { MonetizationDiagnostic } from './MonetizationDiagnostic';
import type { MonetizationObservedProduct } from './MonetizationObservedProduct';
import type { MonetizationPlan } from './MonetizationPlan';
import type { MonetizationPlanStep } from './MonetizationPlanStep';
import type { MonetizationProduct } from './MonetizationProduct';
import type { MonetizationTargetState } from './MonetizationTargetState';

const OPERATION_RANK: Readonly<Record<MonetizationPlanStep['operation'], number>> = {
  'ensure-subscription-family': 0,
  'create-product': 1,
  'update-metadata': 2,
  'update-subscription': 3,
  'update-price': 4,
};

export function createMonetizationPlan(options: {
  readonly desired: MonetizationDesiredState;
  readonly currentRevision: string;
  readonly states: readonly MonetizationTargetState[];
}): MonetizationPlan {
  const diagnostics = options.states.flatMap((state) => [
    ...state.diagnostics,
    ...kindDiagnostics(options.desired, state),
  ]);
  const steps = options.states.flatMap((state) => createTargetSteps(options.desired, state));
  const blocked = diagnostics.some((item) => item.severity === 'error');
  return {
    status: blocked ? 'blocked' : steps.length === 0 ? 'no-change' : 'changes',
    desiredRevision: options.desired.revision,
    currentRevision: options.currentRevision,
    steps: steps.slice().sort(compareSteps),
    diagnostics,
  };
}

function createTargetSteps(
  desired: MonetizationDesiredState,
  state: MonetizationTargetState,
): MonetizationPlanStep[] {
  return desired.products.flatMap((product) => productSteps(product, state));
}

function productSteps(
  desired: MonetizationProduct,
  state: MonetizationTargetState,
): MonetizationPlanStep[] {
  const steps = familySteps(desired, state);
  const current = state.products.find((product) => product.id === desired.id);
  if (current === undefined) return [...steps, step(state, desired.id, 'create-product')];
  if (!kindCompatible(desired, current)) return steps;
  if (!same(desired.localizations, current.localizations)) {
    steps.push(step(state, desired.id, 'update-metadata'));
  }
  if (desired.kind === 'subscription' && !same(desired.subscription, current.subscription)) {
    steps.push(step(state, desired.id, 'update-subscription'));
  }
  if (!same(desired.basePrice, current.basePrice)) {
    steps.push(step(state, desired.id, 'update-price'));
  }
  return steps;
}

function familySteps(
  product: MonetizationProduct,
  state: MonetizationTargetState,
): MonetizationPlanStep[] {
  const family = product.subscription?.family;
  if (
    state.target !== 'ios' ||
    family === undefined ||
    state.subscriptionFamilies.includes(family)
  ) {
    return [];
  }
  return [step(state, product.id, 'ensure-subscription-family')];
}

function kindDiagnostics(
  desired: MonetizationDesiredState,
  state: MonetizationTargetState,
): MonetizationDiagnostic[] {
  return desired.products.flatMap((product) => {
    const current = state.products.find((item) => item.id === product.id);
    if (current === undefined || kindCompatible(product, current)) return [];
    return [
      {
        severity: 'error',
        code: 'MONETIZATION_PRODUCT_KIND_CONFLICT',
        message: `Product ${product.id} has an incompatible existing product kind.`,
        target: state.target,
        productId: product.id,
      },
    ];
  });
}

function kindCompatible(
  desired: MonetizationProduct,
  current: MonetizationObservedProduct,
): boolean {
  if (desired.kind === current.kind) return true;
  return current.kind === 'one-time' && desired.kind !== 'subscription';
}

function step(
  state: MonetizationTargetState,
  productId: string,
  operation: MonetizationPlanStep['operation'],
): MonetizationPlanStep {
  return {
    id: `${state.target}:${productId}:${operation}`,
    target: state.target,
    productId,
    operation,
  };
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function compareSteps(a: MonetizationPlanStep, b: MonetizationPlanStep): number {
  const target = a.target.localeCompare(b.target);
  if (target !== 0) return target;
  const product = a.productId.localeCompare(b.productId);
  if (product !== 0) return product;
  return OPERATION_RANK[a.operation] - OPERATION_RANK[b.operation];
}

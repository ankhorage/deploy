export interface MonetizationPlanStep {
  readonly id: string;
  readonly target: 'android' | 'ios';
  readonly productId: string;
  readonly operation:
    | 'ensure-subscription-family'
    | 'create-product'
    | 'update-metadata'
    | 'update-price'
    | 'update-subscription';
}

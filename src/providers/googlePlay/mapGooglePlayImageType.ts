export function mapGooglePlayImageType(variant: string): string | null {
  switch (variant) {
    case 'icon':
      return 'icon';
    case 'feature':
      return 'featureGraphic';
    case 'phone':
      return 'phoneScreenshots';
    case 'seven-inch':
      return 'sevenInchScreenshots';
    case 'ten-inch':
      return 'tenInchScreenshots';
    case 'tv':
      return 'tvScreenshots';
    case 'wear':
      return 'wearScreenshots';
    default:
      return null;
  }
}

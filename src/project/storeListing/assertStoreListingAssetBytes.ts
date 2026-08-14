export function assertStoreListingAssetBytes(filename: string, data: Uint8Array): void {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.png')) {
    if (!isPng(data)) throw new Error('STORE_LISTING_ASSET_TYPE_UNSUPPORTED');
    return;
  }
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    if (!isJpeg(data)) throw new Error('STORE_LISTING_ASSET_TYPE_UNSUPPORTED');
    return;
  }
  throw new Error('STORE_LISTING_ASSET_TYPE_UNSUPPORTED');
}

function isPng(data: Uint8Array): boolean {
  return (
    data.length >= 8 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47 &&
    data[4] === 0x0d &&
    data[5] === 0x0a &&
    data[6] === 0x1a &&
    data[7] === 0x0a
  );
}

function isJpeg(data: Uint8Array): boolean {
  return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
}

function getConversion(bahan) {
  if (!bahan) return { ratio: 1, unit: '' };
  if (bahan.storageType === 'Kemasan') {
    const itemsCount = Number(bahan.packageItemsCount) || 1;
    const vol = Number(bahan.packageItemVolume) || 1;
    const volUnit = (bahan.packageItemVolumeUnit || '').toLowerCase();
    if (volUnit === 'ml' || volUnit === 'gr' || volUnit === 'gram') {
      return { ratio: itemsCount * vol, unit: volUnit === 'gr' ? 'Gram' : 'ml' };
    } else {
      return { ratio: itemsCount, unit: bahan.packageItemUnit || 'Pcs' };
    }
  } else {
    const u = (bahan.unit || '').toLowerCase();
    if (u === 'kg' || u === 'kilogram') return { ratio: 1000, unit: 'Gram' };
    if (u === 'liter' || u === 'l') return { ratio: 1000, unit: 'ml' };
    return { ratio: 1, unit: bahan.unit };
  }
}

module.exports = { getConversion };

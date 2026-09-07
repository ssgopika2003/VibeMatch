export const hasValidDiscount = (product) => {
  const basePrice = Number(product?.price || 0);
  const discountedPrice = Number(product?.discountPrice);

  return Number.isFinite(discountedPrice) && discountedPrice > 0 && discountedPrice < basePrice;
};

export const getEffectivePrice = (product) => {
  if (!product) return 0;

  if (Number.isFinite(Number(product.effectivePrice))) {
    return Number(product.effectivePrice);
  }

  return hasValidDiscount(product) ? Number(product.discountPrice) : Number(product.price || 0);
};

export const getDiscountPercent = (product) => {
  if (!hasValidDiscount(product)) return 0;

  const basePrice = Number(product.price);
  const discountedPrice = Number(product.discountPrice);

  return Math.round(((basePrice - discountedPrice) / basePrice) * 100);
};

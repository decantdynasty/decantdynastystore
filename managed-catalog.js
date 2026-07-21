/*
 * Decant Dynasty managed catalog.
 *
 * The private local catalog manager replaces this null value with a complete,
 * validated catalog snapshot. Keeping the default empty preserves the
 * hand-maintained data files as a safe storefront fallback.
 */
globalThis.DECANT_MANAGED_CATALOG = null;

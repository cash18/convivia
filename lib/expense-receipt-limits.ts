/** Dimensione massima file immagine scontrino (20 MiB). */
export const MAX_RECEIPT_BYTES = 20 * 1024 * 1024;

/**
 * Limite lunghezza stringa `data:*;base64,...` (~ espansione base64 4/3 + prefisso MIME).
 * Usato per evitare payload eccessivi oltre il file grezzo.
 */
export const MAX_RECEIPT_DATA_URL_CHARS = Math.ceil(MAX_RECEIPT_BYTES * (4 / 3)) + 128;

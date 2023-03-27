/**
 * Determines if an object is an empty object
 */

export function isEmptyObject(obj: object) {
  return Object.getOwnPropertyNames(obj).length === 0;
}

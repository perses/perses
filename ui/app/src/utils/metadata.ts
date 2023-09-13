/**
 * Generated a resource name valid for the API.
 * By removing accents from alpha characters and replace specials character by underscores.
 * @param name
 */
export function generateMetadataName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9_.-]/g, '_');
}

export const toUtf8Nfc = (value: string): string => value.normalize('NFC');

export const stripDiacritics = (value: string): string =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const normalizeSearchText = (value: string): string =>
  stripDiacritics(value.toLowerCase()).replace(/'/g, "");

export const createSlug = (value: string): string =>
  stripDiacritics(value.toLowerCase())
    .replace(/'/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const createComponentName = (value: string): string => {
  const parts = value.split(/[\s'-]+/);
  return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('');
};

export const createAliases = (name: string): string[] => {
  const aliases = new Set<string>();
  const lower = name.toLowerCase();
  
  aliases.add(lower);
  
  // Specific patterns for L'Hospitalet
  if (lower.includes("l'")) {
    aliases.add(lower.replace("l'", "l "));
    aliases.add(lower.replace("l'", "l"));
    aliases.add(lower.replace("l'", ""));
  }
  
  // Basic stripping
  aliases.add(stripDiacritics(lower));
  
  return Array.from(aliases);
};

export const scoreCandidate = (file: any, municipalityName: string) => {
  let score = 0;
  const title = file.title.toLowerCase();
  
  if (file.mime === 'image/svg+xml') score += 70;
  if (title.includes('escut de')) score += 50;
  if (title.includes(municipalityName.toLowerCase())) score += 40;
  
  // Penalties
  if (title.includes('flag') || title.includes('bandera')) score -= 50;
  if (title.includes('old') || title.includes('former')) score -= 40;
  
  return {
    title: file.title,
    score,
    confidence: score >= 100 ? 'high' : score >= 70 ? 'medium' : 'low'
  };
};

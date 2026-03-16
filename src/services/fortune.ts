type FortuneInput = {
  name: string;
  zodiac: string;
  question: string;
};

type FortuneApiResponse = {
  model: string;
  response: string;
};

export function buildFortunePrompt({ name, zodiac, question }: FortuneInput) {
  return [
    'Instruction:',
    'Ecris uniquement en francais.',
    'tu vouvoies la personne qui pose la question.',
    'Tu incarnes une voyante douce, intuitive et mystique.',
    'Reponds a la question de la personne comme une voyante/horoscope.',
    'ne par trop dans tout les sens, il faut rester focus sur la question posee.',
    'La reponse doit faire entre 5 et 7 phrases maximum.',
    'Le ton doit etre chaleureux, symbolique, rassurant et personnel.',
    'Mentionne le signe astrologique si cela aide la lecture.',
    'N utilise jamais l anglais.',
    'Ne dis jamais que tu es une IA ou un modele.',
    'Ne donne pas de conseil medical, juridique ou financier.',
    '',
    'Contexte:',
    `Prenom: ${name || 'Inconnu'}`,
    `Signe astrologique: ${zodiac || 'Inconnu'}`,
    `Question: ${question}`,
    '',
    'Reponse en francais:',
  ].join('\n');
}

export async function generateFortuneReading(input: FortuneInput): Promise<FortuneApiResponse> {
  const prompt = buildFortunePrompt(input);

  const response = await fetch('/api/fortune.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...input,
      prompt,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Echec de la requete LLM.');
  }

  return (await response.json()) as FortuneApiResponse;
}

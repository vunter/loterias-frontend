import logger from '@/lib/logger';

export async function writeToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

interface GameResult {
  tipoLoteria: string;
  estrategia: string;
  jogos: number[][];
  timeSugerido?: string | null;
  mesSugerido?: string | null;
  timesSugeridos?: string[] | null;
  mesesSugeridos?: string[] | null;
}

export function formatGameLine(result: GameResult, jogo: number[], index: number, separator = ', '): string {
  let linha = `Jogo ${index + 1}: ${jogo.map(n => n.toString().padStart(2, '0')).join(separator)}`;
  const time = result.timesSugeridos?.[index] ?? (index === 0 ? result.timeSugerido : null);
  const mes = result.mesesSugeridos?.[index] ?? (index === 0 ? result.mesSugerido : null);
  if (time) linha += ` | Time: ${time}`;
  if (mes) linha += ` | Mês: ${mes}`;
  return linha;
}

export function formatAllGamesText(result: GameResult): string {
  return result.jogos.map((jogo, i) => formatGameLine(result, jogo, i)).join('\n');
}

export function generateCSV(result: GameResult): string {
  const header = 'jogo,numeros';
  const rows = result.jogos.map((jogo, i) =>
    `${i + 1},"${jogo.map(n => n.toString().padStart(2, '0')).join(',')}"`
  );
  return [header, ...rows].join('\n');
}

export function generateTXT(result: GameResult): string {
  let text = `Jogos Gerados - ${result.tipoLoteria}\n`;
  text += `Data: ${new Date().toLocaleString('pt-BR')}\n`;
  text += `Estratégia: ${result.estrategia}\n`;
  text += `${'='.repeat(40)}\n\n`;

  result.jogos.forEach((jogo, i) => {
    let linha = `Jogo ${i + 1}: ${jogo.map(n => n.toString().padStart(2, '0')).join(' - ')}`;
    const time = result.timesSugeridos?.[i] || (i === 0 ? result.timeSugerido : null);
    const mes = result.mesesSugeridos?.[i] || (i === 0 ? result.mesSugerido : null);
    if (time) linha += `\n         Time do Coração: ${time}`;
    if (mes) linha += `\n         Mês da Sorte: ${mes}`;
    text += linha + '\n';
  });

  return text;
}

export async function copyWithFeedback(
  text: string,
  onSuccess: () => void,
  onReset?: () => void,
  duration = 2000,
): Promise<void> {
  try {
    await writeToClipboard(text);
    onSuccess();
    if (onReset) {
      setTimeout(onReset, duration);
    }
  } catch (err) {
    logger.warn({ err }, 'Clipboard copy failed');
  }
}

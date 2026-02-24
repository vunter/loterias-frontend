'use client';

import { useState } from 'react';
import { TipoLoteria, LOTERIAS, GerarJogoResponse } from '@/lib/api';
import { formatGameLine } from '@/lib/game-export';
import { Share2, MessageCircle, Send, Twitter, Link, Check } from 'lucide-react';

interface ShareButtonsProps {
  tipo: TipoLoteria;
  result: GerarJogoResponse;
}

function buildShareText(tipo: TipoLoteria, result: GerarJogoResponse): string {
  const loteriaInfo = LOTERIAS.find(l => l.value === tipo);
  const name = loteriaInfo?.label || tipo;
  
  const lines = result.jogos.map((jogo, i) => {
    const nums = jogo.join(' - ');
    return `Jogo ${i + 1}: ${nums}`;
  });

  let text = `${name} — ${result.jogos.length} jogo(s)\n`;
  text += `Estratégia: ${result.estrategia}\n\n`;
  text += lines.join('\n');

  if (result.timeSugerido) text += `\n\nTime: ${result.timeSugerido}`;
  if (result.mesSugerido) text += `\n\nMes: ${result.mesSugerido}`;

  text += '\n\nGerado com Loterias Analyzer';
  return text;
}

function buildShareUrl(tipo: TipoLoteria, result: GerarJogoResponse): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams();
  params.set('tipo', tipo);
  params.set('jogos', result.jogos.map(j => j.join(',')).join(';'));
  if (result.estrategia) params.set('estrategia', result.estrategia);
  return `${base}?share=${encodeURIComponent(params.toString())}`;
}

export function ShareButtons({ tipo, result }: ShareButtonsProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  const text = buildShareText(tipo, result);
  const url = buildShareUrl(tipo, result);

  const shareWhatsApp = () => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const shareTelegram = () => {
    const encoded = encodeURIComponent(text);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const shareTwitter = () => {
    // Twitter/X has a 280 char limit, so shorten
    const loteriaInfo = LOTERIAS.find(l => l.value === tipo);
    const short = `${loteriaInfo?.label} — ${result.jogos.length} jogo(s) gerado(s) com Loterias Analyzer!\n\n${result.jogos.slice(0, 3).map((j, i) => `${i + 1}: ${j.join('-')}`).join('\n')}${result.jogos.length > 3 ? `\n+${result.jogos.length - 3} mais...` : ''}`;
    const encoded = encodeURIComponent(short);
    window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // clipboard API unavailable — show user feedback
      setCopiedLink(false);
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: 'Loterias Analyzer', text, url });
    } catch {
      // user cancelled
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-text-muted text-sm flex items-center gap-1">
        <Share2 className="w-4 h-4" /> Compartilhar:
      </span>

      <button
        onClick={shareWhatsApp}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors text-sm"
        title="WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </button>

      <button
        onClick={shareTelegram}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors text-sm"
        title="Telegram"
      >
        <Send className="w-4 h-4" />
        Telegram
      </button>

      <button
        onClick={shareTwitter}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600/20 text-sky-400 hover:bg-sky-600/30 transition-colors text-sm"
        title="Twitter / X"
      >
        <Twitter className="w-4 h-4" />
        X
      </button>

      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary text-text-secondary hover:bg-surface-tertiary transition-colors text-sm"
        title="Copiar texto"
      >
        {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Link className="w-4 h-4" />}
        {copiedLink ? 'Copiado!' : 'Copiar'}
      </button>

      {hasNativeShare && (
        <button
          onClick={nativeShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors text-sm"
          title="Compartilhar"
        >
          <Share2 className="w-4 h-4" />
          Mais
        </button>
      )}
    </div>
  );
}

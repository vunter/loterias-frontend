# Loterias Analyzer - Frontend

Dashboard web para analise de loterias brasileiras. Consome a API REST do backend e apresenta estatisticas, geracao de jogos, conferencia de apostas e analises avancadas.

## Tecnologias

- Next.js 16.1.6
- React 19
- TypeScript
- TailwindCSS
- Nivo (graficos: bar, line, pie)
- Lucide Icons
- Datadog RUM e Logs (observabilidade)
- Pino + Loki (logging)

## Funcionalidades

### Dashboard
- Ultimo concurso com numeros sorteados
- Numeros quentes, frios e atrasados
- Analise de padroes (pares/impares, altos/baixos)
- Informacoes do proximo concurso e acumulado

### Gerador de Jogos
- 10 estrategias de geracao
- Geracao estrategica baseada em analise estatistica
- Multi-game: gerar jogos para varias loterias de uma vez
- Exportar jogos gerados
- Copia rapida para area de transferencia

### Conferir Aposta
- Selecao interativa de numeros
- Verificacao nos ultimos 500 concursos
- Resultado detalhado por concurso

### Ranking de Numeros
- Score de tendencia
- Ordenacao por frequencia, atraso ou score
- Numeros companheiros

### Analises Avancadas
- Analise financeira
- Ordem de sorteio
- Tendencias
- Analise Dupla Sena
- Concursos especiais
- Ganhadores por regiao
- Ranking de times (Timemania)

### Outros
- Calculadora de probabilidade
- Compartilhamento social (WhatsApp, Telegram, X)
- Tema claro/escuro
- Historico de jogos gerados
- Exportacao de dados (CSV)

## Pre-requisitos

- Node.js 22+
- npm ou pnpm

## Executando

### Desenvolvimento

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

### Producao

```bash
npm run build
npm start
```

## Configuracao

Crie um arquivo `.env.local`:

```env
BACKEND_URL=http://127.0.0.1:8081
LOKI_URL=http://192.168.1.193:3100
PROMETHEUS_PUSHGATEWAY_URL=http://192.168.1.193:9091
LOG_LEVEL=info
```

### API Proxy

O frontend atua como proxy para o backend. Todas as chamadas `/api/*` sao redirecionadas internamente para o backend via API Routes do Next.js, evitando problemas de CORS e nao expondo o backend diretamente.

Implementacao: `src/app/api/[...path]/route.ts`

## Estrutura do Projeto

```
src/
├── app/
│   ├── page.tsx                    # Pagina principal
│   ├── layout.tsx                  # Layout raiz com providers
│   ├── globals.css                 # Estilos globais e temas
│   ├── error.tsx                   # Error boundary da pagina
│   ├── loading.tsx                 # Loading state
│   ├── robots.ts                   # SEO robots.txt
│   ├── sitemap.ts                  # SEO sitemap
│   └── api/
│       ├── [...path]/route.ts      # Proxy para o backend
│       └── health/route.ts         # Health check
├── components/
│   ├── AppHeader.tsx               # Header com navegacao e sync
│   ├── AppFooter.tsx               # Footer
│   ├── LotterySelector.tsx         # Seletor de loteria
│   ├── Dashboard.tsx               # Dashboard principal
│   ├── GameGenerator.tsx           # Gerador de jogos
│   ├── MultiGameGenerator.tsx      # Gerador multi-loteria
│   ├── BetChecker.tsx              # Conferir aposta
│   ├── NumberRanking.tsx           # Ranking de numeros
│   ├── NumberBall.tsx              # Componente de bola numerica
│   ├── ExportTab.tsx               # Aba de exportacao
│   ├── EspeciaisDashboard.tsx      # Concursos especiais
│   ├── RegionalAnalysis.tsx        # Ganhadores por regiao
│   ├── TimeCoracaoRanking.tsx      # Ranking de times
│   ├── FinanceiroAnalise.tsx       # Analise financeira
│   ├── OrdemSorteioAnalise.tsx     # Analise ordem de sorteio
│   ├── TendenciasAnalise.tsx       # Tendencias
│   ├── DuplaSenaAnalise.tsx        # Analise Dupla Sena
│   ├── JogosHistorico.tsx          # Historico de jogos
│   ├── ProbabilityCalculator.tsx   # Calculadora de probabilidade
│   ├── ShareButtons.tsx            # Botoes de compartilhamento
│   ├── ThemeToggle.tsx             # Toggle claro/escuro
│   ├── ErrorBoundary.tsx           # Error boundary
│   ├── DatadogRum.tsx              # Integracao Datadog
│   └── WebVitalsReporter.tsx       # Metricas Web Vitals
├── contexts/
│   └── ThemeContext.tsx             # Contexto de tema com localStorage
└── lib/
    ├── api.ts                      # Cliente da API com tipos TypeScript
    ├── loterias.ts                 # Definicoes e configuracoes de loterias
    ├── formatters.ts               # Formatadores de numeros e moeda
    ├── chartTheme.ts               # Tema para graficos Nivo
    ├── game-export.ts              # Logica de exportacao de jogos
    ├── logger.ts                   # Logger Pino com envio para Loki
    └── metrics.ts                  # Metricas Prometheus
```

## Loterias Suportadas

- Mega-Sena
- Lotofacil
- Quina
- Lotomania
- Timemania
- Dupla Sena
- Dia de Sorte
- Super Sete
- +Milionaria

## Licenca

Este projeto e para fins educacionais.

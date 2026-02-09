# Loterias Analyzer - Frontend

Frontend React/Next.js para o sistema de análise de loterias brasileiras.

## Tecnologias

- Next.js 16.1.6
- React 19
- TypeScript
- TailwindCSS
- Recharts (gráficos)
- Lucide Icons

## Funcionalidades

### 1. Dashboard
- Visualização do último concurso
- Números quentes, frios e atrasados
- Análise de padrões (pares/ímpares, altos/baixos)
- Informações do próximo concurso

### 2. Gerador de Jogos
- 10 estratégias de geração
- Baseado em análise estatística
- Cópia rápida para área de transferência

### 3. Conferir Aposta
- Seleção interativa de números
- Verifica nos últimos 500 concursos
- Mostra concursos onde teria ganhado

### 4. Ranking de Números
- Análise de todos os números
- Score de tendência
- Ordenação por frequência, atraso ou score
- Números companheiros

## Executando

### Desenvolvimento

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

### Produção

```bash
npm run build
npm start
```

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
# URL do backend (usado pelo API proxy interno)
BACKEND_URL=http://127.0.0.1:8080

# Observability
LOKI_URL=http://192.168.1.193:3100
PROMETHEUS_PUSHGATEWAY_URL=http://192.168.1.193:9091
LOG_LEVEL=info
```

### API Proxy

O frontend atua como proxy para o backend. Todas as chamadas `/api/*` são redirecionadas internamente para o backend via API Routes do Next.js.

**Fluxo:**
```
Browser → Next.js (:3000) → Backend (:8080)
           /api/*            /api/*
```

**Vantagens:**
- Sem problemas de CORS
- Backend não exposto diretamente
- Funciona de qualquer dispositivo na rede

**Implementação:** `src/app/api/[...path]/route.ts`

## Loterias Suportadas

- Mega-Sena
- Lotofácil
- Quina
- Lotomania
- Timemania
- Dupla Sena
- Dia de Sorte
- Super Sete
- +Milionária

## Estrutura

```
src/
├── app/
│   ├── page.tsx          # Página principal
│   ├── layout.tsx        # Layout raiz
│   └── globals.css       # Estilos globais
├── components/
│   ├── LotterySelector   # Seletor de loteria
│   ├── Dashboard         # Dashboard com estatísticas
│   ├── GameGenerator     # Gerador de jogos
│   ├── BetChecker        # Conferir aposta
│   ├── NumberRanking     # Ranking de números
│   └── NumberBall        # Componente de bola numérica
└── lib/
    └── api.ts            # Cliente da API
```

'use client';

import { TipoLoteria, LOTERIAS } from '@/lib/api';
import { Download, Database, BarChart2, FileSpreadsheet } from 'lucide-react';

interface ExportTabProps {
  tipo: TipoLoteria;
}

export function ExportTab({ tipo }: ExportTabProps) {
  const loteriaInfo = LOTERIAS.find(l => l.value === tipo);

  return (
    <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <Download className="w-6 h-6" style={{ color: loteriaInfo?.color }} />
        Exportar Dados - {loteriaInfo?.label}
      </h2>
      <p className="text-text-tertiary mb-6">
        Baixe os dados históricos e estatísticas em formato CSV para análise externa.
      </p>
      
      <div className="grid md:grid-cols-3 gap-4">
        <ExportCard
          href={`/api/export/${tipo}/concursos.csv`}
          icon={<Database className="w-12 h-12 mx-auto mb-3 text-blue-400" />}
          title="Concursos"
          description="Todos os resultados históricos com dezenas, datas e valores"
        />
        <ExportCard
          href={`/api/export/${tipo}/frequencia.csv`}
          icon={<BarChart2 className="w-12 h-12 mx-auto mb-3 text-green-400" />}
          title="Frequência"
          description="Frequência de cada número com percentuais"
        />
        <ExportCard
          href={`/api/export/${tipo}/estatisticas.csv`}
          icon={<FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-purple-400" />}
          title="Estatísticas"
          description="Análises completas: pares, ímpares, sequências, correlações"
        />
      </div>
    </div>
  );
}

function ExportCard({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <a
      href={href}
      download
      className="bg-surface-secondary hover:bg-surface-tertiary rounded-xl p-6 text-center transition-colors"
    >
      {icon}
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-tertiary text-sm">{description}</p>
    </a>
  );
}

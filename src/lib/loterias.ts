export type TipoLoteria = 
  | 'mega_sena' | 'lotofacil' | 'quina' | 'lotomania' 
  | 'timemania' | 'dupla_sena' | 'dia_de_sorte' | 'super_sete' | 'mais_milionaria';

export interface LoteriaConfig {
  value: TipoLoteria;
  label: string;
  color: string;
  min: number;
  max: number;
  numeroInicial: number;
  numeroFinal: number;
}

export const LOTERIAS: LoteriaConfig[] = [
  { value: 'mega_sena', label: 'Mega-Sena', color: '#209869', min: 6, max: 20, numeroInicial: 1, numeroFinal: 60 },
  { value: 'lotofacil', label: 'Lotofácil', color: '#930089', min: 15, max: 20, numeroInicial: 1, numeroFinal: 25 },
  { value: 'quina', label: 'Quina', color: '#260085', min: 5, max: 15, numeroInicial: 1, numeroFinal: 80 },
  { value: 'lotomania', label: 'Lotomania', color: '#F78100', min: 50, max: 50, numeroInicial: 0, numeroFinal: 99 },
  { value: 'timemania', label: 'Timemania', color: '#00FF48', min: 10, max: 10, numeroInicial: 1, numeroFinal: 80 },
  { value: 'dupla_sena', label: 'Dupla Sena', color: '#A61324', min: 6, max: 15, numeroInicial: 1, numeroFinal: 50 },
  { value: 'dia_de_sorte', label: 'Dia de Sorte', color: '#CB8529', min: 7, max: 15, numeroInicial: 1, numeroFinal: 31 },
  { value: 'super_sete', label: 'Super Sete', color: '#A8CF45', min: 7, max: 21, numeroInicial: 0, numeroFinal: 9 },
  { value: 'mais_milionaria', label: '+Milionária', color: '#00346C', min: 6, max: 12, numeroInicial: 1, numeroFinal: 50 },
];

export const LOTERIA_CONFIG: Record<TipoLoteria, LoteriaConfig> = 
  LOTERIAS.reduce((acc, loteria) => {
    acc[loteria.value] = loteria;
    return acc;
  }, {} as Record<TipoLoteria, LoteriaConfig>);

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPSProject, Pivot } from './types';

export const MOCK_PIVOTS: Pivot[] = [
  { id: 'piv-1', name: 'Ana Costa', email: 'ana.costa@example.com', department: 'Qualidade' },
  { id: 'piv-2', name: 'João Silva', email: 'joao.silva@example.com', department: 'Produção' },
  { id: 'piv-3', name: 'Pedro Martins', email: 'pedro.martins@example.com', department: 'Manutenção' },
  { id: 'piv-4', name: 'Ricardo Lima', email: 'ricardo.lima@example.com', department: 'Logística' },
  { id: 'piv-5', name: 'Maria Santos', email: 'maria.santos@example.com', department: 'Engenharia' },
  { id: 'piv-6', name: 'Carlos Oliveira', email: 'carlos.oliveira@example.com', department: 'Produção' },
];

const today = new Date();
const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);

export const MOCK_PROJECTS: PPSProject[] = [
  {
    id: 'pps-1',
    name: 'Otimização Linha Montagem A',
    description: 'Redução de desperdícios no posto 4 da linha de montagem principal.',
    owner: 'João Silva',
    status: 'green',
    urgency: 2,
    progress: 45,
    plannedStart: lastMonth.toISOString(),
    plannedEnd: nextMonth.toISOString(),
    actualStart: lastMonth.toISOString(),
    tasks: [
      {
        id: 'task-1-1',
        description: 'Análise de tempos e movimentos',
        responsible: 'piv-1',
        deadline: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5).toISOString(),
        status: 'concluido',
      },
      {
        id: 'task-1-2',
        description: 'Implementação de novo layout de ferramentas',
        responsible: 'piv-2',
        deadline: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15).toISOString(),
        status: 'em-curso',
      },
      {
        id: 'task-1-3',
        description: 'Treino da equipa no novo método',
        responsible: 'piv-3',
        deadline: new Date(today.getFullYear(), today.getMonth() + 1, 5).toISOString(),
        status: 'por-fazer',
      }
    ]
  },
  {
    id: 'pps-2',
    name: 'Redução Defeitos Pintura',
    description: 'Investigar causas raízes de porosidade na pintura dos chassis.',
    owner: 'Maria Santos',
    status: 'red',
    urgency: 4,
    progress: 15,
    plannedStart: new Date(today.getFullYear(), today.getMonth() - 1, 15).toISOString(),
    plannedEnd: new Date(today.getFullYear(), today.getMonth(), 30).toISOString(),
    actualStart: new Date(today.getFullYear(), today.getMonth() - 1, 20).toISOString(),
    tasks: [
      {
        id: 'task-2-1',
        description: 'Auditoria ao fornecedor de tinta',
        responsible: 'piv-4',
        deadline: new Date(today.getFullYear(), today.getMonth() - 1, 25).toISOString(),
        status: 'concluido',
      },
      {
        id: 'task-2-2',
        description: 'Calibração dos bicos atomizadores',
        responsible: 'piv-5',
        deadline: new Date(today.getFullYear(), today.getMonth(), 10).toISOString(),
        status: 'por-fazer',
      }
    ]
  },
  {
    id: 'pps-3',
    name: 'Melhoria Set-up Prensa 500T',
    description: 'Reduzir o tempo de mudança de molde de 45 para 20 minutos.',
    owner: 'Carlos Oliveira',
    status: 'yellow',
    urgency: 3,
    progress: 30,
    plannedStart: today.toISOString(),
    plannedEnd: new Date(today.getFullYear(), today.getMonth() + 2, 1).toISOString(),
    tasks: [
      {
        id: 'task-3-1',
        description: 'Workshop SMED',
        responsible: 'piv-6',
        deadline: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).toISOString(),
        status: 'em-curso',
      }
    ]
  }
];

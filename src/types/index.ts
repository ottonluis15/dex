export type UserRole = 'ADMIN' | 'LAWYER' | 'ASSISTANT' | 'INTERN';
export type ClientType = 'PF' | 'PJ';
export type CaseArea = 'CIVIL' | 'CRIMINAL' | 'TRABALHISTA' | 'TRIBUTARIO' | 'FAMILIA' | 'EMPRESARIAL' | 'PREVIDENCIARIO' | 'AMBIENTAL' | 'CONSUMIDOR' | 'DIGITAL';
export type CaseStatus = 'NOVO' | 'EM_ANDAMENTO' | 'AGUARDANDO' | 'CONCLUIDO' | 'ARQUIVADO';
export type EventType = 'MOVIMENTACAO' | 'AUDIENCIA' | 'DESPACHO' | 'SENTENCA' | 'PETICAO' | 'NOTA';
export type FinancialType = 'RECEITA' | 'DESPESA';
export type FinancialStatus = 'PENDENTE' | 'PAGO' | 'CANCELADO';

export const CASE_AREA_LABELS: Record<CaseArea, string> = {
  CIVIL: 'Civil',
  CRIMINAL: 'Criminal',
  TRABALHISTA: 'Trabalhista',
  TRIBUTARIO: 'Tributário',
  FAMILIA: 'Família',
  EMPRESARIAL: 'Empresarial',
  PREVIDENCIARIO: 'Previdenciário',
  AMBIENTAL: 'Ambiental',
  CONSUMIDOR: 'Consumidor',
  DIGITAL: 'Digital',
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  NOVO: 'Novo',
  EM_ANDAMENTO: 'Em Andamento',
  AGUARDANDO: 'Aguardando',
  CONCLUIDO: 'Concluído',
  ARQUIVADO: 'Arquivado',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  LAWYER: 'Advogado(a)',
  ASSISTANT: 'Assistente',
  INTERN: 'Estagiário(a)',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  MOVIMENTACAO: 'Movimentação',
  AUDIENCIA: 'Audiência',
  DESPACHO: 'Despacho',
  SENTENCA: 'Sentença',
  PETICAO: 'Petição',
  NOTA: 'Nota',
};

export const FINANCIAL_STATUS_LABELS: Record<FinancialStatus, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  CANCELADO: 'Cancelado',
};

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  officeId: string;
  officeName: string;
  avatar?: string;
}

export interface DashboardData {
  totalCases: number;
  activeCases: number;
  totalClients: number;
  monthlyRevenue: number;
  upcomingDeadlines: number;
  casesByStatus: Record<string, number>;
  revenueByMonth: { month: string; receita: number; despesa: number }[];
  recentActivity: {
    id: string;
    title: string;
    description: string;
    type: string;
    date: string;
    userName: string;
  }[];
  recentCases: {
    id: string;
    title: string;
    number: string;
    status: CaseStatus;
    area: CaseArea;
    clientName: string;
    responsibleName: string;
    deadline: string | null;
  }[];
}

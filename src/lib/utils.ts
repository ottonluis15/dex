export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return formatDate(date);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NOVO: 'var(--accent-info)',
    EM_ANDAMENTO: 'var(--accent-primary)',
    AGUARDANDO: 'var(--accent-warning)',
    CONCLUIDO: 'var(--accent-success)',
    ARQUIVADO: 'var(--text-tertiary)',
    PENDENTE: 'var(--accent-warning)',
    PAGO: 'var(--accent-success)',
    CANCELADO: 'var(--accent-danger)',
  };
  return colors[status] || 'var(--text-secondary)';
}

export function getCaseAreaIcon(area: string): string {
  const icons: Record<string, string> = {
    CIVIL: '⚖️',
    CRIMINAL: '🔒',
    TRABALHISTA: '👷',
    TRIBUTARIO: '💰',
    FAMILIA: '👨‍👩‍👧',
    EMPRESARIAL: '🏢',
    PREVIDENCIARIO: '🏥',
    AMBIENTAL: '🌱',
    CONSUMIDOR: '🛒',
    DIGITAL: '💻',
  };
  return icons[area] || '📋';
}

export function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

import { toPng } from 'html-to-image';
import { formatDateToBrazilian } from './utils';

interface SnapshotTx {
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'fixed' | 'card' | 'casual';
}

interface SnapshotData {
  username?: string;
  cycle: string; // YYYY-MM
  availableBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalSaved: number;
  transactions: SnapshotTx[]; // last N, already sorted desc
}

const fmt = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const typeMeta: Record<SnapshotTx['type'], { label: string; color: string }> = {
  income: { label: 'Renda', color: '#10b981' },
  fixed: { label: 'Fixo', color: '#f97316' },
  card: { label: 'Cartão', color: '#8b5cf6' },
  casual: { label: 'Avulso', color: '#3b82f6' },
};

const cycleLabel = (cycle: string) => {
  const [y, m] = cycle.split('-');
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return `${months[Number(m) - 1] ?? ''} ${y}`;
};

export async function generateBalanceSnapshot(data: SnapshotData): Promise<void> {
  const node = document.createElement('div');
  node.style.position = 'fixed';
  node.style.top = '0';
  node.style.left = '-10000px';
  node.style.width = '520px';
  node.style.padding = '32px';
  node.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
  node.style.color = '#f8fafc';
  node.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";
  node.style.borderRadius = '24px';

  const balanceColor = data.availableBalance >= 0 ? '#10b981' : '#ef4444';
  const now = new Date();
  const generatedAt = `${formatDateToBrazilian(now.toISOString().slice(0, 10))} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  const txRows = data.transactions.length
    ? data.transactions
        .map((t) => {
          const meta = typeMeta[t.type];
          const sign = t.type === 'income' ? '+' : '-';
          const amountColor = t.type === 'income' ? '#10b981' : '#f87171';
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:rgba(255,255,255,0.04);border-radius:12px;margin-bottom:8px;">
              <div style="min-width:0;flex:1;padding-right:12px;">
                <div style="font-size:14px;font-weight:600;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(t.description)}</div>
                <div style="font-size:11px;color:#94a3b8;margin-top:2px;">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${meta.color};margin-right:6px;vertical-align:middle;"></span>
                  ${meta.label} · ${formatDateToBrazilian(t.date)}
                </div>
              </div>
              <div style="font-size:14px;font-weight:700;color:${amountColor};white-space:nowrap;">${sign} R$ ${fmt(Math.abs(t.amount))}</div>
            </div>`;
        })
        .join('')
    : `<div style="text-align:center;color:#64748b;font-size:13px;padding:24px 0;">Nenhuma transação neste ciclo</div>`;

  node.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      <div>
        <div style="font-size:12px;color:#94a3b8;letter-spacing:0.08em;text-transform:uppercase;">Resumo Financeiro</div>
        <div style="font-size:18px;font-weight:700;color:#f8fafc;margin-top:2px;">${escapeHtml(cycleLabel(data.cycle))}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:#64748b;">Gerado em</div>
        <div style="font-size:12px;color:#cbd5e1;font-weight:500;">${generatedAt}</div>
      </div>
    </div>

    <div style="background:linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.1));border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px;margin-bottom:16px;">
      <div style="font-size:12px;color:#94a3b8;">Saldo Disponível</div>
      <div style="font-size:36px;font-weight:800;color:${balanceColor};margin-top:4px;letter-spacing:-0.02em;">R$ ${fmt(data.availableBalance)}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:24px;">
      <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:12px;">
        <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Renda</div>
        <div style="font-size:15px;font-weight:700;color:#10b981;margin-top:4px;">R$ ${fmt(data.totalIncome)}</div>
      </div>
      <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:12px;">
        <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Gastos</div>
        <div style="font-size:15px;font-weight:700;color:#f87171;margin-top:4px;">R$ ${fmt(data.totalExpenses)}</div>
      </div>
      <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:12px;">
        <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Guardado</div>
        <div style="font-size:15px;font-weight:700;color:#60a5fa;margin-top:4px;">R$ ${fmt(data.totalSaved)}</div>
      </div>
    </div>

    <div>
      <div style="font-size:13px;font-weight:600;color:#e2e8f0;margin-bottom:10px;">Últimas Transações</div>
      ${txRows}
    </div>

    <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;font-size:11px;color:#64748b;">
      Gestão de Gastos · rickreis
    </div>
  `;

  document.body.appendChild(node);
  try {
    const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
    const link = document.createElement('a');
    link.download = `saldo-${data.cycle}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  } finally {
    document.body.removeChild(node);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

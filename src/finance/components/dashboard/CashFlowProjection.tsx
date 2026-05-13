import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Account, BudgetItem, MonthlyBalance, Transaction, TransactionType } from '../../financeTypes';
import { formatCurrency, parseDate } from '../../utils/calculations';

/**
 * CashFlowProjection — gráfico de saldo proyectado para los próximos N meses.
 * Toma el saldo actual y va sumando IN - OUT mes a mes (presupuestados + cuotas pendientes).
 * El mes actual usa real-to-date + proyectado-restante para no mentir.
 */

interface Props {
  accounts: Account[];
  transactions: Transaction[];
  monthlyBalances: MonthlyBalance[];
  budgetItems: BudgetItem[];
  monthsAhead?: number;
}

const MONTH_NAMES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const CashFlowProjection: React.FC<Props> = ({
  accounts,
  transactions,
  monthlyBalances,
  budgetItems,
  monthsAhead = 6,
}) => {
  const data = useMemo(() => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    // 1) Saldo actual de cuentas que entran en cashflow (no inversiones).
    // Simplificación: usamos saldo agregado por mes opening + flujos del mes.
    const openingThisMonth = accounts
      .filter(a => a.isActive !== false)
      .reduce((sum, acc) => {
        const mb = monthlyBalances.find(
          b => b.accountId === acc.id && b.year === todayYear && b.month === todayMonth,
        );
        return sum + (mb?.amount || 0);
      }, 0);

    // Real del mes actual hasta hoy
    const realInMonth = transactions
      .filter(t => {
        if (t.transferId) return false;
        const d = parseDate(t.date);
        return d.getMonth() === todayMonth && d.getFullYear() === todayYear;
      })
      .reduce(
        (acc, t) => {
          if (t.type === TransactionType.IN) acc.in += t.amount;
          if (t.type === TransactionType.OUT) acc.out += t.amount;
          return acc;
        },
        { in: 0, out: 0 },
      );

    // Pendientes del mes actual (lo planeado que NO está cubierto por reales)
    const pendingThisMonth = budgetItems
      .filter(b => b.year === todayYear && b.month === todayMonth && !b.paidAt)
      .reduce(
        (acc, b) => {
          if (b.type === TransactionType.IN) acc.in += b.plannedAmount;
          if (b.type === TransactionType.OUT) acc.out += b.plannedAmount;
          return acc;
        },
        { in: 0, out: 0 },
      );

    // Promedio de ingresos REALES de los 3 meses anteriores → fallback para
    // meses futuros que no tengan presupuesto IN cargado. Evita la falsa alarma
    // de "saldo negativo" cuando solo se cargaron los gastos.
    const avg3MIn = (() => {
      let total = 0, count = 0;
      for (let off = 1; off <= 3; off++) {
        const d = new Date(todayYear, todayMonth - off, 1);
        const m = d.getMonth(), y = d.getFullYear();
        const sum = transactions
          .filter(t => {
            if (t.transferId) return false;
            if (t.type !== TransactionType.IN) return false;
            const dd = parseDate(t.date);
            return dd.getMonth() === m && dd.getFullYear() === y;
          })
          .reduce((s, t) => s + t.amount, 0);
        total += sum;
        count++;
      }
      return count > 0 ? total / count : 0;
    })();

    let runningBalance = openingThisMonth + realInMonth.in - realInMonth.out;
    const points: { label: string; balance: number; in: number; out: number; isProjection: boolean; inIsEstimated?: boolean }[] = [];

    // Punto "Hoy"
    points.push({
      label: `${MONTH_NAMES[todayMonth]}·${String(todayYear).slice(-2)}`,
      balance: runningBalance,
      in: realInMonth.in,
      out: realInMonth.out,
      isProjection: false,
    });

    // Aplicar pendientes del mes actual (proyectado)
    runningBalance += pendingThisMonth.in - pendingThisMonth.out;

    // Proyectar los próximos `monthsAhead` meses
    for (let offset = 1; offset <= monthsAhead; offset++) {
      const d = new Date(todayYear, todayMonth + offset, 1);
      const m = d.getMonth();
      const y = d.getFullYear();

      const monthBudget = budgetItems.filter(b => b.year === y && b.month === m);
      let inSum = monthBudget
        .filter(b => b.type === TransactionType.IN)
        .reduce((s, b) => s + b.plannedAmount, 0);
      const outSum = monthBudget
        .filter(b => b.type === TransactionType.OUT)
        .reduce((s, b) => s + b.plannedAmount, 0);

      // Si no hay presupuesto IN cargado pero hay historia de ingresos, usar el
      // promedio 3M como estimación realista. Caso típico: alguien presupuestó
      // sus gastos fijos pero no recarga "Sueldo" todos los meses.
      let inIsEstimated = false;
      if (inSum === 0 && avg3MIn > 0) {
        inSum = avg3MIn;
        inIsEstimated = true;
      }

      runningBalance += inSum - outSum;
      points.push({
        label: `${MONTH_NAMES[m]}·${String(y).slice(-2)}`,
        balance: runningBalance,
        in: inSum,
        out: outSum,
        isProjection: true,
        inIsEstimated,
      });
    }
    return points;
  }, [accounts, transactions, monthlyBalances, budgetItems, monthsAhead]);

  // Cuántos meses futuros usan ingreso estimado (proxy)
  const estimatedMonths = data.filter(d => d.inIsEstimated).length;

  const minBalance = Math.min(...data.map(d => d.balance));
  const hasNegative = minBalance < 0;

  return (
    <div className="bg-fin-card border border-fin-border rounded-md p-6 relative overflow-hidden">
      <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fin-muted mb-1">— CPD-FIN-CFP-001</div>
          <h3 className="font-display text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--color-primary)]" />
            Flujo de caja proyectado
          </h3>
          <p className="font-mono text-[11px] text-fin-muted mt-0.5">
            Saldo agregado hoy + proyección {monthsAhead}M con presupuesto.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {hasNegative && (
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-1 border bg-[rgba(255,77,77,0.10)] text-[var(--color-danger)] border-[var(--color-danger)]">
              ⚠ Saldo negativo proyectado
            </div>
          )}
          {estimatedMonths > 0 && (
            <div
              className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-1 border"
              style={{ borderColor: 'var(--text-muted)', color: 'var(--text-muted)' }}
              title="Para los meses futuros sin presupuesto de ingresos cargado, se usa el promedio de los últimos 3 meses como proxy."
            >
              Ingresos {estimatedMonths}M = proxy 3M
            </div>
          )}
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cfPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cfNegative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-danger)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--color-danger)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              stroke="var(--text-muted)"
              tick={{ fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--text-muted)"
              tick={{ fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={v => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <ReferenceLine y={0} stroke="var(--color-danger)" strokeDasharray="3 3" strokeOpacity={0.4} />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-base)',
                border: '1px solid var(--color-primary)',
                fontFamily: 'monospace',
                fontSize: 11,
              }}
              formatter={(value: any) => formatCurrency(value)}
              labelStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={hasNegative ? 'var(--color-danger)' : 'var(--color-primary)'}
              strokeWidth={2}
              fill={hasNegative ? 'url(#cfNegative)' : 'url(#cfPositive)'}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-fin-border">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted">Hoy</div>
          <div className="font-mono text-sm font-bold text-[var(--text-primary)]">{formatCurrency(data[0]?.balance || 0)}</div>
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted">+{Math.floor(monthsAhead / 2)}M</div>
          <div className="font-mono text-sm font-bold text-[var(--text-primary)]">{formatCurrency(data[Math.floor(monthsAhead / 2)]?.balance || 0)}</div>
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted">+{monthsAhead}M</div>
          <div className={`font-mono text-sm font-bold ${(data[monthsAhead]?.balance || 0) < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-primary)]'}`}>
            {formatCurrency(data[monthsAhead]?.balance || 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowProjection;

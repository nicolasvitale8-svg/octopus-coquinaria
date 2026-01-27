import React, { useState, useEffect, useRef } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { BudgetItem, Category, SubCategory, Transaction, TransactionType } from '../financeTypes';
import { formatCurrency, formatPercentage, getAdjustedWorkingDay } from '../utils/calculations';
import { Plus, Trash2, Pencil, ChevronRight, PieChart, Sparkles, Calendar as CalendarIcon, Clock, X } from 'lucide-react';
import { useFinanza } from '../context/FinanzaContext';

export const Budget: React.FC = () => {
  const { activeEntity } = useFinanza();
  const [loading, setLoading] = useState(true);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeBudgetTab, setActiveBudgetTab] = useState<TransactionType>(TransactionType.OUT);

  const [newItem, setNewItem] = useState<Partial<BudgetItem>>({ type: TransactionType.OUT, plannedAmount: 0 });
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadData(); }, [activeEntity]);

  const loadData = async () => {
    setLoading(true);
    try {
      const bId = activeEntity.id || undefined;
      const [items, t, cat, subCat] = await Promise.all([
        SupabaseService.getBudgetItems(bId),
        SupabaseService.getTransactions(bId),
        SupabaseService.getCategories(bId),
        SupabaseService.getAllSubCategories(bId)
      ]);
      setBudgetItems(items);
      setTransactions(t);
      setCategories(cat);
      setSubCategories(subCat);
    } catch (error) {
      console.error("Error loading budget data:", error);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = async (increment: number) => {
    const newDate = new Date(currentYear, currentMonth + increment, 1);
    const m = newDate.getMonth();
    const y = newDate.getFullYear();

    // Check if there's any budget for the target month
    const targetItems = budgetItems.filter(i => i.month === m && i.year === y);

    if (targetItems.length === 0) {
      // Logic to copy recurring and installments
      const prevDate = new Date(y, m - 1, 1);
      const pm = prevDate.getMonth();
      const py = prevDate.getFullYear();
      const prevItems = budgetItems.filter(i => i.month === pm && i.year === py);

      const bId = activeEntity.id || undefined;
      let hasCopied = false;

      for (const item of prevItems) {
        if (item.isRecurring) {
          const newItem = { ...item, id: undefined, month: m, year: y };
          await SupabaseService.saveBudgetItem(newItem, bId);
          hasCopied = true;
        } else if ((item.totalInstallments || 1) > (item.currentInstallment || 1)) {
          const newItem = {
            ...item,
            id: undefined,
            month: m,
            year: y,
            currentInstallment: (item.currentInstallment || 1) + 1
          };
          await SupabaseService.saveBudgetItem(newItem, bId);
          hasCopied = true;
        }
      }

      if (hasCopied) await loadData();
    }

    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.categoryId || !newItem.plannedAmount || !newItem.label) return;

    try {
      const bId = activeEntity.id || undefined;
      const itemToSave = {
        ...newItem,
        id: editingId || undefined,
        year: currentYear,
        month: currentMonth,
        plannedAmount: Number(newItem.plannedAmount),
        plannedDate: Number(newItem.plannedDate) || 1
      };
      await SupabaseService.saveBudgetItem(itemToSave, bId);
      await loadData();
      setIsAdding(false); setEditingId(null); setNewItem({ type: TransactionType.OUT, plannedAmount: 0, label: '' });
    } catch (error) {
      console.error("Error saving budget item:", error);
    }
  };

  const importFromPreviousMonth = async () => {
    if (!confirm('¿Importar items recurrentes del mes anterior? Esto no duplicará items existentes.')) return;

    setLoading(true);
    try {
      const prevDate = new Date(currentYear, currentMonth - 1, 1);
      const prevMonth = prevDate.getMonth();
      const prevYear = prevDate.getFullYear();

      const bId = activeEntity.id || undefined;
      const [prevItems, currentItems] = await Promise.all([
        SupabaseService.getBudgetItems(bId),
        SupabaseService.getBudgetItems(bId) // Fetch fresh current items
      ]);

      const sourceItems = prevItems.filter(i => i.month === prevMonth && i.year === prevYear);
      const existingLabels = new Set(currentItems.filter(i => i.month === currentMonth && i.year === currentYear).map(i => i.label.toLowerCase().trim()));

      let importCount = 0;
      for (const item of sourceItems) {
        // Condition: Must be recurring OR have installments remaining
        const isRecurring = item.isRecurring;
        const hasInstallments = (item.totalInstallments || 1) > (item.currentInstallment || 1);

        if (!isRecurring && !hasInstallments) continue;

        // Avoid duplicates checking label
        if (existingLabels.has(item.label.toLowerCase().trim())) continue;

        let newItem = { ...item, id: undefined, month: currentMonth, year: currentYear };

        if (hasInstallments && !isRecurring) {
          newItem.currentInstallment = (item.currentInstallment || 1) + 1;
        }

        await SupabaseService.saveBudgetItem(newItem, bId);
        importCount++;
      }

      await loadData();
      alert(`Se importaron ${importCount} items del mes anterior.`);
    } catch (error) {
      console.error(error);
      alert('Error al importar items');
    } finally {
      setLoading(false);
    }
  };

  const calculateActual = (item: BudgetItem) => {
    return transactions.reduce((sum, t) => {
      const tDate = new Date(t.date);
      // Filtrar por mes, año, categoría y tipo
      if (tDate.getMonth() !== item.month || tDate.getFullYear() !== item.year || t.categoryId !== item.categoryId || t.type !== item.type) return sum;

      // CASO 1: Ambos tienen subCategoryId - deben coincidir exactamente
      if (item.subCategoryId && t.subCategoryId) {
        if (t.subCategoryId !== item.subCategoryId) return sum;
        return sum + t.amount;
      }

      // CASO 2: El presupuesto tiene subCategoryId pero la transacción NO
      // Intentar match por palabras clave del label
      if (item.subCategoryId && !t.subCategoryId) {
        // Buscar si la descripción contiene el label del presupuesto
        const labelWords = item.label.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const descLower = t.description.toLowerCase();
        const matchesLabel = labelWords.some(word => descLower.includes(word));
        if (!matchesLabel) return sum;
        return sum + t.amount;
      }

      // CASO 3: El presupuesto NO tiene subCategoryId pero la transacción SÍ
      if (!item.subCategoryId && t.subCategoryId) {
        // Verificar si hay otro presupuesto más específico para esta subcategoría
        const hasSpecificBudget = budgetItems.some(bi =>
          bi.id !== item.id &&
          bi.categoryId === item.categoryId &&
          bi.subCategoryId === t.subCategoryId &&
          bi.month === item.month &&
          bi.year === item.year &&
          bi.type === item.type
        );
        if (hasSpecificBudget) return sum; // Se cuenta en otro presupuesto más específico
      }

      // CASO 4: Ninguno tiene subCategoryId
      // Verificar si hay otro presupuesto del mismo rubro que matchee mejor por label
      if (!item.subCategoryId && !t.subCategoryId) {
        const otherBudgets = budgetItems.filter(bi =>
          bi.id !== item.id &&
          bi.categoryId === item.categoryId &&
          bi.month === item.month &&
          bi.year === item.year &&
          bi.type === item.type
        );

        // Si hay otros presupuestos del mismo rubro, ver si alguno matchea mejor por label
        const descLower = t.description.toLowerCase();
        for (const other of otherBudgets) {
          const otherLabelWords = other.label.toLowerCase().split(/\s+/).filter(w => w.length > 2);
          const otherMatches = otherLabelWords.some(word => descLower.includes(word));
          if (otherMatches) {
            // Esta transacción pertenece a otro presupuesto
            return sum;
          }
        }
      }

      return sum + t.amount;
    }, 0);
  };

  const renderBudgetTable = (type: TransactionType, title: string) => {
    const items = budgetItems.filter(i => i.month === currentMonth && i.year === currentYear && i.type === type);
    const totalPlanned = items.reduce((s, i) => s + i.plannedAmount, 0);
    const totalActual = items.reduce((s, i) => s + calculateActual(i), 0);
    const totalPct = totalPlanned > 0 ? totalActual / totalPlanned : 0;

    return (
      <div className="bg-fin-card rounded-2xl border border-fin-border overflow-hidden mb-10">
        <div className="px-8 py-6 bg-fin-bg/40 border-b border-fin-border flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-1 h-4 rounded-full ${type === 'IN' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            <h3 className="text-xs font-black uppercase tracking-widest text-fin-text">{title}</h3>
          </div>
          <div className="text-[10px] font-black text-fin-muted tracking-widest uppercase">
            {formatCurrency(totalActual)} / {formatCurrency(totalPlanned)}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[9px] text-fin-muted uppercase tracking-widest border-b border-fin-border">
              <tr>
                <th className="px-8 py-4 font-black">Plan</th>
                <th className="px-8 py-4 font-black">Ajuste</th>
                <th className="px-8 py-4 font-black">Concepto</th>
                <th className="px-8 py-4 text-right font-black">Previsto</th>
                <th className="px-8 py-4 text-right font-black">Real</th>
                <th className="px-8 py-4 text-right font-black">Eje.</th>
                <th className="px-8 py-4 text-right font-black">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fin-border/50">
              {items.map(item => {
                const actual = calculateActual(item);
                const pct = item.plannedAmount > 0 ? actual / item.plannedAmount : 0;
                let barColor = 'bg-brand';
                if (type === 'OUT') { if (pct > 1) barColor = 'bg-red-500'; else if (pct > 0.8) barColor = 'bg-amber-500'; else barColor = 'bg-emerald-500'; }
                else { if (pct >= 1) barColor = 'bg-emerald-500'; else barColor = 'bg-brand'; }

                return (
                  <tr key={item.id} className="hover:bg-fin-bg transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-fin-text font-black text-sm">{item.plannedDate || '-'}</span>
                        <span className="text-[8px] text-fin-muted uppercase tracking-widest font-black">Estimado</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {item.plannedDate ? (
                        <div className="flex flex-col">
                          <span className="text-cyan-400 font-black text-sm">
                            {getAdjustedWorkingDay(item.plannedDate, item.month, item.year).getDate()}
                          </span>
                          <span className="text-[8px] text-cyan-500/50 uppercase tracking-widest font-black">Hábil</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <p className="font-bold text-fin-text leading-tight">{item.label}</p>
                        <div className="flex flex-wrap gap-2">
                          <p className="text-[9px] text-fin-muted uppercase tracking-widest font-black flex items-center gap-1.5 px-2 py-0.5 bg-fin-bg rounded-lg w-fit border border-fin-border/50">
                            <div className="w-1 h-1 rounded-full bg-cyan-500"></div>
                            {categories.find(c => c.id === item.categoryId)?.name}
                          </p>
                          {item.isRecurring && (
                            <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-tighter border border-emerald-500/20">Fijo</span>
                          )}
                          {(item.totalInstallments || 1) > 1 && (
                            <span className="text-[8px] font-black text-brand bg-brand/10 px-1.5 py-0.5 rounded-md uppercase tracking-tighter border border-brand/20">
                              {item.currentInstallment} / {item.totalInstallments}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right tabular-nums text-fin-muted">{formatCurrency(item.plannedAmount)}</td>
                    <td className="px-8 py-5 text-right tabular-nums font-black">{formatCurrency(actual)}</td>
                    <td className="px-8 py-5 text-right w-32">
                      <div className="flex items-center justify-end gap-2 mb-1.5">
                        <span className="text-[10px] font-black opacity-60">{Math.round(pct * 100)}%</span>
                      </div>
                      <div className="w-full bg-fin-bg rounded-full h-1 overflow-hidden">
                        <div className={`h-full rounded-full ${barColor} transition-all duration-1000`} style={{ width: `${Math.min(pct * 100, 100)}%` }}></div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-3 opacity-20 hover:opacity-100 transition-opacity">
                        <button onClick={() => {
                          setEditingId(item.id);
                          setNewItem({
                            ...item,
                            categoryId: item.categoryId,
                            subCategoryId: item.subCategoryId
                          });
                          setIsAdding(true);
                          // Scroll automático al formulario
                          setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                        }} className="p-2 bg-fin-bg rounded-lg text-fin-text hover:text-brand border border-fin-border transition-all"><Pencil size={14} /></button>
                        <button onClick={async () => { if (confirm('¿Eliminar proyección definitivamente?')) { await SupabaseService.deleteBudgetItem(item.id); await loadData(); } }} className="p-2 bg-fin-bg rounded-lg text-fin-text hover:text-red-500 border border-fin-border transition-all"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {items.length === 0 && <tr><td colSpan={6} className="px-8 py-16 text-center text-fin-muted text-[10px] uppercase tracking-widest opacity-30 italic">Sin proyección configurada</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  if (loading && budgetItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-pulse">
        <div className="w-12 h-12 bg-brand/20 rounded-full flex items-center justify-center">
          <Sparkles className="text-brand animate-spin" size={24} />
        </div>
        <p className="text-fin-muted font-bold uppercase tracking-widest text-[10px]">Cargando presupuesto...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fin-text uppercase">Presupuesto</h1>
          <p className="text-fin-muted text-sm mt-1">Planificación financiera por periodos</p>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex bg-fin-card rounded-xl border border-fin-border p-1 items-center">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-fin-bg rounded-lg text-fin-muted transition-colors">
              <ChevronRight className="rotate-180" size={16} />
            </button>
            <span className="px-4 text-[10px] font-black uppercase tracking-widest text-fin-text">
              {new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'short' })} {currentYear}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-fin-bg rounded-lg text-fin-muted transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <button onClick={() => { setIsAdding(!isAdding); setEditingId(null); setNewItem({ type: TransactionType.OUT, plannedAmount: 0, label: '' }); }} className="bg-brand text-fin-bg px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-hover transition-all">
            {isAdding ? 'CERRAR FORM' : 'NUEVO ITEM'}
          </button>
          <button onClick={importFromPreviousMonth} className="bg-fin-card border border-fin-border text-fin-muted hover:text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-brand transition-all" title="Importar recurrentes del mes anterior">
            <Sparkles size={16} />
          </button>
        </div>
      </div>

      <div className="bg-fin-card p-1 rounded-2xl border border-fin-border w-fit">
        <button
          onClick={() => setActiveBudgetTab(TransactionType.OUT)}
          className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeBudgetTab === TransactionType.OUT ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-fin-muted hover:text-white'}`}
        >
          Salidas
        </button>
        <button
          onClick={() => setActiveBudgetTab(TransactionType.IN)}
          className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeBudgetTab === TransactionType.IN ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-fin-muted hover:text-white'}`}
        >
          Ingresos
        </button>
      </div>

      {isAdding && (
        <div ref={formRef} className="bg-fin-card p-10 rounded-[32px] border border-fin-border animate-fade-in mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          {/* Botón de cierre */}
          <button
            type="button"
            onClick={() => { setIsAdding(false); setEditingId(null); setNewItem({ type: TransactionType.OUT, plannedAmount: 0, label: '' }); }}
            className="absolute top-6 right-6 p-2 text-fin-muted hover:text-white transition-colors z-20"
          >
            <X size={24} />
          </button>
          <h3 className="text-xl font-black mb-10 text-white uppercase tracking-tight flex items-center gap-3">
            <Plus className="text-brand" size={24} />
            {editingId ? 'Modificar Proyección' : 'Nueva Planificación Mensual'}
          </h3>
          <form onSubmit={handleSaveItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1">Tipo de Flujo</label>
              <select value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value as TransactionType, categoryId: undefined, subCategoryId: undefined })} className="w-full bg-[#050f1a] border border-white/10 rounded-2xl p-4 text-sm text-white font-bold outline-none focus:border-brand transition-all appearance-none cursor-pointer">
                <option value={TransactionType.IN}>Ingreso</option>
                <option value={TransactionType.OUT}>Gasto (Salida)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1">1. Rubro Principal</label>
              <select value={newItem.categoryId || ''} onChange={e => setNewItem({ ...newItem, categoryId: e.target.value, subCategoryId: undefined })} className="w-full bg-[#050f1a] border border-white/10 rounded-2xl p-4 text-sm text-white font-bold outline-none focus:border-brand transition-all appearance-none cursor-pointer" required>
                <option value="">Seleccionar rubro...</option>
                {categories
                  .filter(c => c.type === newItem.type || c.type === 'MIX')
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1">2. Item Sugerido</label>
              <select
                value={newItem.subCategoryId || ''}
                onChange={e => {
                  const sub = subCategories.find(s => s.id === e.target.value);
                  setNewItem({ ...newItem, subCategoryId: e.target.value, label: sub ? sub.name : newItem.label });
                }}
                className="w-full bg-[#050f1a] border border-white/10 rounded-2xl p-4 text-sm text-white font-bold outline-none focus:border-brand transition-all appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={!newItem.categoryId}
              >
                <option value="">Elegir de la lista...</option>
                {subCategories
                  .filter(s => s.categoryId === newItem.categoryId)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1">Concepto Personalizado</label>
              <input type="text" value={newItem.label || ''} onChange={e => setNewItem({ ...newItem, label: e.target.value })} placeholder="Ej. Pago de luz" className="w-full bg-[#050f1a] border border-white/10 rounded-2xl p-4 text-sm text-white font-bold outline-none focus:border-brand transition-all placeholder:text-white/20" required />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1">Día Estimado</label>
              <input type="number" max="31" min="1" value={newItem.plannedDate || ''} onChange={e => setNewItem({ ...newItem, plannedDate: Number(e.target.value) })} className="w-full bg-[#050f1a] border border-white/10 rounded-2xl p-4 text-sm text-white font-bold outline-none focus:border-brand transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1">Monto Proyectado</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fin-muted font-bold">$</span>
                <input type="number" step="0.01" value={newItem.plannedAmount || ''} onChange={e => setNewItem({ ...newItem, plannedAmount: Number(e.target.value) })} className="w-full bg-[#050f1a] border border-white/10 rounded-2xl p-4 pl-8 text-sm text-white font-black outline-none focus:border-brand transition-all" required />
              </div>
            </div>
            <div className="space-y-4 pt-4 border-l border-white/5 pl-8">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={newItem.isRecurring || false}
                  onChange={e => setNewItem({ ...newItem, isRecurring: e.target.checked })}
                  className="w-5 h-5 rounded-lg bg-[#050f1a] border-white/10 text-brand focus:ring-brand"
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-fin-muted group-hover:text-white transition-colors">Gasto Fijo (Mensual)</span>
              </label>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1">Cuotas / Pagos</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={newItem.currentInstallment || 1}
                    onChange={e => setNewItem({ ...newItem, currentInstallment: Number(e.target.value) })}
                    className="w-16 bg-[#050f1a] border border-white/10 rounded-xl p-2 text-xs text-white font-bold outline-none focus:border-brand"
                    placeholder="Cuota"
                  />
                  <span className="text-fin-muted text-[10px] font-black uppercase">de</span>
                  <input
                    type="number"
                    min="1"
                    value={newItem.totalInstallments || 1}
                    onChange={e => setNewItem({ ...newItem, totalInstallments: Number(e.target.value) })}
                    className="w-16 bg-[#050f1a] border border-white/10 rounded-xl p-2 text-xs text-white font-bold outline-none focus:border-brand"
                    placeholder="Total"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <button type="submit" className="w-full bg-brand text-fin-bg rounded-2xl py-4 font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-hover transition-all shadow-xl shadow-brand/20 active:scale-95">
                {editingId ? 'ACTUALIZAR DATOS' : 'CREAR PROYECCIÓN'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeBudgetTab === TransactionType.IN
        ? renderBudgetTable(TransactionType.IN, 'Planificación de Ingresos')
        : renderBudgetTable(TransactionType.OUT, 'Planificación de Gastos')
      }
    </div>
  );
};
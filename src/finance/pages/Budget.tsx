import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { Account, AccountType, BudgetItem, Category, SubCategory, Transaction, TransactionType } from '../financeTypes';
import { formatCurrency, formatPercentage, getAdjustedWorkingDay } from '../utils/calculations';
import { Plus, Trash2, Pencil, ChevronRight, PieChart, Sparkles, Calendar as CalendarIcon, Clock, X, CreditCard, Wallet, Landmark, ArrowRight, Check, Copy, Receipt } from 'lucide-react';
import { useFinanza } from '../context/FinanzaContext';

export const Budget: React.FC = () => {
  const { activeEntity, service } = useFinanza();
  const [loading, setLoading] = useState(true);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeBudgetTab, setActiveBudgetTab] = useState<TransactionType>(TransactionType.OUT);

  const [newItem, setNewItem] = useState<Partial<BudgetItem>>({ type: TransactionType.OUT, plannedAmount: 0 });

  // Payment Execution State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [executingItem, setExecutingItem] = useState<BudgetItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);

  // Card Summary Payment State
  const [showCardSummaryModal, setShowCardSummaryModal] = useState(false);
  const [cardSummaryAccountId, setCardSummaryAccountId] = useState<string>('');
  const [cardSummaryAmount, setCardSummaryAmount] = useState<number>(0);
  const [cardSummaryPayAccountId, setCardSummaryPayAccountId] = useState<string>('');
  const [cardSummaryCategoryId, setCardSummaryCategoryId] = useState<string>('');
  const [isPayingCardSummary, setIsPayingCardSummary] = useState(false);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'amount' | 'category' | 'label', direction: 'asc' | 'desc' }>({ key: 'date', direction: 'asc' });

  // Filter State
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSubCategory, setFilterSubCategory] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<number | ''>('');
  const [filterDateTo, setFilterDateTo] = useState<number | ''>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [filterCategory, filterSubCategory, filterDateFrom, filterDateTo, filterSearch].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterCategory('');
    setFilterSubCategory('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterSearch('');
  };

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadData(); }, [activeEntity]);

  /**
   * Replica al mes target los items del mes anterior que sean
   *  - recurrentes (Gasto Fijo Mensual), o
   *  - cuotas pendientes (currentInstallment < totalInstallments).
   *
   * Es idempotente: chequea SIEMPRE contra la DB (no contra estado en memoria,
   * que puede estar desactualizado tras navegaciones rápidas) y captura el
   * unique constraint para no duplicar aunque haya carreras.
   *
   * Devuelve true si copió al menos un item (para que el caller decida recargar).
   */
  const replicateRecurringTo = async (
    targetMonth: number,
    targetYear: number,
    bId: string | undefined,
  ): Promise<boolean> => {
    // Mes anterior
    const prevDate = new Date(targetYear, targetMonth - 1, 1);
    const pm = prevDate.getMonth();
    const py = prevDate.getFullYear();

    const allItems = await SupabaseService.getBudgetItems(bId);
    const prevItems = allItems.filter(i => i.month === pm && i.year === py);
    const targetItems = allItems.filter(i => i.month === targetMonth && i.year === targetYear);

    // Set de claves ya existentes en el target → evita duplicar.
    // Clave compuesta: label + categoryId (consistente con el unique de DB).
    const targetKeys = new Set(
      targetItems.map(i => `${(i.label || '').toLowerCase().trim()}|${i.categoryId || ''}`),
    );

    let copied = 0;
    for (const item of prevItems) {
      const isRecurring = !!item.isRecurring;
      const hasInstallments = (item.totalInstallments || 1) > (item.currentInstallment || 1);
      if (!isRecurring && !hasInstallments) continue;

      const key = `${(item.label || '').toLowerCase().trim()}|${item.categoryId || ''}`;
      if (targetKeys.has(key)) continue; // ya existe → skip

      const newItem: any = {
        ...item,
        id: undefined,
        month: targetMonth,
        year: targetYear,
      };
      if (hasInstallments && !isRecurring) {
        newItem.currentInstallment = (item.currentInstallment || 1) + 1;
      }

      try {
        await SupabaseService.saveBudgetItem(newItem, bId);
        targetKeys.add(key);
        copied++;
      } catch (err: any) {
        // Si la DB rechaza por unique violation, lo ignoramos: ya estaba copiado.
        const msg = String(err?.message || err || '');
        if (msg.includes('duplicate key') || msg.includes('uniq_fin_budget_items')) continue;
        console.warn('replicateRecurringTo: skip item por error', err);
      }
    }
    return copied > 0;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const bId = activeEntity.id || undefined;

      // 1) Antes de leer, intentar replicar al mes activo lo recurrente del mes
      // anterior. Si copió algo, los datos que vamos a leer ya lo incluyen.
      try {
        await replicateRecurringTo(currentMonth, currentYear, bId);
      } catch (e) {
        console.warn('Auto-replicación falló, sigo igual:', e);
      }

      const [items, t, cat, subCat, accs, accTypes] = await Promise.all([
        SupabaseService.getBudgetItems(bId),
        SupabaseService.getTransactions(bId),
        SupabaseService.getCategories(bId),
        SupabaseService.getAllSubCategories(bId),
        SupabaseService.getAccounts(bId),
        SupabaseService.getAccountTypes(bId)
      ]);
      setBudgetItems(items);
      setTransactions(t);
      setSubCategories(subCat);
      setAccounts(accs);
      setAccountTypes(accTypes);

      // Auto-crear categoría Inversiones/Ahorro si no existe
      const savingsCatName = 'Inversiones / Ahorro';
      let updatedCats = cat;
      let savingsCat = cat.find(c => c.name === savingsCatName);
      if (!savingsCat) {
        savingsCat = await service.addCategory({ name: savingsCatName, type: 'MIX', isActive: true }, bId);
        updatedCats = [...cat, savingsCat];

        const subs = ['Frascos (Plazo Fijo)', 'Cripto', 'Acciones / FCI', 'Ahorro en USD', 'Otro'];
        for (const subName of subs) {
          const newSub = await service.addSubCategory({ categoryId: savingsCat.id, name: subName, isActive: true }, bId);
          setSubCategories(prev => [...prev, newSub]);
        }
      }
      setCategories(updatedCats);
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

    const bId = activeEntity.id || undefined;
    const copied = await replicateRecurringTo(m, y, bId);
    if (copied) await loadData();

    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!newItem.categoryId || !newItem.plannedAmount || !newItem.label) return;

    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecutePayment = async () => {
    if (!executingItem || !selectedAccountId || isExecuting) return;

    setIsExecuting(true);
    try {
      const bId = activeEntity.id || undefined;
      const transaction: Partial<Transaction> = {
        date: new Date().toISOString().split('T')[0],
        categoryId: executingItem.categoryId,
        subCategoryId: executingItem.subCategoryId,
        description: executingItem.label,
        amount: Number(paymentAmount),
        type: TransactionType.OUT,
        accountId: selectedAccountId
      };

      await SupabaseService.addTransaction(transaction, bId);
      await loadData();
      setShowPaymentModal(false);
      setExecutingItem(null);
      setSelectedAccountId('');
    } catch (error) {
      console.error("Error executing payment:", error);
      alert("Error al registrar el pago");
    } finally {
      setIsExecuting(false);
    }
  };

  // ============== PAGO RESUMEN DE TARJETA ==============

  /** ¿La cuenta es de tipo tarjeta de crédito? */
  const isCreditCardAccount = (acc: Account): boolean => {
    const t = accountTypes.find(at => at.id === acc.accountTypeId);
    if (!t) return false;
    const name = (t.name || '').toLowerCase();
    return name.includes('crédit') || name.includes('credito') || name.includes('tarjeta');
  };

  /** Tarjetas con cuotas pendientes en el mes activo. */
  const cardsWithPendingThisMonth = useMemo(() => {
    const out: { account: Account; items: BudgetItem[]; total: number }[] = [];
    accounts.filter(isCreditCardAccount).forEach(acc => {
      const pendingItems = budgetItems.filter(b =>
        b.accountId === acc.id &&
        b.year === currentYear &&
        b.month === currentMonth &&
        !b.paidAt
      );
      if (pendingItems.length > 0) {
        const total = pendingItems.reduce((s, i) => s + (i.plannedAmount || 0), 0);
        out.push({ account: acc, items: pendingItems, total });
      }
    });
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, accountTypes, budgetItems, currentMonth, currentYear]);

  const openCardSummaryModal = (accountId: string) => {
    const card = cardsWithPendingThisMonth.find(c => c.account.id === accountId);
    if (!card) return;
    setCardSummaryAccountId(accountId);
    setCardSummaryAmount(card.total);
    setCardSummaryPayAccountId('');
    // Default category: la del primer item (suelen ser todas la misma "Préstamos / Cuotas")
    setCardSummaryCategoryId(card.items[0]?.categoryId || '');
    setShowCardSummaryModal(true);
  };

  const handlePayCardSummary = async () => {
    if (isPayingCardSummary) return;
    if (!cardSummaryAccountId || !cardSummaryPayAccountId || cardSummaryAmount <= 0 || !cardSummaryCategoryId) {
      alert('Completá todos los campos del resumen.');
      return;
    }
    setIsPayingCardSummary(true);
    try {
      const bId = activeEntity.id || undefined;
      const card = cardsWithPendingThisMonth.find(c => c.account.id === cardSummaryAccountId);
      if (!card) throw new Error('Tarjeta no encontrada.');

      const result = await SupabaseService.payCardSummary({
        cardAccountId: cardSummaryAccountId,
        payFromAccountId: cardSummaryPayAccountId,
        year: currentYear,
        month: currentMonth,
        totalAmount: Number(cardSummaryAmount),
        date: new Date().toISOString().split('T')[0],
        categoryId: cardSummaryCategoryId,
        description: `Pago resumen ${card.account.name} ${currentMonth + 1}/${currentYear}`
      }, bId);

      await loadData();
      setShowCardSummaryModal(false);
      alert(`Resumen pagado. ${result.paidItemsCount} cuotas marcadas como pagadas. Transacción ID: ${result.transactionId.slice(0, 8)}...`);
    } catch (error: any) {
      console.error('Error pagando resumen:', error);
      alert('Error al pagar resumen: ' + (error?.message || 'desconocido'));
    } finally {
      setIsPayingCardSummary(false);
    }
  };

  // ============== /PAGO RESUMEN ==============

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

        try {
          await SupabaseService.saveBudgetItem(newItem, bId);
          importCount++;
        } catch (e: any) {
          const msg = String(e?.message || '');
          if (!(msg.includes('duplicate key') || msg.includes('uniq_fin_budget_items'))) {
            throw e;
          }
          // Duplicado: lo ignoramos silenciosamente.
        }
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

  const handleDuplicateNextMonth = async (item: BudgetItem) => {
    if (isSaving) return;
    
    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }

    setIsSaving(true);
    try {
      const bId = activeEntity.id || undefined;
      const existingItems = await SupabaseService.getBudgetItems(bId);
      const isAlreadyCopied = existingItems.some(i => 
        i.month === nextMonth && 
        i.year === nextYear && 
        i.categoryId === item.categoryId &&
        i.label.toLowerCase() === item.label.toLowerCase()
      );

      if (isAlreadyCopied) {
        if (!confirm(`El ítem "${item.label}" ya parece existir en el próximo mes. ¿Copiar igual?`)) {
          setIsSaving(false);
          return;
        }
      }

      const { id, ...newItemData } = item;
      const newItem = {
        ...newItemData,
        month: nextMonth,
        year: nextYear
      };

      try {
        await SupabaseService.saveBudgetItem(newItem, bId);
        alert(`Ítem "${item.label}" copiado al mes siguiente exitosamente.`);
      } catch (e: any) {
        const msg = String(e?.message || '');
        if (msg.includes('duplicate key') || msg.includes('uniq_fin_budget_items')) {
          alert(`El ítem "${item.label}" ya existe en el próximo mes. No se copia para evitar duplicados.`);
        } else {
          throw e;
        }
      }
    } catch (error) {
      console.error(error);
      alert("Error al copiar el ítem");
    } finally {
      setIsSaving(false);
    }
  };

  const actualAmounts = useMemo(() => {
    const actuals: Record<string, number> = {};
    budgetItems.forEach(i => { if (i.id) actuals[i.id] = 0; });
    
    transactions.forEach(t => {
      const tDate = new Date(t.date);
      const candidates = budgetItems.filter(i => 
        tDate.getMonth() === i.month && 
        tDate.getFullYear() === i.year && 
        t.categoryId === i.categoryId && 
        t.type === i.type &&
        (!i.subCategoryId || !t.subCategoryId || i.subCategoryId === t.subCategoryId)
      );

      if (candidates.length === 0) return;
      if (candidates.length === 1 && candidates[0].id) {
        actuals[candidates[0].id] += t.amount;
        return;
      }

      const descLower = t.description.toLowerCase();
      
      // 1. Label match exacto
      const exactMatches = candidates.filter(i => i.label.toLowerCase() === descLower);
      let winners = exactMatches.length > 0 ? exactMatches : candidates;

      // 2. Exact amount match (margen < 1.1)
      if (winners.length > 1) {
        const amountMatches = winners.filter(i => Math.abs(t.amount - i.plannedAmount) < 1.1);
        if (amountMatches.length > 0) winners = amountMatches;
      }

      // 3. Keyword match (si no hubo exactMatch)
      if (winners.length > 1 && exactMatches.length === 0) {
        let maxScore = -1;
        let bestWinners: BudgetItem[] = [];
        winners.forEach(i => {
           const words = i.label.toLowerCase().split(/\s+/).filter(w => w.length > 2);
           const score = words.filter(w => descLower.includes(w)).length;
           if (score > maxScore) { maxScore = score; bestWinners = [i]; }
           else if (score === maxScore) { bestWinners.push(i); }
        });
        if (maxScore > 0) winners = bestWinners;
      }

      // 4. Asignamos a la opción que tenga más "espacio" o a la primera
      const notFullWinners = winners.filter(w => w.id && actuals[w.id] < w.plannedAmount);
      const selected = notFullWinners.length > 0 ? notFullWinners[0] : winners[0];
      
      if (selected && selected.id) {
        actuals[selected.id] += t.amount;
      }
    });

    return actuals;
  }, [budgetItems, transactions]);

  const calculateActual = (item: BudgetItem) => {
    return item.id ? (actualAmounts[item.id] || 0) : 0;
  };

  const renderBudgetTable = (type: TransactionType, title: string) => {
    let items = budgetItems.filter(i => i.month === currentMonth && i.year === currentYear && i.type === type);

    // Apply filters
    if (filterCategory) items = items.filter(i => i.categoryId === filterCategory);
    if (filterSubCategory) items = items.filter(i => i.subCategoryId === filterSubCategory);
    if (filterDateFrom !== '') items = items.filter(i => (i.plannedDate || 0) >= filterDateFrom);
    if (filterDateTo !== '') items = items.filter(i => (i.plannedDate || 32) <= filterDateTo);
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      items = items.filter(i => {
        const cat = categories.find(c => c.id === i.categoryId)?.name || '';
        const sub = subCategories.find(s => s.id === i.subCategoryId)?.name || '';
        return i.label.toLowerCase().includes(q) || cat.toLowerCase().includes(q) || sub.toLowerCase().includes(q);
      });
    }

    // Logic for sorting: default is by day ASC → then by category name ASC
    const sortedItems = [...items].sort((a, b) => {
      let comparison = 0;
      const catA = categories.find(c => c.id === a.categoryId)?.name || '';
      const catB = categories.find(c => c.id === b.categoryId)?.name || '';

      switch (sortConfig.key) {
        case 'date':
          comparison = (a.plannedDate || 32) - (b.plannedDate || 32);
          if (comparison === 0) comparison = catA.localeCompare(catB);
          if (comparison === 0) comparison = a.label.localeCompare(b.label);
          break;
        case 'amount':
          comparison = a.plannedAmount - b.plannedAmount;
          break;
        case 'category':
          comparison = catA.localeCompare(catB);
          if (comparison === 0) comparison = (a.plannedDate || 32) - (b.plannedDate || 32);
          break;
        case 'label':
          comparison = a.label.localeCompare(b.label);
          break;
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    const totalPlanned = items.reduce((s, i) => s + i.plannedAmount, 0);
    const totalActual = items.reduce((s, i) => s + calculateActual(i), 0);
    const totalPct = totalPlanned > 0 ? totalActual / totalPlanned : 0;

    const handleHeaderClick = (key: 'date' | 'amount' | 'category' | 'label') => {
      setSortConfig(current => ({
        key,
        direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
      }));
    };

    const SortIcon = ({ colKey }: { colKey: 'date' | 'amount' | 'category' | 'label' }) => {
      if (sortConfig.key !== colKey) return null;
      return <span className="ml-1 text-[8px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    };

    return (
      <div className="bg-fin-card rounded-md border border-fin-border overflow-hidden mb-10">
        <div className="px-8 py-6 bg-fin-bg/40 border-b border-fin-border flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-1 h-4 rounded-full ${type === 'IN' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-danger)]'}`}></div>
            <h3 className="text-xs font-black uppercase tracking-widest text-fin-text">{title}</h3>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${
                showFilters || activeFilterCount > 0
                  ? 'bg-brand/10 border-brand/30 text-brand'
                  : 'border-fin-border text-fin-muted hover:text-fin-text hover:border-fin-text/30'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Filtros{activeFilterCount > 0 && <span className="bg-brand text-[#050607] w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-black">{activeFilterCount}</span>}
            </button>
            <div className="text-[10px] font-black text-fin-muted tracking-widest uppercase">
              {formatCurrency(totalActual)} / {formatCurrency(totalPlanned)}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="px-8 py-4 bg-fin-bg/60 border-b border-fin-border flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-black uppercase tracking-widest text-fin-muted">Categoría</label>
              <select
                value={filterCategory}
                onChange={e => { setFilterCategory(e.target.value); setFilterSubCategory(''); }}
                className="bg-fin-card border border-fin-border rounded-lg px-3 py-1.5 text-xs text-fin-text focus:border-brand focus:outline-none min-w-[140px]"
              >
                <option value="">Todas</option>
                {categories
                  .filter(c => items.length > 0 || budgetItems.some(i => i.month === currentMonth && i.year === currentYear && i.type === type && i.categoryId === c.id))
                  .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {filterCategory && (
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-fin-muted">Subcategoría</label>
                <select
                  value={filterSubCategory}
                  onChange={e => setFilterSubCategory(e.target.value)}
                  className="bg-fin-card border border-fin-border rounded-lg px-3 py-1.5 text-xs text-fin-text focus:border-brand focus:outline-none min-w-[140px]"
                >
                  <option value="">Todas</option>
                  {subCategories.filter(s => s.categoryId === filterCategory).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-black uppercase tracking-widest text-fin-muted">Día desde</label>
              <input
                type="number" min="1" max="31" placeholder="1"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value ? parseInt(e.target.value) : '')}
                className="bg-fin-card border border-fin-border rounded-lg px-3 py-1.5 text-xs text-fin-text focus:border-brand focus:outline-none w-20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-black uppercase tracking-widest text-fin-muted">Día hasta</label>
              <input
                type="number" min="1" max="31" placeholder="31"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value ? parseInt(e.target.value) : '')}
                className="bg-fin-card border border-fin-border rounded-lg px-3 py-1.5 text-xs text-fin-text focus:border-brand focus:outline-none w-20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-black uppercase tracking-widest text-fin-muted">Buscar</label>
              <input
                type="text" placeholder="Nombre o rubro..."
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                className="bg-fin-card border border-fin-border rounded-lg px-3 py-1.5 text-xs text-fin-text focus:border-brand focus:outline-none min-w-[160px]"
              />
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-[10px] font-bold text-[var(--color-danger)] hover:text-[var(--color-danger)] flex items-center gap-1 pb-1.5 transition-colors"
              >
                <X className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[9px] text-fin-muted uppercase tracking-widest border-b border-fin-border">
              <tr>
                <th className="px-8 py-4 font-black cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none" onClick={() => handleHeaderClick('date')}>
                  Plan <SortIcon colKey="date" />
                </th>
                <th className="px-8 py-4 font-black text-xs opacity-50 select-none">Ajuste</th>
                <th className="px-8 py-4 font-black cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none" onClick={() => handleHeaderClick('category')}>
                  Concepto / Rubro <SortIcon colKey="category" />
                </th>
                <th className="px-8 py-4 text-right font-black cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none" onClick={() => handleHeaderClick('amount')}>
                  Previsto <SortIcon colKey="amount" />
                </th>
                <th className="px-8 py-4 text-right font-black select-none">Real</th>
                <th className="px-8 py-4 text-right font-black select-none">Eje.</th>
                <th className="px-8 py-4 text-right font-black select-none">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fin-border/50">
              {sortedItems.map(item => {
                const actual = calculateActual(item);
                const pct = item.plannedAmount > 0 ? actual / item.plannedAmount : 0;
                let barColor = 'bg-brand';
                if (type === 'OUT') { if (pct > 1) barColor = 'bg-[var(--color-danger)]'; else if (pct > 0.8) barColor = 'bg-[var(--color-warning)]'; else barColor = 'bg-[var(--color-success)]'; }
                else { if (pct >= 1) barColor = 'bg-[var(--color-success)]'; else barColor = 'bg-brand'; }

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
                          <span className="text-[var(--color-primary)] font-black text-sm">
                            {getAdjustedWorkingDay(item.plannedDate, item.month, item.year).getDate()}
                          </span>
                          <span className="text-[8px] text-[var(--color-primary)]/50 uppercase tracking-widest font-black">Hábil</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <p className="font-bold text-fin-text leading-tight">{item.label}</p>
                        <div className="flex flex-wrap gap-2">
                          <p className="text-[9px] text-fin-muted uppercase tracking-widest font-black flex items-center gap-1.5 px-2 py-0.5 bg-fin-bg rounded-lg w-fit border border-fin-border/50">
                            <div className="w-1 h-1 rounded-full bg-[var(--color-primary)]"></div>
                            {categories.find(c => c.id === item.categoryId)?.name}
                          </p>
                          {item.isRecurring && (
                            <span className="text-[8px] font-black text-[var(--color-success)] bg-[var(--color-success)]/10 px-1.5 py-0.5 rounded-md uppercase tracking-tighter border border-[var(--color-success)]/20">Fijo</span>
                          )}
                          {item.paidAt && (
                            <span className="text-[8px] font-black text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-1.5 py-0.5 rounded-md uppercase tracking-tighter border border-[var(--color-primary)]/30 flex items-center gap-1">
                              <Check size={9} strokeWidth={3} /> Pagada
                            </span>
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
                        {(!item.totalInstallments || item.totalInstallments <= 1) && (
                          <button onClick={() => handleDuplicateNextMonth(item)} className="p-2 bg-fin-bg rounded-lg text-fin-text hover:text-[var(--color-primary)] border border-fin-border transition-all" title="Copiar al mes siguiente"><Copy size={14} /></button>
                        )}
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
                        
                        {type === TransactionType.OUT && (
                          <button 
                            onClick={() => {
                              setExecutingItem(item);
                              setPaymentAmount(Math.max(0, item.plannedAmount - calculateActual(item)));
                              setShowPaymentModal(true);
                            }} 
                            className="p-2 bg-[var(--color-success)]/10 rounded-lg text-[var(--color-success)] hover:bg-[var(--color-success)] hover:text-[#050607] border border-[var(--color-success)]/20 transition-all"
                            title="Ejecutar Pago"
                          >
                            <CreditCard size={14} />
                          </button>
                        )}

                        <button onClick={async () => { if (confirm('¿Eliminar proyección definitivamente?')) { await SupabaseService.deleteBudgetItem(item.id); await loadData(); } }} className="p-2 bg-fin-bg rounded-lg text-fin-text hover:text-[var(--color-danger)] border border-fin-border transition-all"><Trash2 size={14} /></button>
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
          <div className="flex bg-fin-card rounded-md border border-fin-border p-1 items-center">
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
          <button onClick={() => { setIsAdding(!isAdding); setEditingId(null); setNewItem({ type: TransactionType.OUT, plannedAmount: 0, label: '' }); }} className="bg-brand text-fin-bg px-5 py-3 rounded-md text-xs font-black uppercase tracking-widest hover:bg-brand-hover transition-all">
            {isAdding ? 'CERRAR FORM' : 'NUEVO ITEM'}
          </button>
          <button onClick={importFromPreviousMonth} className="bg-fin-card border border-fin-border text-fin-muted hover:text-[var(--text-primary)] px-4 py-3 rounded-md text-[10px] font-black uppercase tracking-widest hover:border-brand transition-all" title="Importar recurrentes del mes anterior">
            <Sparkles size={16} />
          </button>
        </div>
      </div>

      {/* CHIPS: Resumen pendiente por tarjeta de crédito */}
      {cardsWithPendingThisMonth.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-2">
          {cardsWithPendingThisMonth.map(({ account, items, total }) => (
            <button
              key={account.id}
              onClick={() => openCardSummaryModal(account.id)}
              className="group flex items-center gap-3 bg-fin-card border border-fin-border hover:border-brand px-4 py-3 rounded-md transition-all"
              title={`Pagar resumen completo de ${account.name}`}
            >
              <Receipt className="w-4 h-4 text-brand" />
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-widest text-fin-muted group-hover:text-[var(--text-primary)]">
                  Pagar resumen {account.name}
                </div>
                <div className="text-xs font-bold text-[var(--text-primary)]">
                  {items.length} cuota{items.length === 1 ? '' : 's'} · {formatCurrency(total)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="bg-fin-card p-1 rounded-md border border-fin-border w-fit">
        <button
          onClick={() => setActiveBudgetTab(TransactionType.OUT)}
          className={`px-6 py-3 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeBudgetTab === TransactionType.OUT ? 'bg-[var(--color-danger)] text-[var(--text-primary)] shadow-lg shadow-red-500/20' : 'text-fin-muted hover:text-[var(--text-primary)]'}`}
        >
          Salidas
        </button>
        <button
          onClick={() => setActiveBudgetTab(TransactionType.IN)}
          className={`px-6 py-3 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeBudgetTab === TransactionType.IN ? 'bg-[var(--color-success)] text-[var(--text-primary)] shadow-lg shadow-emerald-500/20' : 'text-fin-muted hover:text-[var(--text-primary)]'}`}
        >
          Ingresos
        </button>
        <button
          onClick={() => setActiveBudgetTab(TransactionType.SAVINGS)}
          className={`px-6 py-3 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeBudgetTab === TransactionType.SAVINGS ? 'bg-[var(--color-warning)] text-[var(--text-primary)] shadow-lg shadow-amber-500/20' : 'text-fin-muted hover:text-[var(--text-primary)]'}`}
        >
          Ahorro
        </button>
      </div>

      {isAdding && (
        <div ref={formRef} className="bg-fin-card p-10 rounded-[32px] border border-fin-border animate-fade-in mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          {/* Botón de cierre */}
          <button
            type="button"
            onClick={() => { setIsAdding(false); setEditingId(null); setNewItem({ type: TransactionType.OUT, plannedAmount: 0, label: '' }); }}
            className="absolute top-6 right-6 p-2 text-fin-muted hover:text-[var(--text-primary)] transition-colors z-20"
          >
            <X size={24} />
          </button>
          <h3 className="text-xl font-black mb-10 text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-3">
            <Plus className="text-brand" size={24} />
            {editingId ? 'Modificar Proyección' : 'Nueva Planificación Mensual'}
          </h3>
          <form onSubmit={handleSaveItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1">Tipo de Flujo</label>
              <select value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value as TransactionType, categoryId: undefined, subCategoryId: undefined })} className="w-full bg-[#050f1a] border border-white/10 rounded-md p-4 text-sm text-[var(--text-primary)] font-bold outline-none focus:border-brand transition-all appearance-none cursor-pointer">
                <option value={TransactionType.IN}>Ingreso</option>
                <option value={TransactionType.OUT}>Gasto (Salida)</option>
                <option value={TransactionType.SAVINGS}>Ahorro / Inversión</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1">1. Rubro Principal</label>
              <select value={newItem.categoryId || ''} onChange={e => setNewItem({ ...newItem, categoryId: e.target.value, subCategoryId: undefined })} className="w-full bg-[#050f1a] border border-white/10 rounded-md p-4 text-sm text-[var(--text-primary)] font-bold outline-none focus:border-brand transition-all appearance-none cursor-pointer" required>
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
                className="w-full bg-[#050f1a] border border-white/10 rounded-md p-4 text-sm text-[var(--text-primary)] font-bold outline-none focus:border-brand transition-all appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
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
              <input type="text" value={newItem.label || ''} onChange={e => setNewItem({ ...newItem, label: e.target.value })} placeholder="Ej. Pago de luz" className="w-full bg-[#050f1a] border border-white/10 rounded-md p-4 text-sm text-[var(--text-primary)] font-bold outline-none focus:border-brand transition-all placeholder:text-[var(--text-primary)]/20" required />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1">Día Estimado</label>
              <input type="number" max="31" min="1" value={newItem.plannedDate || ''} onChange={e => setNewItem({ ...newItem, plannedDate: Number(e.target.value) })} className="w-full bg-[#050f1a] border border-white/10 rounded-md p-4 text-sm text-[var(--text-primary)] font-bold outline-none focus:border-brand transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1">Monto Proyectado</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fin-muted font-bold">$</span>
                <input type="number" step="0.01" value={newItem.plannedAmount || ''} onChange={e => setNewItem({ ...newItem, plannedAmount: Number(e.target.value) })} className="w-full bg-[#050f1a] border border-white/10 rounded-md p-4 pl-8 text-sm text-[var(--text-primary)] font-black outline-none focus:border-brand transition-all" required />
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
                <span className="text-[10px] font-black uppercase tracking-widest text-fin-muted group-hover:text-[var(--text-primary)] transition-colors">Gasto Fijo (Mensual)</span>
              </label>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1">Cuotas / Pagos</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={newItem.currentInstallment || 1}
                    onChange={e => setNewItem({ ...newItem, currentInstallment: Number(e.target.value) })}
                    className="w-16 bg-[#050f1a] border border-white/10 rounded-md p-2 text-xs text-[var(--text-primary)] font-bold outline-none focus:border-brand"
                    placeholder="Cuota"
                  />
                  <span className="text-fin-muted text-[10px] font-black uppercase">de</span>
                  <input
                    type="number"
                    min="1"
                    value={newItem.totalInstallments || 1}
                    onChange={e => setNewItem({ ...newItem, totalInstallments: Number(e.target.value) })}
                    className="w-16 bg-[#050f1a] border border-white/10 rounded-md p-2 text-xs text-[var(--text-primary)] font-bold outline-none focus:border-brand"
                    placeholder="Total"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <button type="submit" disabled={isSaving} className="w-full bg-brand text-fin-bg rounded-md py-4 font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-hover transition-all shadow-xl shadow-brand/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSaving ? 'GUARDANDO...' : (editingId ? 'ACTUALIZAR DATOS' : 'CREAR PROYECCIÓN')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget Summary Cards */}
      {(() => {
        const monthItems = budgetItems.filter(i => i.month === currentMonth && i.year === currentYear);
        const totalInBudget = monthItems.filter(i => i.type === 'IN').reduce((s, i) => s + i.plannedAmount, 0);
        const totalOutBudget = monthItems.filter(i => i.type === 'OUT').reduce((s, i) => s + i.plannedAmount, 0);
        const totalSavingsBudget = monthItems.filter(i => i.type === 'SAVINGS').reduce((s, i) => s + i.plannedAmount, 0);
        const disponible = totalInBudget - totalOutBudget - totalSavingsBudget;
        const totalInActual = monthItems.filter(i => i.type === 'IN').reduce((s, i) => s + calculateActual(i), 0);
        const totalOutActual = monthItems.filter(i => i.type === 'OUT').reduce((s, i) => s + calculateActual(i), 0);

        return (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-fin-card rounded-md border border-fin-border p-5 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-[var(--color-success)]/10 rounded-full blur-xl"></div>
              <p className="text-[9px] font-black text-fin-muted uppercase tracking-widest mb-1">Ingreso Presup.</p>
              <p className="text-xl font-black text-[var(--color-success)] tabular-nums">{formatCurrency(totalInBudget)}</p>
              <p className="text-[9px] font-bold text-fin-muted mt-1">Real: <span className="text-[var(--text-primary)]">{formatCurrency(totalInActual)}</span></p>
            </div>
            <div className="bg-fin-card rounded-md border border-fin-border p-5 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-[var(--color-danger)]/10 rounded-full blur-xl"></div>
              <p className="text-[9px] font-black text-fin-muted uppercase tracking-widest mb-1">Egreso Presup.</p>
              <p className="text-xl font-black text-[var(--color-danger)] tabular-nums">{formatCurrency(totalOutBudget)}</p>
              <p className="text-[9px] font-bold text-fin-muted mt-1">Real: <span className="text-[var(--text-primary)]">{formatCurrency(totalOutActual)}</span></p>
            </div>
            <div className="bg-fin-card rounded-md border border-fin-border p-5 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-[var(--color-warning)]/10 rounded-full blur-xl"></div>
              <p className="text-[9px] font-black text-fin-muted uppercase tracking-widest mb-1">Ahorro Planif.</p>
              <p className="text-xl font-black text-[var(--color-warning)] tabular-nums">{formatCurrency(totalSavingsBudget)}</p>
              <p className="text-[9px] font-bold text-[var(--color-warning)]/60 mt-1">Inversiones & Frascos</p>
            </div>
            <div className="bg-fin-card rounded-md border border-fin-border p-5 relative overflow-hidden">
              <div className={`absolute -top-6 -right-6 w-16 h-16 ${disponible >= 0 ? 'bg-[var(--color-primary)]/10' : 'bg-[var(--color-danger)]/10'} rounded-full blur-xl`}></div>
              <p className="text-[9px] font-black text-fin-muted uppercase tracking-widest mb-1">Disponible</p>
              <p className={`text-xl font-black tabular-nums ${disponible >= 0 ? 'text-[var(--color-primary)]' : 'text-[var(--color-danger)]'}`}>
                {formatCurrency(disponible)}
              </p>
              <p className="text-[9px] font-bold text-fin-muted mt-1">Ingreso - Egreso - Ahorro</p>
            </div>
            <div className="bg-fin-card rounded-md border border-fin-border p-5 relative overflow-hidden">
              <div className={`absolute -top-6 -right-6 w-16 h-16 ${(totalInActual - totalOutActual) >= 0 ? 'bg-[var(--color-success)]/10' : 'bg-[var(--color-danger)]/10'} rounded-full blur-xl`}></div>
              <p className="text-[9px] font-black text-fin-muted uppercase tracking-widest mb-1">Resultado Real</p>
              <p className={`text-xl font-black tabular-nums ${(totalInActual - totalOutActual) >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                {(totalInActual - totalOutActual) >= 0 ? '+' : ''}{formatCurrency(totalInActual - totalOutActual)}
              </p>
              <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${(totalInActual - totalOutActual) >= 0 ? 'text-[var(--color-success)]/60' : 'text-[var(--color-danger)]/60'}`}>
                {(totalInActual - totalOutActual) >= 0 ? '▲ Ganancia' : '▼ Pérdida'}
              </p>
            </div>
          </div>
        );
      })()}

      {activeBudgetTab === TransactionType.IN
        ? renderBudgetTable(TransactionType.IN, 'Planificación de Ingresos')
        : activeBudgetTab === TransactionType.SAVINGS
          ? renderBudgetTable(TransactionType.SAVINGS, 'Planificación de Ahorro / Inversiones')
          : renderBudgetTable(TransactionType.OUT, 'Planificación de Gastos')
      }

      {/* Modal de Ejecución de Pago */}
      {/* MODAL: Pagar Resumen de Tarjeta */}
      {showCardSummaryModal && (() => {
        const card = cardsWithPendingThisMonth.find(c => c.account.id === cardSummaryAccountId);
        if (!card) return null;
        const otherAccounts = accounts.filter(a => a.id !== card.account.id && a.isActive !== false);
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-fin-card w-full max-w-lg rounded-[32px] border border-fin-border shadow-2xl overflow-hidden relative">
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fin-muted mb-1">— CPD-FIN-CARD-PAY</div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                      <Receipt className="text-brand" size={22} />
                      Pagar Resumen {card.account.name}
                    </h3>
                    <p className="text-[11px] text-fin-muted mt-1">
                      {currentMonth + 1}/{currentYear} · {card.items.length} cuota{card.items.length === 1 ? '' : 's'} pendiente{card.items.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <button onClick={() => setShowCardSummaryModal(false)} className="p-2 text-fin-muted hover:text-[var(--text-primary)]">
                    <X size={18} />
                  </button>
                </div>

                {/* Lista de cuotas */}
                <div className="bg-fin-bg border border-fin-border rounded-md p-4 max-h-40 overflow-y-auto space-y-1">
                  {card.items.map(it => (
                    <div key={it.id} className="flex justify-between text-xs">
                      <span className="text-[var(--text-primary)]">{it.label}</span>
                      <span className="text-fin-muted font-mono">{formatCurrency(it.plannedAmount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold pt-2 mt-2 border-t border-fin-border">
                    <span className="text-[var(--text-primary)]">Suma cuotas</span>
                    <span className="text-brand font-mono">{formatCurrency(card.total)}</span>
                  </div>
                </div>

                {/* Monto total del resumen (editable, default = suma de cuotas) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-fin-muted tracking-widest">
                    Total del resumen (incluye consumos extra si los hay)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cardSummaryAmount}
                    onChange={e => setCardSummaryAmount(Number(e.target.value))}
                    className="w-full bg-fin-bg border border-fin-border rounded-md p-3 text-[var(--text-primary)] font-bold focus:border-brand outline-none"
                  />
                  {Math.abs(cardSummaryAmount - card.total) > 0.5 && (
                    <p className="text-[10px] text-amber-400">
                      Diferencia con suma de cuotas: {formatCurrency(cardSummaryAmount - card.total)} (consumos extra / intereses)
                    </p>
                  )}
                </div>

                {/* Cuenta desde la que se paga */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-fin-muted tracking-widest">Pagar desde</label>
                  <select
                    value={cardSummaryPayAccountId}
                    onChange={e => setCardSummaryPayAccountId(e.target.value)}
                    className="w-full bg-fin-bg border border-fin-border rounded-md p-3 text-[var(--text-primary)] text-xs font-bold focus:border-brand outline-none"
                  >
                    <option value="">Seleccionar cuenta…</option>
                    {otherAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                {/* Categoría */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-fin-muted tracking-widest">Categoría de la transacción</label>
                  <select
                    value={cardSummaryCategoryId}
                    onChange={e => setCardSummaryCategoryId(e.target.value)}
                    className="w-full bg-fin-bg border border-fin-border rounded-md p-3 text-[var(--text-primary)] text-xs font-bold focus:border-brand outline-none"
                  >
                    {categories.filter(c => c.type === TransactionType.OUT || c.type === 'MIX').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handlePayCardSummary}
                  disabled={isPayingCardSummary || !cardSummaryPayAccountId || cardSummaryAmount <= 0}
                  className="w-full py-4 bg-brand text-fin-bg rounded-md font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-brand/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPayingCardSummary ? 'Procesando…' : `Pagar ${formatCurrency(cardSummaryAmount)} · marcar ${card.items.length} cuota${card.items.length === 1 ? '' : 's'}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showPaymentModal && executingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-fin-card w-full max-w-md rounded-[32px] border border-fin-border shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-success)]/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-3">
                  <CreditCard className="text-[var(--color-success)]" size={24} />
                  Ejecutar Pago
                </h3>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 text-fin-muted hover:text-[var(--text-primary)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-fin-bg/50 p-4 rounded-md border border-fin-border/50">
                  <p className="text-[10px] font-black text-fin-muted uppercase tracking-widest mb-1">Concepto</p>
                  <p className="font-bold text-[var(--text-primary)]">{executingItem.label}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-fin-muted uppercase font-black px-2 py-0.5 bg-fin-bg rounded-md border border-fin-border/50">
                      {categories.find(c => c.id === executingItem.categoryId)?.name}
                    </span>
                    <span className="text-[10px] text-[var(--color-success)] font-black">
                      Plan: {formatCurrency(executingItem.plannedAmount)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1">Monto a Pagar</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fin-muted font-bold">$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={paymentAmount} 
                      onChange={e => setPaymentAmount(Number(e.target.value))} 
                      className="w-full bg-[#050f1a] border border-white/10 rounded-md p-4 pl-8 text-lg text-[var(--text-primary)] font-black outline-none focus:border-[var(--color-success)] transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1">¿Desde qué cuenta?</label>
                  <div className="grid grid-cols-1 gap-2">
                    {accounts.length === 0 ? (
                      <p className="text-[10px] text-[var(--color-danger)] italic">No tienes cuentas configuradas</p>
                    ) : (
                      accounts.map(acc => (
                        <button
                          key={acc.id}
                          onClick={() => setSelectedAccountId(acc.id)}
                          className={`flex items-center justify-between p-4 rounded-md border transition-all ${
                            selectedAccountId === acc.id 
                            ? 'bg-[var(--color-success)]/10 border-[var(--color-success)] text-[var(--text-primary)] shadow-lg shadow-emerald-500/10' 
                            : 'bg-[#050f1a] border-white/5 text-fin-muted hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {acc.accountTypeId.includes('bank') ? <Landmark size={18} /> : <Wallet size={18} />}
                            <span className="font-bold text-sm uppercase tracking-tight">{acc.name}</span>
                          </div>
                          {selectedAccountId === acc.id && <Check size={18} className="text-[var(--color-success)]" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <button 
                  onClick={handleExecutePayment}
                  disabled={!selectedAccountId || isExecuting || paymentAmount <= 0}
                  className="w-full bg-[var(--color-success)] text-fin-bg rounded-md py-5 font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isExecuting ? (
                    'PROCESANDO...'
                  ) : (
                    <>
                      CONFIRMAR PAGO
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
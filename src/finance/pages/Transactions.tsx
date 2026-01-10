import React, { useState, useEffect, useMemo } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { Transaction, Account, Category, SubCategory, TransactionType } from '../financeTypes';
import { Plus, X, Tag, Calendar, Wallet, Filter, ListFilter, RotateCcw, TrendingUp, TrendingDown, DollarSign, Search, Sparkles, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import { useFinanza } from '../context/FinanzaContext';

export const Transactions: React.FC = () => {
  const { activeEntity } = useFinanza();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // ... (Filter states remain same)
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [filterStartDate, setFilterStartDate] = useState(firstDay);
  const [filterEndDate, setFilterEndDate] = useState(lastDay);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<Transaction> & { isTransfer?: boolean, toAccountId?: string }>({
    date: new Date().toISOString().split('T')[0],
    type: TransactionType.OUT, amount: 0, description: '',
    isTransfer: false
  });

  useEffect(() => { loadData(); }, [activeEntity]);

  const loadData = async () => {
    setLoading(true);
    try {
      const bId = activeEntity.id || undefined;
      const [t, acc, cat, subCat] = await Promise.all([
        SupabaseService.getTransactions(bId),
        SupabaseService.getAccounts(bId),
        SupabaseService.getCategories(bId),
        SupabaseService.getAllSubCategories(bId)
      ]);
      setTransactions(t);
      setAccounts(acc);
      setCategories(cat);
      setSubCategories(subCat);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.date || !formData.accountId) return;

    try {
      const bId = activeEntity.id || undefined;

      if (formData.isTransfer) {
        if (!formData.toAccountId) return alert("Selecciona la cuenta destino");

        // Buscar el rubro de Transferencias o crear uno genérico
        let transCat = categories.find(c => c.name.toLowerCase().includes('transferencia'));
        if (!transCat) {
          // Si no existe, usamos el primero disponible como fallback
          transCat = categories[0];
        }

        await SupabaseService.performTransfer({
          fromAccountId: formData.accountId,
          toAccountId: formData.toAccountId,
          amount: formData.amount,
          description: formData.description || 'Transferencia entre cuentas',
          date: formData.date,
          categoryId: transCat.id
        }, bId);
      } else {
        if (!formData.categoryId) return alert("Selecciona un rubro");

        if (editingTransaction) {
          // Update existing transaction
          await SupabaseService.updateTransaction({
            ...editingTransaction,
            ...formData,
          } as Transaction);
        } else {
          // Create new transaction
          await SupabaseService.addTransaction(formData, bId);
        }
      }

      await loadData();
      closeModal();
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Error al guardar la operación");
    }
  };

  const openEditModal = (t: Transaction) => {
    setEditingTransaction(t);
    setFormData({
      id: t.id,
      date: t.date,
      type: t.type,
      amount: t.amount,
      description: t.description,
      categoryId: t.categoryId,
      subCategoryId: t.subCategoryId,
      accountId: t.accountId,
      isTransfer: false
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: TransactionType.OUT,
      amount: 0,
      description: '',
      isTransfer: false
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este movimiento?')) return;
    try {
      await SupabaseService.deleteTransaction(id);
      await loadData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Error al eliminar el movimiento");
    }
  };

  const clearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterCategory('');
    setFilterAccount('');
    setFilterType('');
    setSearchTerm('');
  };

  // Memoized Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterStartDate && t.date < filterStartDate) return false;
      if (filterEndDate && t.date > filterEndDate) return false;
      if (filterCategory && t.categoryId !== filterCategory) return false;
      if (filterAccount && t.accountId !== filterAccount) return false;
      if (filterType && t.type !== filterType) return false;
      if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterStartDate, filterEndDate, filterCategory, filterAccount, filterType, searchTerm]);

  // Totals for filtered data (excluyendo transferencias entre cuentas)
  const filteredTotals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      // Excluir transferencias del cálculo de totales
      const isTransfer = t.description?.toLowerCase().includes('transferencia');
      if (isTransfer) return acc;

      if (t.type === TransactionType.IN) acc.in += t.amount;
      else acc.out += t.amount;
      return acc;
    }, { in: 0, out: 0 });
  }, [filteredTransactions]);

  const activeFilterCount = [filterStartDate, filterEndDate, filterCategory, filterAccount, filterType, searchTerm].filter(Boolean).length;
  if (loading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-pulse">
        <div className="w-12 h-12 bg-brand/20 rounded-full flex items-center justify-center">
          <Sparkles className="text-brand animate-spin" size={24} />
        </div>
        <p className="text-fin-muted font-bold uppercase tracking-widest text-[10px]">Cargando movimientos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Movimientos</h1>
          <div className="flex items-center gap-2 mt-3">
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${activeEntity.type === 'personal' ? 'bg-brand/10 text-brand border border-brand/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
              {activeEntity.name}
            </span>
            <p className="text-fin-muted text-sm font-medium">Analiza y filtra tu actividad financiera</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 md:flex-none px-6 py-3.5 rounded-2xl font-bold text-sm transition-all border flex items-center justify-center gap-3 ${activeFilterCount > 0 || showFilters
              ? 'bg-brand/10 border-brand text-brand shadow-lg shadow-brand/5'
              : 'bg-fin-card border-fin-border text-fin-muted hover:text-white'
              }`}
          >
            <Filter size={18} />
            Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none bg-brand text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-brand-hover transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-3"
          >
            <Plus size={18} strokeWidth={3} /> Nueva
          </button>
        </div>
      </div>

      {/* Dynamic Filter Panel */}
      {showFilters && (
        <div className="bg-fin-card p-8 rounded-2xl border border-fin-border animate-fade-in shadow-xl space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">

            {/* Search Input */}
            <div className="space-y-2 lg:col-span-2 xl:col-span-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1 flex items-center gap-2">
                <Search size={12} /> Buscar
              </label>
              <input
                type="text"
                placeholder="Descripción..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#020b14] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-brand outline-none transition-all placeholder:text-white/20"
              />
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1 flex items-center gap-2">
                <Calendar size={12} /> Desde
              </label>
              <input
                type="date"
                value={filterStartDate}
                onChange={e => setFilterStartDate(e.target.value)}
                className="w-full bg-[#020b14] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-brand outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1 flex items-center gap-2">
                <Calendar size={12} /> Hasta
              </label>
              <input
                type="date"
                value={filterEndDate}
                onChange={e => setFilterEndDate(e.target.value)}
                className="w-full bg-[#020b14] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-brand outline-none transition-all"
              />
            </div>

            {/* Selectors */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1 flex items-center gap-2">
                <Tag size={12} /> Rubro
              </label>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full bg-[#020b14] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-brand outline-none appearance-none cursor-pointer transition-all"
              >
                <option value="">Todos los rubros</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1 flex items-center gap-2">
                <Wallet size={12} /> Cuenta
              </label>
              <select
                value={filterAccount}
                onChange={e => setFilterAccount(e.target.value)}
                className="w-full bg-[#020b14] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-brand outline-none appearance-none cursor-pointer transition-all"
              >
                <option value="">Todas las cuentas</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1 flex items-center gap-2">
                <ListFilter size={12} /> Flujo
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as any)}
                  className="flex-1 bg-[#020b14] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-brand outline-none appearance-none cursor-pointer transition-all"
                >
                  <option value="">Ambos</option>
                  <option value={TransactionType.IN}>Ingresos</option>
                  <option value={TransactionType.OUT}>Gastos</option>
                </select>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm flex-shrink-0"
                    title="Limpiar filtros"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-fin-card p-6 rounded-2xl border border-fin-border flex items-center gap-5 hover:border-emerald-500/30 transition-all group">
          <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl group-hover:scale-110 transition-transform"><TrendingUp size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-fin-muted uppercase tracking-widest mb-1">Entradas Filtradas</p>
            <p className="text-2xl font-black text-white tabular-nums tracking-tight">{formatCurrency(filteredTotals.in)}</p>
          </div>
        </div>
        <div className="bg-fin-card p-6 rounded-2xl border border-fin-border flex items-center gap-5 hover:border-red-500/30 transition-all group">
          <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl group-hover:scale-110 transition-transform"><TrendingDown size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-fin-muted uppercase tracking-widest mb-1">Salidas Filtradas</p>
            <p className="text-2xl font-black text-white tabular-nums tracking-tight">{formatCurrency(filteredTotals.out)}</p>
          </div>
        </div>
        <div className="bg-fin-card p-6 rounded-2xl border border-fin-border flex items-center gap-5 hover:border-brand/30 transition-all group">
          <div className="p-4 bg-brand/10 text-brand rounded-2xl group-hover:scale-110 transition-transform"><DollarSign size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-fin-muted uppercase tracking-widest mb-1">Resultado Neto</p>
            <p className="text-2xl font-black text-white tabular-nums tracking-tight">{formatCurrency(filteredTotals.in - filteredTotals.out)}</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-fin-card rounded-2xl border border-fin-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-fin-bg/40 border-b border-fin-border">
              <tr className="text-[10px] text-fin-muted font-black uppercase tracking-widest">
                <th className="px-8 py-5">Fecha</th>
                <th className="px-8 py-5">Descripción</th>
                <th className="px-8 py-5">Clasificación</th>
                <th className="px-8 py-5">Cuenta</th>
                <th className="px-8 py-5 text-right">Monto</th>
                <th className="px-8 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fin-border/30">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-6 text-fin-muted">
                      <div className="p-6 bg-fin-bg rounded-full border border-fin-border">
                        <ListFilter size={48} strokeWidth={1} className="opacity-30" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white">Sin resultados</p>
                        <p className="text-xs font-medium italic opacity-60">No encontramos movimientos que coincidan con los filtros aplicados</p>
                      </div>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={clearFilters}
                          className="px-6 py-2.5 bg-brand/10 text-brand rounded-xl text-[11px] font-black uppercase tracking-widest border border-brand/20 hover:bg-brand hover:text-white transition-all"
                        >
                          Limpiar Todos los Filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  const cat = categories.find(c => c.id === t.categoryId);
                  const acc = accounts.find(a => a.id === t.accountId);
                  return (
                    <tr key={t.id} className="hover:bg-fin-bg/30 transition-colors group">
                      <td className="px-8 py-5 font-bold text-white/60 tabular-nums text-xs whitespace-nowrap">{t.date}</td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-white text-[14px] leading-tight truncate max-w-[220px]">{t.description}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-fin-bg border border-fin-border rounded-lg text-[10px] font-black text-brand uppercase tracking-tighter">
                          <Tag size={10} /> {cat?.name}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-bold text-fin-muted uppercase tracking-widest bg-fin-bg/20 px-2.5 py-1.5 rounded-lg border border-fin-border/50">
                          {acc?.name}
                        </span>
                      </td>
                      <td className={`px-8 py-5 text-right font-black tabular-nums text-[16px] ${t.type === 'IN' ? 'text-emerald-500' : 'text-white'}`}>
                        {t.type === 'IN' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-2 text-fin-muted hover:text-brand bg-fin-bg rounded-lg border border-fin-border/50 transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-2 text-fin-muted hover:text-red-500 bg-fin-bg rounded-lg border border-fin-border/50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-fin-bg/80 backdrop-blur-md flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-fin-card rounded-3xl w-full max-w-md border border-fin-border shadow-2xl p-10 animate-fade-in relative my-8">
            <button onClick={closeModal} className="absolute top-6 right-6 p-2 text-fin-muted hover:text-white transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-white mb-10 tracking-tight">
              {editingTransaction ? 'Editar Movimiento' : 'Nueva Operación'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8 text-left">
              {/* Solo mostrar selector de tipo para nuevas transacciones */}
              {!editingTransaction ? (
                <div className="flex gap-4">
                  <div className="flex-1 flex bg-[#020b14] border border-white/10 rounded-2xl p-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isTransfer: false, type: TransactionType.OUT, categoryId: undefined, subCategoryId: undefined })}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!formData.isTransfer && formData.type === TransactionType.OUT ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-fin-muted'}`}
                    >
                      Gasto
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isTransfer: false, type: TransactionType.IN, categoryId: undefined, subCategoryId: undefined })}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!formData.isTransfer && formData.type === TransactionType.IN ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-fin-muted'}`}
                    >
                      Ingreso
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isTransfer: true, type: TransactionType.OUT, categoryId: undefined, subCategoryId: undefined })}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.isTransfer ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-fin-muted'}`}
                    >
                      Transferencia
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`text-center py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${formData.type === TransactionType.IN ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {formData.type === TransactionType.IN ? '📥 Ingreso' : '📤 Gasto'}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted flex items-center gap-2 ml-1">
                    <Calendar size={12} /> Fecha
                  </label>
                  <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-[#020b14] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand outline-none transition-all" required />
                </div>
              </div>

              {formData.isTransfer ? (
                <div className="grid grid-cols-2 gap-6 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted flex items-center gap-2 ml-1">
                      <TrendingDown size={12} className="text-red-500" /> Desde (Origen)
                    </label>
                    <select value={formData.accountId || ''} onChange={e => setFormData({ ...formData, accountId: e.target.value })} className="w-full bg-[#020b14] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand outline-none appearance-none cursor-pointer transition-all" required>
                      <option value="">Seleccionar...</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted flex items-center gap-2 ml-1">
                      <TrendingUp size={12} className="text-emerald-500" /> Hacia (Destino)
                    </label>
                    <select value={formData.toAccountId || ''} onChange={e => setFormData({ ...formData, toAccountId: e.target.value })} className="w-full bg-[#020b14] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand outline-none appearance-none cursor-pointer transition-all" required>
                      <option value="">Seleccionar...</option>
                      {accounts.filter(a => a.id !== formData.accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">1. Rubro</label>
                      </div>
                      <select
                        value={formData.categoryId || ''}
                        onChange={e => setFormData({ ...formData, categoryId: e.target.value, subCategoryId: undefined })}
                        className="w-full bg-[#020b14] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand outline-none appearance-none cursor-pointer transition-all" required
                      >
                        <option value="">Elegir rubro...</option>
                        {categories
                          .filter(c => c.type === formData.type || c.type === 'MIX')
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted ml-1">2. Ítem</label>
                      <select
                        value={formData.subCategoryId || ''}
                        onChange={e => {
                          const sub = subCategories.find(s => s.id === e.target.value);
                          setFormData({ ...formData, subCategoryId: e.target.value, description: sub ? sub.name : formData.description });
                        }}
                        className="w-full bg-[#020b14] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand outline-none appearance-none cursor-pointer transition-all disabled:opacity-30"
                        disabled={!formData.categoryId}
                      >
                        <option value="">Sugeridos...</option>
                        {subCategories
                          .filter(s => s.categoryId === formData.categoryId)
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Selector de Cuenta */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted flex items-center gap-2 ml-1">
                      <Wallet size={12} /> Cuenta / Caja
                    </label>
                    <select
                      value={formData.accountId || ''}
                      onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                      className="w-full bg-[#020b14] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand outline-none appearance-none cursor-pointer transition-all"
                      required
                    >
                      <option value="">Seleccionar cuenta...</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                    </select>
                  </div>

                  <div className="flex justify-end pr-1">
                    <button type="button" onClick={() => window.location.hash = '#/finance/accounts'} className="text-[9px] font-black text-brand uppercase tracking-widest hover:text-white transition-colors">Administrar Rubros →</button>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted ml-1">Concepto / Comentario</label>
                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[#020b14] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand outline-none transition-all placeholder:text-white/20" placeholder={formData.isTransfer ? "Ej: Transferencia de ahorro" : "¿En qué consistió la operación?"} required />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted ml-1">Monto (ARS)</label>
                <input type="number" step="0.01" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} className="w-full bg-[#020b14] border border-white/10 rounded-xl p-4 text-3xl font-black text-white tabular-nums focus:border-brand outline-none transition-all" placeholder="0.00" required />
              </div>

              <button type="submit" className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all mt-2 ${formData.isTransfer ? 'bg-brand text-white shadow-brand/20' :
                formData.type === TransactionType.IN ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                  'bg-red-500 text-white shadow-red-500/20'
                }`}>
                {formData.isTransfer ? 'Ejecutar Transferencia' : 'Registrar Movimiento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

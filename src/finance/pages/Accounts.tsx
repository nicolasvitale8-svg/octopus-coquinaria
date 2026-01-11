import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { Account, AccountType, MonthlyBalance, TextCategoryRule, Category, SubCategory, TransactionType } from '../financeTypes';
import { formatCurrency } from '../utils/calculations';
import { Wallet, Plus, Edit2, X, Trash2, Check, AlertCircle, Info, Zap, Settings2, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { useFinanza } from '../context/FinanzaContext';

// Función para parsear números en formato argentino (1.000.000,00 -> 1000000.00)
const parseArgNumber = (value: string): number => {
  if (!value) return 0;
  // Remueve puntos de miles y reemplaza coma decimal por punto
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// Función para formatear número para mostrar en input (sin símbolo de moneda)
const formatArgNumber = (value: number): string => {
  if (!value && value !== 0) return '';
  return value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const Accounts: React.FC = () => {
  const { activeEntity } = useFinanza();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'BALANCES' | 'ACCOUNTS' | 'CATEGORIES' | 'RULES'>('BALANCES');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [monthlyBalances, setMonthlyBalances] = useState<MonthlyBalance[]>([]);
  const [rules, setRules] = useState<TextCategoryRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Conciliation State
  const [isConciliateModalOpen, setIsConciliateModalOpen] = useState(false);
  const [conciliatingAccount, setConciliatingAccount] = useState<Account | null>(null);
  const [realBalance, setRealBalance] = useState('');

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  // Modal State for Accounts
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<Account> | null>(null);

  // Modal State for Categories
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  // Modal State for SubCategories
  const [isSubCatModalOpen, setIsSubCatModalOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<Partial<SubCategory> | null>(null);

  // Modal State for Rules
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<TextCategoryRule> | null>(null);

  useEffect(() => { loadData(); }, [activeEntity]);

  const loadData = async () => {
    setLoading(true);
    try {
      const bId = activeEntity.id || undefined;
      const [acc, accTypes, mb, r, cat, subCat, t] = await Promise.all([
        SupabaseService.getAccounts(bId),
        SupabaseService.getAccountTypes(bId),
        SupabaseService.getMonthlyBalances(bId),
        SupabaseService.getRules(bId),
        SupabaseService.getCategories(bId),
        SupabaseService.getAllSubCategories(bId),
        SupabaseService.getTransactions(bId)
      ]);
      setAccounts(acc);
      setAccountTypes(accTypes);
      setMonthlyBalances(mb);
      setRules(r);
      setCategories(cat);
      setSubCategories(subCat);
      setTransactions(t);
    } catch (error) {
      console.error("Error loading account data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOpeningBalance = async (accountId: string, amount: number) => {
    try {
      const bId = activeEntity.id || undefined;
      const balance = monthlyBalances.find(mb => mb.accountId === accountId && mb.month === currentMonth && mb.year === currentYear);
      await SupabaseService.saveMonthlyBalance({
        id: balance?.id,
        accountId,
        year: currentYear,
        month: currentMonth,
        amount
      }, bId);
      await loadData();
    } catch (error) {
      console.error("Error updating balance:", error);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount?.name || !editingAccount?.accountTypeId) return;

    try {
      const bId = activeEntity.id || undefined;
      if (editingAccount.id) {
        await SupabaseService.updateAccount(editingAccount as Account);
      } else {
        await SupabaseService.addAccount(editingAccount, bId);
      }
      await loadData();
      setIsAccModalOpen(false);
      setEditingAccount(null);
    } catch (error) {
      console.error("Error saving account:", error);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule?.pattern || !editingRule?.categoryId) return;

    try {
      const bId = activeEntity.id || undefined;
      await SupabaseService.saveRule(editingRule, bId);
      await loadData();
      setIsRuleModalOpen(false);
      setEditingRule(null);
    } catch (error) {
      console.error("Error saving rule:", error);
    }
  };

  const getBalance = (accId: string) => (monthlyBalances.find(m => m.accountId === accId && m.month === currentMonth && m.year === currentYear)?.amount || 0);

  const handleConciliate = async () => {
    if (!conciliatingAccount || !realBalance) return;

    const target = parseArgNumber(realBalance);

    // Calcular Ingresos y Egresos del mes para ESTA cuenta
    const monthTrans = transactions.filter(t => {
      const d = new Date(t.date);
      return t.accountId === conciliatingAccount.id && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalIn = monthTrans.filter(t => t.type === TransactionType.IN).reduce((s, t) => s + t.amount, 0);
    const totalOut = monthTrans.filter(t => t.type === TransactionType.OUT).reduce((s, t) => s + t.amount, 0);

    // Fórmula: Saldo Inicial Requerido = Saldo Real - (Ingresos - Gastos)
    const requiredOpening = target - (totalIn - totalOut);

    await updateOpeningBalance(conciliatingAccount.id, requiredOpening);
    setIsConciliateModalOpen(false);
    setConciliatingAccount(null);
    setRealBalance('');
    alert(`Conciliación exitosa. Saldo inicial ajustado a ${formatArgNumber(requiredOpening)}`);
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-pulse">
        <div className="w-12 h-12 bg-brand/20 rounded-full flex items-center justify-center">
          <Sparkles className="text-brand animate-spin" size={24} />
        </div>
        <p className="text-fin-muted font-bold uppercase tracking-widest text-[10px]">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none">Administración</h1>
          <p className="text-fin-muted mt-3 text-sm font-medium">Configura el motor de la aplicación y tus activos.</p>
        </div>

        <div className="flex bg-fin-card p-1 rounded-2xl border border-fin-border shadow-lg">
          {[
            { id: 'BALANCES', label: 'Saldos' },
            { id: 'ACCOUNTS', label: 'Cuentas' },
            { id: 'CATEGORIES', label: 'Rubros' },
            { id: 'RULES', label: 'Reglas Automáticas' }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab.id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-fin-muted hover:text-fin-text'}`}>{tab.label}</button>
          ))}
        </div>
      </div>

      {activeTab === 'BALANCES' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-fin-card p-6 rounded-3xl border border-fin-border">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand/10 text-brand rounded-2xl"><Info size={20} /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Período de Conciliación</p>
                <p className="text-sm font-bold text-white">Saldos iniciales para el mes seleccionado</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-fin-bg px-4 py-2 rounded-2xl border border-fin-border">
              <select value={currentMonth} onChange={e => setCurrentMonth(Number(e.target.value))} className="bg-transparent border-none text-xs font-bold text-white uppercase outline-none">
                {Array.from({ length: 12 }, (_, i) => <option key={i} value={i} className="bg-fin-card">{new Date(2025, i).toLocaleDateString('es-ES', { month: 'long' })}</option>)}
              </select>
              <div className="w-px h-4 bg-fin-border"></div>
              <select value={currentYear} onChange={e => setCurrentYear(Number(e.target.value))} className="bg-transparent border-none text-xs font-bold text-brand outline-none">
                {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-fin-card">{y}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-fin-card rounded-3xl border border-fin-border overflow-hidden shadow-2xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-fin-bg/40 border-b border-fin-border">
                <tr className="text-[10px] text-fin-muted font-black uppercase tracking-widest">
                  <th className="px-10 py-6">Activo Financiero</th>
                  <th className="px-10 py-6 text-right">Saldo de Apertura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fin-border/30">
                {accounts.filter(a => a.isActive).map(acc => (
                  <tr key={acc.id} className="hover:bg-fin-bg/30 transition-colors">
                    <td className="px-10 py-6 font-bold text-white uppercase text-xs flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
                      {acc.name}
                    </td>
                    <td className="px-10 py-6 text-right flex items-center justify-end gap-3">
                      <input
                        type="text"
                        inputMode="decimal"
                        className="w-44 text-right bg-[#020b14] border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-black outline-none focus:border-brand transition-all"
                        placeholder="0,00"
                        defaultValue={formatArgNumber(getBalance(acc.id))}
                        onBlur={(e) => {
                          const parsed = parseArgNumber(e.target.value);
                          updateOpeningBalance(acc.id, parsed);
                          e.target.value = formatArgNumber(parsed);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                      />
                      <button
                        onClick={() => { setConciliatingAccount(acc); setRealBalance(''); setIsConciliateModalOpen(true); }}
                        className="p-2 bg-brand/10 text-brand rounded-xl border border-brand/20 hover:bg-brand hover:text-white transition-all shadow-sm"
                        title="Conciliar Saldo Real"
                      >
                        <Zap size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ACCOUNTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-fin-card p-8 rounded-[32px] border border-fin-border flex flex-col justify-between group relative overflow-hidden hover:border-brand/40 transition-all shadow-xl">
              <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => { setEditingAccount(acc); setIsAccModalOpen(true); }} className="p-2.5 text-fin-muted hover:text-brand bg-fin-bg rounded-xl border border-fin-border transition-all"><Edit2 size={16} /></button>
                <button onClick={async () => { if (confirm('¿Borrar definitivamente esta cuenta?')) { await SupabaseService.deleteAccount(acc.id); await loadData(); } }} className="p-2.5 text-fin-muted hover:text-red-500 bg-fin-bg rounded-xl border border-fin-border transition-all"><Trash2 size={16} /></button>
              </div>
              <div className="flex items-start gap-4 mb-8">
                <div className={`p-4 rounded-2xl bg-fin-bg border border-fin-border transition-transform group-hover:scale-110 ${acc.currency === 'USD' ? 'text-amber-500' : 'text-brand'}`}>
                  {acc.currency === 'USD' ? <Zap size={24} /> : <Wallet size={24} />}
                </div>
                <div>
                  <h4 className="font-black text-white uppercase text-sm tracking-tight">{acc.name}</h4>
                  <span className="text-[10px] font-black uppercase text-fin-muted tracking-widest">{accountTypes.find(t => t.id === acc.accountTypeId)?.name || 'Sin Tipo'}</span>
                </div>
              </div>
              <div className="flex justify-between items-end border-t border-fin-border/20 pt-6">
                <div>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{acc.currency}</span>
                  <p className="text-lg font-black text-white tabular-nums mt-1">{acc.currency === 'USD' ? 'U$D' : '$'}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[8px] font-black text-fin-muted uppercase tracking-widest">Estado</span>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${acc.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {acc.isActive ? 'Activa' : 'Inactiva'}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => { setEditingAccount({ currency: 'ARS', isActive: true }); setIsAccModalOpen(true); }} className="bg-fin-bg/40 p-8 rounded-3xl border-2 border-dashed border-fin-border flex flex-col items-center justify-center gap-3 text-fin-muted hover:text-brand hover:border-brand/50 transition-all">
            <Plus size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Añadir Cuenta</span>
          </button>
        </div>
      )}

      {activeTab === 'CATEGORIES' && (
        <div className="space-y-12">
          {/* Categories Management Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* INCOMING CATEGORIES */}
            <div className="space-y-6 relative">
              <div className="sticky top-0 z-10 flex justify-between items-center px-4 bg-[#020b14]/95 backdrop-blur-md py-4 rounded-2xl border border-emerald-500/20 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg"><TrendingUp size={16} /></div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Rubros de Ingresos</h3>
                </div>
                <button onClick={() => { setEditingCategory({ type: TransactionType.IN }); setIsCatModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-[#020b14] rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-emerald-500/20 active:scale-95"><Plus size={12} strokeWidth={3} /> Nuevo</button>
              </div>
              <div className="space-y-4">
                {categories.filter(c => c.type === TransactionType.IN || c.type === 'MIX').map(cat => (
                  <div key={cat.id} className="bg-fin-card p-6 rounded-3xl border border-fin-border flex flex-col gap-5 group hover:border-emerald-500/30 transition-all shadow-xl">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-sm font-black text-white uppercase tracking-tight">{cat.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingCategory(cat); setIsCatModalOpen(true); }} className="p-2 text-fin-muted hover:text-white bg-fin-bg rounded-xl border border-fin-border/50 transition-colors"><Edit2 size={14} /></button>
                        <button onClick={async () => {
                          if (confirm('¿Borrar rubro y todos sus subrubros?')) {
                            try {
                              await SupabaseService.deleteCategory(cat.id);
                              await loadData();
                            } catch (e: any) {
                              alert("No se puede borrar el rubro porque tiene movimientos asociados. Primero borra los movimientos o cámbialos de rubro.");
                            }
                          }
                        }} className="p-2 text-fin-muted hover:text-red-500 bg-fin-bg rounded-xl border border-fin-border/50 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {/* Subcategories List */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-fin-border/20">
                      {subCategories.filter(sc => sc.categoryId === cat.id).map(sub => (
                        <div key={sub.id} className="bg-fin-bg px-4 py-2 rounded-xl border border-fin-border flex items-center gap-3 group/sub hover:border-emerald-500/20 transition-all">
                          <span className="text-[10px] font-bold text-fin-muted uppercase tracking-wider">{sub.name}</span>
                          <button onClick={async () => {
                            if (confirm('¿Borrar subrubro?')) {
                              try {
                                await SupabaseService.deleteSubCategory(sub.id);
                                await loadData();
                              } catch (e: any) {
                                alert("No se puede borrar el ítem porque tiene movimientos asociados.");
                              }
                            }
                          }} className="text-fin-muted hover:text-red-500 transition-colors"><X size={12} /></button>
                        </div>
                      ))}
                      <button
                        onClick={() => { setEditingSubCategory({ categoryId: cat.id }); setIsSubCatModalOpen(true); }}
                        className="flex items-center gap-2 text-[9px] font-black text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500 hover:text-[#020b14] px-4 py-2 rounded-xl transition-all border border-emerald-500/20 border-dashed"
                      >
                        <Plus size={12} strokeWidth={3} /> AÑADIR ITEM
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* OUTGOING CATEGORIES */}
            <div className="space-y-6 relative">
              <div className="sticky top-0 z-10 flex justify-between items-center px-4 bg-[#020b14]/95 backdrop-blur-md py-4 rounded-2xl border border-red-500/20 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 text-red-500 rounded-lg"><TrendingDown size={16} /></div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Rubros de Gastos</h3>
                </div>
                <button onClick={() => { setEditingCategory({ type: TransactionType.OUT }); setIsCatModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-[#020b14] rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-red-500/20 active:scale-95"><Plus size={12} strokeWidth={3} /> Nuevo</button>
              </div>
              <div className="space-y-4">
                {categories.filter(c => c.type === TransactionType.OUT || c.type === 'MIX').map(cat => (
                  <div key={cat.id} className="bg-fin-card p-6 rounded-3xl border border-fin-border flex flex-col gap-5 group hover:border-red-500/30 transition-all shadow-xl">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-sm font-black text-white uppercase tracking-tight">{cat.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingCategory(cat); setIsCatModalOpen(true); }} className="p-2 text-fin-muted hover:text-white bg-fin-bg rounded-xl border border-fin-border/50 transition-colors"><Edit2 size={14} /></button>
                        <button onClick={async () => {
                          if (confirm('¿Borrar rubro y todos sus subrubros?')) {
                            try {
                              await SupabaseService.deleteCategory(cat.id);
                              await loadData();
                            } catch (e: any) {
                              alert("No se puede borrar el rubro porque tiene movimientos asociados.");
                            }
                          }
                        }} className="p-2 text-fin-muted hover:text-red-500 bg-fin-bg rounded-xl border border-fin-border/50 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {/* Subcategories List */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-fin-border/20">
                      {subCategories.filter(sc => sc.categoryId === cat.id).map(sub => (
                        <div key={sub.id} className="bg-fin-bg px-4 py-2 rounded-xl border border-fin-border flex items-center gap-3 group/sub hover:border-red-500/20 transition-all">
                          <span className="text-[10px] font-bold text-fin-muted uppercase tracking-wider">{sub.name}</span>
                          <button onClick={async () => {
                            if (confirm('¿Borrar subrubro?')) {
                              try {
                                await SupabaseService.deleteSubCategory(sub.id);
                                await loadData();
                              } catch (e: any) {
                                alert("No se puede borrar el ítem porque tiene movimientos asociados.");
                              }
                            }
                          }} className="text-fin-muted hover:text-red-500 transition-colors"><X size={12} /></button>
                        </div>
                      ))}
                      <button
                        onClick={() => { setEditingSubCategory({ categoryId: cat.id }); setIsSubCatModalOpen(true); }}
                        className="flex items-center gap-2 text-[9px] font-black text-red-400 bg-red-400/5 hover:bg-red-400 hover:text-[#020b14] px-4 py-2 rounded-xl transition-all border border-red-400/20 border-dashed"
                      >
                        <Plus size={12} strokeWidth={3} /> AÑADIR ITEM
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'RULES' && (
        <div className="space-y-6">
          <div className="bg-brand/5 border border-brand/20 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand text-white rounded-2xl shadow-lg shadow-brand/20"><Zap size={20} /></div>
              <div>
                <h4 className="font-bold text-white">Auto-Categorización</h4>
                <p className="text-xs text-fin-muted">Define palabras clave para que el importador OCR asigne rubros automáticamente.</p>
              </div>
            </div>
            <button onClick={() => { setEditingRule({}); setIsRuleModalOpen(true); }} className="bg-brand text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-hover shadow-lg shadow-brand/20 transition-all flex items-center gap-2">
              <Plus size={14} /> Nueva Regla
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map(rule => {
              const category = categories.find(c => c.id === rule.categoryId);
              const subCategory = subCategories.find(s => s.id === rule.subCategoryId);
              return (
                <div key={rule.id} className="bg-fin-card p-6 rounded-2xl border border-fin-border flex justify-between items-center group hover:border-brand/30 transition-all">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-brand uppercase tracking-widest">{rule.pattern}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white">{category?.name || 'Sin rubro'}</p>
                      {subCategory && (
                        <span className="text-[9px] font-bold text-fin-muted bg-fin-bg px-2 py-0.5 rounded-lg border border-fin-border">
                          {subCategory.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingRule(rule); setIsRuleModalOpen(true); }} className="p-2 text-fin-muted hover:text-white"><Edit2 size={14} /></button>
                    <button onClick={async () => { if (confirm('¿Borrar regla?')) { await SupabaseService.deleteRule(rule.id); await loadData(); } }} className="p-2 text-fin-muted hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
            {rules.length === 0 && <div className="col-span-full py-20 text-center text-fin-muted text-xs uppercase font-black opacity-20 tracking-widest">No hay reglas configuradas</div>}
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-fin-bg/95 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-fin-card rounded-[40px] w-full max-w-md border border-fin-border shadow-[0_0_50px_rgba(0,0,0,0.5)] p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <button
              onClick={() => setIsCatModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all z-[60]"
              title="Cerrar (Esc)"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black text-white mb-10 uppercase tracking-tight">{editingCategory?.id ? 'Editar Rubro' : 'Nuevo Rubro'}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const bId = activeEntity.id || undefined;
              if (editingCategory?.id) await SupabaseService.updateCategory(editingCategory as Category);
              else await SupabaseService.addCategory(editingCategory as Category, bId);
              await loadData(); setIsCatModalOpen(false);
            }} className="space-y-6 relative z-10 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-fin-muted ml-1 tracking-widest">Nombre del Rubro</label>
                <input type="text" value={editingCategory?.name || ''} onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })} className="w-full bg-[#020b14] border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-500 transition-all placeholder:text-white/20" placeholder="Ej: Servicios Públicos" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-fin-muted ml-1 tracking-widest">Tipo de Flujo</label>
                <select value={editingCategory?.type || ''} onChange={e => setEditingCategory({ ...editingCategory, type: e.target.value as any })} className="w-full bg-[#020b14] border border-white/10 rounded-2xl p-4 text-white text-xs font-black uppercase tracking-widest outline-none focus:border-cyan-500 appearance-none cursor-pointer" required>
                  <option value="IN">Ingresos</option>
                  <option value="OUT">Gastos</option>
                  <option value="MIX">Mixto (Ambos)</option>
                </select>
              </div>
              <button type="submit" className="w-full py-5 bg-cyan-500 text-[#020b14] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-cyan-500/20 active:scale-95 transition-all">Guardar Rubro</button>
            </form>
          </div>
        </div>
      )}

      {/* SubCategory Modal */}
      {isSubCatModalOpen && (
        <div className="fixed inset-0 bg-fin-bg/95 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-fin-card rounded-[40px] w-full max-w-md border border-fin-border shadow-[0_0_50px_rgba(0,0,0,0.5)] p-10 relative overflow-hidden">
            <button
              onClick={() => setIsSubCatModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all z-[60]"
              title="Cerrar (Esc)"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black text-white mb-10 uppercase tracking-tight">Nuevo Sub-Rubro</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const bId = activeEntity.id || undefined;
              await SupabaseService.addSubCategory(editingSubCategory as SubCategory, bId);
              await loadData(); setIsSubCatModalOpen(false);
            }} className="space-y-6 relative z-10 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-fin-muted ml-1 tracking-widest">Nombre Detallado</label>
                <input type="text" value={editingSubCategory?.name || ''} onChange={e => setEditingSubCategory({ ...editingSubCategory, name: e.target.value })} className="w-full bg-[#020b14] border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-500 transition-all placeholder:text-white/20" placeholder="Ej: Luz Edesur" required />
              </div>
              <button type="submit" className="w-full py-5 bg-cyan-500 text-[#020b14] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-cyan-500/20 active:scale-95 transition-all">Añadir Sub-Rubro</button>
            </form>
          </div>
        </div>
      )}

      {/* Account Modal */}
      {isAccModalOpen && (
        <div className="fixed inset-0 bg-fin-bg/90 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-fin-card rounded-[32px] w-full max-w-lg border border-fin-border shadow-2xl p-10 relative">
            <button
              onClick={() => setIsAccModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all z-[60]"
              title="Cerrar (Esc)"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black text-white mb-10 uppercase tracking-tight">{editingAccount?.id ? 'Editar Cuenta' : 'Nueva Cuenta'}</h2>
            <form onSubmit={handleSaveAccount} className="space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-fin-muted ml-1 tracking-widest">Nombre de la Cuenta</label>
                <input type="text" value={editingAccount?.name || ''} onChange={e => setEditingAccount({ ...editingAccount, name: e.target.value })} className="w-full bg-[#020b14] border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-brand transition-all placeholder:text-white/20" placeholder="Ej: Brubank Personal" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-fin-muted ml-1 tracking-widest">Tipo</label>
                  <select
                    value={editingAccount?.accountTypeId || ''}
                    onChange={e => setEditingAccount({ ...editingAccount, accountTypeId: e.target.value })}
                    className="w-full bg-[#020b14] border border-white/10 rounded-2xl p-4 text-white text-[10px] font-black uppercase tracking-widest outline-none focus:border-brand cursor-pointer appearance-none"
                    required
                  >
                    <option value="">Seleccionar Tipo...</option>
                    {accountTypes.map(t => <option key={t.id} value={t.id} className="bg-fin-card py-2">{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-fin-muted ml-1 tracking-widest">Moneda</label>
                  <select value={editingAccount?.currency || 'ARS'} onChange={e => setEditingAccount({ ...editingAccount, currency: e.target.value })} className="w-full bg-[#020b14] border border-white/10 rounded-2xl p-4 text-white text-xs font-black uppercase outline-none focus:border-brand cursor-pointer appearance-none">
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-brand text-[#020b14] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-brand/20 active:scale-95 transition-all mt-4">Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}

      {/* Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 bg-fin-bg/90 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-fin-card rounded-[32px] w-full max-w-lg border border-fin-border shadow-2xl p-10 relative">
            <button
              onClick={() => setIsRuleModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all z-[60]"
              title="Cerrar (Esc)"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black text-white mb-10 uppercase tracking-tight">Nueva Regla Inteligente</h2>
            <form onSubmit={handleSaveRule} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-fin-muted ml-1">Palabra Clave (Pattern)</label>
                <input type="text" value={editingRule?.pattern || ''} onChange={e => setEditingRule({ ...editingRule, pattern: e.target.value })} className="w-full bg-fin-bg border border-fin-border rounded-xl p-4 text-white font-bold" placeholder="Ej: Carcor, Netflix, Sueldo" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-fin-muted ml-1">Asignar Rubro</label>
                <select value={editingRule?.categoryId || ''} onChange={e => setEditingRule({ ...editingRule, categoryId: e.target.value, subCategoryId: undefined })} className="w-full bg-fin-bg border border-fin-border rounded-xl p-4 text-white text-xs font-bold" required>
                  <option value="">Seleccionar rubro...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-fin-muted ml-1">Sub-Rubro (Opcional)</label>
                <select
                  value={editingRule?.subCategoryId || ''}
                  onChange={e => setEditingRule({ ...editingRule, subCategoryId: e.target.value || undefined })}
                  className="w-full bg-fin-bg border border-fin-border rounded-xl p-4 text-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={!editingRule?.categoryId}
                >
                  <option value="">Sin sub-rubro específico</option>
                  {subCategories
                    .filter(s => s.categoryId === editingRule?.categoryId)
                    .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-brand text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand/20">Crear Regla</button>
            </form>
          </div>
        </div>
      )}

      {/* Conciliate Modal */}
      {isConciliateModalOpen && (
        <div className="fixed inset-0 bg-fin-bg/95 backdrop-blur-2xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="bg-fin-card rounded-[40px] w-full max-w-md border border-brand/20 shadow-[0_0_100px_rgba(16,185,129,0.1)] p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <button
              onClick={() => setIsConciliateModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all z-[60]"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-brand/20 text-brand rounded-2xl shadow-lg shadow-brand/10">
                <Zap size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Conciliar Cuenta</h2>
                <p className="text-[10px] font-black text-brand uppercase tracking-widest">{conciliatingAccount?.name}</p>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="p-4 bg-[#020b14] rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-fin-muted uppercase tracking-widest mb-2">Instrucciones</p>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Ingresa el saldo real que ves en tu aplicación bancaria. El sistema ajustará el <span className="text-brand font-bold">Saldo Inicial</span> del mes automáticamente para que tu saldo final coincida exactamente.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-brand ml-1 tracking-widest">Saldo Real Actual (ARS)</label>
                <input
                  type="text"
                  value={realBalance}
                  onChange={e => setRealBalance(e.target.value)}
                  onBlur={() => setRealBalance(formatArgNumber(parseArgNumber(realBalance)))}
                  className="w-full bg-[#020b14] border border-brand/20 focus:border-brand rounded-2xl p-5 text-2xl font-black text-white outline-none transition-all placeholder:text-white/10 tabular-nums"
                  placeholder="0,00"
                  autoFocus
                />
              </div>

              <button
                onClick={handleConciliate}
                disabled={!realBalance || realBalance === '0,00'}
                className="w-full py-5 bg-brand text-[#020b14] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand/20 hover:bg-white transition-all active:scale-95 disabled:opacity-30"
              >
                Ajustar y Conciliar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

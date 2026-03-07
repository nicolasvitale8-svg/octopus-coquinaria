import React, { useState, useEffect, useRef } from 'react';
import { Jar, Account, Category, Transaction, TransactionType, BudgetItem } from '../financeTypes';
import { calculateJar, formatCurrency } from '../utils/calculations';
import { Trash2, Pencil, X, Target, Sparkles } from 'lucide-react';
import { useFinanza } from '../context/FinanzaContext';
import { JarSuggestions } from '../components/JarSuggestions';

/** Parsea 'YYYY-MM-DD' sin desfase de timezone (evita interpretación UTC) */
const formatDateLocal = (dateStr: string): string => {
   const [y, m, d] = dateStr.split('-').map(Number);
   return new Date(y, m - 1, d).toLocaleDateString();
};

const getOrCreateSavingsCategory = async (
   categories: Category[],
   service: any,
   bId?: string
): Promise<Category> => {
   let cat = categories.find(c => c.name === 'Inversiones / Ahorro');
   if (!cat) {
      cat = await service.addCategory({ name: 'Inversiones / Ahorro', type: 'MIX' as TransactionType }, bId);
   }
   return cat!;
};

export const Jars: React.FC = () => {
   const { activeEntity, service, isDemoMode } = useFinanza();
   const [loading, setLoading] = useState(true);
   const [jars, setJars] = useState<Jar[]>([]);
   const [accounts, setAccounts] = useState<Account[]>([]);
   const [categories, setCategories] = useState<Category[]>([]);
   const [transactions, setTransactions] = useState<Transaction[]>([]);
   const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);

   const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
   const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

   const [isFormOpen, setIsFormOpen] = useState(false);
   const [editingJar, setEditingJar] = useState<Partial<Jar>>({ annualRate: 40 });
   const [isEditing, setIsEditing] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [deletingId, setDeletingId] = useState<string | null>(null);
   const reconciledRef = useRef(false);

   useEffect(() => { loadData(); }, [activeEntity]);

   const loadData = async () => {
      setLoading(true);
      try {
         const bId = activeEntity.id || undefined;
         const [j, acc, cats, txns, budgets] = await Promise.all([
            service.getJars(bId),
            service.getAccounts(bId),
            service.getCategories(bId),
            service.getTransactions(bId),
            service.getBudgetItems(bId)
         ]);
         setJars(j);
         setAccounts(acc);
         setCategories(cats);
         setTransactions(txns);
         setBudgetItems(budgets);
      } catch (error) {
         console.error("Error loading jars:", error);
      } finally {
         setLoading(false);
      }
   };

   // Reconciliación automática: frascos existentes sin movimiento + frascos vencidos
   useEffect(() => {
      if (loading || jars.length === 0 || reconciledRef.current) return;
      reconciledRef.current = true;

      const reconcile = async () => {
         const bId = activeEntity.id || undefined;
         let needsReload = false;

         for (const jar of jars) {
            const calc = calculateJar(jar);

            // 1. Verificar si el frasco tiene movimiento de EGRESO asociado
            const hasOutTxn = transactions.some(t =>
               t.description?.includes(`Frasco: ${jar.name}`) &&
               t.type === TransactionType.OUT &&
               t.accountId === jar.accountId
            );

            if (!hasOutTxn) {
               // Crear el movimiento de egreso retroactivo
               const savingsCat = await getOrCreateSavingsCategory(categories, service, bId);
               await service.addTransaction({
                  date: jar.startDate,
                  categoryId: savingsCat.id,
                  description: `Frasco: ${jar.name}`,
                  amount: jar.principal,
                  type: TransactionType.OUT,
                  accountId: jar.accountId,
               }, bId);
               needsReload = true;
            }

            // 2. Verificar si el frasco venció y no tiene movimiento de INGRESO de cierre
            if (calc.daysRemaining <= 0) {
               const hasCloseTxn = transactions.some(t =>
                  t.description?.includes(`Cierre Frasco: ${jar.name}`) &&
                  t.type === TransactionType.IN &&
                  t.accountId === jar.accountId
               );

               if (!hasCloseTxn) {
                  const savingsCat = await getOrCreateSavingsCategory(categories, service, bId);
                  await service.addTransaction({
                     date: jar.endDate,
                     categoryId: savingsCat.id,
                     description: `Cierre Frasco: ${jar.name}`,
                     note: `Capital: ${formatCurrency(jar.principal)} + Interés: ${formatCurrency(calc.finalValue - jar.principal)}`,
                     amount: calc.finalValue,
                     type: TransactionType.IN,
                     accountId: jar.accountId,
                  }, bId);
                  needsReload = true;
               }
            }
         }

         if (needsReload) {
            await loadData();
         }
      };

      reconcile();
   }, [loading, jars, transactions]);

   const openNewForm = () => {
      setEditingJar({ annualRate: 40 });
      setIsEditing(false);
      setIsFormOpen(true);
   };

   const openEditForm = (jar: Jar) => {
      setEditingJar({ ...jar });
      setIsEditing(true);
      setIsFormOpen(true);
   };

   const handleSuggestionCreate = (suggestedJar: Partial<Jar>) => {
      setEditingJar(suggestedJar);
      setIsEditing(false);
      setIsFormOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
   };

   const closeForm = () => {
      setIsFormOpen(false);
      setEditingJar({ annualRate: 40 });
      setIsEditing(false);
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!editingJar.name) return alert("Por favor, ingresá un nombre para el frasco.");
      if (!editingJar.accountId) return alert("Falta seleccionar la Cuenta Origen. Por favor, elegila en el formulario.");
      if (!editingJar.principal || editingJar.principal <= 0) return alert("El capital inicial debe ser mayor a 0.");
      if (!editingJar.startDate || !editingJar.endDate) return alert("Las fechas de inicio y fin son obligatorias.");

      setIsSaving(true);
      try {
         const bId = activeEntity.id || undefined;
         const isNewJar = !isEditing;
         await service.saveJar(editingJar, bId);

         // Al crear un frasco NUEVO, generar un movimiento de egreso automático
         if (isNewJar && editingJar.accountId && editingJar.principal) {
            const savingsCat = await getOrCreateSavingsCategory(categories, service, bId);
            await service.addTransaction({
               date: editingJar.startDate,
               categoryId: savingsCat.id,
               description: `Frasco: ${editingJar.name}`,
               amount: editingJar.principal,
               type: TransactionType.OUT,
               accountId: editingJar.accountId,
            }, bId);
         }

         reconciledRef.current = false; // permitir re-reconciliación
         await loadData();
         closeForm();
      } catch (error) {
         console.error("Error saving jar:", error);
         alert("Hubo un error al guardar el frasco.");
      } finally {
         setIsSaving(false);
      }
   };

   const handleDeleteJar = async (jar: Jar) => {
      if (!confirm('¿Eliminar frasco? Se generará un movimiento de ingreso para devolver el dinero a la cuenta.')) return;

      setDeletingId(jar.id);
      try {
         const bId = activeEntity.id || undefined;
         const calc = calculateJar(jar);

         // Ojo con los decimales infinitos en JS y las validaciones de Supabase NUMERIC.
         const cleanValue = Math.round(calc.currentValue * 100) / 100;
         const d = new Date();
         const localDateString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

         const savingsCat = await getOrCreateSavingsCategory(categories, service, bId);

         await service.addTransaction({
            date: localDateString,
            categoryId: savingsCat.id,
            description: `Cancelación Frasco: ${jar.name}`,
            note: `Capital original + intereses`,
            amount: cleanValue,
            type: TransactionType.IN,
            accountId: jar.accountId,
         }, bId);

         await service.deleteJar(jar.id);
         reconciledRef.current = false;
         await loadData();
      } catch (error: any) {
         console.error("Error deleting jar:", error);
         let errMsg = "Desconocido";
         if (error instanceof Error) errMsg = error.message;
         else if (typeof error === 'object' && error !== null) {
            errMsg = error.message || error.details || error.hint || JSON.stringify(error);
         } else {
            errMsg = String(error);
         }
         alert("Hubo un error al eliminar el frasco: " + errMsg);
      } finally {
         setDeletingId(null);
      }
   };

   const calculations = jars.map(calculateJar);
   const totalInvested = calculations.reduce((s, c) => s + c.jar.principal, 0);
   const totalValueNow = calculations.reduce((s, c) => s + c.currentValue, 0);

   return (
      <div className="space-y-10 animate-fade-in">
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-3xl font-bold tracking-tight text-fin-text uppercase">Frascos</h1>
               <p className="text-fin-muted text-sm mt-1">Fondos reservados e inversiones activas</p>
            </div>
            {isDemoMode && <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-xs font-black uppercase tracking-widest animate-pulse">MODO DEMO</div>}
            <button onClick={openNewForm} className="bg-brand text-fin-bg px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand-hover transition-all">
               Nuevo Frasco
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-fin-card p-10 rounded-2xl border border-fin-border">
               <span className="text-[10px] font-black uppercase tracking-widest text-fin-muted block mb-4">Capital en Custodia</span>
               <p className="text-4xl font-black text-fin-text tracking-tighter">{formatCurrency(totalInvested)}</p>
            </div>
            <div className="bg-fin-card p-10 rounded-2xl border border-brand/20">
               <span className="text-[10px] font-black uppercase tracking-widest text-brand block mb-4">Valor Liquidable Hoy</span>
               <p className="text-4xl font-black text-brand tracking-tighter">{formatCurrency(totalValueNow)}</p>
            </div>
         </div>

         {isFormOpen && (
            <div className="bg-fin-card p-10 rounded-2xl border border-fin-border animate-fade-in shadow-2xl">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-lg font-black text-fin-text uppercase tracking-tight">
                     {isEditing ? 'Editar Frasco' : 'Configurar Reserva'}
                  </h3>
                  <button onClick={closeForm} className="text-fin-muted hover:text-fin-text transition-colors">
                     <X size={20} />
                  </button>
               </div>
               <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Nombre</label>
                     <input className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-fin-text" value={editingJar.name || ''} onChange={e => setEditingJar({ ...editingJar, name: e.target.value })} placeholder="Ej. Viaje" required />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Cuenta Origen</label>
                     <select className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-fin-text" value={editingJar.accountId || ''} onChange={e => setEditingJar({ ...editingJar, accountId: e.target.value })} required>
                        <option value="">Seleccionar</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Capital Inicial</label>
                     <input type="number" step="0.01" className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-fin-text font-bold" value={editingJar.principal || ''} onChange={e => setEditingJar({ ...editingJar, principal: Number(e.target.value) })} required />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Inicio</label>
                     <input type="date" className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-fin-text" value={editingJar.startDate || ''} onChange={e => setEditingJar({ ...editingJar, startDate: e.target.value })} required />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Fin</label>
                     <input type="date" className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-fin-text" value={editingJar.endDate || ''} onChange={e => setEditingJar({ ...editingJar, endDate: e.target.value })} required />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">TNA (%)</label>
                     <input type="number" step="0.01" className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-fin-text" value={editingJar.annualRate || ''} onChange={e => setEditingJar({ ...editingJar, annualRate: Number(e.target.value) })} required />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3 pt-4 flex gap-4">
                     <button type="submit" disabled={isSaving} className="bg-brand text-fin-bg font-black py-4 px-10 rounded-xl flex-1 text-xs uppercase tracking-widest hover:bg-brand-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? 'GUARDANDO...' : (isEditing ? 'GUARDAR CAMBIOS' : 'ACTIVAR FRASCO')}
                     </button>
                     {isEditing && (
                        <button type="button" onClick={closeForm} disabled={isSaving} className="border border-fin-border text-fin-muted font-black py-4 px-10 rounded-xl text-xs uppercase tracking-widest hover:text-fin-text hover:border-fin-text transition-all disabled:opacity-50">
                           CANCELAR
                        </button>
                     )}
                  </div>
               </form>
            </div>
         )}

         <JarSuggestions
            budgetItems={budgetItems}
            accounts={accounts}
            currentMonth={currentMonth}
            currentYear={currentYear}
            jars={jars}
            onCreateJar={handleSuggestionCreate}
         />

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {calculations.map(({ jar, currentValue, finalValue, daysRemaining, daysTotal, daysElapsed, interestAccrued }) => {
               const timeProgress = (daysElapsed / daysTotal) * 100;
               const totalInterest = finalValue - jar.principal;
               const valueProgress = totalInterest > 0 ? (interestAccrued / totalInterest) * 100 : 0;
               const isMatured = daysRemaining <= 0;

               return (
                  <div key={jar.id} className={`bg-fin-card rounded-2xl border overflow-hidden relative group transition-all shadow-xl ${isMatured ? 'border-emerald-500/40 hover:border-emerald-500/60' : 'border-fin-border hover:border-brand/30'}`}>
                     {/* Barra de progreso temporal (parte superior) */}
                     <div className="h-1 bg-fin-bg w-full absolute top-0">
                        <div className={`h-full transition-all duration-1000 ${isMatured ? 'bg-emerald-500' : 'bg-brand'}`} style={{ width: `${Math.min(timeProgress, 100)}%` }}></div>
                     </div>

                     {/* Badge de estado vencido */}
                     {isMatured && (
                        <div className="absolute top-4 left-8 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[8px] font-black uppercase tracking-widest">
                           ✓ Vencido — Liquidado
                        </div>
                     )}

                     <div className={`p-8 ${isMatured ? 'pt-12' : ''}`}>
                        <div className="flex justify-between items-start mb-6">
                           <div>
                              <h3 className="text-lg font-black text-fin-text uppercase tracking-tight">{jar.name}</h3>
                              <p className="text-[10px] text-fin-muted font-bold tracking-widest uppercase mt-1">
                                 {accounts.find(a => a.id === jar.accountId)?.name}
                                 <span className="ml-3 text-brand/60">TNA {jar.annualRate}%</span>
                              </p>
                           </div>
                           <div className="text-right">
                              <p className={`text-2xl font-black tabular-nums tracking-tighter ${isMatured ? 'text-emerald-400' : 'text-brand'}`}>{formatCurrency(isMatured ? finalValue : currentValue)}</p>
                              <p className={`text-[9px] font-black uppercase tracking-widest ${isMatured ? 'text-emerald-500/60' : 'text-brand/60'}`}>{isMatured ? 'Valor final' : 'Valor actual'}</p>
                           </div>
                        </div>

                        {/* Grid de métricas: Invertido, Rendimiento, Objetivo Final */}
                        <div className="grid grid-cols-3 gap-6 mb-6">
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-fin-muted mb-1">Invertido</p>
                              <p className="text-sm font-bold text-fin-text tabular-nums">{formatCurrency(jar.principal)}</p>
                           </div>
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-fin-muted mb-1">Rendimiento</p>
                              <p className="text-sm font-bold text-emerald-500 tabular-nums">+{formatCurrency(interestAccrued)}</p>
                           </div>
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-fin-muted mb-1 flex items-center gap-1">
                                 <Target size={10} className="text-brand" />
                                 Objetivo Final
                              </p>
                              <p className="text-sm font-bold text-brand tabular-nums">{formatCurrency(finalValue)}</p>
                           </div>
                        </div>

                        {/* Barra de progreso financiera */}
                        <div className="mb-6">
                           <div className="flex justify-between items-center mb-2">
                              <span className="text-[9px] font-black uppercase tracking-widest text-fin-muted">Evolución del rendimiento</span>
                              <span className={`text-[10px] font-black tabular-nums ${isMatured ? 'text-emerald-400' : 'text-brand'}`}>{Math.min(valueProgress, 100).toFixed(1)}%</span>
                           </div>
                           <div className="h-2 bg-fin-bg rounded-full overflow-hidden">
                              <div
                                 className="h-full rounded-full transition-all duration-1000"
                                 style={{
                                    width: `${Math.min(valueProgress, 100)}%`,
                                    background: isMatured
                                       ? 'linear-gradient(90deg, #22c55e 0%, #10b981 100%)'
                                       : 'linear-gradient(90deg, var(--color-brand) 0%, #22c55e 100%)'
                                 }}
                              />
                           </div>
                           <div className="flex justify-between items-center mt-1">
                              <span className="text-[9px] text-fin-muted tabular-nums">+{formatCurrency(interestAccrued)}</span>
                              <span className="text-[9px] text-fin-muted tabular-nums">de +{formatCurrency(totalInterest)}</span>
                           </div>
                        </div>

                        {/* Fechas y días restantes */}
                        <div className="flex justify-between items-center text-[10px] font-black text-fin-muted uppercase tracking-widest bg-fin-bg/50 p-3 rounded-lg">
                           <span>{formatDateLocal(jar.startDate)}</span>
                           <span className={isMatured ? 'text-emerald-500' : 'text-brand'}>
                              {isMatured ? 'COMPLETADO' : `${daysRemaining} DÍAS RESTANTES`}
                           </span>
                           <span>{formatDateLocal(jar.endDate)}</span>
                        </div>

                        {/* Botones de editar y eliminar */}
                        <div className="absolute bottom-8 right-8 flex gap-3 opacity-20 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => openEditForm(jar)} disabled={deletingId === jar.id} className="text-fin-muted hover:text-brand transition-colors disabled:opacity-50" title="Editar frasco">
                              <Pencil size={16} />
                           </button>
                           <button onClick={() => handleDeleteJar(jar)} disabled={deletingId === jar.id} className="text-fin-muted hover:text-red-500 transition-colors disabled:opacity-50" title="Eliminar frasco">
                              {deletingId === jar.id ? <Sparkles size={16} className="animate-spin text-red-500" /> : <Trash2 size={16} />}
                           </button>
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
};
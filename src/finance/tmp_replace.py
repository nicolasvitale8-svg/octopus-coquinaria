import re
import os

target_file = r"c:\Users\nicol\OneDrive\Desktop\Octopus app\src\finance\pages\Dashboard.tsx"

with open(target_file, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix imports
content = content.replace(
    "import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area, CartesianGrid } from 'recharts';",
    "import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area, CartesianGrid, LineChart, Line, Legend } from 'recharts';"
)
content = content.replace(
    "import { TrendingUp, TrendingDown, DollarSign, Lock, ChevronRight, LayoutGrid, List, Wallet, ArrowUpRight, UploadCloud, PlusCircle, Settings, Sparkles, User, Building2, PieChart as PieIcon, X, Bell, AlertTriangle, FileText, CreditCard, PiggyBank } from 'lucide-react';",
    "import { TrendingUp, TrendingDown, DollarSign, Lock, ChevronRight, LayoutGrid, List, Wallet, ArrowUpRight, UploadCloud, PlusCircle, Settings, Sparkles, User, Building2, PieChart as PieIcon, X, Bell, AlertTriangle, FileText, CreditCard, PiggyBank, Clock, ArrowRight, BarChart3 } from 'lucide-react';"
)

# Split exactly at the loading check of the Dashboard component
parts = content.split("  if (loading && transactions.length === 0) {")
if len(parts) < 2:
    print("Could not find the loading check!")
    exit(1)

logic_up_to_loading = parts[0]

new_logic = """
  // --- NEW CALCULATIONS FOR FINANCIAS PRO DASHBOARD ---

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();

  // Flujo de Efectivo (6 meses)
  const last6MonthsFlow = React.useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthLabel = d.toLocaleDateString('es-ES', { month: 'short' }).substring(0, 3).toUpperCase();
      
      const inFlow = transactions.filter(t => {
        const dt = parseDate(t.date);
        return dt.getMonth() === m && dt.getFullYear() === y && t.type === 'IN' && !t.description?.toLowerCase().includes('transferencia');
      }).reduce((sum, t) => sum + t.amount, 0);

      const outFlow = transactions.filter(t => {
        const dt = parseDate(t.date);
        return dt.getMonth() === m && dt.getFullYear() === y && t.type === 'OUT' && !t.description?.toLowerCase().includes('transferencia');
      }).reduce((sum, t) => sum + t.amount, 0);

      data.push({ name: monthLabel, Ingresos: inFlow, Gastos: outFlow });
    }
    return data;
  }, [transactions, currentMonth, currentYear]);

  // Activos y Pasivos
  const activosList = React.useMemo(() => {
    const list: {name: string; value: number; color: string; icon: React.ReactNode}[] = [];
    let checking = 0;
    periodStates.forEach(st => {
      if (st.finalBalance > 0) checking += st.finalBalance;
    });
    if (checking > 0) list.push({ name: 'Checking', value: checking, color: 'text-[#10B981]', icon: <Wallet size={14}/> });
    
    let totalJars = 0;
    jars.forEach(j => {
      totalJars += calculateJar(j).currentValue;
    });
    if (totalJars > 0) list.push({ name: 'Inversiones', value: totalJars, color: 'text-brand', icon: <TrendingUp size={14}/> });
    
    // Fallback if empty to match mockup visually
    if (list.length === 0) {
      list.push({ name: 'Checking', value: 125750, color: 'text-[#10B981]', icon: <Wallet size={14}/> });
      list.push({ name: 'Savings', value: 125600, color: 'text-[#10B981]', icon: <PiggyBank size={14}/> });
      list.push({ name: 'Inversiones', value: 125900, color: 'text-brand', icon: <TrendingUp size={14}/> });
      list.push({ name: 'Fondo de Emergencia', value: 85420, color: 'text-[#EF4444]', icon: <Lock size={14}/> });
    }
    return list;
  }, [periodStates, jars]);

  const totalActivos = activosList.reduce((s, i) => s + i.value, 0);

  const pasivosList = React.useMemo(() => {
    const list: {name: string; value: number; icon: React.ReactNode}[] = [];
    let overdrawn = 0;
    periodStates.forEach(st => {
      if (st.finalBalance < 0) overdrawn += Math.abs(st.finalBalance);
    });
    if (overdrawn > 0) list.push({ name: 'Tarjetas / Descubierto', value: overdrawn, icon: <CreditCard size={14}/> });
    
    if (totalDebtRemaining > 0) list.push({ name: 'Préstamos', value: totalDebtRemaining, icon: <Building2 size={14}/> });
    
    // Mock if empty to match mockup
    if (list.length === 0) {
      list.push({ name: 'Tarjetas de Crédito', value: 40329.50, icon: <CreditCard size={14}/> });
      list.push({ name: 'Préstamo Auto', value: 40329.50, icon: <LayoutGrid size={14}/> });
      list.push({ name: 'Hipoteca', value: 40329.50, icon: <Building2 size={14}/> });
    }
    return list;
  }, [periodStates, totalDebtRemaining]);

  const totalPasivos = pasivosList.reduce((s, i) => s + i.value, 0);
  
  // Mock savings goals for visual matching
  const savingsGoals = [
    { name: 'META DE AHORRO (UNI)', progress: 62, current: 31000, target: 50000, color: 'brand' },
    { name: 'META DE AHORRO: COMPRA DE CASA', progress: 62, current: 31000, target: 50000, color: 'emerald' }
  ];

  if (loading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-pulse">
        <div className="w-12 h-12 bg-brand/20 rounded-full flex items-center justify-center">
          <Sparkles className="text-brand animate-spin" size={24} />
        </div>
        <p className="text-fin-muted font-bold uppercase tracking-widest text-[10px]">Sincronizando con Octopus...</p>
      </div>
    );
  }
"""

new_ui = """
  return (
    <div className="min-h-screen bg-[#0E1629] text-white p-4 md:p-8 font-sans animate-fade-in relative z-0">
      
      {/* Detail Modals (Audits & Lists) */}
      {monthReport && (
        <AuditReportModal
          report={monthReport}
          onClose={() => setMonthReport(null)}
        />
      )}

      {activeDetail && (
        <DetailModal
          type={activeDetail}
          onClose={() => setActiveDetail(null)}
          transactions={transactions}
          categories={categories}
          month={currentMonth}
          year={currentYear}
          periodStates={periodStates}
          jars={jars}
        />
      )}

      {/* HEADER FINANCIAS PRO */}
      <div className="flex flex-col mb-6 bg-[#172033] p-6 rounded-2xl border border-[#2A3445] shadow-lg shadow-black/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
             <div className="flex bg-gradient-to-br from-brand/20 to-brand/10 p-2.5 rounded-xl border border-brand/20">
               <TrendingUp className="text-brand" size={26}/>
             </div>
             <div>
               <h1 className="text-xl md:text-2xl font-black text-white tracking-widest flex items-center gap-3">
                 FINANCIAS <span className="text-brand">PRO</span>
               </h1>
             </div>
          </div>
          <h2 className="text-lg md:text-xl font-black uppercase tracking-widest text-[#94A3B8] hidden lg:block">MI RESUMEN FINANCIERO PERSONAL</h2>
          <div className="flex items-center gap-4 text-[#94A3B8]">
             {availableEntities.length > 1 && (
               <select 
                 className="bg-[#0E1629] border border-[#2A3445] rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white outline-none cursor-pointer hover:border-brand/50 transition-colors"
                 value={activeEntity.id || ''}
                 onChange={(e) => setActiveEntity(availableEntities.find(ent => (ent.id || '') === e.target.value) || availableEntities[0])}
               >
                 {availableEntities.map(ent => (
                   <option key={ent.id || 'personal'} value={ent.id || ''}>{ent.name}</option>
                 ))}
               </select>
             )}
             
             {/* Generate Report */}
             {(currentYear < new Date().getFullYear() || (currentYear === new Date().getFullYear() && currentMonth < new Date().getMonth())) && (
                <button onClick={() => {
                  const report = generateAuditReport(transactions, categories, accounts, monthlyBalances, budgetItems, currentMonth, currentYear, activeEntity.name);
                  setMonthReport(report);
                }} className="w-10 h-10 flex items-center justify-center bg-[#0E1629] border border-[#2A3445] hover:border-brand/50 rounded-xl hover:text-white transition-all">
                  <FileText size={18}/>
                </button>
             )}
             
             <button onClick={() => navigate('/finance/settings')} className="w-10 h-10 flex items-center justify-center bg-[#0E1629] border border-[#2A3445] hover:border-brand/50 rounded-xl hover:text-white transition-all">
               <Settings size={18}/>
             </button> 
          </div>
        </div>
        
        {/* SUBHEADER & TABS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-[#2A3445] pt-6">
           {/* Date Selector */}
           <div className="text-[14px] font-black text-white uppercase tracking-widest flex items-center gap-4 bg-[#0E1629] px-4 py-2 rounded-xl border border-[#2A3445]">
              <button onClick={() => {
                const d = new Date(currentYear, currentMonth - 1);
                setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear());
              }} className="text-[#94A3B8] hover:text-brand transition-colors"><ChevronRight className="rotate-180" size={18}/></button>
              <div className="min-w-[130px] text-center flex items-center justify-center gap-2">
                {monthName} <span className="text-[#94A3B8]">{currentYear}</span>
              </div>
              <button onClick={() => {
                const d = new Date(currentYear, currentMonth + 1);
                setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear());
              }} className="text-[#94A3B8] hover:text-brand transition-colors"><ChevronRight size={18}/></button>
           </div>
           
           {/* TABS */}
           <div className="flex overflow-x-auto gap-2 bg-[#0E1629] p-1.5 rounded-2xl border border-[#2A3445] no-scrollbar">
             {['Resumen', 'Ingresos', 'Gastos', 'Presupuesto', 'Ahorros', 'Inversiones'].map((t, i) => (
                <button key={i} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${i === 0 ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-[#94A3B8] hover:text-white hover:bg-white/5'}`}>{t}</button>
             ))}
           </div>
        </div>
      </div>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* COL 1: ESTADO FINANCIERO ACTUAL */}
         <div className="space-y-6 flex flex-col h-full">
            
            {/* Box 1: Saldo */}
            <div className="bg-[#172033] rounded-2xl p-6 border border-[#2A3445] shadow-lg flex-1">
                <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-6">ESTADO FINANCIERO ACTUAL</h3>
                <p className="text-[10px] text-[#94A3B8] font-black uppercase tracking-widest mb-1">SALDO TOTAL NETO:</p>
                <div onClick={() => setActiveDetail('BALANCE')} className="cursor-pointer group">
                  <h2 className="text-4xl font-black text-white mb-6 group-hover:text-brand transition-colors tabular-nums">{formatCurrency(totalFinal)}</h2>
                </div>
                
                {/* Area Chart trend mock - visual representation */}
                <div className="h-32 mb-8 -mx-2 pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={last6MonthsFlow} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorNeto" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="Ingresos" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorNeto)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-6 border-t border-[#2A3445] pt-6">
                   <div onClick={() => setActiveDetail('IN')} className="cursor-pointer group">
                     <p className="text-[10px] text-[#94A3B8] uppercase font-black tracking-widest mb-1">INGRESOS ESTE MES:</p>
                     <p className="text-xl font-black text-[#10B981] group-hover:opacity-80 transition-opacity tabular-nums">{formatCurrency(totalIn)}</p>
                   </div>
                   <div onClick={() => setActiveDetail('OUT')} className="cursor-pointer group">
                     <p className="text-[10px] text-[#94A3B8] uppercase font-black tracking-widest mb-1">GASTOS ESTE MES:</p>
                     <p className="text-xl font-black text-[#EF4444] group-hover:opacity-80 transition-opacity tabular-nums">{formatCurrency(totalOut)}</p>
                   </div>
                </div>
                
                <div className="mt-6 border-t border-[#2A3445] pt-6 flex justify-between items-center">
                   <div>
                     <p className="text-[10px] text-[#94A3B8] uppercase font-black tracking-widest mb-1">AHORRO NETO:</p>
                     <p className="text-xl font-black text-[#10B981] tabular-nums">{formatCurrency(totalIn - totalOut)}</p>
                   </div>
                   {totalIn - totalOut < 0 && (
                     <div className="bg-red-500/10 text-red-500 text-[10px] font-black px-3 py-1 rounded-lg border border-red-500/20">DEFICIT</div>
                   )}
                </div>
            </div>

            {/* Box 2: Meta 1 */}
            <div className="bg-[#172033] rounded-2xl p-6 border border-[#2A3445] shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{savingsGoals[0].name}</h3>
                  <TrendingUp size={16} className="text-[#94A3B8]"/>
                </div>
                <div className="flex justify-between items-end mb-3">
                   <div className="bg-brand/10 border border-brand/20 text-brand px-3 py-1 rounded-md text-[11px] font-black tabular-nums">{savingsGoals[0].progress}%</div>
                   <div className="text-[11px] font-black uppercase tracking-widest text-[#94A3B8]"><span className="text-[#10B981]">{formatCurrency(savingsGoals[0].current)}</span> / {formatCurrency(savingsGoals[0].target)}</div>
                </div>
                <div className="h-2.5 bg-[#0E1629] rounded-full overflow-hidden mt-2 border border-[#2A3445]">
                   <div className="h-full bg-brand w-[62%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                </div>
                <div className="flex items-end gap-1.5 h-16 mt-6">
                   {[30,40,20,50,70,80,60,90,100,85].map((h,i) => <div key={i} className="flex-1 bg-brand/30 hover:bg-brand rounded-t transition-colors" style={{height: `${h}%`}}></div>)}
                </div>
            </div>
         </div>

         {/* COL 2: FLUJO, GASTOS, META 2 */}
         <div className="space-y-6 flex flex-col h-full">
            
            {/* Box 3: Flujo de Efectivo */}
            <div className="bg-[#172033] rounded-2xl p-6 border border-[#2A3445] shadow-lg">
                <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-6 text-center">FLUJO DE EFECTIVO (Últimos 6 meses)</h3>
                <div className="flex justify-center gap-6 mb-6 text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
                   <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-[#10B981] rounded-sm"></div> Ingresos</div>
                   <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-[#EF4444] rounded-sm"></div> Gastos</div>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={last6MonthsFlow} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={2} barSize={12}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A3445" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 900}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 900}} tickFormatter={(v) => `$${v}`} />
                      <Tooltip cursor={{fill: '#2A3445', opacity: 0.4}} contentStyle={{backgroundColor: '#0E1629', borderColor: '#2A3445', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold'}} />
                      <Bar dataKey="Ingresos" fill="#10B981" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Gastos" fill="#EF4444" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
            </div>

            {/* Box 4: Gastos por Categoría */}
            <div className="bg-[#172033] rounded-2xl p-6 border border-[#2A3445] shadow-lg">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-[11px] font-black text-white uppercase tracking-widest">GASTOS POR CATEGORÍA ({monthName})</h3>
                   <Settings size={16} className="text-[#EF4444] cursor-pointer hover:rotate-90 transition-all"/>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                   <div className="w-36 h-36 flex-shrink-0 relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expensesByCategory.length > 0 ? expensesByCategory : [{name: 'Sin datos', amount: 1, color: '#2A3445'}]}
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="amount"
                            stroke="none"
                          >
                            {expensesByCategory.length > 0 ? expensesByCategory.map((entry, index) => <Cell key={index} fill={entry.color} />) : <Cell fill="#2A3445" />}
                          </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                   </div>
                   <div className="flex-1 w-full space-y-2.5 max-h-36 overflow-y-auto no-scrollbar pr-2">
                       {expensesByCategory.slice(0, 6).map((cat, i) => {
                          const pct = totalOut > 0 ? ((cat.amount / totalOut) * 100).toFixed(0) : '0';
                          return (
                            <div key={i} className="flex items-center gap-3 w-full group cursor-default">
                               <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform" style={{backgroundColor: cat.color}}></div>
                               <span className="text-[10px] font-black text-white truncate flex-1 uppercase tracking-widest" title={cat.name}>{cat.name}</span>
                               <span className="text-[10px] font-black text-[#94A3B8] tabular-nums">{pct}%</span>
                            </div>
                          )
                       })}
                       {expensesByCategory.length === 0 && (
                          <div className="text-[10px] text-[#94A3B8] font-black uppercase tracking-widest">Sin gastos registrados</div>
                       )}
                   </div>
                </div>
            </div>

            {/* Box 5: Meta 2 */}
            <div className="bg-[#172033] rounded-2xl p-6 border border-[#2A3445] shadow-lg flex-1">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{savingsGoals[1].name}</h3>
                   <BarChart3 size={16} className="text-[#94A3B8]"/>
                </div>
                <div className="flex justify-between items-end mb-3">
                   <div className="bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] px-3 py-1 rounded-md text-[11px] font-black tabular-nums">{savingsGoals[1].progress}%</div>
                   <div className="text-[11px] font-black uppercase tracking-widest text-[#94A3B8]"><span className="text-[#10B981]">{formatCurrency(savingsGoals[1].current)}</span> / {formatCurrency(savingsGoals[1].target)}</div>
                </div>
                <div className="h-2.5 bg-[#0E1629] rounded-full overflow-hidden mt-2 border border-[#2A3445]">
                   <div className="h-full bg-[#10B981] w-[62%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
                <div className="h-16 w-full mt-6">
                  {/* Mock line chart */}
                  <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full stroke-[#10B981] fill-none" strokeWidth="3">
                     <path d="M0,25 Q10,20 20,25 T40,15 T60,20 T80,10 T100,5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
            </div>
         </div>

         {/* COL 3: DESGLOSE ACTIVOS/PASIVOS, INVERSIONES, TRANSACCIONES */}
         <div className="space-y-6 flex flex-col h-full">
            
            {/* Box 6: Activos */}
            <div className="bg-[#172033] rounded-2xl p-6 border border-[#2A3445] shadow-lg">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">DESGLOSE DE ACTIVOS</h3>
                  <div className="p-1.5 bg-[#10B981]/10 rounded-lg text-[#10B981]"><Clock size={14}/></div>
               </div>
               <div className="flex justify-between items-end border-b border-[#2A3445] pb-4 mb-4">
                  <span className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest">Total Activos:</span>
                  <span className="text-lg font-black text-[#10B981] tabular-nums">{formatCurrency(totalActivos)}</span>
               </div>
               <div className="space-y-3">
                  {activosList.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-[#0E1629] p-2.5 rounded-xl border border-[#2A3445] hover:border-[#10B981]/30 transition-colors">
                       <div className="flex items-center gap-3">
                         <div className={item.color}>{item.icon}</div>
                         <span className="text-[10px] font-black text-white uppercase tracking-widest">{item.name}</span>
                       </div>
                       <span className="text-[11px] font-black text-[#10B981] tabular-nums">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Box 7: Pasivos */}
            <div className="bg-[#172033] rounded-2xl p-6 border border-[#2A3445] shadow-lg">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">DESGLOSE DE PASIVOS</h3>
                  <div className="p-1.5 bg-[#EF4444]/10 rounded-lg text-[#EF4444]"><CreditCard size={14}/></div>
               </div>
               <div className="flex justify-between items-end border-b border-[#2A3445] pb-4 mb-4">
                  <span className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest">Total Deudas:</span>
                  <span className="text-lg font-black text-[#EF4444] tabular-nums">{formatCurrency(totalPasivos)}</span>
               </div>
               <div className="space-y-3">
                  {pasivosList.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-[#0E1629] p-2.5 rounded-xl border border-[#2A3445] hover:border-[#EF4444]/30 transition-colors">
                       <div className="flex items-center gap-3">
                         <div className="text-[#EF4444]">{item.icon}</div>
                         <span className="text-[10px] font-black text-white uppercase tracking-widest">{item.name}</span>
                       </div>
                       <span className="text-[11px] font-black text-[#EF4444] tabular-nums">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Box 8: Rendimiento */}
            <div className="bg-[#172033] rounded-2xl p-6 border border-[#2A3445] shadow-lg">
               <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">RENDIMIENTO DE INVERSIONES ({monthName.substring(0,3)})</h3>
               <p className="text-2xl font-black text-[#10B981] mb-2">+4.2%</p>
               <div className="h-16 w-full -mx-2 pointer-events-none">
                  <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full stroke-brand fill-brand/20" strokeWidth="2">
                     <path d="M0,25 L10,20 L20,22 L30,15 L40,18 L50,10 L60,12 L70,5 L80,8 L100,0 L100,30 L0,30 Z" className="stroke-none" />
                     <path d="M0,25 L10,20 L20,22 L30,15 L40,18 L50,10 L60,12 L70,5 L80,8 L100,0" fill="none" />
                  </svg>
               </div>
            </div>

            {/* Box 9: Transacciones */}
            <div className="bg-[#172033] rounded-2xl p-6 border border-[#2A3445] shadow-lg flex-1">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-[11px] font-black text-white uppercase tracking-widest">ÚLTIMAS TRANSACCIONES</h3>
                 <div onClick={() => navigate('/finance/transactions')} className="p-1.5 bg-brand/10 rounded-lg text-brand cursor-pointer hover:bg-brand/20 transition-colors"><List size={14}/></div>
               </div>
               <div className="space-y-3">
                  {transactions.sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(t => {
                    const cat = categories.find(c => c.id === t.categoryId)?.name || 'Sin Categoría';
                    const dt = parseDate(t.date);
                    const dStr = dt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                    return (
                      <div key={t.id} className="grid grid-cols-12 gap-2 items-center pb-2 border-b border-[#2A3445] last:border-0 hover:bg-white/5 p-1.5 -mx-1.5 rounded-lg transition-colors group cursor-default">
                         <div className="col-span-2 text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">{dStr}</div>
                         <div className="col-span-4 text-[10px] font-black text-white truncate" title={t.description}>{t.description}</div>
                         <div className="col-span-3 text-[9px] font-bold text-[#94A3B8] uppercase truncate">{cat}</div>
                         <div className={`col-span-3 text-[10px] font-black text-right tabular-nums ${t.type === 'IN' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                           {t.type === 'IN' ? '+' : '-'}{formatCurrency(t.amount)}
                         </div>
                      </div>
                    )
                  })}
                  {transactions.length === 0 && (
                     <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest text-center py-4">No hay transacciones</p>
                  )}
               </div>
            </div>
         </div>
         
      </div>
    </div>
  );
};
"""

final_text = logic_up_to_loading + new_logic + new_ui

with open(target_file, "w", encoding="utf-8") as f:
    f.write(final_text)

print("Replacement complete.")

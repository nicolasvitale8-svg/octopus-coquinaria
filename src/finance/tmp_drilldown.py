import re
import os

target_file = r"c:\Users\nicol\OneDrive\Desktop\Octopus app\src\finance\pages\Dashboard.tsx"

with open(target_file, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update DetailModal props & logic to support "activeCategoryScope"
old_modal_props = """const DetailModal: React.FC<{
  type: 'IN' | 'OUT' | 'BALANCE' | 'INVESTED';
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  month: number;
  year: number;
  periodStates: PeriodAccountState[];
  jars: Jar[];
}> = ({ type, onClose, transactions, categories, month, year, periodStates, jars }) => {"""

new_modal_props = """const DetailModal: React.FC<{
  type: 'IN' | 'OUT' | 'BALANCE' | 'INVESTED';
  activeCategoryScope?: string;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  month: number;
  year: number;
  periodStates: PeriodAccountState[];
  jars: Jar[];
}> = ({ type, activeCategoryScope, onClose, transactions, categories, month, year, periodStates, jars }) => {"""

content = content.replace(old_modal_props, new_modal_props)

old_modal_memo = """  const data = React.useMemo(() => {
    if (type === 'IN' || type === 'OUT') {
      const filtered = transactions.filter(t => {
        const d = parseDate(t.date);
        const isTransfer = t.description?.toLowerCase().includes('transferencia');
        return d.getMonth() === month && d.getFullYear() === year && t.type === type && !isTransfer;
      });

      const byCat = filtered.reduce((acc, t) => {
        const catName = categories.find(c => c.id === t.categoryId)?.name || 'Sin Rubro';
        acc[catName] = (acc[catName] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(byCat).map(([name, value]) => ({ name, value }));
    } else if (type === 'BALANCE') {"""

new_modal_memo = """  const data = React.useMemo(() => {
    if (type === 'IN' || type === 'OUT') {
      const filtered = transactions.filter(t => {
        const d = parseDate(t.date);
        const isTransfer = t.description?.toLowerCase().includes('transferencia');
        let pass = d.getMonth() === month && d.getFullYear() === year && t.type === type && !isTransfer;
        
        if (pass && activeCategoryScope) {
           const catName = categories.find(c => c.id === t.categoryId)?.name || 'Sin Rubro';
           pass = catName === activeCategoryScope;
        }
        return pass;
      });

      if (activeCategoryScope) {
         // If a specific category is selected, breakdown by Transaction instead of Category
         return filtered.map(t => ({ name: t.description || 'Sin detalle', value: t.amount, _id: t.id }));
      }

      const byCat = filtered.reduce((acc, t) => {
        const catName = categories.find(c => c.id === t.categoryId)?.name || 'Sin Rubro';
        acc[catName] = (acc[catName] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(byCat).map(([name, value]) => ({ name, value }));
    } else if (type === 'BALANCE') {"""

content = content.replace(old_modal_memo, new_modal_memo)

# Add state to Dashboard component
old_state = """  const [activeDetail, setActiveDetail] = useState<'IN' | 'OUT' | 'BALANCE' | 'INVESTED' | null>(null);"""
new_state = """  const [activeDetail, setActiveDetail] = useState<'IN' | 'OUT' | 'BALANCE' | 'INVESTED' | null>(null);
  const [activeCategoryScope, setActiveCategoryScope] = useState<string | undefined>(undefined);"""

content = content.replace(old_state, new_state)

# Add prop to DetailModal instantiation
old_instantiation = """      {activeDetail && (
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
      )}"""
new_instantiation = """      {activeDetail && (
        <DetailModal
          type={activeDetail}
          activeCategoryScope={activeCategoryScope}
          onClose={() => { setActiveDetail(null); setActiveCategoryScope(undefined); }}
          transactions={transactions}
          categories={categories}
          month={currentMonth}
          year={currentYear}
          periodStates={periodStates}
          jars={jars}
        />
      )}"""
content = content.replace(old_instantiation, new_instantiation)

# Modify navigation tabs
old_tabs = """           {/* TABS */}
           <div className="flex overflow-x-auto gap-2 bg-[#0E1629] p-1.5 rounded-2xl border border-[#2A3445] no-scrollbar">
             {['Resumen', 'Ingresos', 'Gastos', 'Presupuesto', 'Ahorros', 'Inversiones'].map((t, i) => (
                <button key={i} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${i === 0 ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-[#94A3B8] hover:text-white hover:bg-white/5'}`}>{t}</button>
             ))}
           </div>"""
new_tabs = """           {/* TABS */}
           <div className="flex overflow-x-auto gap-2 bg-[#0E1629] p-1.5 rounded-2xl border border-[#2A3445] no-scrollbar">
             {[
               {name:'Resumen', action:()=>setActiveDetail(null)}, 
               {name:'Ingresos', action:()=>{setActiveCategoryScope(undefined); setActiveDetail('IN')}}, 
               {name:'Gastos', action:()=>{setActiveCategoryScope(undefined); setActiveDetail('OUT')}}, 
               {name:'Presupuesto', action:()=>navigate('/finance/budget')}, 
               {name:'Cuentas', action:()=>navigate('/finance/accounts')}, 
               {name:'Inversiones', action:()=>{setActiveCategoryScope(undefined); setActiveDetail('INVESTED')}}
             ].map((t, i) => (
                <button key={i} onClick={t.action} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${i === 0 && !activeDetail ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-[#94A3B8] hover:text-white hover:bg-white/5'}`}>{t.name}</button>
             ))}
           </div>"""
content = content.replace(old_tabs, new_tabs)

# Modify Bar chart to jump to specific month
old_bar = """<BarChart data={last6MonthsFlow} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={2} barSize={12}>"""
new_bar = """<BarChart 
                      data={last6MonthsFlow} 
                      margin={{ top: 0, right: 0, left: -20, bottom: 0 }} 
                      barGap={2} 
                      barSize={12}
                      onClick={(e) => {
                         if (e && e.activePayload && e.activePayload.length > 0) {
                            const payload = e.activePayload[0].payload;
                            // Reconstruct month jump logic based on index relative to current
                            const reversedIndex = last6MonthsFlow.findIndex(m => m.name === payload.name);
                            if (reversedIndex !== -1) {
                               const monthsBack = 5 - reversedIndex; 
                               const d = new Date(new Date().getFullYear(), new Date().getMonth() - monthsBack, 1);
                               setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear());
                            }
                         }
                      }}
                      className="cursor-pointer"
                    >"""
content = content.replace(old_bar, new_bar)

# Modify Donut chart list items
old_slice = """                          return (
                            <div key={i} className="flex items-center gap-3 w-full group cursor-default">
                               <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform" style={{backgroundColor: cat.color}}></div>
                               <span className="text-[10px] font-black text-white truncate flex-1 uppercase tracking-widest" title={cat.name}>{cat.name}</span>
                               <span className="text-[10px] font-black text-[#94A3B8] tabular-nums">{pct}%</span>
                            </div>
                          )"""
new_slice = """                          return (
                            <div key={i} 
                                 className="flex items-center gap-3 w-full group cursor-pointer hover:bg-white/5 p-1 -mx-1 rounded transition-colors"
                                 onClick={() => { setActiveCategoryScope(cat.name); setActiveDetail('OUT'); }}
                            >
                               <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform" style={{backgroundColor: cat.color}}></div>
                               <span className="text-[10px] font-black text-white truncate flex-1 uppercase tracking-widest" title={cat.name}>{cat.name}</span>
                               <span className="text-[10px] font-black text-[#94A3B8] tabular-nums">{pct}%</span>
                            </div>
                          )"""
content = content.replace(old_slice, new_slice)

old_pie = """                        <PieChart>
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
                        </PieChart>"""

new_pie = """                        <PieChart>
                          <Pie
                            data={expensesByCategory.length > 0 ? expensesByCategory : [{name: 'Sin datos', amount: 1, color: '#2A3445'}]}
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="amount"
                            stroke="none"
                            className="cursor-pointer"
                            onClick={(e) => {
                              if (e && e.name && e.name !== 'Sin datos') {
                                setActiveCategoryScope(e.name);
                                setActiveDetail('OUT');
                              }
                            }}
                          >
                            {expensesByCategory.length > 0 ? expensesByCategory.map((entry, index) => <Cell key={index} fill={entry.color} />) : <Cell fill="#2A3445" />}
                          </Pie>
                        </PieChart>"""
content = content.replace(old_pie, new_pie)

# Enhance Assets and Liabilities clickability
old_activo = """                  {activosList.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-[#0E1629] p-2.5 rounded-xl border border-[#2A3445] hover:border-[#10B981]/30 transition-colors">
                       <div className="flex items-center gap-3">
                         <div className={item.color}>{item.icon}</div>
                         <span className="text-[10px] font-black text-white uppercase tracking-widest">{item.name}</span>
                       </div>
                       <span className="text-[11px] font-black text-[#10B981] tabular-nums">{formatCurrency(item.value)}</span>
                    </div>
                  ))}"""
new_activo = """                  {activosList.map((item, i) => (
                    <div key={i} 
                         onClick={() => item.name === 'Checking' ? navigate('/finance/accounts') : navigate('/finance/jars')}
                         className="flex justify-between items-center bg-[#0E1629] p-2.5 rounded-xl border border-[#2A3445] hover:border-[#10B981]/50 cursor-pointer transition-colors group">
                       <div className="flex items-center gap-3">
                         <div className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</div>
                         <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-[#10B981] transition-colors">{item.name}</span>
                       </div>
                       <span className="text-[11px] font-black text-[#10B981] tabular-nums flex items-center gap-2">{formatCurrency(item.value)} <ChevronRight size={12} className="opacity-0 group-hover:opacity-100"/></span>
                    </div>
                  ))}"""
content = content.replace(old_activo, new_activo)

old_pasivo = """                  {pasivosList.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-[#0E1629] p-2.5 rounded-xl border border-[#2A3445] hover:border-[#EF4444]/30 transition-colors">
                       <div className="flex items-center gap-3">
                         <div className="text-[#EF4444]">{item.icon}</div>
                         <span className="text-[10px] font-black text-white uppercase tracking-widest">{item.name}</span>
                       </div>
                       <span className="text-[11px] font-black text-[#EF4444] tabular-nums">{formatCurrency(item.value)}</span>
                    </div>
                  ))}"""
new_pasivo = """                  {pasivosList.map((item, i) => (
                    <div key={i} 
                         onClick={() => item.name.includes('Tarjetas') ? navigate('/finance/accounts') : navigate('/finance/loans')}
                         className="flex justify-between items-center bg-[#0E1629] p-2.5 rounded-xl border border-[#2A3445] hover:border-[#EF4444]/50 cursor-pointer transition-colors group">
                       <div className="flex items-center gap-3">
                         <div className="text-[#EF4444] group-hover:scale-110 transition-transform">{item.icon}</div>
                         <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-[#EF4444] transition-colors">{item.name}</span>
                       </div>
                       <span className="text-[11px] font-black text-[#EF4444] tabular-nums flex items-center gap-2">{formatCurrency(item.value)} <ChevronRight size={12} className="opacity-0 group-hover:opacity-100"/></span>
                    </div>
                  ))}"""
content = content.replace(old_pasivo, new_pasivo)

# Fix missing title for activeCategoryScope inside Modal
old_title_switch = """const getTitle = () => {
    switch (type) {
      case 'IN': return 'Distribución de Ingresos';
      case 'OUT': return 'Desglose de Gastos por Rubro';
      case 'BALANCE': return 'Saldos por Cuenta';
      case 'INVESTED': return 'Detalle de Inversiones (Frascos)';
    }
  };"""
new_title_switch = """const getTitle = () => {
    if (activeCategoryScope) return `Gastos de ${activeCategoryScope}`;
    switch (type) {
      case 'IN': return 'Distribución de Ingresos';
      case 'OUT': return 'Desglose de Gastos por Rubro';
      case 'BALANCE': return 'Saldos por Cuenta';
      case 'INVESTED': return 'Detalle de Inversiones (Frascos)';
    }
  };"""
content = content.replace(old_title_switch, new_title_switch)

with open(target_file, "w", encoding="utf-8") as f:
    f.write(content)

print("Added interactivity successfully.")

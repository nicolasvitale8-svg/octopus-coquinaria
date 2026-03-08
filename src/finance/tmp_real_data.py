import re
import os

target_file = r"c:\Users\nicol\OneDrive\Desktop\Octopus app\src\finance\pages\Dashboard.tsx"

with open(target_file, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove mock savingsGoals and define the new calculated data
old_savings = """  // Mock savings goals for visual matching
  const savingsGoals = [
    { name: 'META DE AHORRO (UNI)', progress: 62, current: 31000, target: 50000, color: 'brand' },
    { name: 'META DE AHORRO: COMPRA DE CASA', progress: 62, current: 31000, target: 50000, color: 'emerald' }
  ];"""

new_derived_data = """  // Top Savings Goal (Highest finalValue Jar)
  const topJarGoal = React.useMemo(() => {
    if (jars.length === 0) return null;
    const sorted = [...jars].map(j => {
      const calc = calculateJar(j);
      return { 
        name: j.name, 
        current: calc.currentValue, 
        target: calc.finalValue, 
        progress: j ? Math.min(100, Math.round((calc.daysElapsed / Math.max(calc.daysTotal, 1)) * 100)) : 0 
      };
    }).sort((a,b) => b.target - a.target);
    return sorted[0];
  }, [jars]);

  // Account Yield (TNA) Data
  const topYieldAccounts = React.useMemo(() => {
    return accounts
      .filter(a => a.isActive && a.annualRate && a.annualRate > 0)
      .sort((a,b) => (b.annualRate || 0) - (a.annualRate || 0))
      .slice(0, 5);
  }, [accounts]);

  // Real Inflation Data
  const recentInflation = React.useMemo(() => {
     if (inflationData.length === 0) return { current: '0', trend: []};
     const sorted = [...inflationData].sort((a,b) => new Date(`${a.year}-${a.month}-01`).getTime() - new Date(`${b.year}-${b.month}-01`).getTime());
     const last6 = sorted.slice(-6);
     const currentMonthData = sorted[sorted.length - 1];
     return {
        current: currentMonthData ? currentMonthData.rate.toFixed(1) : '0',
        trend: last6.map(d => ({ 
           name: new Date(`${d.year}-${d.month}-01`).toLocaleDateString('es-ES', { month: 'short' }).substring(0,3).toUpperCase(),
           Tasa: d.rate 
        }))
     };
  }, [inflationData]);"""

content = content.replace(old_savings, new_derived_data)

# 2. Replace Box 2 (first goal) with real Top Jar
old_box_2 = """            {/* Box 2: Meta 1 */}
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
                   <div className="h-full bg-brand rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000" style={{width: `${savingsGoals[0].progress}%`}}></div>
                </div>
                <div className="flex items-end gap-1.5 h-16 mt-6">
                   {[30,40,20,50,70,80,60,90,100,85].map((h,i) => <div key={i} className="flex-1 bg-brand/30 hover:bg-brand rounded-t transition-colors" style={{height: `${h}%`}}></div>)}
                </div>
            </div>"""

new_box_2 = """            {/* Box 2: Meta Principal (Frascos) */}
            <div className="bg-[#172033] rounded-2xl p-6 border border-[#2A3445] shadow-lg flex flex-col justify-between">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">
                     {topJarGoal ? `INVERSIÓN: ${topJarGoal.name}` : 'MÁXIMA INVERSIÓN'}
                  </h3>
                  <TrendingUp size={16} className="text-[#94A3B8]"/>
                </div>
                {topJarGoal ? (
                  <>
                    <div className="flex justify-between items-end mb-3 mt-auto">
                       <div className="bg-brand/10 border border-brand/20 text-brand px-3 py-1 rounded-md text-[11px] font-black tabular-nums">{topJarGoal.progress}%</div>
                       <div className="text-[11px] font-black uppercase tracking-widest text-[#94A3B8]"><span className="text-[#10B981]">{formatCurrency(topJarGoal.current)}</span> / {formatCurrency(topJarGoal.target)}</div>
                    </div>
                    <div className="h-2.5 bg-[#0E1629] rounded-full overflow-hidden mt-2 border border-[#2A3445]">
                       <div className="h-full bg-brand rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000" style={{width: `${Math.min(100, topJarGoal.progress)}%`}}></div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-[10px] text-[#94A3B8] font-black uppercase tracking-widest flex flex-col items-center gap-2 mt-auto">
                     <TrendingUp size={24} className="opacity-50"/>
                     No hay inversiones activas (Frascos)
                  </div>
                )}
            </div>"""

content = re.sub(r'\{\/\* Box 2: Meta 1 \*\/\}.*?<\/div>(\s+)<\/div>', new_box_2 + r'\1</div>', content, flags=re.DOTALL)


# 3. Replace Box 5 (second goal) with Account Yield (TNA)
old_box_5 = """            {/* Box 5: Meta 2 */}
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
                   <div className="h-full bg-[#10B981] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{width: `${savingsGoals[1].progress}%`}}></div>
                </div>
                <div className="h-16 w-full mt-6">
                  {/* Mock line chart */}
                  <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full stroke-[#10B981] fill-none" strokeWidth="3">
                     <path d="M0,25 Q10,20 20,25 T40,15 T60,20 T80,10 T100,5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
            </div>"""

new_box_5 = """            {/* Box 5: Rendimiento de Cuentas (TNA) */}
            <div className="bg-[#172033] rounded-2xl p-6 border border-[#2A3445] shadow-lg flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-[11px] font-black text-white uppercase tracking-widest">RENDIMIENTO DE CUENTAS (TNA)</h3>
                   <TrendingUp size={16} className="text-[#94A3B8]"/>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pr-2">
                   {topYieldAccounts.map((acc, i) => {
                     // Determine color scale for TNA
                     const tna = acc.annualRate || 0;
                     const isTop = i === 0;
                     return (
                        <div key={acc.id} onClick={() => navigate('/finance/accounts')} className="flex items-center justify-between p-2.5 bg-[#0E1629] rounded-xl border border-[#2A3445] hover:border-[#10B981]/30 cursor-pointer transition-colors group">
                           <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${isTop ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-white/5 text-[#94A3B8]'}`}>
                                 <Wallet size={12}/>
                              </div>
                              <span className="text-[10px] font-black text-white uppercase tracking-widest">{acc.name}</span>
                           </div>
                           <div className="flex items-center gap-3">
                              <span className="text-[11px] font-black tracking-wider text-[#10B981]">{tna.toFixed(1)}% TNA</span>
                           </div>
                        </div>
                     )
                   })}
                   {topYieldAccounts.length === 0 && (
                      <div className="text-center py-6 text-[10px] text-[#94A3B8] font-black uppercase tracking-widest h-full flex flex-col justify-center items-center gap-2">
                         <Percent size={24} className="opacity-50"/>
                         Sin cuentas con TNA configurada
                      </div>
                   )}
                </div>
            </div>"""

# Ensure Percent icon is imported
content = content.replace("BarChart3 } from 'lucide-react';", "BarChart3, Percent } from 'lucide-react';")

content = re.sub(r'\{\/\* Box 5: Meta 2 \*\/\}.*?<\/div>(\s+)<\/div>', new_box_5 + r'\1</div>', content, flags=re.DOTALL)


# 4. Replace Box 8 (Inflation Mock) with Real Inflation Chart
old_box_8 = """            {/* Box 8: Rendimiento */}
            <div className="bg-[#172033] rounded-2xl p-6 border border-[#2A3445] shadow-lg">
               <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">RENDIMIENTO DE INVERSIONES ({monthName.substring(0,3)})</h3>
               <p className="text-2xl font-black text-[#10B981] mb-2">+4.2%</p>
               <div className="h-16 w-full -mx-2 pointer-events-none">
                  <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full stroke-brand fill-brand/20" strokeWidth="2">
                     <path d="M0,25 L10,20 L20,22 L30,15 L40,18 L50,10 L60,12 L70,5 L80,8 L100,0 L100,30 L0,30 Z" className="stroke-none" />
                     <path d="M0,25 L10,20 L20,22 L30,15 L40,18 L50,10 L60,12 L70,5 L80,8 L100,0" fill="none" />
                  </svg>
               </div>
            </div>"""

new_box_8 = """            {/* Box 8: Inflación */}
            <div className="bg-[#172033] rounded-2xl p-6 border border-[#2A3445] shadow-lg flex flex-col">
               <div className="flex justify-between items-start mb-1">
                 <h3 className="text-[11px] font-black text-white uppercase tracking-widest">INFLACIÓN MENSUAL (Último Dato)</h3>
                 <span className="text-[9px] text-[#94A3B8] uppercase font-bold bg-white/5 px-2 py-1 rounded">ARG</span>
               </div>
               <p className="text-2xl font-black text-[#EF4444] mb-4">{recentInflation.current}%</p>
               
               <div className="h-20 w-full -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={recentInflation.trend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <Line type="monotone" dataKey="Tasa" stroke="#EF4444" strokeWidth={2} dot={{r:3, fill: '#EF4444', strokeWidth: 0}} />
                      <Tooltip 
                         cursor={{stroke: '#2A3445', strokeWidth: 1, strokeDasharray: '3 3'}}
                         contentStyle={{backgroundColor: '#0E1629', borderColor: '#2A3445', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold'}}
                         formatter={(value: any) => [`${value}%`, 'Inflación']}
                         labelStyle={{color: '#94A3B8'}}
                      />
                    </LineChart>
                  </ResponsiveContainer>
               </div>
            </div>"""

content = re.sub(r'\{\/\* Box 8: Rendimiento \*\/\}.*?<\/div>', new_box_8, content, flags=re.DOTALL)

with open(target_file, "w", encoding="utf-8") as f:
    f.write(content)

print("Replaced mock data with real data successfully.")

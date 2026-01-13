import React from 'react';
import { X, Zap } from 'lucide-react';
import { Account } from '../financeTypes';

interface ConciliateModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: Account | null;
    realBalance: string;
    setRealBalance: (value: string) => void;
    onConciliate: () => void;
    formatArgNumber: (value: number) => string;
    parseArgNumber: (value: string) => number;
}

export const ConciliateModal: React.FC<ConciliateModalProps> = ({
    isOpen,
    onClose,
    account,
    realBalance,
    setRealBalance,
    onConciliate,
    formatArgNumber,
    parseArgNumber
}) => {
    if (!isOpen || !account) return null;

    return (
        <div className="fixed inset-0 bg-fin-bg/95 backdrop-blur-2xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
            <div className="bg-fin-card rounded-[40px] w-full max-w-md border border-brand/20 shadow-[0_0_100px_rgba(16,185,129,0.1)] p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <button
                    onClick={onClose}
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
                        <p className="text-[10px] font-black text-brand uppercase tracking-widest">{account.name}</p>
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
                        onClick={onConciliate}
                        disabled={!realBalance || realBalance === '0,00'}
                        className="w-full py-5 bg-brand text-[#020b14] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand/20 hover:bg-white transition-all active:scale-95 disabled:opacity-30"
                    >
                        Ajustar y Conciliar
                    </button>
                </div>
            </div>
        </div>
    );
};

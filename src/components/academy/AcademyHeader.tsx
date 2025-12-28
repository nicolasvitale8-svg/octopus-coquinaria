import React from 'react';
import { BookOpen, Plus } from 'lucide-react';
import Button from '../ui/Button';

interface AcademyHeaderProps {
    onNewResource: () => void;
}

const AcademyHeader: React.FC<AcademyHeaderProps> = ({ onNewResource }) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-6 rounded-xl border border-slate-800 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-white font-space flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-[#1FB6D5]" />
                    Academia Octopus
                </h1>
                <p className="text-slate-400 text-sm">Biblioteca de recursos educativos para tus clientes.</p>
            </div>
            <Button onClick={onNewResource} className="bg-[#1FB6D5] text-[#021019] font-bold hover:bg-white flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nuevo Recurso
            </Button>
        </div>
    );
};

export default AcademyHeader;

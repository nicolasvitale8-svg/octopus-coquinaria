import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { getResources, createResource, deleteResource, Resource } from '../services/academyService';

// Components
import AcademyHeader from '../components/academy/AcademyHeader';
import AcademyResourceTable from '../components/academy/AcademyResourceTable';
import AcademyResourceModal from '../components/academy/AcademyResourceModal';

const AdminAcademy = () => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processingAction, setProcessingAction] = useState<string | null>(null);

    const fetchResources = async () => {
        // 1. Load Local Fast
        const { getLocalResources } = await import('../services/academyService');
        const local = getLocalResources();
        if (local.length > 0) {
            setResources(local);
            setIsLoading(false);
        } else {
            setIsLoading(true);
        }

        // 2. Load Remote Background
        const data = await getResources();
        setResources(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const handleSaveResource = async (formData: any) => {
        setProcessingAction('Guardando Recurso...');
        try {
            await createResource({
                ...formData,
                topics: formData.topics,
                pilares: formData.pilares
            });
            // Refresh
            fetchResources();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving resource:", error);
            alert("Error al guardar el recurso");
        } finally {
            setProcessingAction(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este recurso?')) return;
        setProcessingAction('Eliminando...');
        try {
            await deleteResource(id);
            fetchResources();
        } catch (error) {
            console.error("Error deleting resource:", error);
            alert("Error al eliminar el recurso");
        } finally {
            setProcessingAction(null);
        }
    };

    const filteredResources = resources.filter(r =>
        r.titulo.toLowerCase().includes(search.toLowerCase()) ||
        r.tipo.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <AcademyHeader onNewResource={() => setIsModalOpen(true)} />

            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                {/* Search Bar Inline */}
                <div className="p-4 border-b border-slate-800 flex items-center">
                    <Search className="w-5 h-5 text-slate-500 mr-3" />
                    <input
                        type="text"
                        placeholder="Buscar recursos..."
                        className="bg-transparent border-none focus:ring-0 text-white w-full placeholder-slate-600"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <AcademyResourceTable
                    resources={filteredResources}
                    isLoading={isLoading}
                    onDelete={handleDelete}
                />
            </div>

            <AcademyResourceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveResource}
            />

            <LoadingOverlay isVisible={!!processingAction} text={processingAction || ''} />
        </div>
    );
};

export default AdminAcademy;

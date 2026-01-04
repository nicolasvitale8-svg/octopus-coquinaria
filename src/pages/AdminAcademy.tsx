import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { getResources, createResource, deleteResource } from '../services/academyService';
import { AcademyResource } from '../types';

// Components
import AcademyHeader from '../components/academy/AcademyHeader';
import AcademyResourceTable from '../components/academy/AcademyResourceTable';
import AcademyResourceModal from '../components/academy/AcademyResourceModal';

const AdminAcademy = () => {
    const [resources, setResources] = useState<AcademyResource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<AcademyResource | null>(null);
    const [processingAction, setProcessingAction] = useState<string | null>(null);

    const fetchResources = async () => {
        setIsLoading(true);
        try {
            const data = await getResources();
            setResources(data);
        } catch (error) {
            console.error("Error fetching resources:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const handleSaveResource = async (formData: any) => {
        setProcessingAction('Guardando Recurso...');
        try {
            await createResource(formData);
            await fetchResources();
            setIsModalOpen(false);
            setEditingResource(null);
        } catch (error) {
            console.error("Error saving resource:", error);
            alert("Error al guardar el recurso. Verifica la consola.");
        } finally {
            setProcessingAction(null);
        }
    };

    const handleEdit = (resource: AcademyResource) => {
        setEditingResource(resource);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este recurso?')) return;
        setProcessingAction('Eliminando...');
        try {
            await deleteResource(id);
            await fetchResources();
        } catch (error) {
            console.error("Error deleting resource:", error);
            alert("Error al eliminar el recurso");
        } finally {
            setProcessingAction(null);
        }
    };

    const filteredResources = resources.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase()) ||
        r.format.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <AcademyHeader onNewResource={() => {
                setEditingResource(null);
                setIsModalOpen(true);
            }} />

            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                {/* Search Bar Inline */}
                <div className="p-4 border-b border-slate-800 flex items-center">
                    <Search className="w-5 h-5 text-slate-500 mr-3" />
                    <input
                        type="text"
                        placeholder="Buscar por título, categoría o formato..."
                        className="bg-transparent border-none focus:ring-0 text-white w-full placeholder-slate-600"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <AcademyResourceTable
                    resources={filteredResources}
                    isLoading={isLoading}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                />
            </div>

            <AcademyResourceModal
                isOpen={isModalOpen}
                initialData={editingResource}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingResource(null);
                }}
                onSave={handleSaveResource}
            />

            <LoadingOverlay isVisible={!!processingAction} text={processingAction || ''} />
        </div>
    );
};

export default AdminAcademy;

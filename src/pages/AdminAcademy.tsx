import React, { useState, useEffect } from 'react';
import { Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { getResources, createResource, deleteResource } from '../services/academyService';
import { AcademyResource } from '../types';

// Components
import AcademyHeader from '../components/academy/AcademyHeader';
import AcademyResourceTable from '../components/academy/AcademyResourceTable';
import AcademyResourceModal from '../components/academy/AcademyResourceModal';

const AdminAcademy = () => {
    const navigate = useNavigate();
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
            <AcademyHeader
                onNewResource={() => {
                    setEditingResource(null);
                    setIsModalOpen(true);
                }}
                actions={
                    <Button
                        onClick={() => navigate('/admin/academy/documents')}
                        variant="secondary"
                        icon={FileText}
                    >
                        Generador PDF
                    </Button>
                }
            />

            {/* Search Bar HUD */}
            <div
                className="relative border flex items-center px-4 py-3 gap-3"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
                <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-2.5 h-2.5 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
                <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-2.5 h-2.5 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)] select-none whitespace-nowrap">
                    QUERY ›
                </span>
                <Search className="w-4 h-4 text-[var(--color-primary)]" strokeWidth={1.75} />
                <input
                    type="text"
                    placeholder="Buscar por título, categoría o formato…"
                    className="bg-transparent border-none focus:ring-0 text-[var(--text-primary)] w-full placeholder-[var(--text-muted)] font-mono text-sm focus:outline-none"
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

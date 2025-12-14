import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Project } from '../types';

const ClientProjectRedirect = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const findProject = async () => {
            if (!supabase || !user) return;

            // Strategy: Find project where this user is the client
            // 1. Check by client_email in team JSON
            // 2. Check by client_contacts array in team JSON

            try {
                // Fetch all projects (RLS should filter, but we might not have RLS perfectly set for 'list all' for clients yet)
                // Better to search. Supabase JSON filtering is tricky.
                // Let's fetch all (usually not many) and filter in JS for flexibility, 
                // OR use a specific RPC if we had one. Simple fetch first.

                const { data: projects, error } = await supabase
                    .from('projects')
                    .select('*');

                if (error) throw error;

                // Filter logic
                const myProject = projects?.find((p: any) => {
                    // Check direct email
                    if (p.team?.client_email === user.email) return true;

                    // Check contacts
                    const contacts = p.team?.client_contacts || [];
                    if (Array.isArray(contacts)) {
                        return contacts.some((c: any) => c.email === user.email);
                    }
                    return false;
                });

                if (myProject) {
                    // Found! Redirect to the Hub view
                    // We can reuse AdminProjectHub path but we need to ensure permissions allow it.
                    // Or we can render the view here. Redirect is cleaner URL-wise if we want deep linking.
                    // But if AdminProjectHub checks 'isAdmin', it will block.
                    // We need to unblock AdminProjectHub first.
                    navigate(`/hub/projects/${myProject.id}`);
                } else {
                    setError('No se encontró un proyecto asociado a tu cuenta. Contacta a tu consultor.');
                }

            } catch (err: any) {
                console.error("Error finding project:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        findProject();
    }, [user, navigate]);

    if (isLoading) return <div className="p-8 text-white text-center">Buscando tu proyecto...</div>;

    if (error) return (
        <div className="p-8 text-center">
            <h2 className="text-xl text-red-400 mb-2">Error</h2>
            <p className="text-slate-300">{error}</p>
            <button onClick={() => navigate('/dashboard')} className="mt-4 text-blue-400 hover:underline">Volver</button>
        </div>
    );

    return null;
};

export default ClientProjectRedirect;

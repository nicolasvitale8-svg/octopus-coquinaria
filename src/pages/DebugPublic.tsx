
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Link } from 'react-router-dom';

const DebugPublic = () => {
    const [boardLog, setBoardLog] = useState<any>({});
    const [eventsLog, setEventsLog] = useState<any>({});
    const [academyLog, setAcademyLog] = useState<any>({});
    const [envInfo, setEnvInfo] = useState<any>({});

    useEffect(() => {
        const runChecks = async () => {
            // 1. Check ENV
            setEnvInfo({
                url: import.meta.env.VITE_SUPABASE_URL ? 'Defined' : 'Missing',
                key_len: import.meta.env.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY.length : 0
            });

            // 2. Access Board
            const { data: boardData, error: boardError } = await supabase
                .from('public_board_items')
                .select('*'); // NO FILTERS (check raw access)
            setBoardLog({ data: boardData, error: boardError });

            // 3. Access Calendar
            const { data: eventData, error: eventError } = await supabase
                .from('eventos_calendario')
                .select('*');
            setEventsLog({ data: eventData, error: eventError });

            // 4. Access Academy
            const { data: academyData, error: academyError } = await supabase
                .from('recursos_academia')
                .select('*')
                .limit(5);
            setAcademyLog({ data: academyData, error: academyError });
        };

        runChecks();
    }, []);

    return (
        <div className="p-10 bg-black text-white min-h-screen font-mono text-xs">
            <h1 className="text-xl font-bold mb-4 text-cyan-400">DEBUG PUBLIC ACCESS</h1>
            <Link to="/" className="underline mb-8 block">Volver a Home</Link>

            <section className="mb-8 border border-white/20 p-4">
                <h2 className="text-yellow-400 font-bold mb-2">1. Environment</h2>
                <pre>{JSON.stringify(envInfo, null, 2)}</pre>
            </section>

            <section className="mb-8 border border-white/20 p-4">
                <h2 className="text-yellow-400 font-bold mb-2">2. Tabla: public_board_items</h2>
                {boardLog.error ? (
                    <div className="text-red-500 font-bold">ERROR: {JSON.stringify(boardLog.error)}</div>
                ) : (
                    <div className="text-green-400">
                        STATUS: OK. Rows found: {boardLog.data?.length}<br />
                        <pre className="mt-2 text-slate-500 max-h-40 overflow-auto">{JSON.stringify(boardLog.data, null, 2)}</pre>
                    </div>
                )}
            </section>

            <section className="mb-8 border border-white/20 p-4">
                <h2 className="text-yellow-400 font-bold mb-2">3. Tabla: eventos_calendario</h2>
                {eventsLog.error ? (
                    <div className="text-red-500 font-bold">ERROR: {JSON.stringify(eventsLog.error)}</div>
                ) : (
                    <div className="text-green-400">
                        STATUS: OK. Rows found: {eventsLog.data?.length}<br />
                        <pre className="mt-2 text-slate-500 max-h-40 overflow-auto">{JSON.stringify(eventsLog.data, null, 2)}</pre>
                    </div>
                )}
            </section>

            <section className="mb-8 border border-white/20 p-4">
                <h2 className="text-yellow-400 font-bold mb-2">4. Tabla: recursos_academia</h2>
                {academyLog.error ? (
                    <div className="text-red-500 font-bold">ERROR: {JSON.stringify(academyLog.error)}</div>
                ) : (
                    <div className="text-green-400">
                        STATUS: OK. Rows found: {academyLog.data?.length}<br />
                        <pre className="mt-2 text-slate-500 max-h-40 overflow-auto">{JSON.stringify(academyLog.data, null, 2)}</pre>
                    </div>
                )}
            </section>
        </div>
    );
};

export default DebugPublic;

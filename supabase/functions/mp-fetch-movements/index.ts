// supabase/functions/mp-fetch-movements/index.ts
// Edge Function para OBTENER movimientos de Mercado Pago (sin insertar)
// Retorna los movimientos para validación en el frontend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MPPayment {
    id: number;
    date_created: string;
    date_approved: string | null;
    description: string | null;
    payment_method_id: string;
    transaction_amount: number;
    status: string;
    operation_type: string;
    payer?: { id?: string };
    collector?: { id?: string };
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

        if (!MP_ACCESS_TOKEN) {
            throw new Error("Missing MP_ACCESS_TOKEN");
        }

        // Obtener parámetros - soporta rango de fechas O días hacia atrás
        const url = new URL(req.url);
        const dateFromParam = url.searchParams.get("dateFrom");
        const dateToParam = url.searchParams.get("dateTo");
        const daysBack = parseInt(url.searchParams.get("days") || "30");

        let dateFrom: Date;
        let dateTo: Date;

        if (dateFromParam && dateToParam) {
            // Usar fechas específicas
            dateFrom = new Date(dateFromParam + "T00:00:00");
            dateTo = new Date(dateToParam + "T23:59:59");
        } else {
            // Fallback a días hacia atrás
            dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - daysBack);
            dateTo = new Date();
        }

        console.log(`Fetching MP movements from ${dateFrom.toISOString()} to ${dateTo.toISOString()}`);

        // Obtener movimientos de MP API
        const searchUrl = `https://api.mercadopago.com/v1/payments/search?` + new URLSearchParams({
            range: "date_created",
            begin_date: dateFrom.toISOString(),
            end_date: dateTo.toISOString(),
            status: "approved",
            limit: "100",
        });

        const response = await fetch(searchUrl, {
            headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error MP API: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const payments: MPPayment[] = data.results || [];

        console.log(`Found ${payments.length} movements`);

        // Transformar a formato compatible con ImportLine del frontend
        const movements = payments.map((payment) => {
            // Determinar tipo (IN/OUT)
            const isExpense = payment.transaction_amount < 0 ||
                (payment.operation_type === "regular_payment" &&
                    payment.payer?.id?.toString() === payment.collector?.id?.toString());

            const type = isExpense ? "OUT" : "IN";

            return {
                id: payment.id.toString(),
                date: (payment.date_approved || payment.date_created)?.split("T")[0] || new Date().toISOString().split("T")[0],
                description: `[MP] ${payment.description || payment.payment_method_id || "Movimiento MP"}`,
                amount: Math.abs(payment.transaction_amount),
                type: type,
                external_id: payment.id.toString(),
                source: "mercadopago",
            };
        });

        return new Response(JSON.stringify({
            success: true,
            movements,
            total: movements.length,
            period: { from: dateFrom.toISOString(), to: dateTo.toISOString() }
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Error fetching MP movements:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});

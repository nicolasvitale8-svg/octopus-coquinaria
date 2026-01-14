// supabase/functions/mp-sync-movements/index.ts
// Edge Function para sincronizar movimientos (gastos) desde Mercado Pago

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Missing environment variables");
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Obtener parámetros opcionales (fecha desde/hasta)
        const url = new URL(req.url);
        const daysBack = parseInt(url.searchParams.get("days") || "7");

        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - daysBack);
        const dateTo = new Date();

        // Formato para MP API: yyyy-MM-ddTHH:mm:ss.SSSZ
        const formatDate = (d: Date) => d.toISOString();

        console.log(`Sincronizando movimientos desde ${dateFrom.toISOString()} hasta ${dateTo.toISOString()}`);

        // Obtener movimientos de la cuenta desde MP
        // Usamos el endpoint de payments/search para obtener pagos realizados
        const searchUrl = `https://api.mercadopago.com/v1/payments/search?` + new URLSearchParams({
            range: "date_created",
            begin_date: formatDate(dateFrom),
            end_date: formatDate(dateTo),
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
        const payments = data.results || [];

        console.log(`Encontrados ${payments.length} movimientos`);

        let inserted = 0;
        let skipped = 0;

        for (const payment of payments) {
            // Determinar si es ingreso o gasto
            // - operation_type === "regular_payment" y payer.id === tu user_id → GASTO (vos pagaste)
            // - operation_type === "regular_payment" y payer.id !== tu user_id → INGRESO (te pagaron)

            const isExpense = payment.operation_type === "regular_payment" &&
                payment.payer?.id?.toString() === payment.collector?.id?.toString();

            // Por defecto tratamos como ingreso si no podemos determinar
            const transactionType = payment.transaction_amount < 0 || isExpense ? "OUT" : "IN";

            const transaction = {
                date: payment.date_approved?.split("T")[0] || payment.date_created?.split("T")[0] || new Date().toISOString().split("T")[0],
                type: transactionType,
                amount: Math.abs(payment.transaction_amount),
                description: `[MP] ${payment.description || payment.payment_method_id || "Movimiento MP"}`,
                source: "mercadopago",
                external_id: payment.id?.toString(),
            };

            // Verificar duplicado
            const { data: existing } = await supabase
                .from("fin_transactions")
                .select("id")
                .eq("external_id", transaction.external_id)
                .eq("source", "mercadopago")
                .single();

            if (existing) {
                skipped++;
                continue;
            }

            // Insertar
            const { error } = await supabase.from("fin_transactions").insert(transaction);
            if (error) {
                console.error(`Error insertando pago ${payment.id}:`, error);
            } else {
                inserted++;
            }
        }

        const result = {
            success: true,
            period: { from: dateFrom.toISOString(), to: dateTo.toISOString() },
            total: payments.length,
            inserted,
            skipped,
        };

        console.log("Sincronización completada:", result);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Error en sincronización:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});

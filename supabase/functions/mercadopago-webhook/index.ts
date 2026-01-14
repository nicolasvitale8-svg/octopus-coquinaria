// supabase/functions/mercadopago-webhook/index.ts
// Edge Function para recibir webhooks de Mercado Pago

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

interface MPWebhookPayload {
    action: string;
    api_version: string;
    data: { id: string };
    date_created: string;
    id: number;
    live_mode: boolean;
    type: string;
    user_id: string;
}

serve(async (req: Request) => {
    // Handle CORS preflight
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

        // Parse webhook payload
        const payload: MPWebhookPayload = await req.json();
        console.log("Webhook recibido:", JSON.stringify(payload));

        // Solo procesar eventos de pagos
        if (payload.type !== "payment") {
            return new Response(JSON.stringify({ message: "Evento ignorado" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Obtener detalles del pago desde MP API
        const paymentId = payload.data.id;
        const paymentResponse = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
                },
            }
        );

        if (!paymentResponse.ok) {
            throw new Error(`Error obteniendo pago: ${paymentResponse.status}`);
        }

        const payment = await paymentResponse.json();
        console.log("Pago obtenido:", JSON.stringify(payment));

        // Solo procesar pagos aprobados
        if (payment.status !== "approved") {
            return new Response(JSON.stringify({ message: "Pago no aprobado, ignorado" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Mapear a transacción de Octopus
        const transaction = {
            date: payment.date_approved?.split("T")[0] || new Date().toISOString().split("T")[0],
            type: "IN", // Los webhooks de MP son para cobros (ingresos)
            amount: payment.transaction_amount,
            description: `[MP] ${payment.description || payment.payment_method_id || "Pago recibido"}`,
            // account_id se debe configurar - usar la cuenta de MP predeterminada
            // category_id se puede asignar después o usar una categoría genérica
            source: "mercadopago",
            external_id: payment.id?.toString(),
        };

        // Verificar si ya existe (evitar duplicados)
        const { data: existing } = await supabase
            .from("fin_transactions")
            .select("id")
            .eq("external_id", transaction.external_id)
            .eq("source", "mercadopago")
            .single();

        if (existing) {
            console.log("Transacción ya existe, ignorando");
            return new Response(JSON.stringify({ message: "Transacción duplicada" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Insertar transacción
        const { error } = await supabase.from("fin_transactions").insert(transaction);

        if (error) {
            console.error("Error insertando transacción:", error);
            throw error;
        }

        console.log("Transacción creada exitosamente");
        return new Response(JSON.stringify({ success: true, transaction }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Error en webhook:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});

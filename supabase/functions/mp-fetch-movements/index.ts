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
    payer?: {
        id?: string;
        first_name?: string;
        last_name?: string;
        email?: string;
    };
    collector?: {
        id?: string;
        first_name?: string;
        last_name?: string;
    };
    external_reference?: string;
    statement_descriptor?: string;
    additional_info?: {
        items?: Array<{ title?: string; description?: string }>;
        payer?: { first_name?: string; last_name?: string };
    };
    point_of_interaction?: {
        transaction_data?: {
            bank_info?: {
                payer?: { account_holder_name?: string };
                collector?: { account_holder_name?: string };
            };
        };
        business_info?: { sub_unit?: string; unit?: string };
    };
    money_release_schema?: string;
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

            // Construir descripción con la mejor información disponible
            let description = "";

            // Nombre del pagador (quien envía dinero)
            const payerName = payment.payer?.first_name && payment.payer?.last_name
                ? `${payment.payer.first_name} ${payment.payer.last_name}`.trim()
                : payment.additional_info?.payer?.first_name && payment.additional_info?.payer?.last_name
                    ? `${payment.additional_info.payer.first_name} ${payment.additional_info.payer.last_name}`.trim()
                    : payment.point_of_interaction?.transaction_data?.bank_info?.payer?.account_holder_name || "";

            // Nombre del comercio receptor (quien recibe el pago)
            const collectorName = payment.collector?.first_name && payment.collector?.last_name
                ? `${payment.collector.first_name} ${payment.collector.last_name}`.trim()
                : payment.point_of_interaction?.transaction_data?.bank_info?.collector?.account_holder_name
                || payment.statement_descriptor || "";

            // Título del item o referencia externa
            const itemTitle = payment.additional_info?.items?.[0]?.title || "";
            const externalRef = payment.external_reference || "";
            const originalDesc = payment.description || "";

            // Elegir según tipo de movimiento
            if (type === "OUT") {
                // Para pagos, priorizar: comercio receptor > item > referencia > descripción
                if (collectorName && collectorName.length > 2 && !collectorName.toLowerCase().includes("null")) {
                    description = collectorName;
                } else if (itemTitle && itemTitle.length > 3) {
                    description = itemTitle;
                } else if (externalRef && externalRef.length > 3) {
                    description = externalRef;
                } else if (originalDesc && !["Producto", "Varios", "account_money", "null"].includes(originalDesc)) {
                    description = originalDesc;
                } else {
                    description = payment.payment_method_id || "Pago MP";
                }
            } else {
                // Para cobros, priorizar: nombre del pagador > item > referencia
                if (payerName && payerName.length > 2 && !payerName.toLowerCase().includes("null")) {
                    description = `Cobro de ${payerName}`;
                } else if (itemTitle && itemTitle.length > 3) {
                    description = itemTitle;
                } else if (originalDesc && !["Producto", "Varios", "account_money", "null"].includes(originalDesc)) {
                    description = originalDesc;
                } else {
                    description = "Cobro MP";
                }
            }

            return {
                id: payment.id.toString(),
                date: (payment.date_approved || payment.date_created)?.split("T")[0] || new Date().toISOString().split("T")[0],
                description: `[MP] ${description}`,
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

// supabase/functions/mp-request-report/index.ts
// Edge Function para SOLICITAR generación de reporte de cuenta de Mercado Pago

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

        if (!MP_ACCESS_TOKEN) {
            throw new Error("Missing MP_ACCESS_TOKEN");
        }

        // Obtener parámetros de fecha
        const url = new URL(req.url);
        const dateFrom = url.searchParams.get("dateFrom");
        const dateTo = url.searchParams.get("dateTo");

        if (!dateFrom || !dateTo) {
            throw new Error("dateFrom and dateTo are required");
        }

        console.log(`Requesting MP report from ${dateFrom} to ${dateTo}`);

        // Solicitar generación del reporte de saldo de cuenta
        const reportRequest = await fetch(
            "https://api.mercadopago.com/v1/account/settlement_report",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    begin_date: `${dateFrom}T00:00:00Z`,
                    end_date: `${dateTo}T23:59:59Z`,
                }),
            }
        );

        if (!reportRequest.ok) {
            const errorText = await reportRequest.text();
            console.error("Error requesting report:", errorText);

            // Si falla, intentar con el endpoint de "releases" (dinero liberado)
            const releasesRequest = await fetch(
                "https://api.mercadopago.com/v1/account/release_report",
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        begin_date: `${dateFrom}T00:00:00Z`,
                        end_date: `${dateTo}T23:59:59Z`,
                    }),
                }
            );

            if (!releasesRequest.ok) {
                const releasesError = await releasesRequest.text();
                throw new Error(`Error MP API (settlement): ${errorText}\nError MP API (releases): ${releasesError}`);
            }

            const releasesData = await releasesRequest.json();
            return new Response(JSON.stringify({
                success: true,
                reportType: "releases",
                reportId: releasesData.id,
                status: releasesData.status || "processing",
                message: "Reporte de liberaciones solicitado"
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        const data = await reportRequest.json();
        console.log("Report requested successfully:", data);

        return new Response(JSON.stringify({
            success: true,
            reportType: "settlement",
            reportId: data.id,
            status: data.status || "processing",
            fileName: data.file_name,
            message: "Reporte de cuenta solicitado"
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Error requesting MP report:", error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});

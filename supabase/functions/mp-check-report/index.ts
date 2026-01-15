// supabase/functions/mp-check-report/index.ts
// Edge Function para VERIFICAR estado y DESCARGAR reporte de Mercado Pago

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CSVMovement {
    DATE: string;
    SOURCE_ID: string;
    EXTERNAL_REFERENCE: string;
    TRANSACTION_TYPE: string;
    TRANSACTION_AMOUNT: string;
    TRANSACTION_CURRENCY: string;
    SELLER_AMOUNT: string;
    MP_FEE_AMOUNT: string;
    FINANCING_FEE_AMOUNT: string;
    SHIPPING_FEE_AMOUNT: string;
    TAXES_AMOUNT: string;
    COUPON_AMOUNT: string;
    INSTALLMENTS: string;
    PAYMENT_METHOD: string;
    ISSUER_NAME?: string;
    OPERATION_NAME?: string;
    SELLING_NAME?: string;
    BUYER_NAME?: string;
    PAYER_ID?: string;
    [key: string]: string | undefined;
}

function parseCSV(csvText: string): CSVMovement[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const movements: CSVMovement[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const movement: any = {};
        headers.forEach((header, index) => {
            movement[header] = values[index] || '';
        });
        movements.push(movement);
    }

    return movements;
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

        const url = new URL(req.url);
        const reportId = url.searchParams.get("reportId");
        const fileName = url.searchParams.get("fileName");
        const reportType = url.searchParams.get("reportType") || "settlement";

        // Si tenemos fileName, descargar directamente el reporte
        if (fileName) {
            console.log(`Downloading report: ${fileName}`);

            const downloadUrl = reportType === "releases"
                ? `https://api.mercadopago.com/v1/account/release_report/${fileName}`
                : `https://api.mercadopago.com/v1/account/settlement_report/${fileName}`;

            const downloadResponse = await fetch(downloadUrl, {
                headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` },
            });

            if (!downloadResponse.ok) {
                const errorText = await downloadResponse.text();
                throw new Error(`Error downloading report: ${downloadResponse.status} - ${errorText}`);
            }

            const csvText = await downloadResponse.text();
            console.log(`CSV downloaded, length: ${csvText.length}`);

            const csvMovements = parseCSV(csvText);
            console.log(`Parsed ${csvMovements.length} movements from CSV`);

            // Transformar a formato ImportLine
            const movements = csvMovements.map((mov, index) => {
                const amount = parseFloat(mov.TRANSACTION_AMOUNT || mov.SELLER_AMOUNT || '0');
                const isExpense = amount < 0 || mov.TRANSACTION_TYPE?.includes('payment');

                // Construir descripción con la mejor info disponible
                let description = mov.OPERATION_NAME
                    || mov.SELLING_NAME
                    || mov.BUYER_NAME
                    || mov.EXTERNAL_REFERENCE
                    || mov.PAYMENT_METHOD
                    || "Movimiento MP";

                return {
                    id: mov.SOURCE_ID || `mp-${index}`,
                    date: mov.DATE?.split('T')[0] || new Date().toISOString().split('T')[0],
                    description: `[MP] ${description}`,
                    amount: Math.abs(amount),
                    type: isExpense ? "OUT" : "IN",
                    external_id: mov.SOURCE_ID,
                    source: "mercadopago",
                    // Datos extra para debugging
                    raw: {
                        transactionType: mov.TRANSACTION_TYPE,
                        paymentMethod: mov.PAYMENT_METHOD,
                        sellingName: mov.SELLING_NAME,
                        buyerName: mov.BUYER_NAME,
                    }
                };
            }).filter(m => m.amount > 0); // Filtrar movimientos sin monto

            return new Response(JSON.stringify({
                success: true,
                status: "ready",
                movements,
                total: movements.length,
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Si tenemos reportId, verificar estado
        if (reportId) {
            console.log(`Checking report status: ${reportId}`);

            const statusUrl = reportType === "releases"
                ? `https://api.mercadopago.com/v1/account/release_report/${reportId}`
                : `https://api.mercadopago.com/v1/account/settlement_report/${reportId}`;

            const statusResponse = await fetch(statusUrl, {
                headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` },
            });

            if (!statusResponse.ok) {
                // Intentar listar reportes para encontrar el más reciente
                const listUrl = reportType === "releases"
                    ? "https://api.mercadopago.com/v1/account/release_report/list"
                    : "https://api.mercadopago.com/v1/account/settlement_report/list";

                const listResponse = await fetch(listUrl, {
                    headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` },
                });

                if (listResponse.ok) {
                    const reports = await listResponse.json();
                    if (reports.length > 0) {
                        const latestReport = reports[0];
                        return new Response(JSON.stringify({
                            success: true,
                            status: latestReport.status,
                            fileName: latestReport.file_name,
                            reportId: latestReport.id,
                        }), {
                            headers: { ...corsHeaders, "Content-Type": "application/json" },
                            status: 200,
                        });
                    }
                }

                throw new Error(`Report not found: ${reportId}`);
            }

            const statusData = await statusResponse.json();

            return new Response(JSON.stringify({
                success: true,
                status: statusData.status,
                fileName: statusData.file_name,
                reportId: statusData.id,
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        throw new Error("Either reportId or fileName is required");

    } catch (error) {
        console.error("Error checking/downloading MP report:", error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});

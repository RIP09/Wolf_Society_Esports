// supabase/edge-functions/match-realtime/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
    try {
        const { matchId, action, data } = await req.json();

        if (action === "start") {
            // Start a match – make it live
            const { error } = await supabase
                .from("matches")
                .update({ status: "live", start_time: new Date().toISOString() })
                .eq("id", matchId);

            if (error) throw error;

            // Broadcast via WebSocket
            await broadcastUpdate({ matchId, status: "live" });

            return new Response(JSON.stringify({ success: true, matchId, status: "live" }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        if (action === "score") {
            // Update score
            const { homeScore, awayScore, timeElapsed } = data;
            const { error } = await supabase
                .from("matches")
                .update({
                    home_score: homeScore,
                    away_score: awayScore,
                    time_elapsed: timeElapsed
                })
                .eq("id", matchId);

            if (error) throw error;

            await broadcastUpdate({ matchId, homeScore, awayScore, timeElapsed });

            return new Response(JSON.stringify({ success: true, matchId, homeScore, awayScore }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        if (action === "finish") {
            // Finish match
            const { error } = await supabase
                .from("matches")
                .update({ status: "finished" })
                .eq("id", matchId);

            if (error) throw error;

            await broadcastUpdate({ matchId, status: "finished" });

            return new Response(JSON.stringify({ success: true, matchId, status: "finished" }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});

async function broadcastUpdate(payload: any) {
    // This would integrate with your WebSocket server
    // For now, we just log it
    console.log("Broadcast update:", payload);
}

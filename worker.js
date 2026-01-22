
/**
 * Cloudflare Worker: Kaleem AI Backend Middleware
 * This script handles requests from the frontend and securely communicates with OpenAI.
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // You can change "*" to your GitHub Pages URL later for better security
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const { message } = await request.json();

      if (!message) {
        return new Response(JSON.stringify({ error: "No message provided" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const openaiApiKey = env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return new Response(JSON.stringify({ error: "API Key not configured in Worker settings" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Cost-effective and fast model
          messages: [
            { role: "system", content: "أنت مساعد ذكي ولطيف تتحدث باللغة العربية بطلاقة. اسمك 'كليم'." },
            { role: "user", content: message }
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      if (data.error) {
        return new Response(JSON.stringify({ error: data.error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiReply = data.choices[0].message.content;

      return new Response(JSON.stringify({ reply: aiReply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};

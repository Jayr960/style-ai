import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a fashion AI assistant. Analyze clothing images and return structured data. You must respond ONLY by calling the analyze_clothing function.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this clothing item. Identify its type, primary color, style, pattern, suitable seasons, and descriptive tags.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_clothing",
              description: "Return structured analysis of a clothing item from an image.",
              parameters: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    description: "Clothing type, e.g. t-shirt, jeans, sneakers, jacket, dress, hoodie, skirt, shorts, blazer, hat, scarf, bag",
                  },
                  color: {
                    type: "string",
                    description: "Primary color of the item, e.g. white, black, navy, red, beige",
                  },
                  style: {
                    type: "string",
                    enum: ["casual", "formal", "streetwear", "athletic", "bohemian", "minimalist", "preppy", "vintage", "luxury", "smart-casual"],
                    description: "The overall style category",
                  },
                  pattern: {
                    type: "string",
                    enum: ["plain", "striped", "plaid", "floral", "graphic", "abstract", "polka-dot", "camo", "tie-dye", "animal-print"],
                    description: "The pattern on the clothing",
                  },
                  season: {
                    type: "array",
                    items: { type: "string", enum: ["spring", "summer", "fall", "winter"] },
                    description: "Suitable seasons to wear this item",
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-6 descriptive tags like basic, everyday, statement, layering, cozy, trendy",
                  },
                },
                required: ["type", "color", "style", "pattern", "season", "tags"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_clothing" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-clothing error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { wardrobeItems, weather, preferences } = await req.json();

    if (!wardrobeItems || wardrobeItems.length < 3) {
      return new Response(JSON.stringify({ error: "You need at least 3 wardrobe items to generate outfits." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const itemsSummary = wardrobeItems.map((item: any) => 
      `- ID: ${item.id} | ${item.item_type} | ${item.color} | ${item.style} | ${item.pattern} | seasons: ${(item.season || []).join(", ")} | tags: ${(item.tags || []).join(", ")}`
    ).join("\n");

    const weatherContext = weather 
      ? `Current weather: ${weather.temp}°F (feels like ${weather.feels_like}°F), ${weather.description}, humidity ${weather.humidity}%, wind ${weather.wind_speed}mph in ${weather.city}.`
      : "No weather data available. Assume moderate spring weather.";

    const prefContext = preferences
      ? `User style preferences: vibes: ${(preferences.style_vibes || []).join(", ")}; preferred colors: ${(preferences.preferred_colors || []).join(", ")}; occasions: ${(preferences.occasions || []).join(", ")}.`
      : "";

    const systemPrompt = `You are a fashion stylist AI. Create 7 outfit combinations (one per day, Monday–Sunday) from the user's wardrobe. Each outfit should be practical, stylish, and weather-appropriate. Avoid repeating the same item in consecutive days when possible. You MUST respond by calling the generate_weekly_outfits function.`;

    const userPrompt = `Here are my wardrobe items:\n${itemsSummary}\n\n${weatherContext}\n${prefContext}\n\nCreate 7 unique outfits for the week. Each outfit should have 2-4 items that go well together. Include a short name and reasoning for each.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_weekly_outfits",
              description: "Return 7 daily outfit combinations from the user's wardrobe.",
              parameters: {
                type: "object",
                properties: {
                  outfits: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "string", description: "Day of the week" },
                        outfit_name: { type: "string", description: "A catchy name for the outfit" },
                        item_ids: {
                          type: "array",
                          items: { type: "string" },
                          description: "Array of wardrobe item IDs that make up this outfit",
                        },
                        occasion: { type: "string", description: "Best occasion for this outfit, e.g. work, casual, date night" },
                        reasoning: { type: "string", description: "Brief explanation of why these items work together" },
                      },
                      required: ["day", "outfit_name", "item_ids", "occasion", "reasoning"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["outfits"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_weekly_outfits" } },
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

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-outfits error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

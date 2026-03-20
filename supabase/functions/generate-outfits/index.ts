import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LAYERING_GUIDELINES = `
LAYERING RULES — Only layer when it naturally fits the style and weather. Not every outfit needs layers.

- Streetwear: Oversized hoodies under open flannels or bombers, graphic tees under zip-up jackets, baggy pants with layered socks above sneakers
- Minimalist: Clean tonal layering — white tee under neutral crewneck, slim trousers with longline coat in same color family, no loud patterns
- Casual: Relaxed layering — basic tee under unbuttoned overshirt or light jacket, straight leg jeans, simple sneakers
- Preppy: Collar layering — polo or button-up under sweater vest or crewneck sweater, chinos, loafers or clean white sneakers
- Boho: Flowy layering — flowy blouse under kimono or duster cardigan, wide leg pants or maxi skirt, sandals or ankle boots
- Formal: Sharp layering — fitted dress shirt under blazer or suit jacket, tailored trousers, oxford shoes or heels
- Sporty: Athletic layering — compression base layer under jersey or athletic tee, joggers or shorts with zip-up or track jacket

When layering IS used, mention it in the reasoning naturally. When NOT layering, just describe the outfit without mentioning layering at all.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { wardrobeItems, weather, preferences, styleHistory } = await req.json();

    if (!wardrobeItems || wardrobeItems.length < 3) {
      return new Response(JSON.stringify({ error: "You need at least 3 wardrobe items to generate outfits." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const itemsSummary = wardrobeItems.map((item: any) =>
      `- ID: ${item.id} | ${item.item_type} | ${item.color} | ${item.style} | ${item.pattern} | seasons: ${(item.season || []).join(", ")} | tags: ${(item.tags || []).join(", ")}`
    ).join("\n");

    const weatherContext = weather
      ? `CURRENT WEATHER (you MUST factor this into every outfit choice and mention it in reasoning):
Temperature: ${weather.temp}°F (feels like ${weather.feels_like}°F)
Condition: ${weather.description}
Humidity: ${weather.humidity}%
Wind: ${weather.wind_speed} mph
City: ${weather.city}

Example reasoning style: "It's ${weather.temp}°F and ${weather.description} in ${weather.city} today, so we picked [items] to keep you [warm/cool/dry/comfortable] and stylish."`
      : "No weather data available. Assume moderate 65°F spring weather and mention that in reasoning.";

    const prefContext = preferences
      ? `User style preferences: vibes: ${(preferences.style_vibes || []).join(", ")}; preferred colors: ${(preferences.preferred_colors || []).join(", ")}; occasions: ${(preferences.occasions || []).join(", ")}.`
      : "";

    let styleHistoryContext = "";
    if (styleHistory && styleHistory.length > 0) {
      const histSummary = styleHistory.map((h: any, i: number) =>
        `${i + 1}. Style: ${h.style_vibe || "N/A"} | Colors: ${(h.colors || []).join(", ")} | Occasion: ${h.occasion || "N/A"} | Tags: ${(h.outfit_tags || []).join(", ")}`
      ).join("\n");
      styleHistoryContext = `
PERSONAL STYLE HISTORY (the user's last ${styleHistory.length} saved outfits — learn from these patterns):
${histSummary}

Use this history to personalize. If you notice patterns (e.g. user prefers minimalist fits with neutral colors), mention it: "Based on your recent style, you tend to prefer [pattern], so here's a look that matches that."`;
    }

    const systemPrompt = `You are a fashion stylist AI. Create 7 outfit combinations (one per day, Monday–Sunday) from the user's ACTUAL wardrobe items.

CRITICAL RULES:
1. You MUST ONLY use item IDs from the wardrobe list provided. Never invent or hallucinate item IDs.
2. Every outfit MUST be weather-appropriate. The reasoning MUST explicitly mention the current weather.
3. Use the layering guidelines below — but only layer when it naturally makes sense for the style and weather.
4. Avoid repeating the same item on consecutive days when possible.
5. Each outfit should have 2-4 items that work well together.
6. You MUST respond by calling the generate_weekly_outfits function.
7. For each item in the outfit, specify its role (top, bottom, shoes, accessory, outerwear).

${LAYERING_GUIDELINES}`;

    const userPrompt = `Here are my wardrobe items:\n${itemsSummary}\n\n${weatherContext}\n\n${prefContext}\n${styleHistoryContext}\n\nCreate 7 unique outfits for the week using ONLY the item IDs listed above. Each outfit should be practical, stylish, and weather-appropriate. Include a catchy name, the best occasion, and detailed reasoning that mentions the weather.`;

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
                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string", description: "The wardrobe item ID" },
                              role: { type: "string", enum: ["top", "bottom", "shoes", "accessory", "outerwear"], description: "The role this item plays in the outfit" },
                            },
                            required: ["id", "role"],
                            additionalProperties: false,
                          },
                          description: "Array of wardrobe items with their roles in this outfit",
                        },
                        occasion: { type: "string", description: "Best occasion for this outfit" },
                        reasoning: { type: "string", description: "Detailed explanation mentioning weather, style, and why these items work together" },
                      },
                      required: ["day", "outfit_name", "items", "occasion", "reasoning"],
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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No structured response from AI");

    const result = JSON.parse(toolCall.function.arguments);
    const outfits = result.outfits || [];

    // Extract all item_ids for backward compatibility
    const enrichedOutfits = outfits.map((o: any) => ({
      ...o,
      item_ids: (o.items || []).map((i: any) => i.id),
    }));

    return new Response(JSON.stringify({ outfits: enrichedOutfits }), {
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LAYERING_GUIDELINES = `
LAYERING RULES — You must structure outfits exactly how real people get dressed.

1. MANDATORY BASE LAYERS:
Certain items cannot be worn alone against the skin and ALWAYS require a base layer underneath them. Never generate an outfit with these items unless a valid base layer is also included:
- Quarter zips — always need a t-shirt, long sleeve, or henley underneath
- Hoodies — always need a t-shirt or long sleeve underneath
- Zip-up jackets — always need a t-shirt, long sleeve, or hoodie underneath
- Blazers — always need a shirt, t-shirt, or turtleneck underneath
- Overshirts and flannels (worn open/as top layer) — always need a t-shirt underneath
- Bombers and track jackets — always need a t-shirt or long sleeve underneath
- Cardigans — always need a t-shirt, tank, or fitted top underneath
- Suit jackets — always need a dress shirt or fitted top underneath

2. BASE LAYER PRIORITY:
When building an outfit that includes any of the items above, you MUST FIRST select a base layer from the user's wardrobe before adding the top layer. Choose stylistically appropriate basics (e.g. a white or neutral tee). Mention the base layer first in the outfit breakdown.

3. WHEN LAYERING DOES NOT APPLY:
Not every outfit needs layers. The following items are perfectly fine worn alone as the sole top piece:
- T-shirts worn alone
- Shirts and button-ups worn alone
- Polos worn alone
- Tank tops worn alone
- Sweaters worn as the sole top layer
- Dresses and jumpsuits
- Crop tops
Do not force layering onto these items unless the weather or specific style vibe strongly calls for it.

4. HOW TO DESCRIBE IT:
When an outfit includes layering, describe it naturally in the reasoning like a stylist would. Example: "We started with a clean white tee as your base and layered your grey quarter zip on top for that effortless put-together look." If there is no layering, just describe the outfit normally.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { wardrobeItems, weather, preferences, styleHistory, generationOptions } = await req.json();
    
    const options = generationOptions || {
      followWeather: true, includeLayering: true, learnStyle: true,
      selectedOccasion: null, selectedVibe: null, selectedColor: null
    };

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

    const weatherContext = (weather && options.followWeather)
      ? `CURRENT WEATHER (you MUST factor this into every outfit choice and mention it in reasoning):
Temperature: ${weather.temp}°F (feels like ${weather.feels_like}°F)
Condition: ${weather.description}
Humidity: ${weather.humidity}%
Wind: ${weather.wind_speed} mph
City: ${weather.city}

Example reasoning style: "It's ${weather.temp}°F and ${weather.description} in ${weather.city} today, so we picked [items] to keep you [warm/cool/dry/comfortable] and stylish."`
      : "WEATHER CONTEXT: Ignore weather completely. Generate outfits based purely on style and the occasion.";

    const prefContext = preferences
      ? `User style preferences: vibes: ${(preferences.style_vibes || []).join(", ")}; preferred colors: ${(preferences.preferred_colors || []).join(", ")}; occasions: ${(preferences.occasions || []).join(", ")}.`
      : "";

    const styleHistoryContext = (styleHistory && styleHistory.length > 0 && options.learnStyle) ? `
PERSONAL STYLE HISTORY (the user's last ${styleHistory.length} saved outfits — learn from these patterns):
${styleHistory.map((h: any, i: number) => `${i + 1}. Style: ${h.style_vibe || "N/A"} | Colors: ${(h.colors || []).join(", ")} | Occasion: ${h.occasion || "N/A"} | Tags: ${(h.outfit_tags || []).join(", ")}`).join("\n")}
Use this history to personalize. If you notice patterns, mention it: "Based on your recent style, you tend to prefer [pattern], so here's a look that matches that."` : "STYLE HISTORY: Do not bias the generation based on past history. Generate fresh new style perspectives.";

    const systemPrompt = `You are a fashion stylist AI. Create 7 outfit combinations (one per day, Monday–Sunday) from the user's ACTUAL wardrobe items.

CRITICAL RULES:
1. You MUST ONLY use item IDs from the wardrobe list provided. Never invent or hallucinate item IDs.
${options.followWeather ? "2. Every outfit MUST be weather-appropriate. The reasoning MUST explicitly mention the current weather." : "2. DO NOT MENTION WEATHER at all. Pretend weather does not exist and focus completely on the design parameters."}
3. Use the layering guidelines below — but only layer when it naturally makes sense for the style and weather.
4. MAXIMUM VARIETY RULE: Do NOT use the exact same item in more than 2 outfits. You MUST utilize as many distinct items from the user's wardrobe as physically possible. Never just reuse the same 4 items!
5. Each outfit should have 2-4 items that work well together.
6. You MUST respond by calling the generate_weekly_outfits function.
7. For each item in the outfit, specify its role (top, bottom, shoes, accessory, outerwear).

${LAYERING_GUIDELINES}`;

    const userPrompt = `Here are my wardrobe items:
${itemsSummary}

${weatherContext}

${prefContext}
${styleHistoryContext}

USER REQUESTED CONSTRAINTS:
${options.selectedOccasion ? `- Target Occasion: **${options.selectedOccasion}** (All outfits must strictly fit this occasion)` : ""}
${options.selectedVibe ? `- Style Vibe: **${options.selectedVibe}** (Adapt the pieces to fit this exact vibe)` : ""}
${options.selectedColor ? `- Color Mood: **${options.selectedColor}** (Rigorously restrict or focus the palette to fit this mood)` : ""}
${!options.includeLayering ? `- NO LAYERING. Provide exactly one top piece per outfit. Do not include outerwear or overshirts.` : "- STRICT LAYERING RULE: You MUST explicitly generate at least 4 outfits that feature multiple upper-body items (e.g. Base Layer + Outerwear). Do not be lazy and just output single-layer outfits for the whole week! You MUST build complex layered looks."}

Create 7 unique outfits for the week using ONLY the item IDs listed above. Each outfit should be practical, stylish, and exactly follow the user's constraints. Include a catchy name, the occasion, and detailed structural reasoning mapping exactly to the chosen UI toggles. ${!options.followWeather ? "Again, DO NOT mention the weather, temperature, or seasons in your reasoning." : "Ensure your reasoning mentions the exact weather provided."} The 'reasoning' object MUST have 'why' and 'styling_tips' per the schema.`;


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
                        reasoning: { 
                          type: "object", 
                          description: "Structural advice breakdown.",
                          properties: {
                            why: { type: "string", description: options.followWeather ? "One single short sentence maximum explaining why this outfit was chosen based on style and occasion. Include exact weather reference." : "One single short sentence maximum explaining why this outfit was chosen based on style and occasion. DO NOT MENTION WEATHER." },
                            styling_tips: { 
                              type: "array", 
                              items: { type: "string" }, 
                              description: "Two to three very short practical styling tips for the outfit. Each bullet should be one sentence max." 
                            }
                          },
                          required: ["why", "styling_tips"],
                          additionalProperties: false
                        },
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

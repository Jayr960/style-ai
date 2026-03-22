import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  try {
    const { outfitId, itemsDescription, styleVibe } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Create a clean professional flat-lay fashion editorial photograph on a pure white background. Arrange the following clothing items in a styled flat-lay layout with no mannequin or body, no shadows, and no props other than the clothes themselves. Items to include: ${itemsDescription}. Style: ${styleVibe}. The image should look like a professional Stitch fix or fashion magazine flat-lay product photo. Clothes should be neatly arranged, wrinkle-free, and styled naturally as if a professional stylist laid them out.`;

    const imgRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          { role: "user", content: [{ type: "text", text: prompt }] }
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!imgRes.ok) throw new Error(await imgRes.text());
    
    const imgData = await imgRes.json();
    const generatedImage = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImage) throw new Error("No image generated from model");

    const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    // Because we are authenticating server-side, it's safer to use service role or just the anon key + user token.
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const fileName = `${outfitId}/${crypto.randomUUID()}.png`;

    let bucket = "clothing-images"; // Use clothing-images bucket since it's confirmed existing in cleanup-clothing-image
    let { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from(bucket)
      .upload(fileName, imageBytes, { contentType: "image/png" });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseClient.storage.from(bucket).getPublicUrl(fileName);

    const { data: outfitData, error: fetchError } = await supabaseClient
      .from("outfits")
      .select("items")
      .eq("id", outfitId)
      .single();

    if (fetchError) throw fetchError;

    const currentItems = Array.isArray(outfitData.items) ? outfitData.items : [];
    const updatedItems = [
      ...currentItems.filter((i: any) => i.id !== "generated_image"),
      { id: "generated_image", role: "flat_lay", url: publicUrl }
    ];

    const { error: updateError } = await supabaseClient
      .from("outfits")
      .update({ items: updatedItems })
      .eq("id", outfitId);

    if (updateError) throw updateError;


    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Image gen error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

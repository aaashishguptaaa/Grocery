import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Grocery from "@/models/grocery.model";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const { query } = await req.json();

        if (!query || query.trim() === "") {
            return NextResponse.json({ error: "Grocery list query is required" }, { status: 400 });
        }

        // Fetch available in-stock groceries from store
        const groceries = await Grocery.find({ inStock: { $ne: false } }, "name price mrp unit image categories category inStock").lean();

        const groceryCatalogSummary = groceries.map(g => ({
            id: g._id?.toString(),
            name: g.name,
            category: g.category,
            categories: g.categories,
            price: g.price,
            unit: g.unit,
            image: g.image
        }));

        const systemPrompt = `You are Snapcart's Smart Grocery Shopping List Assistant for an ultra-fast grocery delivery store (like Blinkit, Zepto, or Instamart).
A customer gave this grocery shopping list or bundle request: "${query}"

Here is Snapcart's current supermarket shelf inventory:
${JSON.stringify(groceryCatalogSummary.slice(0, 160))}

YOUR TASK:
1. Parse the customer's grocery request into individual supermarket items.
2. MATCH as many items as possible to items in Snapcart's catalog using their exact "id".
3. Provide a clear bundle title (e.g. "Weekly Grocery Essentials", "Breakfast Basket", "Pantry Restock").
4. If some grocery item from their list is not in stock, list it in "unmatchedItems".

RESPONSE FORMAT:
Respond with strictly valid JSON only. No markdown, no conversational text outside JSON.
{
  "bundleTitle": "string",
  "summary": "Short 1-sentence summary of matched grocery items",
  "matchedGroceryIds": ["id1", "id2", ...],
  "unmatchedItems": ["item1", "item2"]
}`;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: systemPrompt }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            return NextResponse.json({ error: "Failed to parse grocery list" }, { status: 500 });
        }

        let parsedData;
        try {
            parsedData = JSON.parse(rawText);
        } catch (e) {
            const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
            parsedData = JSON.parse(cleaned);
        }

        // Attach full product objects for matched IDs
        const matchedItems = groceries.filter(g => 
            parsedData.matchedGroceryIds?.includes(g._id?.toString())
        );

        return NextResponse.json({
            ...parsedData,
            matchedProducts: matchedItems
        }, { status: 200 });

    } catch (error: any) {
        console.error("AI Grocery List Error:", error);
        return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
    }
}

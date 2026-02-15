import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { PageContent } from "@/lib/types";

const SYSTEM_PROMPT = `You are a content generator for DUST, a game about identifying misinformation. Generate a realistic-looking web page with a mix of true and false claims.

IMPORTANT RULES:
1. Generate content that LOOKS realistic and requires careful reading to evaluate
2. Include exactly 2-3 false claims mixed with true statements
3. False claims should be BELIEVABLE — plausible-sounding but factually wrong
4. Vary topics: politics, science, technology, culture, health, history, environment
5. Return ONLY valid JSON matching the schema below

Output JSON schema:
{
  "id": "generated-{timestamp}",
  "title": "string (article/post title)",
  "contentType": "news|blog|social|wiki",
  "author": "string (realistic author name)",
  "date": "string (formatted date)",
  "url": "string (realistic fake URL)",
  "difficulty": number (1-10, match requested difficulty),
  "decayDuration": number (seconds, based on difficulty),
  "sections": [
    {
      "id": "s1",
      "text": "string (paragraph of content)",
      "isTrue": true/false,
      "category": "headline|body|quote|statistic|attribution",
      "decayOrder": 1-5 (1=decays first, 5=decays last),
      "archiveCost": 1
    }
  ],
  "factCheckData": {
    "sourceCredibility": 0-100,
    "dateAccuracy": true/false,
    "emotionalLanguageScore": 0-100,
    "crossReferenceHits": ["string (fact check notes)"],
    "authorHistory": "string (author credibility note)"
  }
}

Generate 5-7 sections per page. Headlines should have decayOrder 5 (last to decay). Statistics and metadata decay first (decayOrder 1-2).`;

let lastCallTime = 0;

export async function POST(request: NextRequest) {
  // Rate limit: 1 call per 5 seconds
  const now = Date.now();
  if (now - lastCallTime < 5000) {
    return NextResponse.json(
      { error: "Rate limited. Try again in a few seconds." },
      { status: 429 }
    );
  }
  lastCallTime = now;

  try {
    const { contentType, difficulty } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Generate a ${contentType || "news"} page at difficulty level ${difficulty || 3}. Current date: February 2026.`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from AI" },
        { status: 500 }
      );
    }

    // Extract JSON from the response
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const pageContent: PageContent = JSON.parse(jsonMatch[0]);

    // Ensure required fields
    if (!pageContent.id) {
      pageContent.id = `generated-${Date.now()}`;
    }

    return NextResponse.json(pageContent);
  } catch (error) {
    console.error("Content generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

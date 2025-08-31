import { generateBusinessCoachResponse, BUSINESS_PROMPTS } from "@/lib/ai-providers";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { withRateLimit } from "@/lib/with-rate-limit";
import { NextRequest } from "next/server";

async function postHandler(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Detect business context from the latest message
    const latestMessage = messages[messages.length - 1];
    let context: keyof typeof BUSINESS_PROMPTS = "strategy";
    
    const messageText = latestMessage?.content?.toLowerCase() || "";
    
    if (messageText.includes("revenue") || messageText.includes("profit") || messageText.includes("pricing")) {
      context = "revenue";
    } else if (messageText.includes("marketing") || messageText.includes("customer") || messageText.includes("brand")) {
      context = "marketing";
    } else if (messageText.includes("operations") || messageText.includes("process") || messageText.includes("efficiency")) {
      context = "operations";
    } else if (messageText.includes("finance") || messageText.includes("budget") || messageText.includes("cash flow")) {
      context = "finance";
    }

    // Use our multi-AI provider system for business coaching
    const aiResponse = await generateBusinessCoachResponse(messages, context);

    // For streaming, we'll use the most cost-effective provider directly
    // This provides the intelligent caching while maintaining real-time feel
    const result = streamText({
      model: openai("gpt-4o-mini"), // Cost-effective streaming model
      messages: [
        {
          role: "system",
          content: `You are an expert AI business coach. ${BUSINESS_PROMPTS[context]}. 
          
          Keep responses actionable, specific, and focused on measurable business outcomes. 
          Always provide clear next steps and ROI-focused recommendations.
          
          Previous AI analysis: ${aiResponse.content}`
        },
        ...messages
      ],
      maxTokens: 1000,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error("Chat API error:", error);
    
    // Fallback to basic OpenAI
    const { messages } = await req.json();
    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system", 
          content: "You are a helpful AI business coach. Provide strategic advice for business growth and optimization."
        },
        ...messages
      ],
    });

    return result.toDataStreamResponse();
  }
}

// Apply rate limiting to chat endpoint (default rate limit since it's AI-powered)
export const POST = withRateLimit(postHandler, { type: 'default' });

import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { createHash } from "crypto";
import Redis from "ioredis";

// AI Provider Types
export type AIProvider = "openai" | "anthropic" | "google";

export interface AIResponse {
  content: string;
  provider: AIProvider;
  cached: boolean;
  cost: number;
  tokens: number;
}

export interface AIProviderConfig {
  name: AIProvider;
  model: string;
  priority: number;
  costPerToken: number;
  enabled: boolean;
}

// Provider configurations (ordered by cost-effectiveness)
const AI_PROVIDERS: AIProviderConfig[] = [
  {
    name: "anthropic",
    model: "claude-3-haiku-20240307",
    priority: 1,
    costPerToken: 0.00000025, // $0.25/1M tokens
    enabled: true,
  },
  {
    name: "openai", 
    model: "gpt-4o-mini",
    priority: 2,
    costPerToken: 0.000000150, // $0.15/1M tokens
    enabled: true,
  },
  {
    name: "google",
    model: "gemini-1.5-flash",
    priority: 3,
    costPerToken: 0.000000075, // $0.075/1M tokens
    enabled: true,
  }
];

// Redis client (with fallback for development)
let redis: Redis | null = null;

try {
  redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
} catch (error) {
  console.warn("Redis not available, AI caching disabled:", error);
}

// Cache configuration
const CACHE_CONFIG = {
  TTL: 60 * 60 * 24, // 24 hours
  KEY_PREFIX: "bossio:ai:cache:",
  ENABLED: !!redis
};

/**
 * Generate cache key from message content and system prompt
 */
function generateCacheKey(messages: any[], systemPrompt?: string): string {
  const content = JSON.stringify({ messages, systemPrompt });
  return CACHE_CONFIG.KEY_PREFIX + createHash("sha256").update(content).digest("hex");
}

/**
 * Get cached AI response
 */
async function getCachedResponse(cacheKey: string): Promise<AIResponse | null> {
  if (!CACHE_CONFIG.ENABLED || !redis) return null;
  
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const response = JSON.parse(cached);
      return { ...response, cached: true };
    }
  } catch (error) {
    console.warn("Cache retrieval error:", error);
  }
  
  return null;
}

/**
 * Cache AI response
 */
async function setCachedResponse(cacheKey: string, response: AIResponse): Promise<void> {
  if (!CACHE_CONFIG.ENABLED || !redis) return;
  
  try {
    await redis.setex(cacheKey, CACHE_CONFIG.TTL, JSON.stringify({
      content: response.content,
      provider: response.provider,
      cost: response.cost,
      tokens: response.tokens
    }));
  } catch (error) {
    console.warn("Cache storage error:", error);
  }
}

/**
 * Get AI model instance by provider
 */
function getAIModel(provider: AIProvider, modelName: string) {
  switch (provider) {
    case "openai":
      return openai(modelName);
    case "anthropic":
      return anthropic(modelName);
    case "google":
      return google(modelName);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Calculate estimated tokens (rough approximation)
 */
function estimateTokens(text: string): number {
  // Rough estimation: ~4 chars per token
  return Math.ceil(text.length / 4);
}

/**
 * Generate AI response with intelligent provider fallback
 */
export async function generateAIResponse(
  messages: any[],
  systemPrompt?: string,
  options?: {
    preferredProvider?: AIProvider;
    maxRetries?: number;
    businessContext?: string;
  }
): Promise<AIResponse> {
  const { 
    preferredProvider, 
    maxRetries = 3,
    businessContext = "general business consultation"
  } = options || {};

  // Add business context to system prompt
  const enhancedSystemPrompt = systemPrompt 
    ? `${systemPrompt}\n\nContext: You are an AI business coach helping with ${businessContext}. Provide actionable, strategic advice that drives revenue growth and operational efficiency.`
    : `You are an expert AI business coach specializing in ${businessContext}. Provide strategic, actionable advice that helps businesses grow revenue, optimize operations, and make data-driven decisions.`;

  // Generate cache key
  const cacheKey = generateCacheKey(messages, enhancedSystemPrompt);

  // Check cache first
  const cached = await getCachedResponse(cacheKey);
  if (cached) {
    return cached;
  }

  // Get available providers, prioritizing preferred provider
  let providers = AI_PROVIDERS
    .filter(p => p.enabled)
    .sort((a, b) => a.priority - b.priority);

  if (preferredProvider) {
    const preferred = providers.find(p => p.name === preferredProvider);
    if (preferred) {
      providers = [preferred, ...providers.filter(p => p.name !== preferredProvider)];
    }
  }

  let lastError: Error | null = null;
  
  // Try each provider with fallback
  for (const providerConfig of providers) {
    try {
      console.log(`Attempting AI generation with ${providerConfig.name}...`);
      
      const model = getAIModel(providerConfig.name, providerConfig.model);
      
      const result = await generateText({
        model,
        messages: [
          ...(enhancedSystemPrompt ? [{ role: "system" as const, content: enhancedSystemPrompt }] : []),
          ...messages
        ],
        maxTokens: 1500,
        temperature: 0.7,
      });

      const tokens = estimateTokens(result.text);
      const cost = tokens * providerConfig.costPerToken;

      const response: AIResponse = {
        content: result.text,
        provider: providerConfig.name,
        cached: false,
        cost,
        tokens
      };

      // Cache successful response
      await setCachedResponse(cacheKey, response);

      console.log(`AI response generated successfully with ${providerConfig.name} (${tokens} tokens, $${cost.toFixed(6)})`);
      
      return response;

    } catch (error) {
      lastError = error as Error;
      console.warn(`Provider ${providerConfig.name} failed:`, error);
      
      // Continue to next provider
      continue;
    }
  }

  // All providers failed
  throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
}

/**
 * Get AI provider statistics
 */
export async function getAIProviderStats(): Promise<{
  providers: AIProviderConfig[];
  cacheEnabled: boolean;
  totalCostSaved: number;
}> {
  let totalCostSaved = 0;

  // Try to get cache hit statistics (simplified)
  if (CACHE_CONFIG.ENABLED && redis) {
    try {
      const keys = await redis.keys(`${CACHE_CONFIG.KEY_PREFIX}*`);
      // Rough estimation: assume average cost savings of $0.002 per cached response
      totalCostSaved = keys.length * 0.002;
    } catch (error) {
      console.warn("Failed to get cache stats:", error);
    }
  }

  return {
    providers: AI_PROVIDERS,
    cacheEnabled: CACHE_CONFIG.ENABLED,
    totalCostSaved
  };
}

/**
 * Business-specific AI prompts for different use cases
 */
export const BUSINESS_PROMPTS = {
  revenue: "Focus on revenue optimization, pricing strategies, and profit maximization",
  operations: "Emphasize operational efficiency, process optimization, and cost reduction", 
  marketing: "Concentrate on customer acquisition, retention strategies, and brand building",
  strategy: "Provide high-level strategic planning, competitive analysis, and growth planning",
  finance: "Focus on financial planning, cash flow management, and investment decisions"
};

/**
 * Generate business coaching response with context
 */
export async function generateBusinessCoachResponse(
  messages: any[],
  context: keyof typeof BUSINESS_PROMPTS = "strategy"
): Promise<AIResponse> {
  return generateAIResponse(messages, undefined, {
    businessContext: BUSINESS_PROMPTS[context]
  });
}
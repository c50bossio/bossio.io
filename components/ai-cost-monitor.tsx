"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  DollarSign, 
  TrendingDown, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  RotateCcw
} from "lucide-react";
import { useState, useEffect } from "react";

interface AIStats {
  providers: Array<{
    name: string;
    enabled: boolean;
    costPerToken: number;
    priority: number;
  }>;
  cacheEnabled: boolean;
  totalCostSaved: number;
  costSavings: {
    total: number;
    percentage: number;
    monthlyEstimate: number;
  };
  businessMetrics: {
    avgResponseTime: string;
    uptime: string;
    totalQueries: number;
    cacheHitRate: string;
  };
  recommendations: Array<{
    type: string;
    message: string;
  }>;
}

export default function AICostMonitor() {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ai/stats");
      if (!response.ok) throw new Error("Failed to fetch AI stats");
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            AI System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {error || "Unable to load AI statistics"}
          </p>
          <Button variant="outline" size="sm" onClick={fetchStats} className="mt-3">
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cost Savings Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-600" />
              <CardTitle>AI Cost Optimization</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {stats.costSavings.percentage}% Savings
            </Badge>
          </div>
          <CardDescription>
            Multi-provider system with intelligent caching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${stats.costSavings.total.toFixed(3)}
              </div>
              <div className="text-sm text-muted-foreground">Total Saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                ${stats.costSavings.monthlyEstimate.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Monthly Est.</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.businessMetrics.cacheHitRate}
              </div>
              <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Provider Status
          </CardTitle>
          <CardDescription>
            Multi-provider failover system for optimal reliability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.providers.map((provider, index) => (
              <div key={provider.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {provider.enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="font-medium capitalize">{provider.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Priority {provider.priority}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    ${(provider.costPerToken * 1000000).toFixed(3)}/1M
                  </div>
                  <div className="text-xs text-muted-foreground">tokens</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Business Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Response Time</span>
              <span className="font-medium">{stats.businessMetrics.avgResponseTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-medium">{stats.businessMetrics.uptime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Queries</span>
              <span className="font-medium">{stats.businessMetrics.totalQueries.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cache Status</span>
              <Badge variant={stats.cacheEnabled ? "default" : "secondary"}>
                {stats.cacheEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {stats.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{rec.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
"use client"

import { useEffect, useState } from "react"
import { Loader2, Server, RefreshCw, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function MaintenancePage() {
  const [isCheckingHealth, setIsCheckingHealth] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkHealth = async () => {
    setIsCheckingHealth(true)
    console.log('[MaintenancePage] Starting checkHealth...');
    try {
      // Log details about the Supabase session
      const supabaseForHealthCheck = createClient(); // Correct: uses the app's configured client
      let session = null;
      try {
        const { data: sessionData, error: sessionError } = await supabaseForHealthCheck.auth.getSession();
        if (sessionError) {
          console.error('[MaintenancePage] Error getting Supabase session:', sessionError);
        }
        session = sessionData?.session;
        console.log('[MaintenancePage] Supabase session:', session);
      } catch (e) {
        console.error('[MaintenancePage] Exception during getSession:', e);
      }

      console.log(`[MaintenancePage] Fetching: ${process.env.NEXT_PUBLIC_BACKEND_URL}/health`);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('[MaintenancePage] Using Authorization header.');
      } else {
        console.log('[MaintenancePage] Not using Authorization header (no session or token).');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/health`, {
        method: 'GET',
        headers,
      });

      console.log('[MaintenancePage] Health check response status:', response.status);

      if (!response.ok) {
        let errorBody = null;
        try {
          errorBody = await response.json();
        } catch (e) {
          errorBody = await response.text(); // Fallback to text if not JSON
        }
        console.error('[MaintenancePage] API health check !response.ok. Status:', response.status, 'Body:', errorBody);
        throw new Error(`API Health Check Failed: ${response.status} - ${JSON.stringify(errorBody) || response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('[MaintenancePage] API health check successful:', responseData);
      // If we get here, the API is healthy
      window.location.reload()
    } catch (error) {
      console.error('[MaintenancePage] API health check failed in catch block:', error)
    } finally {
      setIsCheckingHealth(false)
      setLastChecked(new Date())
    }
  }

  useEffect(() => {
    checkHealth()
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Server className="h-16 w-16 text-primary animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight">
            System Maintenance
          </h1>
          
          <p className="text-muted-foreground">
            We're currently performing maintenance on our systems. Our team is working to get everything back up and running as soon as possible.
          </p>

          <Alert className="mt-6">
            <AlertTitle>Agent Executions Stopped</AlertTitle>
            <AlertDescription>
              Any running agent executions have been stopped during maintenance. You'll need to manually continue these executions once the system is back online.
            </AlertDescription>
          </Alert>
        </div>

        <div className="space-y-4">
          <Button
            onClick={checkHealth}
            disabled={isCheckingHealth}
            className="w-full"
          >
            <RefreshCw className={cn(
              "mr-2 h-4 w-4",
              isCheckingHealth && "animate-spin"
            )} />
            {isCheckingHealth ? "Checking..." : "Check Again"}
          </Button>

          {lastChecked && (
            <p className="text-sm text-muted-foreground">
              Last checked: {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 
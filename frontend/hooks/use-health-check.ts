"use client"

import { useEffect, useState } from "react"

export function useHealthCheck() {
  const [isHealthy, setIsHealthy] = useState(true)
  const [isChecking, setIsChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
        const response = await fetch(`${backendUrl}/api/health`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) {
          throw new Error(`Health check failed with status ${response.status}`)
        }

        const data = await response.json()
        if (data.status === "ok") {
          setIsHealthy(true)
          setError(null)
          console.log("[v0] Backend health check passed")
        } else {
          throw new Error("Backend returned unexpected status")
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to connect to backend"
        setIsHealthy(false)
        setError(errorMessage)
        console.error("[v0] Health check failed:", errorMessage)
      } finally {
        setIsChecking(false)
      }
    }

    checkHealth()
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return { isHealthy, isChecking, error }
}

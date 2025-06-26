"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, AlertTriangle, X } from "lucide-react"
import TokenAnalysis from "./components/TokenAnalysis"

interface AnalysisResult {
  tokenData: {
    name: string
    symbol: string
    totalSupply: string
    decimals: number
  }
  redFlags: {
    noNameOrSymbol: boolean
    hugeSupply: boolean
    fewTransfers: boolean
    fewHolders: boolean
    recentlyCreated: boolean
  }
  riskScore: number
  riskLevel: "Low" | "Medium" | "High"
  error?: string
}

export default function Home() {
  const [contractAddress, setContractAddress] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState("")

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contractAddress.trim()) {
      setError("Please enter a contract address")
      return
    }

    // Basic Ethereum address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress.trim())) {
      setError("Please enter a valid Ethereum contract address")
      return
    }

    setIsAnalyzing(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/analyze-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contractAddress: contractAddress.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during analysis")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "Low":
        return <Shield className="h-5 w-5 text-green-500" />
      case "Medium":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "High":
        return <X className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Low":
        return "text-green-600 bg-green-50 border-green-200"
      case "Medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "High":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ERC-20 Token Risk Analyzer</h1>
          <p className="text-lg text-gray-600">Analyze Ethereum tokens for common red flags and scam indicators</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Token Analysis</CardTitle>
            <CardDescription>Enter an ERC-20 contract address to analyze for potential risks</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="0x... (Ethereum contract address)"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  className="text-sm font-mono"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={isAnalyzing} className="w-full">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Token...
                  </>
                ) : (
                  "Analyze Token"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Risk Assessment</CardTitle>
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getRiskColor(result.riskLevel)}`}
                  >
                    {getRiskIcon(result.riskLevel)}
                    <span className="font-semibold">{result.riskLevel} Risk</span>
                  </div>
                </div>
                <CardDescription>Risk Score: {result.riskScore}/100</CardDescription>
              </CardHeader>
            </Card>

            <TokenAnalysis result={result} />
          </div>
        )}
      </div>
    </div>
  )
}

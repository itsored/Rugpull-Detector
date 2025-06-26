"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, AlertTriangle, X, Copy, Info } from "lucide-react"
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

// Real example token addresses for testing
const EXAMPLE_TOKENS = [
  {
    name: "USDT",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    description: "Tether USD - Stablecoin",
  },
  {
    name: "USDC",
    address: "0xA0b86a33E6441b8C4505B8C4505B8C4505B8C4505",
    description: "USD Coin - Stablecoin",
  },
  {
    name: "WETH",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    description: "Wrapped Ether",
  },
  {
    name: "LINK",
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    description: "Chainlink Token",
  },
]

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
      setError("Please enter a valid Ethereum contract address (0x followed by 40 hexadecimal characters)")
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
        throw new Error(data.error || `HTTP ${response.status}: Analysis failed`)
      }

      setResult(data)
    } catch (err) {
      console.error("Analysis error:", err)
      let errorMessage = "An error occurred during analysis"

      if (err instanceof Error) {
        errorMessage = err.message
      }

      // Provide helpful suggestions based on error type
      if (errorMessage.includes("404")) {
        errorMessage += "\n\nTip: Make sure the address is a valid ERC-20 token contract on Ethereum mainnet."
      } else if (errorMessage.includes("401") || errorMessage.includes("403")) {
        errorMessage += "\n\nTip: Check if the Tatum API key is properly configured."
      }

      setError(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleExampleClick = (address: string) => {
    setContractAddress(address)
    setError("")
    setResult(null)
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

        {/* API Key Notice */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Setup Required:</strong> This app requires a Tatum API key. Get your free key at{" "}
            <a href="https://tatum.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              tatum.io
            </a>{" "}
            and add it to your environment variables as <code className="bg-gray-100 px-1 rounded">TATUM_API_KEY</code>.
          </AlertDescription>
        </Alert>

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

              {/* Example tokens */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Try these example tokens:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {EXAMPLE_TOKENS.map((token) => (
                    <Button
                      key={token.address}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleExampleClick(token.address)}
                      className="text-xs justify-start"
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">{token.name}</div>
                        <div className="text-gray-500">{token.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
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

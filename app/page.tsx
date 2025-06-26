"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, AlertTriangle, X, Copy, Info, Zap } from "lucide-react"
import ComprehensiveAnalysis from "./components/ComprehensiveAnalysis"

// Real example token addresses for testing
const EXAMPLE_TOKENS = [
  {
    name: "USDT",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    description: "Tether USD - Major Stablecoin",
  },
  {
    name: "LINK",
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    description: "Chainlink Token - Oracle Network",
  },
  {
    name: "UNI",
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    description: "Uniswap Token - DEX Governance",
  },
  {
    name: "WETH",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    description: "Wrapped Ether",
  },
]

export default function Home() {
  const [contractAddress, setContractAddress] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contractAddress.trim()) {
      setError("Please enter a contract address")
      return
    }

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

      if (errorMessage.includes("404")) {
        errorMessage += "\n\nTip: Make sure the address is a valid ERC-20 token contract on Ethereum mainnet."
      } else if (errorMessage.includes("401") || errorMessage.includes("403")) {
        errorMessage += "\n\nTip: Check if the API keys are properly configured."
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
      case "Very Low":
      case "Low":
        return <Shield className="h-5 w-5 text-green-500" />
      case "Medium":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "High":
      case "Very High":
        return <X className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Very Low":
        return "text-green-700 bg-green-100 border-green-300"
      case "Low":
        return "text-green-600 bg-green-50 border-green-200"
      case "Medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "High":
        return "text-red-600 bg-red-50 border-red-200"
      case "Very High":
        return "text-red-700 bg-red-100 border-red-300"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">🔍 Token Risk Analyzer</h1>
          <p className="text-xl text-gray-600 mb-2">Professional-grade security analysis for Ethereum ERC-20 tokens</p>
          <p className="text-sm text-gray-500">Powered by Tatum, CoinGecko, and Etherscan APIs</p>
        </div>

        {/* API Setup Notice */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Multi-API Analysis:</strong> This tool combines blockchain data, market information, and security
            analysis.
            <br />
            <strong>Required:</strong> Tatum API key | <strong>Recommended:</strong> Etherscan API key for enhanced
            security analysis
          </AlertDescription>
        </Alert>

        <Card className="mb-8 border-2 border-indigo-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-600" />
              Token Analysis Dashboard
            </CardTitle>
            <CardDescription>
              Enter an ERC-20 contract address for comprehensive risk assessment including security, market data, and
              holder distribution analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAnalyze} className="space-y-6">
              <div>
                <Input
                  type="text"
                  placeholder="0x... (Ethereum contract address)"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  className="text-sm font-mono h-12 text-lg"
                />
              </div>

              {/* Example tokens */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Try these verified tokens:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {EXAMPLE_TOKENS.map((token) => (
                    <Button
                      key={token.address}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleExampleClick(token.address)}
                      className="text-xs justify-start h-auto p-3 hover:bg-indigo-50 hover:border-indigo-300"
                    >
                      <Copy className="h-3 w-3 mr-2 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium text-sm">{token.name}</div>
                        <div className="text-gray-500 text-xs">{token.description}</div>
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

              <Button type="submit" disabled={isAnalyzing} className="w-full h-12 text-lg">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing Token Security & Market Data...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    Analyze Token
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-6 w-6" />
                    Analysis Results for {result.tokenData.symbol}
                  </CardTitle>
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${getRiskColor(result.riskLevel)}`}
                  >
                    {getRiskIcon(result.riskLevel)}
                    <span className="font-bold text-lg">{result.riskLevel} Risk</span>
                  </div>
                </div>
                <CardDescription className="text-lg">
                  Overall Risk Score: <span className="font-bold">{result.overallRiskScore}/100</span>
                  {result.riskFactors.length > 0 && (
                    <span className="ml-4 text-red-600">
                      {result.riskFactors.length} risk factor{result.riskFactors.length !== 1 ? "s" : ""} identified
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>

            <ComprehensiveAnalysis result={result} />
          </div>
        )}
      </div>
    </div>
  )
}

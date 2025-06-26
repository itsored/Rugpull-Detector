import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle, TrendingUp, Users, CheckCircle, XCircle, Info, Lock, Coins } from "lucide-react"

interface ComprehensiveAnalysisProps {
  result: {
    tokenData: {
      name: string
      symbol: string
      totalSupply: string
      decimals: number
      contractAddress: string
    }
    marketData: {
      price: number
      marketCap: number
      volume24h: number
      priceChange24h: number
      circulatingSupply: number
      totalSupply: number
      maxSupply: number | null
      ath: number
      athChangePercentage: number
      atl: number
      atlChangePercentage: number
    } | null
    securityAnalysis: {
      isVerified: boolean
      hasProxyContract: boolean
      hasMintFunction: boolean
      hasPauseFunction: boolean
      hasBlacklistFunction: boolean
      hasOwnershipRenounced: boolean
      rugPullRisk: number
    }
    holderAnalysis: {
      totalHolders: number
      top10HoldersPercentage: number
      creatorPercentage: number
      distributionScore: number
    }
    riskFactors: Array<{
      category: string
      severity: "low" | "medium" | "high" | "critical"
      description: string
      impact: number
    }>
    overallRiskScore: number
    riskLevel: "Very Low" | "Low" | "Medium" | "High" | "Very High"
    recommendation: string
  }
}

export default function ComprehensiveAnalysis({ result }: ComprehensiveAnalysisProps) {
  const {
    tokenData,
    marketData,
    securityAnalysis,
    holderAnalysis,
    riskFactors,
    overallRiskScore,
    riskLevel,
    recommendation,
  } = result

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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-yellow-100 text-yellow-800"
      case "medium":
        return "bg-orange-100 text-orange-800"
      case "high":
        return "bg-red-100 text-red-800"
      case "critical":
        return "bg-red-200 text-red-900"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const formatSupply = (supply: string, decimals: number) => {
    const num = Number.parseFloat(supply) / Math.pow(10, decimals)
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num.toFixed(2)
  }

  return (
    <div className="space-y-6">
      {/* Overall Risk Assessment */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Assessment
            </CardTitle>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getRiskColor(riskLevel)}`}>
              <span className="font-bold">{riskLevel} Risk</span>
            </div>
          </div>
          <CardDescription>Overall Risk Score: {overallRiskScore}/100</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={overallRiskScore} className="w-full" />
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="font-medium">{recommendation}</AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Token Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Token Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-lg font-semibold">{tokenData.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Symbol</label>
              <p className="text-lg font-semibold">{tokenData.symbol}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Total Supply</label>
              <p className="text-lg font-semibold">{formatSupply(tokenData.totalSupply, tokenData.decimals)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Decimals</label>
              <p className="text-lg font-semibold">{tokenData.decimals}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Data */}
      {marketData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Market Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Price</label>
                <p className="text-lg font-semibold">${marketData.price.toFixed(6)}</p>
                <p className={`text-sm ${marketData.priceChange24h >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {marketData.priceChange24h >= 0 ? "+" : ""}
                  {marketData.priceChange24h.toFixed(2)}% (24h)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Market Cap</label>
                <p className="text-lg font-semibold">{formatNumber(marketData.marketCap)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Volume (24h)</label>
                <p className="text-lg font-semibold">{formatNumber(marketData.volume24h)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Circulating Supply</label>
                <p className="text-lg font-semibold">{marketData.circulatingSupply.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">All-Time High</label>
                <p className="text-lg font-semibold">${marketData.ath.toFixed(6)}</p>
                <p className="text-sm text-red-600">{marketData.athChangePercentage.toFixed(1)}% from ATH</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">All-Time Low</label>
                <p className="text-lg font-semibold">${marketData.atl.toFixed(6)}</p>
                <p className="text-sm text-green-600">+{marketData.atlChangePercentage.toFixed(1)}% from ATL</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="font-medium">Contract Verified</span>
                {securityAnalysis.isVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="font-medium">Mint Function</span>
                {securityAnalysis.hasMintFunction ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="font-medium">Pause Function</span>
                {securityAnalysis.hasPauseFunction ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="font-medium">Blacklist Function</span>
                {securityAnalysis.hasBlacklistFunction ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="font-medium">Proxy Contract</span>
                {securityAnalysis.hasProxyContract ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
              <div className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Rug Pull Risk</span>
                  <span className="text-sm font-medium">{securityAnalysis.rugPullRisk}%</span>
                </div>
                <Progress value={securityAnalysis.rugPullRisk} className="w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holder Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Holder Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Total Holders</label>
              <p className="text-lg font-semibold">{holderAnalysis.totalHolders.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Top 10 Holders</label>
              <p className="text-lg font-semibold">{holderAnalysis.top10HoldersPercentage.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">of total supply</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Creator Holdings</label>
              <p className="text-lg font-semibold">{holderAnalysis.creatorPercentage.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">of total supply</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Distribution Score</label>
              <div className="flex items-center gap-2">
                <Progress value={holderAnalysis.distributionScore} className="flex-1" />
                <span className="text-sm font-medium">{holderAnalysis.distributionScore.toFixed(0)}</span>
              </div>
              <p className="text-xs text-gray-500">Higher = better distribution</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      {riskFactors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Factors ({riskFactors.length})
            </CardTitle>
            <CardDescription>Identified risks and concerns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riskFactors.map((factor, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg border">
                  <Badge className={getSeverityColor(factor.severity)}>{factor.severity.toUpperCase()}</Badge>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{factor.category}</span>
                      <span className="text-sm text-gray-500">Impact: {factor.impact}%</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{factor.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

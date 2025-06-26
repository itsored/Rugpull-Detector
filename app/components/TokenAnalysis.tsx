import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, Coins, Users, Activity, Calendar, FileText } from "lucide-react"

interface TokenAnalysisProps {
  result: {
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
  }
}

export default function TokenAnalysis({ result }: TokenAnalysisProps) {
  const { tokenData, redFlags, riskScore, riskLevel } = result

  const redFlagDetails = [
    {
      key: "noNameOrSymbol",
      title: "Missing Name or Symbol",
      description: "Token lacks proper identification",
      icon: <FileText className="h-4 w-4" />,
      active: redFlags.noNameOrSymbol,
    },
    {
      key: "hugeSupply",
      title: "Excessive Total Supply",
      description: "Unusually large token supply (>1T tokens)",
      icon: <Coins className="h-4 w-4" />,
      active: redFlags.hugeSupply,
    },
    {
      key: "fewTransfers",
      title: "Low Transaction Activity",
      description: "Very few token transfers detected",
      icon: <Activity className="h-4 w-4" />,
      active: redFlags.fewTransfers,
    },
    {
      key: "fewHolders",
      title: "Centralized Holdings",
      description: "Token held by very few addresses",
      icon: <Users className="h-4 w-4" />,
      active: redFlags.fewHolders,
    },
    {
      key: "recentlyCreated",
      title: "Recently Created",
      description: "Contract deployed very recently",
      icon: <Calendar className="h-4 w-4" />,
      active: redFlags.recentlyCreated,
    },
  ]

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
      {/* Token Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Token Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-lg font-semibold">{tokenData.name || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Symbol</label>
              <p className="text-lg font-semibold">{tokenData.symbol || "N/A"}</p>
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

      {/* Red Flags Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Red Flag Analysis
          </CardTitle>
          <CardDescription>Detected risk indicators for this token</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {redFlagDetails.map((flag) => (
              <div
                key={flag.key}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  flag.active ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded ${flag.active ? "text-red-600" : "text-green-600"}`}>{flag.icon}</div>
                  <div>
                    <h4 className="font-medium">{flag.title}</h4>
                    <p className="text-sm text-gray-600">{flag.description}</p>
                  </div>
                </div>
                <div>
                  {flag.active ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Risk Score:</span>
              <Badge variant={riskLevel === "High" ? "destructive" : riskLevel === "Medium" ? "secondary" : "default"}>
                {riskScore}/100
              </Badge>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  riskLevel === "High" ? "bg-red-500" : riskLevel === "Medium" ? "bg-yellow-500" : "bg-green-500"
                }`}
                style={{ width: `${riskScore}%` }}
              />
            </div>

            <div className="text-sm text-gray-600">
              {riskLevel === "Low" && (
                <p>
                  ✅ This token shows relatively few red flags. However, always do your own research before investing.
                </p>
              )}
              {riskLevel === "Medium" && (
                <p>⚠️ This token shows some concerning indicators. Exercise caution and conduct thorough research.</p>
              )}
              {riskLevel === "High" && (
                <p>
                  🚨 This token shows multiple red flags commonly associated with scams or rug pulls. Proceed with
                  extreme caution.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

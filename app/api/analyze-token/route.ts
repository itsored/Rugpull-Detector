import { type NextRequest, NextResponse } from "next/server"

// API configurations
const TATUM_API_KEY = process.env.TATUM_API_KEY || "your-tatum-api-key"
const TATUM_BASE_URL = "https://api.tatum.io/v3"
const COINGECKO_BASE_URL = "https://api.coingecko.co/api/v3"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "YourApiKeyToken"
const ETHERSCAN_BASE_URL = "https://api.etherscan.io/api"

// Add at the top, after imports
const BLUECHIP_WHITELIST = [
  // USDT
  "0xdac17f958d2ee523a2206206994597c13d831ec7",
  // USDC
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  // WETH
  "0xc02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2".toLowerCase(),
  // LINK
  "0x514910771af9ca656af840dff83e8264ecf986ca",
  // Add more as needed
]

function isBluechipToken(address: string): boolean {
  return BLUECHIP_WHITELIST.includes(address.toLowerCase())
}

interface TokenMetadata {
  name: string
  symbol: string
  totalSupply: string
  decimals: number
  contractAddress: string
}

interface MarketData {
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
}

interface SecurityAnalysis {
  isVerified: boolean
  hasProxyContract: boolean
  hasMintFunction: boolean
  hasPauseFunction: boolean
  hasBlacklistFunction: boolean
  hasOwnershipRenounced: boolean
  rugPullRisk: number
}

interface HolderAnalysis {
  totalHolders: number
  top10HoldersPercentage: number
  creatorPercentage: number
  distributionScore: number
}

interface ComprehensiveAnalysis {
  tokenData: TokenMetadata
  marketData: MarketData | null
  securityAnalysis: SecurityAnalysis
  holderAnalysis: HolderAnalysis
  riskFactors: RiskFactor[]
  overallRiskScore: number
  riskLevel: "Very Low" | "Low" | "Medium" | "High" | "Very High"
  recommendation: string
}

interface RiskFactor {
  category: string
  severity: "low" | "medium" | "high" | "critical"
  description: string
  impact: number
}

export async function POST(request: NextRequest) {
  try {
    const { contractAddress } = await request.json()

    if (!contractAddress) {
      return NextResponse.json({ error: "Contract address is required" }, { status: 400 })
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return NextResponse.json({ error: "Invalid Ethereum address format" }, { status: 400 })
    }

    console.log(`Starting analysis for: ${contractAddress}`)

    // If bluechip, return very low risk immediately
    if (isBluechipToken(contractAddress)) {
      const tokenData = await getTokenMetadata(contractAddress)
      const analysis: ComprehensiveAnalysis = {
        tokenData,
        marketData: null,
        securityAnalysis: getDefaultSecurityAnalysis(),
        holderAnalysis: getDefaultHolderAnalysis(),
        riskFactors: [],
        overallRiskScore: 0,
        riskLevel: "Very Low",
        recommendation: "🌟 This is a well-known, established token. No major risks detected.",
      }
      return NextResponse.json(analysis)
    }

    const [tokenData, marketData, securityAnalysis, holderAnalysis] = await Promise.allSettled([
      getTokenMetadata(contractAddress),
      getMarketData(contractAddress),
      performSecurityAnalysis(contractAddress),
      analyzeHolderDistribution(contractAddress),
    ])

    // Only use data if fulfilled
    const resolvedTokenData = tokenData.status === "fulfilled" ? tokenData.value : getDefaultTokenData(contractAddress)
    const resolvedMarketData = marketData.status === "fulfilled" ? marketData.value : null
    const resolvedSecurityAnalysis = securityAnalysis.status === "fulfilled" ? securityAnalysis.value : getDefaultSecurityAnalysis()
    const resolvedHolderAnalysis = holderAnalysis.status === "fulfilled" ? holderAnalysis.value : getDefaultHolderAnalysis()

    // Only include risk factors for present data
    const analysis: ComprehensiveAnalysis = {
      tokenData: resolvedTokenData,
      marketData: resolvedMarketData,
      securityAnalysis: resolvedSecurityAnalysis,
      holderAnalysis: resolvedHolderAnalysis,
      riskFactors: [],
      overallRiskScore: 0,
      riskLevel: "Medium",
      recommendation: "",
    }

    // Only add risk factors for available data
    analysis.riskFactors = identifyRiskFactorsFiltered(analysis)
    analysis.overallRiskScore = calculateOverallRiskScore(analysis.riskFactors)
    analysis.riskLevel = determineRiskLevel(analysis.overallRiskScore)
    analysis.recommendation = generateRecommendation(analysis)

    console.log(`Analysis completed. Risk score: ${analysis.overallRiskScore}`)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Failed to perform token analysis. Please try again." }, { status: 500 })
  }
}

async function getTokenMetadata(contractAddress: string): Promise<TokenMetadata> {
  const [name, symbol, decimals, totalSupply] = await Promise.allSettled([
    callContractMethod(contractAddress, "name", []),
    callContractMethod(contractAddress, "symbol", []),
    callContractMethod(contractAddress, "decimals", []),
    callContractMethod(contractAddress, "totalSupply", []),
  ])

  return {
    name: name.status === "fulfilled" ? name.value || "Unknown" : "Unknown",
    symbol: symbol.status === "fulfilled" ? symbol.value || "UNKNOWN" : "UNKNOWN",
    decimals: decimals.status === "fulfilled" ? Number.parseInt(decimals.value || "18") : 18,
    totalSupply: totalSupply.status === "fulfilled" ? totalSupply.value || "0" : "0",
    contractAddress,
  }
}

async function getMarketData(contractAddress: string): Promise<MarketData | null> {
  try {
    const searchResponse = await fetch(`${COINGECKO_BASE_URL}/coins/ethereum/contract/${contractAddress.toLowerCase()}`)

    if (!searchResponse.ok) {
      console.log("Token not found on CoinGecko")
      return null
    }

    const coinData = await searchResponse.json()

    return {
      price: coinData.market_data?.current_price?.usd || 0,
      marketCap: coinData.market_data?.market_cap?.usd || 0,
      volume24h: coinData.market_data?.total_volume?.usd || 0,
      priceChange24h: coinData.market_data?.price_change_percentage_24h || 0,
      circulatingSupply: coinData.market_data?.circulating_supply || 0,
      totalSupply: coinData.market_data?.total_supply || 0,
      maxSupply: coinData.market_data?.max_supply || null,
      ath: coinData.market_data?.ath?.usd || 0,
      athChangePercentage: coinData.market_data?.ath_change_percentage?.usd || 0,
      atl: coinData.market_data?.atl?.usd || 0,
      atlChangePercentage: coinData.market_data?.atl_change_percentage?.usd || 0,
    }
  } catch (error) {
    console.error("Error fetching market data:", error)
    return null
  }
}

async function performSecurityAnalysis(contractAddress: string): Promise<SecurityAnalysis> {
  const analysis: SecurityAnalysis = {
    isVerified: false,
    hasProxyContract: false,
    hasMintFunction: false,
    hasPauseFunction: false,
    hasBlacklistFunction: false,
    hasOwnershipRenounced: false,
    rugPullRisk: 0,
  }

  try {
    // Check if contract is verified on Etherscan
    const verificationResponse = await fetch(
      `${ETHERSCAN_BASE_URL}?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`,
    )

    if (verificationResponse.ok) {
      const verificationData = await verificationResponse.json()
      const sourceCode = verificationData.result?.[0]?.SourceCode || ""

      analysis.isVerified = sourceCode !== ""

      // Analyze source code for dangerous functions if available
      if (sourceCode) {
        analysis.hasMintFunction = /function\s+mint\s*\(/.test(sourceCode) || /\.mint\s*\(/.test(sourceCode)
        analysis.hasPauseFunction = /function\s+pause\s*\(/.test(sourceCode) || /Pausable/.test(sourceCode)
        analysis.hasBlacklistFunction = /blacklist/i.test(sourceCode) || /function\s+blacklist\s*\(/.test(sourceCode)
        analysis.hasProxyContract = /Proxy/.test(sourceCode) || /upgradeable/i.test(sourceCode)
        analysis.hasOwnershipRenounced = /renounceOwnership/i.test(sourceCode) && /onlyOwner/.test(sourceCode)
      }
    }

    // Calculate rug pull risk based on various factors
    analysis.rugPullRisk = calculateRugPullRisk(analysis)
  } catch (error) {
    console.error("Error in security analysis:", error)
  }

  return analysis
}

async function analyzeHolderDistribution(contractAddress: string): Promise<HolderAnalysis> {
  try {
    // Get top token holders from Etherscan
    const holdersResponse = await fetch(
      `${ETHERSCAN_BASE_URL}?module=token&action=tokenholderlist&contractaddress=${contractAddress}&page=1&offset=100&apikey=${ETHERSCAN_API_KEY}`,
    )

    if (holdersResponse.ok) {
      const holdersData = await holdersResponse.json()

      // Check if the response is successful and has results
      if (holdersData.status === "1" && holdersData.result && Array.isArray(holdersData.result)) {
        const holders = holdersData.result

        if (holders.length > 0) {
          // Calculate total supply from holders data
          const totalSupplyFromHolders = holders.reduce(
            (sum: number, holder: any) => sum + Number.parseFloat(holder.TokenHolderQuantity || "0"),
            0,
          )

          const top10Supply = holders
            .slice(0, 10)
            .reduce((sum: number, holder: any) => sum + Number.parseFloat(holder.TokenHolderQuantity || "0"), 0)

          const creatorBalance = Number.parseFloat(holders[0]?.TokenHolderQuantity || "0")

          return {
            totalHolders: holders.length,
            top10HoldersPercentage: totalSupplyFromHolders > 0 ? (top10Supply / totalSupplyFromHolders) * 100 : 100,
            creatorPercentage: totalSupplyFromHolders > 0 ? (creatorBalance / totalSupplyFromHolders) * 100 : 100,
            distributionScore: calculateDistributionScore(holders, totalSupplyFromHolders),
          }
        }
      } else {
        console.log("Etherscan API response:", holdersData)
        console.log("No holder data available or API limit reached")
      }
    } else {
      console.log("Failed to fetch holder data from Etherscan")
    }
  } catch (error) {
    console.error("Error analyzing holder distribution:", error)
  }

  return getDefaultHolderAnalysis()
}

// Add a new function to only add risk factors for present data
function identifyRiskFactorsFiltered(analysis: ComprehensiveAnalysis): RiskFactor[] {
  const riskFactors: RiskFactor[] = []

  // Security-related risks
  if (analysis.securityAnalysis && analysis.securityAnalysis.isVerified === false) {
    riskFactors.push({
      category: "Security",
      severity: "high",
      description: "Contract source code is not verified on Etherscan",
      impact: 25,
    })
  }
  if (analysis.securityAnalysis && analysis.securityAnalysis.hasMintFunction) {
    riskFactors.push({
      category: "Security",
      severity: "medium",
      description: "Contract has mint function - supply can be increased",
      impact: 15,
    })
  }
  if (analysis.securityAnalysis && analysis.securityAnalysis.hasBlacklistFunction) {
    riskFactors.push({
      category: "Security",
      severity: "high",
      description: "Contract can blacklist addresses from trading",
      impact: 25,
    })
  }
  if (analysis.securityAnalysis && analysis.securityAnalysis.hasPauseFunction) {
    riskFactors.push({
      category: "Security",
      severity: "medium",
      description: "Contract can be paused, stopping all transfers",
      impact: 15,
    })
  }
  if (analysis.securityAnalysis && analysis.securityAnalysis.hasProxyContract) {
    riskFactors.push({
      category: "Security",
      severity: "medium",
      description: "Proxy contract - logic can be upgraded",
      impact: 20,
    })
  }

  // Market-related risks (only if marketData is present)
  if (analysis.marketData) {
    if (typeof analysis.marketData.volume24h === "number" && analysis.marketData.volume24h < 10000) {
      riskFactors.push({
        category: "Market",
        severity: "medium",
        description: "Very low trading volume (< $10,000 daily)",
        impact: 15,
      })
    }
    if (typeof analysis.marketData.marketCap === "number" && analysis.marketData.marketCap < 100000) {
      riskFactors.push({
        category: "Market",
        severity: "medium",
        description: "Very low market cap (< $100,000)",
        impact: 10,
      })
    }
    if (typeof analysis.marketData.priceChange24h === "number" && analysis.marketData.priceChange24h < -50) {
      riskFactors.push({
        category: "Market",
        severity: "high",
        description: "Severe price drop (>50%) in last 24 hours",
        impact: 20,
      })
    }
  }

  // Holder distribution risks (only if holderAnalysis is present and not default)
  if (analysis.holderAnalysis && analysis.holderAnalysis.totalHolders > 0) {
    if (typeof analysis.holderAnalysis.top10HoldersPercentage === "number" && analysis.holderAnalysis.top10HoldersPercentage > 80) {
      riskFactors.push({
        category: "Distribution",
        severity: "high",
        description: "Top 10 holders control more than 80% of supply",
        impact: 25,
      })
    }
    if (typeof analysis.holderAnalysis.creatorPercentage === "number" && analysis.holderAnalysis.creatorPercentage > 50) {
      riskFactors.push({
        category: "Distribution",
        severity: "critical",
        description: "Creator/deployer holds more than 50% of total supply",
        impact: 30,
      })
    }
    if (typeof analysis.holderAnalysis.totalHolders === "number" && analysis.holderAnalysis.totalHolders < 100) {
      riskFactors.push({
        category: "Distribution",
        severity: "medium",
        description: "Very few token holders (< 100)",
        impact: 10,
      })
    }
  }

  // Token metadata risks
  if (analysis.tokenData && (analysis.tokenData.name === "Unknown" || analysis.tokenData.symbol === "UNKNOWN")) {
    riskFactors.push({
      category: "Metadata",
      severity: "medium",
      description: "Missing or invalid token name/symbol",
      impact: 10,
    })
  }

  // Check for excessive supply
  try {
    if (analysis.tokenData && analysis.tokenData.totalSupply && analysis.tokenData.decimals) {
      const supply = Number.parseFloat(analysis.tokenData.totalSupply) / Math.pow(10, analysis.tokenData.decimals)
      if (supply > 1e12) {
        riskFactors.push({
          category: "Tokenomics",
          severity: "medium",
          description: "Extremely large total supply (>1 trillion tokens)",
          impact: 15,
        })
      }
    }
  } catch (error) {
    // Ignore supply calculation errors
  }

  return riskFactors
}

function calculateOverallRiskScore(riskFactors: RiskFactor[]): number {
  const totalImpact = riskFactors.reduce((sum, factor) => sum + factor.impact, 0)
  return Math.min(totalImpact, 100)
}

function determineRiskLevel(score: number): "Very Low" | "Low" | "Medium" | "High" | "Very High" {
  if (score <= 10) return "Very Low"
  if (score <= 25) return "Low"
  if (score <= 50) return "Medium"
  if (score <= 75) return "High"
  return "Very High"
}

function generateRecommendation(analysis: ComprehensiveAnalysis): string {
  const { riskLevel, riskFactors } = analysis
  const criticalRisks = riskFactors.filter((f) => f.severity === "critical")
  const highRisks = riskFactors.filter((f) => f.severity === "high")

  if (criticalRisks.length > 0) {
    return "❌ AVOID: This token has critical security issues. Do not invest."
  }

  if (riskLevel === "Very High" || highRisks.length >= 3) {
    return "🚨 HIGH RISK: This token has multiple serious red flags. Extreme caution advised."
  }

  if (riskLevel === "High") {
    return "⚠️ CAUTION: This token has significant risks. Only invest what you can afford to lose."
  }

  if (riskLevel === "Medium") {
    return "📊 MODERATE: This token has some risks but may be acceptable for experienced investors."
  }

  if (riskLevel === "Low") {
    return "✅ LOW RISK: This token appears relatively safe but always DYOR."
  }

  return "🌟 VERY LOW RISK: This token shows good fundamentals and security practices."
}

// Helper functions
async function callContractMethod(contractAddress: string, methodName: string, params: any[]): Promise<string | null> {
  const methodABIs: Record<string, any> = {
    name: {
      inputs: [],
      name: "name",
      outputs: [{ name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    symbol: {
      inputs: [],
      name: "symbol",
      outputs: [{ name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    decimals: {
      inputs: [],
      name: "decimals",
      outputs: [{ name: "", type: "uint8" }],
      stateMutability: "view",
      type: "function",
    },
    totalSupply: {
      inputs: [],
      name: "totalSupply",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  }

  try {
    const response = await fetch(`${TATUM_BASE_URL}/ethereum/smartcontract`, {
      method: "POST",
      headers: {
        "x-api-key": TATUM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contractAddress,
        methodName,
        methodABI: methodABIs[methodName],
        params,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      return result?.data || result?.[0] || result?.value || result?.toString() || null
    }
  } catch (error) {
    console.error(`Error calling ${methodName}:`, error)
  }

  return null
}

function calculateRugPullRisk(security: SecurityAnalysis): number {
  let risk = 0
  if (!security.isVerified) risk += 25
  if (security.hasMintFunction) risk += 15
  if (security.hasBlacklistFunction) risk += 25
  if (security.hasPauseFunction) risk += 10
  if (security.hasProxyContract) risk += 15
  if (!security.hasOwnershipRenounced) risk += 10
  return Math.min(risk, 100)
}

function calculateDistributionScore(holders: any[], totalSupply: number): number {
  if (!Array.isArray(holders) || holders.length === 0 || totalSupply === 0) return 0

  try {
    // Calculate Gini coefficient for distribution
    const sortedHoldings = holders
      .map((h) => Number.parseFloat(h.TokenHolderQuantity || "0"))
      .filter((amount) => !isNaN(amount) && amount > 0)
      .sort((a, b) => a - b)

    if (sortedHoldings.length === 0) return 0

    let sum = 0
    let weightedSum = 0

    for (let i = 0; i < sortedHoldings.length; i++) {
      sum += sortedHoldings[i]
      weightedSum += (i + 1) * sortedHoldings[i]
    }

    if (sum === 0) return 0

    const gini = (2 * weightedSum) / (sortedHoldings.length * sum) - (sortedHoldings.length + 1) / sortedHoldings.length

    // Convert Gini to distribution score (0 = worst distribution, 100 = perfect distribution)
    return Math.max(0, Math.min(100, (1 - gini) * 100))
  } catch (error) {
    console.error("Error calculating distribution score:", error)
    return 0
  }
}

// Default data functions
function getDefaultTokenData(contractAddress: string): TokenMetadata {
  return {
    name: "Unknown Token",
    symbol: "UNKNOWN",
    totalSupply: "0",
    decimals: 18,
    contractAddress,
  }
}

function getDefaultSecurityAnalysis(): SecurityAnalysis {
  return {
    isVerified: false,
    hasProxyContract: false,
    hasMintFunction: false,
    hasPauseFunction: false,
    hasBlacklistFunction: false,
    hasOwnershipRenounced: false,
    rugPullRisk: 50,
  }
}

function getDefaultHolderAnalysis(): HolderAnalysis {
  return {
    totalHolders: 0,
    top10HoldersPercentage: 100,
    creatorPercentage: 100,
    distributionScore: 0,
  }
}

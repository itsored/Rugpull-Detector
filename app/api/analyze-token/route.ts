import { type NextRequest, NextResponse } from "next/server"

// Tatum API configuration
const TATUM_API_KEY = process.env.TATUM_API_KEY || "your-tatum-api-key"
const TATUM_BASE_URL = "https://api.tatum.io/v3"

interface TokenMetadata {
  name: string
  symbol: string
  totalSupply: string
  decimals: number
}

interface RedFlags {
  noNameOrSymbol: boolean
  hugeSupply: boolean
  fewTransfers: boolean
  fewHolders: boolean
  recentlyCreated: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { contractAddress } = await request.json()

    if (!contractAddress) {
      return NextResponse.json({ error: "Contract address is required" }, { status: 400 })
    }

    // Get token metadata
    const tokenData = await getTokenMetadata(contractAddress)

    // Analyze for red flags
    const redFlags = await analyzeRedFlags(contractAddress, tokenData)

    // Calculate risk score
    const riskScore = calculateRiskScore(redFlags)
    const riskLevel = getRiskLevel(riskScore)

    return NextResponse.json({
      tokenData,
      redFlags,
      riskScore,
      riskLevel,
    })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json(
      { error: "Failed to analyze token. Please check the contract address and try again." },
      { status: 500 },
    )
  }
}

async function getTokenMetadata(contractAddress: string): Promise<TokenMetadata> {
  const response = await fetch(`${TATUM_BASE_URL}/blockchain/token/metadata/ETH/${contractAddress}`, {
    headers: {
      "x-api-key": TATUM_API_KEY,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch token metadata")
  }

  const data = await response.json()

  return {
    name: data.name || "",
    symbol: data.symbol || "",
    totalSupply: data.totalSupply || "0",
    decimals: data.decimals || 18,
  }
}

async function analyzeRedFlags(contractAddress: string, tokenData: TokenMetadata): Promise<RedFlags> {
  const redFlags: RedFlags = {
    noNameOrSymbol: false,
    hugeSupply: false,
    fewTransfers: false,
    fewHolders: false,
    recentlyCreated: false,
  }

  // Check for missing name or symbol
  redFlags.noNameOrSymbol =
    !tokenData.name || !tokenData.symbol || tokenData.name.trim() === "" || tokenData.symbol.trim() === ""

  // Check for huge supply (>1 trillion tokens)
  const supply = Number.parseFloat(tokenData.totalSupply) / Math.pow(10, tokenData.decimals)
  redFlags.hugeSupply = supply > 1e12

  // Check transaction activity (simplified - in real implementation you'd check recent transactions)
  try {
    const transactionResponse = await fetch(
      `${TATUM_BASE_URL}/ethereum/transaction/erc20?address=${contractAddress}&pageSize=10`,
      {
        headers: {
          "x-api-key": TATUM_API_KEY,
        },
      },
    )

    if (transactionResponse.ok) {
      const transactions = await transactionResponse.json()
      redFlags.fewTransfers = !transactions || transactions.length < 5
    }
  } catch (error) {
    console.warn("Could not fetch transaction data:", error)
    // Default to true if we can't fetch data
    redFlags.fewTransfers = true
  }

  // Check for few holders (simplified analysis)
  try {
    // This is a simplified check - in a real implementation you'd need to analyze
    // multiple addresses and their balances
    const balanceResponse = await fetch(
      `${TATUM_BASE_URL}/ethereum/erc20/balance/${contractAddress}/${contractAddress}`,
      {
        headers: {
          "x-api-key": TATUM_API_KEY,
        },
      },
    )

    // This is a placeholder - real implementation would require more sophisticated analysis
    redFlags.fewHolders = false
  } catch (error) {
    console.warn("Could not analyze holder distribution:", error)
    redFlags.fewHolders = true
  }

  // Check if recently created (simplified - would need block timestamp analysis)
  // For now, we'll use a heuristic based on transaction history
  redFlags.recentlyCreated = redFlags.fewTransfers

  return redFlags
}

function calculateRiskScore(redFlags: RedFlags): number {
  let score = 0

  // Each red flag contributes to the risk score
  if (redFlags.noNameOrSymbol) score += 25
  if (redFlags.hugeSupply) score += 20
  if (redFlags.fewTransfers) score += 20
  if (redFlags.fewHolders) score += 20
  if (redFlags.recentlyCreated) score += 15

  return Math.min(score, 100) // Cap at 100
}

function getRiskLevel(score: number): "Low" | "Medium" | "High" {
  if (score <= 30) return "Low"
  if (score <= 70) return "Medium"
  return "High"
}

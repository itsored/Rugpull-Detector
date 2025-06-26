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

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return NextResponse.json({ error: "Invalid Ethereum address format" }, { status: 400 })
    }

    // Get token metadata using Tatum's smart contract invocation
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

    // More specific error messages
    if (error instanceof Error) {
      if (error.message.includes("404")) {
        return NextResponse.json(
          { error: "Token contract not found or not a valid ERC-20 token. Please verify the contract address." },
          { status: 404 },
        )
      }
      if (error.message.includes("401") || error.message.includes("403")) {
        return NextResponse.json(
          { error: "API authentication failed. Please check your Tatum API key configuration." },
          { status: 401 },
        )
      }
      if (error.message.includes("429")) {
        return NextResponse.json({ error: "Rate limit exceeded. Please try again in a moment." }, { status: 429 })
      }
    }

    return NextResponse.json(
      {
        error:
          "Failed to analyze token. The contract may not be a standard ERC-20 token or there may be a network issue.",
      },
      { status: 500 },
    )
  }
}

async function getTokenMetadata(contractAddress: string): Promise<TokenMetadata> {
  console.log(`Analyzing token: ${contractAddress}`)

  // Use Tatum's smart contract invocation to call ERC-20 methods
  const tokenData: Partial<TokenMetadata> = {}

  try {
    // Get token name
    const nameResult = await callContractMethod(contractAddress, "name", [])
    tokenData.name = nameResult || "Unknown Token"
  } catch (error) {
    console.warn("Failed to get token name:", error)
    tokenData.name = "Unknown Token"
  }

  try {
    // Get token symbol
    const symbolResult = await callContractMethod(contractAddress, "symbol", [])
    tokenData.symbol = symbolResult || "UNKNOWN"
  } catch (error) {
    console.warn("Failed to get token symbol:", error)
    tokenData.symbol = "UNKNOWN"
  }

  try {
    // Get token decimals
    const decimalsResult = await callContractMethod(contractAddress, "decimals", [])
    tokenData.decimals = decimalsResult ? Number.parseInt(decimalsResult) : 18
  } catch (error) {
    console.warn("Failed to get token decimals:", error)
    tokenData.decimals = 18
  }

  try {
    // Get total supply
    const totalSupplyResult = await callContractMethod(contractAddress, "totalSupply", [])
    tokenData.totalSupply = totalSupplyResult || "0"
  } catch (error) {
    console.warn("Failed to get token total supply:", error)
    tokenData.totalSupply = "0"
  }

  return {
    name: tokenData.name || "Unknown Token",
    symbol: tokenData.symbol || "UNKNOWN",
    totalSupply: tokenData.totalSupply || "0",
    decimals: tokenData.decimals || 18,
  }
}

async function callContractMethod(contractAddress: string, methodName: string, params: any[]): Promise<string | null> {
  // Standard ERC-20 ABI for common methods
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

  const methodABI = methodABIs[methodName]
  if (!methodABI) {
    throw new Error(`Unknown method: ${methodName}`)
  }

  try {
    const response = await fetch(`${TATUM_BASE_URL}/ethereum/smartcontract`, {
      method: "POST",
      headers: {
        "x-api-key": TATUM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contractAddress: contractAddress,
        methodName: methodName,
        methodABI: methodABI,
        params: params,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Smart contract call failed for ${methodName}:`, response.status, errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log(`${methodName} result:`, result)

    // Handle different response formats
    if (result && typeof result === "object") {
      // If result has a data property
      if (result.data !== undefined) {
        return result.data
      }
      // If result is an array, take the first element
      if (Array.isArray(result) && result.length > 0) {
        return result[0]
      }
      // If result has a value property
      if (result.value !== undefined) {
        return result.value
      }
    }

    // If result is a string or number, return it directly
    if (typeof result === "string" || typeof result === "number") {
      return result.toString()
    }

    return null
  } catch (error) {
    console.error(`Error calling ${methodName}:`, error)
    throw error
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
    !tokenData.name ||
    !tokenData.symbol ||
    tokenData.name.trim() === "" ||
    tokenData.symbol.trim() === "" ||
    tokenData.name === "Unknown Token" ||
    tokenData.symbol === "UNKNOWN"

  // Check for huge supply (>1 trillion tokens)
  try {
    const supply = Number.parseFloat(tokenData.totalSupply) / Math.pow(10, tokenData.decimals)
    redFlags.hugeSupply = supply > 1e12
  } catch (error) {
    console.warn("Could not parse total supply:", error)
    redFlags.hugeSupply = false
  }

  // Check transaction activity using Tatum's transaction history endpoint
  try {
    const transactionResponse = await fetch(
      `${TATUM_BASE_URL}/ethereum/transaction/address/${contractAddress}?pageSize=10`,
      {
        headers: {
          "x-api-key": TATUM_API_KEY,
        },
      },
    )

    if (transactionResponse.ok) {
      const transactions = await transactionResponse.json()
      redFlags.fewTransfers = !transactions || !Array.isArray(transactions) || transactions.length < 5
    } else {
      console.warn("Could not fetch transaction data, defaulting to few transfers")
      redFlags.fewTransfers = true
    }
  } catch (error) {
    console.warn("Could not fetch transaction data:", error)
    redFlags.fewTransfers = true
  }

  // Check for centralized holdings by getting the balance of the contract creator
  try {
    const balanceResponse = await fetch(`${TATUM_BASE_URL}/ethereum/account/balance/${contractAddress}`, {
      headers: {
        "x-api-key": TATUM_API_KEY,
      },
    })

    if (balanceResponse.ok) {
      const balanceData = await balanceResponse.json()
      // This is a simplified check - in reality, you'd need to analyze multiple addresses
      redFlags.fewHolders = false
    } else {
      redFlags.fewHolders = true
    }
  } catch (error) {
    console.warn("Could not analyze holder distribution:", error)
    redFlags.fewHolders = true
  }

  // Simplified age check - based on transaction history
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

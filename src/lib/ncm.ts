/**
 * Nepal Can Move (NCM) API Service Integration
 */

export interface NcmCreateOrderParams {
  name: string;
  phone: string;
  phone2?: string;
  cod_charge: string | number;
  address: string;
  fbranch?: string; // Pickup branch, default TINKUNE
  branch: string; // Destination branch
  package?: string;
  vref_id?: string;
  instruction?: string;
  delivery_type?: "Door2Door" | "Branch2Door" | "Door2Branch" | "Branch2Branch";
  weight?: string | number;
}

export interface NcmOrderResponse {
  success: boolean;
  Message?: string;
  orderid?: number | string;
  Error?: any;
  error?: string;
  rawResponse?: any;
}

export interface NcmSettings {
  apiToken: string;
  baseUrl: string;
  defaultPickupBranch: string;
}

// In-memory or default NCM Settings
export let ncmConfig: NcmSettings = {
  apiToken: process.env.NCM_API_TOKEN || "0c593255a1805c938fd006ab01db5465fa680d8c",
  baseUrl: process.env.NCM_BASE_URL || "https://demo.nepalcanmove.com",
  defaultPickupBranch: process.env.NCM_PICKUP_BRANCH || "TINKUNE",
};

export function updateNcmConfig(newConfig: Partial<NcmSettings>) {
  ncmConfig = { ...ncmConfig, ...newConfig };
  return ncmConfig;
}

// Popular Nepal Can Move Branches list fallback
export const POPULAR_NCM_BRANCHES = [
  "KATHMANDU",
  "TINKUNE",
  "POKHARA",
  "BIRATNAGAR",
  "BUTWAL",
  "BHARATPUR",
  "LALITPUR",
  "BHAKTAPUR",
  "DHARAN",
  "DANG",
  "NEPALGUNJ",
  "JANAKPUR",
  "ITAHARI",
  "BIRGUNJ",
  "HETAUDA",
  "PALPA",
  "BIRTAMODE",
  "SURKHET",
  "DHANGADHI",
  "BANEPA",
  "GORKHA",
  "DAMAK",
  "SYANGJA",
  "KAWASOTI",
];

/**
 * Fetch branches from Nepal Can Move API
 */
export async function fetchNcmBranches(token?: string, baseUrl?: string): Promise<string[]> {
  const activeToken = token || ncmConfig.apiToken;
  const activeBaseUrl = baseUrl || ncmConfig.baseUrl;

  if (!activeToken) {
    return POPULAR_NCM_BRANCHES;
  }

  try {
    const res = await fetch(`${activeBaseUrl}/api/v2/branches`, {
      method: "GET",
      headers: {
        Authorization: `Token ${activeToken}`,
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      // Try assigned branches endpoint
      const resAssigned = await fetch(`${activeBaseUrl}/api/v2/vendor/assigned-branches`, {
        method: "GET",
        headers: {
          Authorization: `Token ${activeToken}`,
        },
      });

      if (resAssigned.ok) {
        const data = await resAssigned.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }

      return POPULAR_NCM_BRANCHES;
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      // Map branch objects or strings
      return data.map((b: any) => (typeof b === "string" ? b : b.name || b.branch_name || b)).filter(Boolean);
    }

    return POPULAR_NCM_BRANCHES;
  } catch (error) {
    console.warn("Failed to fetch NCM branches, returning defaults:", error);
    return POPULAR_NCM_BRANCHES;
  }
}

/**
 * Create Order in Nepal Can Move portal
 */
export async function createNcmOrder(
  params: NcmCreateOrderParams,
  token?: string,
  baseUrl?: string
): Promise<NcmOrderResponse> {
  const activeToken = token || ncmConfig.apiToken;
  const activeBaseUrl = baseUrl || ncmConfig.baseUrl;

  if (!activeToken) {
    return {
      success: false,
      error: "NCM API token is not configured. Please set API token in Settings.",
    };
  }

  const payload = {
    name: params.name,
    phone: params.phone,
    phone2: params.phone2 || "",
    cod_charge: String(params.cod_charge),
    address: params.address,
    fbranch: params.fbranch || ncmConfig.defaultPickupBranch || "TINKUNE",
    branch: params.branch,
    package: params.package || "EazyBox Hardware Order",
    vref_id: params.vref_id || "",
    instruction: params.instruction || "",
    delivery_type: params.delivery_type || "Door2Door",
    weight: String(params.weight || "1"),
  };

  try {
    const res = await fetch(`${activeBaseUrl}/api/v1/order/create`, {
      method: "POST",
      headers: {
        Authorization: `Token ${activeToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && data.orderid) {
      return {
        success: true,
        Message: data.Message || "Order Successfully Created",
        orderid: data.orderid,
        rawResponse: data,
      };
    } else if (res.ok && data.Message) {
      return {
        success: true,
        Message: data.Message,
        orderid: data.orderid || data.id,
        rawResponse: data,
      };
    } else {
      const errDetail =
        data.Error
          ? Object.entries(data.Error)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
          : data.detail || data.message || "Failed to create NCM order";

      return {
        success: false,
        error: errDetail,
        rawResponse: data,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network error while connecting to NCM API",
    };
  }
}

/**
 * Fetch NCM Order Status
 */
export async function getNcmOrderStatus(orderId: number | string, token?: string, baseUrl?: string) {
  const activeToken = token || ncmConfig.apiToken;
  const activeBaseUrl = baseUrl || ncmConfig.baseUrl;

  try {
    const res = await fetch(`${activeBaseUrl}/api/v1/order/status?id=${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Token ${activeToken}`,
      },
    });

    if (!res.ok) {
      return { success: false, error: "Failed to fetch order status" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch NCM Order Details
 */
export async function getNcmOrderDetails(orderId: number | string, token?: string, baseUrl?: string) {
  const activeToken = token || ncmConfig.apiToken;
  const activeBaseUrl = baseUrl || ncmConfig.baseUrl;

  try {
    const res = await fetch(`${activeBaseUrl}/api/v1/order?id=${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Token ${activeToken}`,
      },
    });

    if (!res.ok) {
      return { success: false, error: "Failed to fetch order details" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

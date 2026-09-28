/**
 * Centralized Nepal Can Move (NCM) Vendor Service Client
 * Implements exact endpoints, headers, data structures and rules as specified in the NCM API Specification.
 */

export interface NcmSettings {
  apiToken: string;
  baseUrl: string;
  defaultPickupBranch: string;
}

export let ncmConfig: NcmSettings = {
  apiToken: process.env.NCM_API_TOKEN || "a3dede0dcfb45e2af76ced9f7a74909aac9d0a45",
  baseUrl: process.env.NCM_API_BASE_URL || "https://demo.nepalcanmove.com",
  defaultPickupBranch: process.env.NCM_PICKUP_BRANCH || "TINKUNE",
};

export function updateNcmConfig(newConfig: Partial<NcmSettings>) {
  ncmConfig = { ...ncmConfig, ...newConfig };
  return ncmConfig;
}

export const POPULAR_NCM_BRANCHES = [
  "KATHMANDU",
  "TINKUNE",
  "LALITPUR",
  "BHAKTAPUR",
  "POKHARA",
  "BIRATNAGAR",
  "BUTWAL",
  "BHARATPUR",
  "BHAIRAHAWA",
  "NEPALGUNJ",
  "DHARAN",
  "ITAHARI",
  "BIRTAMODE",
  "DAMAK",
  "JANAKPUR",
  "BIRGUNJ",
  "HETAUDA",
  "SURKHET",
  "DHANGADHI",
  "DANG",
  "TULSIPUR",
  "PALPA",
  "BANEPA",
  "DHULIKHEL",
  "GORKHA",
  "DAMAULI",
  "SYANGJA",
  "BAGLUNG",
  "BENI",
  "BESISAHAR",
  "KAWASOTI",
  "GAIDAKOT",
  "GAIGHAT",
  "LAHAN",
  "RAJBIRAJ",
  "KALAIYA",
  "MALANGWA",
  "JALESHWAR",
  "LALBANDI",
  "GAUR",
  "CHANDRAPUR",
  "INARUWA",
  "DHANKUTA",
  "ILAM",
  "BHADRAPUR",
  "KAKARBHITTA",
  "PATHARI",
  "URLABARI",
  "GULMI",
  "ARGHAKHANCHI",
  "BARDIYA",
  "KAPILVASTU",
  "SUNWAL",
  "KOHALPUR",
  "MAHENDRANAGAR",
  "DADELDHURA",
  "DIPAYAL",
  "TIKAPUR",
  "ATTARIYA",
  "DAILEKH",
  "JUMLA",
  "SALYAN",
  "KIRTIPUR",
  "THIMI",
  "KALANKI",
  "CHABAHIL",
  "GONGABU",
  "KAPAN",
  "BALAJU",
  "JORPATI",
  "SATDOBATO",
  "BUDHANILKANTHA",
];

// Helper to make standardized NCM API requests
async function ncmFetch(endpoint: string, options: RequestInit = {}) {
  const token = ncmConfig.apiToken;
  const baseUrl = ncmConfig.baseUrl.replace(/\/$/, "");

  const headers: Record<string, string> = {
    Authorization: `Token ${token}`,
    ...(options.headers as Record<string, string>),
  };

  if (options.body && typeof options.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const responseText = await res.text();
    let data: any = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { raw: responseText };
    }

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: data.Error
          ? typeof data.Error === "object"
            ? Object.entries(data.Error)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")
            : String(data.Error)
          : data.detail || data.message || `HTTP ${res.status}: ${res.statusText}`,
        data,
      };
    }

    return {
      success: true,
      status: res.status,
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 500,
      error: err.message || "Network error connecting to Nepal Can Move API",
      data: null,
    };
  }
}

export class NCMClient {
  /**
   * 1. GET BRANCH LIST (/api/v2/branches)
   */
  static async getBranches() {
    const res = await ncmFetch("/api/v2/branches");
    if (res.success && Array.isArray(res.data)) {
      return { success: true, branches: res.data };
    }
    // Try fallback to assigned branches or default list
    const assignedRes = await NCMClient.getAssignedBranches();
    if (assignedRes.success && Array.isArray(assignedRes.branches) && assignedRes.branches.length > 0) {
      return { success: true, branches: assignedRes.branches };
    }
    return { success: true, branches: POPULAR_NCM_BRANCHES };
  }

  /**
   * 2. GET SHIPPING / DELIVERY CHARGE (/api/v1/shipping-rate)
   */
  static async getShippingRate(
    creation: string,
    destination: string,
    type: "Pickup/Collect" | "Send" | "D2B" | "B2B" = "Pickup/Collect"
  ) {
    const query = new URLSearchParams({
      creation,
      destination,
      type,
    }).toString();
    return ncmFetch(`/api/v1/shipping-rate?${query}`);
  }

  /**
   * 3. GET SINGLE ORDER DETAILS (/api/v1/order?id=ORDERID)
   */
  static async getOrder(orderId: number | string) {
    if (!orderId) return { success: false, error: "ID parameter missing" };
    return ncmFetch(`/api/v1/order?id=${orderId}`);
  }

  /**
   * 4. GET ORDER COMMENTS (/api/v1/order/comment?id=ORDERID)
   */
  static async getOrderComments(orderId: number | string) {
    if (!orderId) return { success: false, error: "ID parameter missing" };
    return ncmFetch(`/api/v1/order/comment?id=${orderId}`);
  }

  /**
   * 5. GET LAST 25 ORDER COMMENTS (/api/v1/order/getbulkcomments)
   */
  static async getLast25Comments() {
    return ncmFetch("/api/v1/order/getbulkcomments");
  }

  /**
   * 6. GET ORDER STATUS HISTORY (/api/v1/order/status?id=ORDERID)
   */
  static async getOrderStatus(orderId: number | string) {
    if (!orderId) return { success: false, error: "ID parameter missing" };
    return ncmFetch(`/api/v1/order/status?id=${orderId}`);
  }

  /**
   * 8. CREATE ORDER (/api/v1/order/create)
   */
  static async createOrder(params: {
    name: string;
    phone: string;
    phone2?: string;
    cod_charge: string | number;
    address: string;
    fbranch: string;
    branch: string;
    package?: string;
    vref_id?: string;
    instruction?: string;
    delivery_type?: "Door2Door" | "Branch2Door" | "Door2Branch" | "Branch2Branch";
    weight?: string | number;
  }) {
    const payload = {
      name: params.name,
      phone: params.phone,
      phone2: params.phone2 || "",
      cod_charge: String(params.cod_charge),
      address: params.address,
      fbranch: params.fbranch || ncmConfig.defaultPickupBranch || "TINKUNE",
      branch: params.branch,
      package: params.package || "General Goods",
      vref_id: params.vref_id || "",
      instruction: params.instruction || "",
      delivery_type: params.delivery_type || "Door2Door",
      weight: String(params.weight || "1"),
    };

    return ncmFetch("/api/v1/order/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * 9. CREATE ORDER COMMENT (/api/v1/comment)
   */
  static async createComment(orderid: number | string, comments: string) {
    return ncmFetch("/api/v1/comment", {
      method: "POST",
      body: JSON.stringify({
        orderid: String(orderid),
        comments,
      }),
    });
  }

  /**
   * 10. BULK ORDER STATUS (/api/v1/orders/statuses)
   */
  static async getBulkOrderStatuses(orders: (number | string)[]) {
    const numericIds = orders.map((id) => Number(id)).filter((id) => !isNaN(id));
    return ncmFetch("/api/v1/orders/statuses", {
      method: "POST",
      body: JSON.stringify({ orders: numericIds }),
    });
  }

  /**
   * 11. CREATE GENERIC VENDOR TICKET (/api/v2/vendor/ticket/create/new)
   */
  static async createVendorTicket(params: {
    ticket_type: "General" | "Order Processing" | "Return" | "Pickup";
    message: string;
    branch?: string;
  }) {
    const payload: any = {
      ticket_type: params.ticket_type,
      message: params.message.slice(0, 500),
    };
    if (params.ticket_type === "Pickup") {
      payload.branch = params.branch || ncmConfig.defaultPickupBranch || "TINKUNE";
    }
    return ncmFetch("/api/v2/vendor/ticket/create/new", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * 12. CREATE COD TRANSFER TICKET (/api/v2/vendor/ticket/cod/create)
   */
  static async createCODTransferTicket(params: {
    bankName: string;
    bankAccountName: string;
    bankAccountNumber: string;
  }) {
    return ncmFetch("/api/v2/vendor/ticket/cod/create", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * 13. CLOSE VENDOR TICKET (/api/v2/vendor/ticket/close/<ticket_id>)
   */
  static async closeVendorTicket(ticket_id: number | string) {
    return ncmFetch(`/api/v2/vendor/ticket/close/${ticket_id}`, {
      method: "POST",
    });
  }

  /**
   * 14. GET STAFF LIST (/api/v2/vendor/staffs)
   */
  static async getStaffs(q = "", page = 1, limit = 20) {
    const query = new URLSearchParams({
      ...(q ? { q } : {}),
      page: String(page),
      limit: String(limit),
      page_size: String(limit),
    }).toString();
    return ncmFetch(`/api/v2/vendor/staffs?${query}`);
  }

  /**
   * 15. GET VENDOR ASSIGNED BRANCHES (/api/v2/vendor/assigned-branches)
   */
  static async getAssignedBranches() {
    const res = await ncmFetch("/api/v2/vendor/assigned-branches");
    if (res.success && Array.isArray(res.data)) {
      return { success: true, branches: res.data };
    }
    return { success: false, branches: POPULAR_NCM_BRANCHES, error: res.error };
  }

  /**
   * 16. RETURN ORDER (/api/v2/vendor/order/return)
   */
  static async returnOrder(pk: number | string, comment = "") {
    return ncmFetch("/api/v2/vendor/order/return", {
      method: "POST",
      body: JSON.stringify({
        pk: Number(pk),
        ...(comment ? { comment } : {}),
      }),
    });
  }

  /**
   * 17. CREATE EXCHANGE ORDER (/api/v2/vendor/order/exchange-create)
   */
  static async createExchangeOrder(pk: number | string) {
    return ncmFetch("/api/v2/vendor/order/exchange-create", {
      method: "POST",
      body: JSON.stringify({ pk: Number(pk) }),
    });
  }

  /**
   * 18. REDIRECT ORDER (/api/v2/vendor/order/redirect)
   */
  static async redirectOrder(params: {
    pk: number | string;
    name: string;
    phone: string;
    address: string;
    vendorOrderid?: string;
    destination?: number | string;
    cod_charge?: number | string;
  }) {
    return ncmFetch("/api/v2/vendor/order/redirect", {
      method: "POST",
      body: JSON.stringify({
        pk: Number(params.pk),
        name: params.name,
        phone: params.phone,
        address: params.address,
        ...(params.vendorOrderid ? { vendorOrderid: params.vendorOrderid } : {}),
        ...(params.destination ? { destination: params.destination } : {}),
        ...(params.cod_charge !== undefined ? { cod_charge: Number(params.cod_charge) } : {}),
      }),
    });
  }

  /**
   * 19. CREATE / UPDATE / REMOVE WEBHOOK (/api/v2/vendor/webhook)
   */
  static async updateWebhook(webhook_url: string) {
    return ncmFetch("/api/v2/vendor/webhook", {
      method: "POST",
      body: JSON.stringify({ webhook_url }),
    });
  }

  /**
   * 20. TEST WEBHOOK (/api/v2/vendor/webhook/test)
   */
  static async testWebhook(webhook_url: string) {
    return ncmFetch("/api/v2/vendor/webhook/test", {
      method: "POST",
      body: JSON.stringify({ webhook_url }),
    });
  }

  /**
   * 21. GET TICKET DETAIL (/api/v1/tickets/<ticket_id>/detail)
   */
  static async getTicketDetail(ticket_id: number | string) {
    return ncmFetch(`/api/v1/tickets/${ticket_id}/detail`);
  }

  /**
   * 22. CREATE TICKET RESPONSE (/api/v1/vendor/tickets/<ticket_id>/response)
   */
  static async createTicketResponse(ticket_id: number | string, message: string) {
    return ncmFetch(`/api/v1/vendor/tickets/${ticket_id}/response`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  /**
   * 23. GET VENDOR CUSTOMER LIST (/api/v2/vendor/customers)
   */
  static async getCustomers(page = 1, page_size = 25, name = "", phone = "") {
    const query = new URLSearchParams({
      page: String(page),
      page_size: String(Math.min(page_size, 100)),
      ...(name ? { name } : {}),
      ...(phone ? { phone } : {}),
    }).toString();
    return ncmFetch(`/api/v2/vendor/customers?${query}`);
  }

  /**
   * 24. GET CUSTOMER DETAIL (/api/v2/vendor/customers/<customer_id>/detail)
   */
  static async getCustomerDetail(customer_id: number | string) {
    return ncmFetch(`/api/v2/vendor/customers/${customer_id}/detail`);
  }

  /**
   * 25. GET CUSTOMER RATING / DELIVERY STATS (/api/v2/vendor/ratings?phone=)
   */
  static async getCustomerRatings(phone: string) {
    if (!phone) return { success: false, error: "phone parameter is required" };
    return ncmFetch(`/api/v2/vendor/ratings?phone=${encodeURIComponent(phone)}`);
  }

  /**
   * 26. GET SINGLE ORDER LABEL DATA (/api/v2/vendor/order/label/<order_id>)
   */
  static async getOrderLabel(order_id: number | string) {
    return ncmFetch(`/api/v2/vendor/order/label/${order_id}`);
  }

  /**
   * 27. GET BULK ORDER LABEL DATA (/api/v2/vendor/order/label/)
   * Batches max 100 IDs per request as per specification.
   */
  static async getBulkOrderLabels(ids: (number | string)[]) {
    const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id) && id > 0);
    if (numericIds.length === 0) {
      return { success: false, error: '"ids" must be a non-empty array' };
    }

    // Split into batches of 100 if > 100
    if (numericIds.length <= 100) {
      return ncmFetch("/api/v2/vendor/order/label/", {
        method: "POST",
        body: JSON.stringify({ ids: numericIds }),
      });
    }

    let combinedLabels: any[] = [];
    let combinedNotFound: any[] = [];

    for (let i = 0; i < numericIds.length; i += 100) {
      const batch = numericIds.slice(i, i + 100);
      const res = await ncmFetch("/api/v2/vendor/order/label/", {
        method: "POST",
        body: JSON.stringify({ ids: batch }),
      });

      if (res.success && res.data) {
        if (Array.isArray(res.data.labels)) combinedLabels.push(...res.data.labels);
        if (Array.isArray(res.data.not_found)) combinedNotFound.push(...res.data.not_found);
      }
    }

    return {
      success: true,
      data: {
        labels: combinedLabels,
        not_found: combinedNotFound,
      },
    };
  }
}

// Backward compatibility export helpers
export async function fetchNcmBranches() {
  const res = await NCMClient.getBranches();
  return res.branches || POPULAR_NCM_BRANCHES;
}

export async function createNcmOrder(params: any) {
  const res = await NCMClient.createOrder({
    name: params.name,
    phone: params.phone,
    phone2: params.phone2,
    cod_charge: params.cod_charge,
    address: params.address,
    fbranch: params.fbranch,
    branch: params.branch,
    package: params.package,
    vref_id: params.vref_id,
    instruction: params.instruction,
    delivery_type: params.delivery_type,
    weight: params.weight,
  });

  if (res.success && (res.data?.orderid || res.data?.Message)) {
    return {
      success: true,
      Message: res.data.Message || "Order Successfully Created",
      orderid: res.data.orderid || res.data.id,
      rawResponse: res.data,
    };
  }

  return {
    success: false,
    error: res.error || "Failed to create NCM order",
    rawResponse: res.data,
  };
}

export async function getNcmOrderStatus(orderId: number | string) {
  const res: any = await NCMClient.getOrderStatus(orderId);
  return { success: res.success, data: res.data, error: res.error };
}

export async function getNcmOrderDetails(orderId: number | string) {
  const res: any = await NCMClient.getOrder(orderId);
  return { success: res.success, data: res.data, error: res.error };
}

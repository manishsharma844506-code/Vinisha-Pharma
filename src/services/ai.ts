import { db } from './db';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isGrounded?: boolean;
  groundingSources?: Array<{ title: string; url: string }>;
  imageUrl?: string;
  toolResult?: {
    type: 'LOW_STOCK' | 'EXPIRY' | 'SALES_SUMMARY' | 'REORDER_SUGGESTION' | 'PRODUCT_SEARCH';
    data: any;
  };
}

export interface GroundingSource {
  title: string;
  url: string;
}

export async function askPharmacyAssistant(
  userQuery: string, 
  history: AIMessage[] = [],
  searchGrounding = false
): Promise<{ text: string; sources?: GroundingSource[] }> {
  // Respect user's manual ON/OFF mode switch
  if (!db.isAIFeaturesEnabled()) {
    return {
      text: `⚠️ **AI Intelligence Mode is Currently Switched OFF.**\n\nVinisha Pharma is operating in **Manual Pharmacy Mode**. All automated Gemini operations, web search grounding, and AI image tools are paused.\n\nTo activate this assistant, click the **"AI Mode: OFF"** button in the top navigation bar or settings to switch it **ON**.`
    };
  }

  // 1. Gather live operational snapshot from the real database
  const medicines = db.getMedicines();
  const batches = db.getBatches();
  const sales = db.getSales();
  const suppliers = db.getSuppliers();
  const settings = db.getSettings();

  const today = new Date().toISOString().split('T')[0];

  // Expired batches
  const expiredBatches = batches.filter(b => b.expiryDate < today);

  // Expiring within 60 days
  const future60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const nearExpiryBatches = batches.filter(b => b.expiryDate >= today && b.expiryDate <= future60);

  // Low stock medicines
  const lowStockMeds = medicines.filter(m => m.totalStock <= m.minStockAlert);

  // Today's sales
  const todaySales = sales.filter(s => s.createdAt.startsWith(today));
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);

  // Top selling medicines (from sales records)
  const medSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  for (const sale of sales) {
    for (const it of sale.items) {
      if (!medSalesMap[it.medicineId]) {
        medSalesMap[it.medicineId] = { name: it.medicineName, qty: 0, revenue: 0 };
      }
      medSalesMap[it.medicineId].qty += it.quantity;
      medSalesMap[it.medicineId].revenue += it.total;
    }
  }
  const topSelling = Object.values(medSalesMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const contextPrompt = {
    query: userQuery,
    searchGrounding: searchGrounding && settings.aiSearchGroundingEnabled,
    systemContext: {
      pharmacyName: settings.pharmacyName,
      currentDate: today,
      totalMedicines: medicines.length,
      lowStockCount: lowStockMeds.length,
      lowStockList: lowStockMeds.map(m => ({ name: m.name, stock: m.totalStock, minAlert: m.minStockAlert, rack: m.rackLocation })),
      nearExpiryCount: nearExpiryBatches.length,
      nearExpiryList: nearExpiryBatches.map(b => {
        const med = medicines.find(m => m.id === b.medicineId);
        return { name: med?.name || 'Unknown', batch: b.batchNumber, expiry: b.expiryDate, qty: b.quantity };
      }),
      expiredBatchesCount: expiredBatches.length,
      todaySalesCount: todaySales.length,
      todayRevenue: todayRevenue,
      allTimeSalesCount: sales.length,
      topSellingItems: topSelling,
      suppliersCount: suppliers.length
    }
  };

  try {
    const response = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userQuery,
        context: contextPrompt,
        searchGrounding: searchGrounding && settings.aiSearchGroundingEnabled,
        history: history.slice(-6).map(h => ({ role: h.role, content: h.content }))
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.reply) {
        return {
          text: data.reply,
          sources: data.sources || []
        };
      }
    }
  } catch {
    // Fall back to rule-based operational response if backend proxy is unavailable
  }

  // Robust, grounded client fallback matching user intent
  const q = userQuery.toLowerCase();

  if (q.includes('low stock') || q.includes('out of stock') || q.includes('shortage')) {
    if (lowStockMeds.length === 0) {
      return { text: `All inventory levels are currently above minimum stock thresholds. No items are at critical reorder levels.` };
    }
    return {
      text: `**Low Stock Alert (${lowStockMeds.length} items flagged):**\n\n` +
        lowStockMeds.map(m => `• **${m.name}**: ${m.totalStock} units remaining (Min alert: ${m.minStockAlert}, Rack: ${m.rackLocation || 'General'})`).join('\n') +
        `\n\n*Suggestion:* Review supplier reorders for these items immediately to prevent stockouts.`
    };
  }

  if (q.includes('expir') || q.includes('expiry') || q.includes('near expiry')) {
    let msg = `**Batch Expiry Overview (Live Database):**\n\n`;
    if (expiredBatches.length > 0) {
      msg += `⚠️ **Expired Batches (${expiredBatches.length}):**\n` +
        expiredBatches.map(b => {
          const med = medicines.find(m => m.id === b.medicineId);
          return `• ${med?.name} (Batch: ${b.batchNumber}) - Expired on ${b.expiryDate} (${b.quantity} units)`;
        }).join('\n') + '\n\n';
    }
    if (nearExpiryBatches.length > 0) {
      msg += `⏳ **Expiring within 60 Days (${nearExpiryBatches.length}):**\n` +
        nearExpiryBatches.map(b => {
          const med = medicines.find(m => m.id === b.medicineId);
          return `• ${med?.name} (Batch: ${b.batchNumber}) - Expires ${b.expiryDate} (${b.quantity} units left)`;
        }).join('\n');
    }
    if (expiredBatches.length === 0 && nearExpiryBatches.length === 0) {
      msg += `All batches have sufficient shelf life exceeding 60 days.`;
    }
    return { text: msg };
  }

  if (q.includes('sales') || q.includes('revenue') || q.includes('today')) {
    return {
      text: `**Today's Sales Performance (${today}):**\n\n` +
        `• Total Bills Generated: **${todaySales.length}**\n` +
        `• Gross Revenue Collected: **₹${todayRevenue.toFixed(2)}**\n` +
        `• Average Ticket Size: **₹${todaySales.length > 0 ? (todayRevenue / todaySales.length).toFixed(2) : '0.00'}**\n\n` +
        `**Top Selling Items Today:**\n` +
        (topSelling.length > 0
          ? topSelling.map((it, idx) => `${idx + 1}. **${it.name}** — ${it.qty} units (₹${it.revenue.toFixed(2)})`).join('\n')
          : 'No items sold yet today.')
    };
  }

  if (q.includes('reorder') || q.includes('purchase suggestion')) {
    return {
      text: `**Distributor Reorder Recommendation:**\n\n` +
        `Based on current buffer thresholds, the following items are candidates for inward purchase orders:\n\n` +
        lowStockMeds.map(m => `• **${m.name}** (Current: ${m.totalStock}, Reorder Target: ${m.reorderLevel} units) — Deficit: **${m.reorderLevel - m.totalStock}** units`).join('\n') +
        `\n\n*Action:* Open **Purchases** tab to generate purchase invoices with registered suppliers.`
    };
  }

  return {
    text: `I've analyzed your current pharmacy database for "${userQuery}". You currently have **${medicines.length} active medicines** registered with **${lowStockMeds.length} low stock alerts** and **${nearExpiryBatches.length} batches near expiry**. Let me know if you would like me to drill down into any specific medicine, supplier, or batch.`
  };
}

/**
 * Generate or edit pharmacy imagery using Gemini
 */
export async function generatePharmacyImage(
  prompt: string,
  aspectRatio: '1:1' | '16:9' | '4:3' | '9:16' = '1:1',
  referenceImageBase64?: string
): Promise<{ imageUrl: string; description?: string }> {
  if (!db.isAIFeaturesEnabled()) {
    throw new Error('AI features are currently switched OFF. Enable AI mode to generate graphics.');
  }

  const response = await fetch('/api/ai/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      aspectRatio,
      referenceImage: referenceImageBase64
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate image');
  }

  return await response.json();
}

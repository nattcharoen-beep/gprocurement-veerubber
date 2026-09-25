// simulator.js - Smart Bidding Simulator for VEE RUBBER (บริษัท วีรับเบอร์ คอร์ปอเรชั่น จำกัด)
// Implements Thai government e-bidding cost formulas, VAT 7% reconciliation, and tire supply market benchmarks.

window.currentSimProject = null;

// Benchmark market discount percentages derived from historical government tire procurement tenders
window.MARKET_BENCHMARKS = {
  passenger_car_tires: {
    avgDiscount: 6.80,
    name: 'ยางรถยนต์นั่ง ยางรถกระบะ & รถตู้ราชการ',
    tip: 'คู่แข่งร้านยางท้องถิ่นเฉลี่ยตัดราคา 5.0% - 8.0% แนะนำเสนอพ่วงบริการถ่วงล้อและตั้งศูนย์เพื่อชูจุดเด่น'
  },
  truck_bus_tires: {
    avgDiscount: 8.50,
    name: 'ยางรถบรรทุก รถบัส & รถบริการสาธารณะ',
    tip: 'งานจัดซื้อยางรถบรรทุกขยะ/น้ำ/ดับเพลิง แข่งขันตัดราคาเฉลี่ย 8.5% ยาง TBR วีรับเบอร์ได้เปรียบต้นทุนโรงงานตรง'
  },
  motorcycle_tires: {
    avgDiscount: 5.20,
    name: 'ยางรถจักรยานยนต์ราชการ & สายตรวจ',
    tip: 'งานจัดซื้อยางมอเตอร์ไซค์ตำรวจ/เทศกิจ คู่แข่งลดน้อยเฉลี่ย 5.2% เคาะลด 4.5% - 6.0% คว้างานได้ทันที'
  },
  otr_heavy_machinery: {
    avgDiscount: 4.80,
    name: 'ยาง OTR เครื่องจักรกลหนัก & รถแทรกเตอร์',
    tip: 'ยางขนาดใหญ่เฉพาะทาง คู่แข่งมีน้อยราย มาร์จิ้นสูง ลดเฉลี่ยเพียง 4.8% สามารถเคาะราคากำไรพรีเมียมได้'
  },
  bicycle_specialty_tires: {
    avgDiscount: 7.50,
    name: 'ยางรถจักรยาน วีลแชร์ & ยานพาหนะเฉพาะทาง',
    tip: 'โครงการจัดซื้อจักรยานยืมเรียนและรถเข็นผู้ป่วยโรงพยาบาล แนะนำเคาะลด 7.0% - 8.5%'
  },
  tube_accessories: {
    avgDiscount: 4.00,
    name: 'ยางใน ยางรองคอด & อุปกรณ์ล้อยาง',
    tip: 'งานจัดซื้อควบยางในบิวทิลและยางรองคอด เคาะลด 3.0% - 5.0% รักษาอัตรากำไรสูง'
  }
};

window.projectDataStore = window.projectDataStore || new Map();

function openBiddingSimulator(projectId) {
  let project = window.projectDataStore.get(projectId);
  if (!project) {
    project = {
      id: projectId,
      project_name: 'โครงการจัดซื้อยางและอุปกรณ์',
      department: 'หน่วยงานราชการ',
      province: 'ไม่ระบุ',
      budget: 1500000,
      product_group: 'passenger_car_tires'
    };
  }

  window.currentSimProject = project;

  const modal = document.getElementById('bidding-simulator-modal') || document.getElementById('sim-modal');
  if (!modal) {
    console.error('Simulator modal element not found');
    return;
  }

  // Pre-fill header
  const titleEl = document.getElementById('sim-project-title') || document.getElementById('sim-modal-project-title');
  const deptEl = document.getElementById('sim-project-dept');
  const budgetDisplayEl = document.getElementById('sim-project-budget-display');
  const benchmarkEl = document.getElementById('sim-benchmark-info');

  if (titleEl) titleEl.textContent = project.project_name || 'ไม่มีชื่อโครงการ';
  if (deptEl) deptEl.textContent = '🏢 ' + (project.department || '-') + ' | 📍 ' + (project.province || '-');
  if (budgetDisplayEl) budgetDisplayEl.textContent = formatMoney(project.budget || 0);

  const group = project.product_group || 'passenger_car_tires';
  const bm = window.MARKET_BENCHMARKS[group] || window.MARKET_BENCHMARKS.passenger_car_tires;
  if (benchmarkEl) {
    benchmarkEl.innerHTML = '<div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">' +
      '<div>' +
        '<span style="background: #0284c7; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.82rem;">' + bm.name + '</span>' +
        '<span style="margin-left: 6px; font-weight: 700; color: #0f172a;">สถิติตลาดจัดซื้อยาง: ตัดราคาเฉลี่ย <span style="color: #dc2626; font-size: 1.05rem;">' + bm.avgDiscount + '%</span></span>' +
      '</div>' +
      '<span style="color: #475569; font-size: 0.82rem;">💡 ' + bm.tip + '</span>' +
    '</div>';
  }

  // Set default inputs
  const budget = project.budget || 1000000;
  const budgetInput = document.getElementById('sim-input-budget');
  if (budgetInput) budgetInput.value = budget;

  // Estimate default tire quantity based on budget
  const estTires = Math.max(20, Math.round((budget * 0.70) / 3500));
  const epdmAreaInput = document.getElementById('sim-input-epdm-area'); // Reused as tire quantity
  if (epdmAreaInput) epdmAreaInput.value = estTires;

  const epdmUnitCostInput = document.getElementById('sim-input-epdm-unit-cost'); // Reused as unit cost
  if (epdmUnitCostInput) epdmUnitCostInput.value = 1800;

  // Other costs (services, balancing, delivery)
  const otherCostInput = document.getElementById('sim-input-other-cost');
  const estOther = Math.max(0, Math.round((budget / 1.07) * 0.20));
  if (otherCostInput) otherCostInput.value = estOther;

  const bufferInput = document.getElementById('sim-input-buffer');
  if (bufferInput) bufferInput.value = 50000;

  // Configure slider limits
  const slider = document.getElementById('sim-bid-slider');
  const defBid = Math.round(budget * (1 - (bm.avgDiscount / 100)));
  if (slider) {
    slider.min = Math.round(budget * 0.5);
    slider.max = budget;
    slider.step = 1000;
    slider.value = defBid;
  }

  const bidInput = document.getElementById('sim-input-bid-price');
  if (bidInput) bidInput.value = defBid;

  recalculateSimulator();
  modal.style.display = 'flex';
}

function closeBiddingSimulator() {
  const modal = document.getElementById('bidding-simulator-modal') || document.getElementById('sim-modal');
  if (modal) modal.style.display = 'none';
}

function onBidSliderChange(val) {
  const bidInput = document.getElementById('sim-input-bid-price');
  if (bidInput) bidInput.value = val;
  recalculateSimulator();
}

function onBidInputChange(val) {
  const slider = document.getElementById('sim-bid-slider');
  if (slider) slider.value = val;
  recalculateSimulator();
}

function recalculateSimulator() {
  const budget = Number(document.getElementById('sim-input-budget')?.value || 0);
  const tireQty = Number(document.getElementById('sim-input-epdm-area')?.value || 0);
  const tireUnitCost = Number(document.getElementById('sim-input-epdm-unit-cost')?.value || 0);
  const otherCost = Number(document.getElementById('sim-input-other-cost')?.value || 0);
  const buffer = Number(document.getElementById('sim-input-buffer')?.value || 0);
  let bidPrice = Number(document.getElementById('sim-input-bid-price')?.value || 0);

  if (bidPrice <= 0) bidPrice = budget;

  // 1. Cost without VAT
  const tireTotalCost = tireQty * tireUnitCost;
  const costExVat = otherCost + tireTotalCost + buffer;
  const inputVat = costExVat * 0.07;
  const costIncVat = costExVat * 1.07; // Break-even floor price

  // 2. Bid Price & Revenue without VAT
  const revExVat = bidPrice / 1.07;
  const outputVat = bidPrice * (7 / 107);
  const netVatPayable = outputVat - inputVat;

  // 3. True Gross Profit
  const grossProfit = revExVat - costExVat;
  const marginPercent = revExVat > 0 ? (grossProfit / revExVat) * 100 : 0;
  const discountPercent = budget > 0 ? ((budget - bidPrice) / budget) * 100 : 0;

  // 4. Update UI displays
  const discountInfoEl = document.getElementById('res-discount-info');
  if (discountInfoEl) {
    discountInfoEl.textContent = `ลดจากราคากลาง ${discountPercent.toFixed(2)}% (ลดไป ${formatMoney(budget - bidPrice)})`;
  }

  const breakevenEl = document.getElementById('res-breakeven');
  if (breakevenEl) breakevenEl.textContent = formatMoney(costIncVat);

  const revExVatEl = document.getElementById('res-rev-ex-vat');
  if (revExVatEl) revExVatEl.textContent = formatMoney(revExVat);

  const costExVatEl = document.getElementById('res-cost-ex-vat');
  if (costExVatEl) costExVatEl.textContent = formatMoney(costExVat);

  const vatNetEl = document.getElementById('res-vat-net');
  if (vatNetEl) vatNetEl.textContent = formatMoney(netVatPayable);

  const grossProfitEl = document.getElementById('res-gross-profit');
  if (grossProfitEl) {
    grossProfitEl.textContent = formatMoney(grossProfit);
    grossProfitEl.style.color = grossProfit >= 0 ? '#15803d' : '#dc2626';
  }

  const marginEl = document.getElementById('res-margin-percent');
  if (marginEl) {
    marginEl.textContent = `${marginPercent.toFixed(1)}% Margin`;
    marginEl.style.color = marginPercent >= 0 ? '#15803d' : '#dc2626';
  }

  // 5. Status Banner
  const statusBox = document.getElementById('sim-status-box');
  if (statusBox) {
    if (bidPrice < costIncVat) {
      statusBox.style.background = '#fef2f2';
      statusBox.style.borderColor = '#fca5a5';
      statusBox.innerHTML = '<div style="display: flex; align-items: center; gap: 8px;">' +
        '<span style="font-size: 1.3rem;">⚠️</span>' +
        '<div>' +
          '<div style="font-weight: 700; color: #dc2626;">เคาะต่ำกว่าจุดคุ้มทุน! ขาดทุนทันที ' + formatMoney(Math.abs(grossProfit)) + '</div>' +
          '<div style="font-size: 0.82rem; color: #7f1d1d;">ห้ามเสนอราคานี้เด็ดขาด จุดคุ้มทุนขั้นต่ำคือ ' + formatMoney(costIncVat) + '</div>' +
        '</div>' +
      '</div>';
    } else if (marginPercent >= 18) {
      statusBox.style.background = '#f0fdf4';
      statusBox.style.borderColor = '#86efac';
      statusBox.innerHTML = '<div style="display: flex; align-items: center; gap: 8px;">' +
        '<span style="font-size: 1.3rem;">💎</span>' +
        '<div>' +
          '<div style="font-weight: 700; color: #15803d;">ราคากำไรสูงมาก (High Margin: ' + marginPercent.toFixed(1) + '%)</div>' +
          '<div style="font-size: 0.82rem; color: #14532d;">กำไรแท้จริง ' + formatMoney(grossProfit) + ' เหมาะสำหรับงานที่คู่แข่งน้อยราย</div>' +
        '</div>' +
      '</div>';
    } else {
      statusBox.style.background = '#eff6ff';
      statusBox.style.borderColor = '#93c5fd';
      statusBox.innerHTML = '<div style="display: flex; align-items: center; gap: 8px;">' +
        '<span style="font-size: 1.3rem;">🎯</span>' +
        '<div>' +
          '<div style="font-weight: 700; color: #0369a1;">ราคาแข่งขันสมดุล (Margin: ' + marginPercent.toFixed(1) + '%)</div>' +
          '<div style="font-size: 0.82rem; color: #0c4a6e;">โอกาสชนะสูงและรักษากำไรสุทธิ ' + formatMoney(grossProfit) + ' ได้อย่างมั่นคง</div>' +
        '</div>' +
      '</div>';
    }
  }

  // 6. Recommended 3 Strategies
  const s1Bid = Math.round(budget * 0.96);
  const s1Profit = (s1Bid / 1.07) - costExVat;
  const s1BidEl = document.getElementById('strat1-bid');
  const s1ProfitEl = document.getElementById('strat1-profit');
  if (s1BidEl) s1BidEl.textContent = formatMoney(s1Bid);
  if (s1ProfitEl) s1ProfitEl.textContent = 'กำไร ' + formatMoney(s1Profit);

  const group = window.currentSimProject?.product_group || 'passenger_car_tires';
  const bm = window.MARKET_BENCHMARKS[group] || window.MARKET_BENCHMARKS.passenger_car_tires;
  const s2Bid = Math.round(budget * (1 - (bm.avgDiscount / 100)));
  const s2Profit = (s2Bid / 1.07) - costExVat;
  const s2BidEl = document.getElementById('strat2-bid');
  const s2ProfitEl = document.getElementById('strat2-profit');
  if (s2BidEl) s2BidEl.textContent = formatMoney(s2Bid);
  if (s2ProfitEl) s2ProfitEl.textContent = 'กำไร ' + formatMoney(s2Profit);

  const s3Bid = Math.max(Math.round(costIncVat * 1.05), Math.round(budget * 0.85));
  const s3Profit = (s3Bid / 1.07) - costExVat;
  const s3BidEl = document.getElementById('strat3-bid');
  const s3ProfitEl = document.getElementById('strat3-profit');
  if (s3BidEl) s3BidEl.textContent = formatMoney(s3Bid);
  if (s3ProfitEl) s3ProfitEl.textContent = 'กำไร ' + formatMoney(s3Profit);
}

function selectStrategy(stratNum) {
  const budget = Number(document.getElementById('sim-input-budget')?.value || 0);
  const costExVat = Number(document.getElementById('res-cost-ex-vat')?.textContent.replace(/[^0-9.-]+/g,"") || 0);
  const costIncVat = costExVat * 1.07;

  let targetBid = budget;
  if (stratNum === 1) targetBid = Math.round(budget * 0.96);
  if (stratNum === 2) {
    const group = window.currentSimProject?.product_group || 'passenger_car_tires';
    const bm = window.MARKET_BENCHMARKS[group] || window.MARKET_BENCHMARKS.passenger_car_tires;
    targetBid = Math.round(budget * (1 - (bm.avgDiscount / 100)));
  }
  if (stratNum === 3) targetBid = Math.max(Math.round(costIncVat * 1.05), Math.round(budget * 0.85));

  onBidInputChange(targetBid);
}

function copySimulationSummary() {
  const p = window.currentSimProject;
  if (!p) return;

  const budget = document.getElementById('sim-project-budget-display')?.textContent || '';
  const bidPrice = formatMoney(Number(document.getElementById('sim-input-bid-price')?.value || 0));
  const discountInfo = document.getElementById('res-discount-info')?.textContent || '';
  const profit = document.getElementById('res-gross-profit')?.textContent || '';
  const margin = document.getElementById('res-margin-percent')?.textContent || '';
  const floorPrice = document.getElementById('res-breakeven')?.textContent || '';

  const summary = 
`🎯 สรุปกลยุทธ์เคาะราคาจัดซื้อยาง (VEE RUBBER TRACKER)
━━━━━━━━━━━━━━━━━━━━
📌 โครงการ: ${p.project_name}
🏢 หน่วยงาน: ${p.department || '-'} (${p.province || '-'})
💰 ราคากลางรัฐ: ${budget}
━━━━━━━━━━━━━━━━━━━━
🎯 ราคาเสนอประมูลที่แนะนำ: ${bidPrice}
📉 ส่วนลด: ${discountInfo}
💵 กำไรขั้นต้นแท้จริง: ${profit} (${margin})
🛡️ จุดคุ้มทุนขั้นต่ำ (Floor Price): ${floorPrice}
━━━━━━━━━━━━━━━━━━━━
*วิเคราะห์ผ่านระบบ VEE RUBBER G-Procurement Tracker`;

  navigator.clipboard.writeText(summary).then(() => {
    alert('คัดลอกสรุปผลเคาะราคาไปยังคลิปบอร์ดแล้ว! พร้อมส่งต่อใน LINE');
  });
}

window.openBiddingSimulator = openBiddingSimulator;
window.closeBiddingSimulator = closeBiddingSimulator;
window.onBidSliderChange = onBidSliderChange;
window.onBidInputChange = onBidInputChange;
window.recalculateSimulator = recalculateSimulator;
window.selectStrategy = selectStrategy;
window.copySimulationSummary = copySimulationSummary;

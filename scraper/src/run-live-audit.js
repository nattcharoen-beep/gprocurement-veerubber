import { harvestEGP5 } from './harvest-egp5.js';

(async () => {
  console.log('=====================================================================');
  console.log('🚀 LIVE VERIFICATION PROTOCOL: 2-PASS LIFECYCLE & PRECISION ENGINE');
  console.log('=====================================================================');
  
  const startTime = Date.now();
  // Run harvest across keywords with lookback window of 14 days
  const projects = await harvestEGP5(null, null, { maxPages: 2, lookbackDays: 14 });
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n[Verification Engine] Scrape completed in ' + duration + 's. Total verified: ' + projects.length);

  // Assertions:
  const illegalProjects = [];
  const nowStr = new Date().toISOString().split('T')[0];

  for (const p of projects) {
    const isW0 = p.announce_type === 'W0';
    const hasWinnerInFlow = (p.flow_name || '').includes('ผู้ชนะ');
    const hasContract = (p.flow_name || '').includes('สัญญา');
    const hasCancelled = (p.flow_name || '').includes('ยกเลิก');
    const isExpired = p.deadline && p.deadline < nowStr;

    if (isW0 || hasWinnerInFlow || hasContract || hasCancelled || isExpired) {
      illegalProjects.push({
        project_id: p.project_id,
        title: p.title,
        type: p.announce_type,
        flow: p.flow_name,
        deadline: p.deadline,
        reasons: [
          isW0 ? 'W0' : '',
          hasWinnerInFlow ? 'Winner in flow' : '',
          hasContract ? 'Contract' : '',
          hasCancelled ? 'Cancelled' : '',
          isExpired ? 'Expired deadline' : ''
        ].filter(Boolean).join(', ')
      });
    }
  }

  console.log('\n=====================================================================');
  console.log('📋 STATUS AUDIT TABLE (LIVE PROJECTS VERIFIED FROM E-GP)');
  console.log('=====================================================================');
  console.log('| # | Project ID | วันที่ประกาศ | วันสิ้นสุดยื่นซอง (Deadline) | สถานะล่าสุดใน e-GP | วงเงิน (บาท) | ชื่อโครงการ |');
  console.log('|---|---|:---:|:---:|:---:|:---:|---|');

  const displayCount = Math.min(projects.length, 15);
  for (let i = 0; i < displayCount; i++) {
    const it = projects[i];
    console.log('| ' + (i + 1) + ' | `' + it.project_id + '` | ' + it.announce_date + ' | ' + it.deadline + ' | **' + it.announce_type + '** (' + (it.flow_name || 'ประกาศ') + ') | ฿' + Number(it.budget).toLocaleString() + ' | ' + it.title.substring(0, 48) + '... |');
  }

  console.log('\n=====================================================================');
  console.log('🛡️ PROOF OF ZERO WINNER & LIFECYCLE AUDIT');
  console.log('=====================================================================');
  console.log('Total Projects Harvested: ' + projects.length);
  console.log('Completed / Won Projects Found: ' + illegalProjects.length);

  if (illegalProjects.length === 0) {
    console.log('✅ ZERO-WINNER PROOF: 100% PASS! No W0, no awarded bids, no expired deadlines.');
  } else {
    console.error('❌ ZERO-WINNER PROOF FAILED: Found illegal projects:', illegalProjects);
    process.exit(1);
  }

  console.log('=====================================================================\n');
})();

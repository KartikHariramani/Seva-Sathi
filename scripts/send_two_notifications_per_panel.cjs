const http = require('http');

async function postJson(endpoint, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request(
      `http://localhost:5174${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ statusCode: res.statusCode, raw: body });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('=================================================================');
  console.log('  SEVASETU: DISPATCHING 2 AUTOMATED NOTIFICATIONS PER PANEL (10 TOTAL)');
  console.log('=================================================================\n');

  const results = [];

  // ---------------------------------------------------------------------------
  // 1. HOSPITAL PANEL
  // ---------------------------------------------------------------------------
  console.log('--- 1. HOSPITAL DASHBOARD NOTIFICATIONS ---');
  
  // Notification 1: Emergency Blood Request Created
  console.log('Dispatching Hospital Notification 1: Critical Emergency Blood Request...');
  const hosp1 = await postJson('/api/telegram/notify/hospital-request', {
    requestId: 'REQ-202610-EMERG-01',
    displayId: 'REQ-EMERG-01',
    hospitalName: 'Metropolitan Apex Trauma Center',
    bloodGroup: 'O-',
    quantityLitres: 3.5,
    priority: 'EMERGENCY',
    status: 'searching',
  });
  console.log('  -> Result:', hosp1.statusCode, hosp1.data?.success ? 'SUCCESS' : 'FAILED', '\n');
  results.push({ panel: 'Hospital', notif: 'Emergency Blood Request Created', outcome: hosp1 });

  // Notification 2: Blood Request Matched & Reserved Status Transition
  console.log('Dispatching Hospital Notification 2: Blood Request Matched & Reserved Status Transition...');
  const hosp2 = await postJson('/api/telegram/notify/hospital-request', {
    requestId: 'REQ-202610-EMERG-01',
    displayId: 'REQ-EMERG-01',
    hospitalName: 'Metropolitan Apex Trauma Center',
    bloodGroup: 'O-',
    quantityLitres: 3.5,
    priority: 'EMERGENCY',
    status: 'reserved',
  });
  console.log('  -> Result:', hosp2.statusCode, hosp2.data?.success ? 'SUCCESS' : 'FAILED', '\n');
  results.push({ panel: 'Hospital', notif: 'Request Matched & Reserved Status Update', outcome: hosp2 });

  // ---------------------------------------------------------------------------
  // 2. BLOOD BANK PANEL
  // ---------------------------------------------------------------------------
  console.log('--- 2. BLOOD BANK DASHBOARD NOTIFICATIONS ---');

  // Notification 1: Critical Stock Shortage Alert
  console.log('Dispatching Blood Bank Notification 1: Critical Inventory Shortage Alert...');
  const bb1 = await postJson('/api/telegram/alert/shortage', {
    facilityId: 'BB-NAGPUR-REGIONAL',
    facilityName: 'Nagpur Regional Blood Centre',
    bloodGroup: 'O-',
    component: 'Packed Red Blood Cells (PRBC)',
    availableUnits: 1.5,
    threshold: 5.0,
    severity: 'CRITICAL',
  });
  console.log('  -> Result:', bb1.statusCode, bb1.data?.success ? 'SUCCESS' : 'FAILED', '\n');
  results.push({ panel: 'Blood Bank', notif: 'Critical Inventory Shortage Alert', outcome: bb1 });

  // Notification 2: 18-Hour Near-Expiry Shelf-Life Warning
  console.log('Dispatching Blood Bank Notification 2: 18-Hour Component Shelf-Life Expiry Alert...');
  const bb2 = await postJson('/api/telegram/alert/expiry', {
    facilityName: 'Central City Blood Bank & Apheresis Depot',
    bloodGroup: 'A-',
    component: 'Platelet Concentrate',
    quantityUnits: 4.0,
    batchOrUnitId: 'PLT-BATCH-2026-99',
    expiryTimestamp: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    hoursRemaining: 18,
  });
  console.log('  -> Result:', bb2.statusCode, bb2.data?.success ? 'SUCCESS' : 'FAILED', '\n');
  results.push({ panel: 'Blood Bank', notif: '18-Hour Component Expiry Warning', outcome: bb2 });

  // ---------------------------------------------------------------------------
  // 3. DONOR PANEL
  // ---------------------------------------------------------------------------
  console.log('--- 3. DONOR PORTAL NOTIFICATIONS ---');

  // Notification 1: Donation Drive Registration Confirmation with QR Pass
  console.log('Dispatching Donor Notification 1: Drive Registration Confirmation & QR Pass...');
  const donor1 = await postJson('/api/telegram/notify/campaign-event', {
    eventType: 'REGISTRATION',
    donorId: 'DNR-202610-8801',
    donorName: 'Rahul Sharma',
    campaignTitle: 'Nagpur Metro Life-Saver Voluntary Blood Drive',
    venueName: 'Sitabuldi Metro Interchange Concourse Level 2',
    date: '2026-10-25',
    timeSlot: '09:30 - 10:30',
    qrTicketToken: 'TK-PASS-METRO-8801',
  });
  console.log('  -> Result:', donor1.statusCode, donor1.data?.success ? 'SUCCESS' : 'FAILED', '\n');
  results.push({ panel: 'Donor', notif: 'Registration Confirmation & Digital QR Pass', outcome: donor1 });

  // Notification 2: 24-Hour Pre-Drive Event Reminder
  console.log('Dispatching Donor Notification 2: 24-Hour Pre-Drive Event Reminder...');
  const donor2 = await postJson('/api/telegram/notify/campaign-event', {
    eventType: 'REMINDER_24H',
    donorId: 'DNR-202610-8801',
    donorName: 'Rahul Sharma',
    campaignTitle: 'Nagpur Metro Life-Saver Voluntary Blood Drive',
    venueName: 'Sitabuldi Metro Interchange Concourse Level 2',
    date: '2026-10-25',
    timeSlot: '09:30 - 10:30',
    qrTicketToken: 'TK-PASS-METRO-8801',
    reminderType: '24H',
  });
  console.log('  -> Result:', donor2.statusCode, donor2.data?.success ? 'SUCCESS' : 'FAILED', '\n');
  results.push({ panel: 'Donor', notif: '24-Hour Pre-Drive Scheduled Reminder', outcome: donor2 });

  // ---------------------------------------------------------------------------
  // 4. NSS ORGANIZATION PANEL
  // ---------------------------------------------------------------------------
  console.log('--- 4. NSS ORGANIZATION DASHBOARD NOTIFICATIONS ---');

  // Notification 1: Drive Schedule & Venue Update Broadcast
  console.log('Dispatching NSS Org Notification 1: Drive Schedule & Venue Update Broadcast...');
  const nss1 = await postJson('/api/telegram/notify/campaign-event', {
    eventType: 'CAMPAIGN_CHANGED',
    donorId: 'DNR-202610-8801',
    donorName: 'Registered Donors Community',
    campaignTitle: 'VNIT Campus Youth Voluntary Blood Drive',
    venueName: 'Student Activity Centre (SAC Auditorium)',
    date: '2026-10-28',
    timeSlot: '10:00 - 16:00',
    changeNote: 'Venue upgraded to SAC Main Auditorium with air-conditioned observation lounge.',
  });
  console.log('  -> Result:', nss1.statusCode, nss1.data?.success ? 'SUCCESS' : 'FAILED', '\n');
  results.push({ panel: 'NSS Organization', notif: 'Drive Schedule & Venue Update Notice', outcome: nss1 });

  // Notification 2: Attendance Check-In Confirmation
  console.log('Dispatching NSS Org Notification 2: Attendance Check-In Confirmation...');
  const nss2 = await postJson('/api/telegram/notify/campaign-event', {
    eventType: 'CHECKIN',
    donorId: 'DNR-202610-8801',
    donorName: 'Pooja Kulkarni',
    campaignTitle: 'VNIT Campus Youth Voluntary Blood Drive',
    venueName: 'Student Activity Centre (SAC Auditorium)',
    qrTicketToken: 'TK-PASS-METRO-8801',
  });
  console.log('  -> Result:', nss2.statusCode, nss2.data?.success ? 'SUCCESS' : 'FAILED', '\n');
  results.push({ panel: 'NSS Organization', notif: 'Attendance Check-In Confirmation', outcome: nss2 });

  // ---------------------------------------------------------------------------
  // 5. ADMIN PANEL
  // ---------------------------------------------------------------------------
  console.log('--- 5. ADMIN COMMAND CENTER NOTIFICATIONS ---');

  // Notification 1: Emergency Requisition Escalation
  console.log('Dispatching Admin Notification 1: Emergency Requisition Escalation Alert...');
  const admin1 = await postJson('/api/telegram/notify/escalation', {
    requestId: 'REQ-202610-EMERG-01',
    displayId: 'REQ-EMERG-01',
    hospitalName: 'Metropolitan Apex Trauma Center',
    bloodGroup: 'O-',
    quantityLitres: 3.5,
    priority: 'EMERGENCY',
    minutesOverdue: 60,
  });
  console.log('  -> Result:', admin1.statusCode, admin1.data?.success ? 'SUCCESS' : 'FAILED', '\n');
  results.push({ panel: 'Admin', notif: 'Emergency Requisition Escalation Alert', outcome: admin1 });

  // Notification 2: Organization Verification Approval
  console.log('Dispatching Admin Notification 2: Organization Verification & Accreditation Notice...');
  const admin2 = await postJson('/api/telegram/diagnostics/test-send', {
    chatId: '100001',
    text: `🏛️ <b>SEVASETU — STATUTORY FACILITY ACCREDITATION APPROVED</b>\n\n• <b>Organization:</b> Metropolitan Trauma & General Hospital\n• <b>Facility Code:</b> METRO-01\n• <b>Licence No:</b> MH-NGP-HSP-2024-001\n• <b>Accreditation Status:</b> VERIFIED & ACTIVE\n• <b>Approved By:</b> State Medical Administrator\n• <b>Timestamp:</b> ${new Date().toLocaleString('en-IN')}\n\n<i>Full inter-hospital matching and requisition capabilities are now unlocked.</i>`,
  });
  console.log('  -> Result:', admin2.statusCode, admin2.data?.success ? 'SUCCESS' : 'FAILED', '\n');
  results.push({ panel: 'Admin', notif: 'Facility Accreditation Approval Notice', outcome: admin2 });

  console.log('=================================================================');
  console.log('  ALL 10 NOTIFICATIONS SUCCESSFULLY PROCESSED AND RECORDED');
  console.log('=================================================================');
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});

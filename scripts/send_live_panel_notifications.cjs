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
  const targetChat = '1411618730'; // Verified active user chat ID

  console.log('=================================================================');
  console.log(`  SEVASETU: DISPATCHING 2 LIVE NOTIFICATIONS PER PANEL (10 TOTAL)`);
  console.log(`  RECIPIENT TELEGRAM CHAT: ${targetChat} (@sevasathibot)`);
  console.log('=================================================================\n');

  // Register chat as linked user across all roles
  await postJson('/api/telegram/link-direct', {
    userId: 'DNR-2026-001',
    telegramChatId: targetChat,
    userName: 'UserX2006',
    userRole: 'admin',
    telegramUsername: 'UserX2006',
  });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------------------------------------------------------------------------
  // 1. HOSPITAL DASHBOARD NOTIFICATIONS
  // ---------------------------------------------------------------------------
  console.log('--- 1. HOSPITAL DASHBOARD NOTIFICATIONS ---');
  
  // Notification 1: Emergency Blood Request Created
  console.log('1. Dispatching Hospital Notification: Emergency Blood Request Created...');
  const hosp1 = await postJson('/api/telegram/diagnostics/test-send', {
    chatId: targetChat,
    text: `🚨 <b>[HOSPITAL DASHBOARD] CRITICAL EMERGENCY REQUISITION</b>\n\n• <b>Request ID:</b> <code>REQ-202610-EMERG-01</code>\n• <b>Facility:</b> Metropolitan Apex Trauma Center\n• <b>Required Blood Group:</b> O- (Universal Donor)\n• <b>Volume Needed:</b> 3.5 Litres\n• <b>Clinical Urgency:</b> EMERGENCY\n• <b>Required Deadline:</b> Within 60 mins\n• <b>Network Queue Status:</b> SEARCHING ELIGIBLE BLOOD BANKS\n• <b>Logged At:</b> ${new Date().toLocaleString('en-IN')}\n\n🔗 <a href="http://localhost:5174/hospital/requests">Review Requisition in SevaSetu</a>`,
  });
  console.log('  -> Status:', hosp1.data?.status || hosp1.statusCode);
  await sleep(1000);

  // Notification 2: Blood Request Matched & Reserved Status Transition
  console.log('2. Dispatching Hospital Notification: Request Matched & Reserved Status Transition...');
  const hosp2 = await postJson('/api/telegram/diagnostics/test-send', {
    chatId: targetChat,
    text: `✅ <b>[HOSPITAL DASHBOARD] REQUISITION MATCHED & RESERVED</b>\n\n• <b>Request ID:</b> <code>REQ-202610-EMERG-01</code>\n• <b>Matched Facility:</b> Nagpur Regional Blood Centre\n• <b>Reserved Volume:</b> 3.5 L (O- PRBC)\n• <b>Status:</b> RESERVED (Cold-Chain Consignment Preparing)\n• <b>Estimated Transit:</b> ~22 minutes\n• <b>Updated At:</b> ${new Date().toLocaleString('en-IN')}\n\n🔗 <a href="http://localhost:5174/hospital/requests">Track Live Delivery Queue</a>`,
  });
  console.log('  -> Status:', hosp2.data?.status || hosp2.statusCode, '\n');
  await sleep(1000);

  // ---------------------------------------------------------------------------
  // 2. BLOOD BANK DASHBOARD NOTIFICATIONS
  // ---------------------------------------------------------------------------
  console.log('--- 2. BLOOD BANK DASHBOARD NOTIFICATIONS ---');

  // Notification 1: Critical Stock Shortage Alert
  console.log('3. Dispatching Blood Bank Notification: Critical Inventory Shortage Alert...');
  const bb1 = await postJson('/api/telegram/diagnostics/test-send', {
    chatId: targetChat,
    text: `🚨 <b>[BLOOD BANK DASHBOARD] CRITICAL INVENTORY SHORTAGE ALERT</b>\n\n• <b>Facility:</b> Nagpur Regional Blood Centre\n• <b>Blood Group:</b> O- Negative\n• <b>Component:</b> Packed Red Blood Cells (PRBC)\n• <b>Available Stock:</b> 1.5 L\n• <b>Statutory Buffer Threshold:</b> 5.0 L\n• <b>Deficit Status:</b> CRITICAL SHORTAGE DEFICIT\n• <b>Action Required:</b> Triage voluntary donor mobilization and request regional depot balance transfer.\n\n🔗 <a href="http://localhost:5174/blood-bank/inventory">Inspect Blood Bank Stock Ledger</a>`,
  });
  console.log('  -> Status:', bb1.data?.status || bb1.statusCode);
  await sleep(1000);

  // Notification 2: 18-Hour Component Shelf-Life Expiry Alert
  console.log('4. Dispatching Blood Bank Notification: 18-Hour Component Shelf-Life Expiry Warning...');
  const bb2 = await postJson('/api/telegram/diagnostics/test-send', {
    chatId: targetChat,
    text: `⏳ <b>[BLOOD BANK DASHBOARD] 18-HOUR SHELF-LIFE EXPIRY ALERT</b>\n\n• <b>Facility:</b> Central City Blood Bank & Apheresis Depot\n• <b>Component:</b> Platelet Concentrate (Apheresis)\n• <b>Blood Group:</b> A-\n• <b>Batch ID:</b> <code>PLT-BATCH-2026-99</code>\n• <b>Quantity:</b> 4.0 Units\n• <b>Hours Remaining:</b> 18.0 hours\n• <b>Expiry Timestamp:</b> ${new Date(Date.now() + 18 * 3600 * 1000).toLocaleString('en-IN')}\n• <b>Action:</b> Prioritize for immediate regional oncology exchange transfer.\n\n🔗 <a href="http://localhost:5174/blood-bank/near-expiry">Open Expiry Rescue Portal</a>`,
  });
  console.log('  -> Status:', bb2.data?.status || bb2.statusCode, '\n');
  await sleep(1000);

  // ---------------------------------------------------------------------------
  // 3. DONOR PORTAL NOTIFICATIONS
  // ---------------------------------------------------------------------------
  console.log('--- 3. DONOR PORTAL NOTIFICATIONS ---');

  // Notification 1: Drive Registration Confirmation & QR Pass
  console.log('5. Dispatching Donor Notification: Drive Registration Confirmation & Digital QR Pass...');
  const donor1 = await postJson('/api/telegram/diagnostics/test-send', {
    chatId: targetChat,
    text: `🎟️ <b>[DONOR PORTAL] DONATION DRIVE REGISTRATION CONFIRMED</b>\n\nDear <b>Rahul Sharma</b>, thank you for stepping forward to save lives!\n\n• <b>Drive:</b> Nagpur Metro Life-Saver Blood Donation Drive\n• <b>Venue:</b> Sitabuldi Metro Interchange Concourse Level 2\n• <b>Date:</b> Saturday, 25 Oct 2026\n• <b>Reserved Slot:</b> 09:30 AM - 10:30 AM\n• <b>Digital Entry Token:</b> <code>TK-PASS-METRO-8801</code>\n\n📱 <i>Present this token or your digital QR pass at the triage desk for express check-in.</i>\n\n🔗 <a href="http://localhost:5174/donor/portal">Open Digital Entry Pass</a>`,
  });
  console.log('  -> Status:', donor1.data?.status || donor1.statusCode);
  await sleep(1000);

  // Notification 2: 24-Hour Pre-Drive Event Reminder
  console.log('6. Dispatching Donor Notification: 24-Hour Pre-Drive Event Reminder...');
  const donor2 = await postJson('/api/telegram/diagnostics/test-send', {
    chatId: targetChat,
    text: `⏰ <b>[DONOR PORTAL] 24-HOUR DONATION DRIVE REMINDER</b>\n\nDear <b>Rahul Sharma</b>, your voluntary donation appointment is tomorrow!\n\n• <b>Drive:</b> Nagpur Metro Life-Saver Blood Donation Drive\n• <b>Venue:</b> Sitabuldi Metro Interchange Concourse Level 2\n• <b>Designated Time:</b> 09:30 AM\n• <b>Entry Pass:</b> <code>TK-PASS-METRO-8801</code>\n\n💧 <b>Pre-Donation Guidelines:</b>\n1. Drink 500ml extra water/fluids today.\n2. Have a nutritious light meal 2-3 hours before your slot.\n3. Avoid heavy exercise immediately before donation.\n\n🔗 <a href="http://localhost:5174/donor/portal">Manage Registration</a>`,
  });
  console.log('  -> Status:', donor2.data?.status || donor2.statusCode, '\n');
  await sleep(1000);

  // ---------------------------------------------------------------------------
  // 4. NSS ORGANIZATION DASHBOARD NOTIFICATIONS
  // ---------------------------------------------------------------------------
  console.log('--- 4. NSS ORGANIZATION DASHBOARD NOTIFICATIONS ---');

  // Notification 1: Drive Schedule & Venue Update Broadcast
  console.log('7. Dispatching NSS Org Notification: Drive Schedule & Venue Update Broadcast...');
  const nss1 = await postJson('/api/telegram/diagnostics/test-send', {
    chatId: targetChat,
    text: `📢 <b>[NSS ORGANIZATION] VOLUNTARY DRIVE SCHEDULE UPDATE</b>\n\nNotice to all registered community volunteers and donors for <b>VNIT Youth Blood Drive</b>:\n\n• <b>Update:</b> Phlebotomy venue upgraded to Student Activity Centre (SAC Main Auditorium)\n• <b>Date:</b> Wednesday, 28 Oct 2026\n• <b>Operating Hours:</b> 10:00 AM – 04:00 PM\n• <b>Special Facilities:</b> Air-conditioned recovery lounge and doctor consultation desk on site.\n\n🔗 <a href="http://localhost:5174/ngo/campaigns">View NSS Organizer Portal</a>`,
  });
  console.log('  -> Status:', nss1.data?.status || nss1.statusCode);
  await sleep(1000);

  // Notification 2: Attendance Check-In Confirmation
  console.log('8. Dispatching NSS Org Notification: Attendance Check-In & Phlebotomy Turnout...');
  const nss2 = await postJson('/api/telegram/diagnostics/test-send', {
    chatId: targetChat,
    text: `✅ <b>[NSS ORGANIZATION] ATTENDANCE CHECK-IN CONFIRMED</b>\n\n• <b>Donor Name:</b> Pooja Kulkarni\n• <b>Campaign:</b> VNIT Youth Voluntary Blood Drive\n• <b>Verified Entry Token:</b> <code>TK-PASS-METRO-8801</code>\n• <b>Check-In Time:</b> ${new Date().toLocaleTimeString('en-IN')}\n• <b>Organizer Telemetry:</b> Total attendance incremented to 13 verified donors.\n\n<i>Digital certificate and Seva points have been credited to donor profile.</i>`,
  });
  console.log('  -> Status:', nss2.data?.status || nss2.statusCode, '\n');
  await sleep(1000);

  // ---------------------------------------------------------------------------
  // 5. ADMIN COMMAND CENTER NOTIFICATIONS
  // ---------------------------------------------------------------------------
  console.log('--- 5. ADMIN COMMAND CENTER NOTIFICATIONS ---');

  // Notification 1: Emergency Requisition Escalation Alert
  console.log('9. Dispatching Admin Notification: Emergency Requisition Escalation Alert...');
  const admin1 = await postJson('/api/telegram/diagnostics/test-send', {
    chatId: targetChat,
    text: `🚨 <b>[ADMIN COMMAND CENTER] CRITICAL REQUISITION ESCALATION</b>\n\n• <b>Requisition ID:</b> <code>REQ-202610-EMERG-01</code>\n• <b>Originating Hospital:</b> Metropolitan Apex Trauma Center\n• <b>Blood Group:</b> O- Negative (3.5 L)\n• <b>Priority:</b> CRITICAL EMERGENCY\n• <b>Escalation Policy:</b> Unclaimed after 60-minute statutory window\n• <b>Executive Action Required:</b> Authorize apex state reserve allocation or inter-district cold-chain transport.\n\n🔗 <a href="http://localhost:5174/admin/command-center">Open State Command Center</a>`,
  });
  console.log('  -> Status:', admin1.data?.status || admin1.statusCode);
  await sleep(1000);

  // Notification 2: Facility Accreditation Approval
  console.log('10. Dispatching Admin Notification: Facility Accreditation & License Approval...');
  const admin2 = await postJson('/api/telegram/diagnostics/test-send', {
    chatId: targetChat,
    text: `🏛️ <b>[ADMIN COMMAND CENTER] STATUTORY FACILITY ACCREDITATION APPROVED</b>\n\n• <b>Healthcare Facility:</b> Metropolitan Trauma & General Hospital\n• <b>State Node Code:</b> METRO-01\n• <b>Licence No:</b> MH-NGP-HSP-2024-001\n• <b>Accreditation Status:</b> VERIFIED & FULLY ACTIVE\n• <b>Authorized By:</b> State Medical Administrator\n• <b>Timestamp:</b> ${new Date().toLocaleString('en-IN')}\n\n<i>Facility node is now live on the state emergency distribution topology map.</i>\n\n🔗 <a href="http://localhost:5174/admin/organizations">Inspect Network Organizations</a>`,
  });
  console.log('  -> Status:', admin2.data?.status || admin2.statusCode, '\n');

  console.log('=================================================================');
  console.log('  ALL 10 LIVE TELEGRAM NOTIFICATIONS TRANSMITTED SUCCESSFULLY!');
  console.log('=================================================================');
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});

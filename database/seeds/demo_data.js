/**
 * Demo data seed — Yahweh Care & Yahweh Property Care
 * Run: node database/seeds/demo_data.js
 */
const { neon } = require('@neondatabase/serverless')

const DB = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_GbCE3xsd5Teq@ep-little-cake-ahfjtrj2-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

const sql = neon(DB)

const YC  = '00000000-0000-0000-0000-000000000001' // Yahweh Care
const YPC = '00000000-0000-0000-0000-000000000002' // Yahweh Property Care

// ─── helpers ────────────────────────────────────────────────────────────────
const uuid = () => crypto.randomUUID()
const date = (daysOffset = 0) => {
  const d = new Date(); d.setDate(d.getDate() + daysOffset)
  return d.toISOString().slice(0, 10)
}
const past = (days) => date(-days)
const future = (days) => date(days)

// Fixed IDs — deterministic so the script is safely re-runnable
const depts = {
  yc_ops:      'a0000001-0000-0000-0000-000000000001',
  yc_clinical: 'a0000001-0000-0000-0000-000000000002',
  yc_admin:    'a0000001-0000-0000-0000-000000000003',
  yc_training: 'a0000001-0000-0000-0000-000000000004',
  ypc_ops:     'a0000002-0000-0000-0000-000000000001',
  ypc_maint:   'a0000002-0000-0000-0000-000000000002',
  ypc_admin:   'a0000002-0000-0000-0000-000000000003',
}
const pos = {
  yc_sw:     'b0000001-0000-0000-0000-000000000001',
  yc_csw:    'b0000001-0000-0000-0000-000000000002',
  yc_tl:     'b0000001-0000-0000-0000-000000000003',
  yc_rn:     'b0000001-0000-0000-0000-000000000004',
  yc_hr:     'b0000001-0000-0000-0000-000000000005',
  yc_coord:  'b0000001-0000-0000-0000-000000000006',
  ypc_pm:    'b0000002-0000-0000-0000-000000000001',
  ypc_tech:  'b0000002-0000-0000-0000-000000000002',
  ypc_coord: 'b0000002-0000-0000-0000-000000000003',
}
const emp = {
  e1:  'c0000001-0000-0000-0000-000000000001',
  e2:  'c0000001-0000-0000-0000-000000000002',
  e3:  'c0000001-0000-0000-0000-000000000003',
  e4:  'c0000001-0000-0000-0000-000000000004',
  e5:  'c0000001-0000-0000-0000-000000000005',
  e6:  'c0000001-0000-0000-0000-000000000006',
  e7:  'c0000001-0000-0000-0000-000000000007',
  e8:  'c0000001-0000-0000-0000-000000000008',
  e9:  'c0000001-0000-0000-0000-000000000009',
  e10: 'c0000001-0000-0000-0000-000000000010',
  e11: 'c0000001-0000-0000-0000-000000000011',
  e12: 'c0000001-0000-0000-0000-000000000012',
}
const pemp = {
  p1: 'c0000002-0000-0000-0000-000000000001',
  p2: 'c0000002-0000-0000-0000-000000000002',
  p3: 'c0000002-0000-0000-0000-000000000003',
  p4: 'c0000002-0000-0000-0000-000000000004',
  p5: 'c0000002-0000-0000-0000-000000000005',
  p6: 'c0000002-0000-0000-0000-000000000006',
}

async function run() {
  console.log('🌱 Seeding demo data...\n')

  // ── 1. Departments ────────────────────────────────────────────────────────
  console.log('Creating departments...')

  await sql`INSERT INTO departments (id, tenant_id, name, description) VALUES
    (${depts.yc_ops},      ${YC},  'Support Operations',    'Day-to-day NDIS support delivery'),
    (${depts.yc_clinical}, ${YC},  'Clinical Services',     'Nursing, allied health & clinical oversight'),
    (${depts.yc_admin},    ${YC},  'Administration',        'Finance, HR & compliance administration'),
    (${depts.yc_training}, ${YC},  'Training & Development','Staff learning and induction'),
    (${depts.ypc_ops},     ${YPC}, 'Property Operations',   'Property management & client services'),
    (${depts.ypc_maint},   ${YPC}, 'Maintenance',           'Reactive & preventative maintenance'),
    (${depts.ypc_admin},   ${YPC}, 'Administration',        'Finance & back-office support')
  ON CONFLICT DO NOTHING`

  // ── 2. Positions ──────────────────────────────────────────────────────────
  console.log('Creating positions...')

  await sql`INSERT INTO positions (id, tenant_id, department_id, title, is_participant_facing, is_risk_assessed) VALUES
    (${pos.yc_sw},    ${YC},  ${depts.yc_ops},      'Support Worker',              true,  true),
    (${pos.yc_csw},   ${YC},  ${depts.yc_ops},      'Community Support Worker',    true,  true),
    (${pos.yc_tl},    ${YC},  ${depts.yc_ops},      'Team Leader',                 true,  true),
    (${pos.yc_rn},    ${YC},  ${depts.yc_clinical}, 'Registered Nurse',            true,  true),
    (${pos.yc_hr},    ${YC},  ${depts.yc_admin},    'HR & Compliance Officer',     false, false),
    (${pos.yc_coord}, ${YC},  ${depts.yc_ops},      'Participant Coordinator',     true,  false),
    (${pos.ypc_pm},   ${YPC}, ${depts.ypc_ops},     'Property Manager',            false, false),
    (${pos.ypc_tech}, ${YPC}, ${depts.ypc_maint},   'Maintenance Technician',      false, true),
    (${pos.ypc_coord},${YPC}, ${depts.ypc_ops},     'Operations Coordinator',      false, false)
  ON CONFLICT DO NOTHING`

  // ── 3. Employees — Yahweh Care ───────────────────────────────────────────
  console.log('Creating employees (Yahweh Care)...')

  await sql`INSERT INTO employees
    (id, tenant_id, employee_number, first_name, last_name, email, phone,
     entity_name, department_id, position_id, employment_type,
     award_classification, annual_salary, start_date, probation_end_date,
     is_active, compliance_status, ndis_worker)
  VALUES
    (${emp.e1},  ${YC}, 'YC-001', 'Sarah',   'Johnson',   'sarah.johnson@yahwehcare.com.au',   '0412 111 001',
     'Yahweh Care Pty Ltd', ${depts.yc_admin},    ${pos.yc_hr},    'full_time',  'SCHADS Level 4', '75000', ${past(730)},  ${past(550)}, true,  'green', false),
    (${emp.e2},  ${YC}, 'YC-002', 'Michael', 'Okonkwo',   'michael.okonkwo@yahwehcare.com.au', '0412 111 002',
     'Yahweh Care Pty Ltd', ${depts.yc_ops},      ${pos.yc_tl},    'full_time',  'SCHADS Level 5', '82000', ${past(600)},  ${past(420)}, true,  'green', true),
    (${emp.e3},  ${YC}, 'YC-003', 'Priya',   'Sharma',    'priya.sharma@yahwehcare.com.au',    '0412 111 003',
     'Yahweh Care Pty Ltd', ${depts.yc_clinical}, ${pos.yc_rn},    'full_time',  'Nurses Award',   '95000', ${past(480)},  ${past(300)}, true,  'green', true),
    (${emp.e4},  ${YC}, 'YC-004', 'James',   'Williams',  'james.williams@yahwehcare.com.au',  '0412 111 004',
     'Yahweh Care Pty Ltd', ${depts.yc_ops},      ${pos.yc_sw},    'part_time',  'SCHADS Level 2', '42000', ${past(400)},  ${past(220)}, true,  'green', true),
    (${emp.e5},  ${YC}, 'YC-005', 'Amara',   'Ndiaye',    'amara.ndiaye@yahwehcare.com.au',    '0412 111 005',
     'Yahweh Care Pty Ltd', ${depts.yc_ops},      ${pos.yc_sw},    'casual',     'SCHADS Level 2', null,    ${past(365)},  ${past(185)}, true,  'amber', true),
    (${emp.e6},  ${YC}, 'YC-006', 'Emily',   'Chen',      'emily.chen@yahwehcare.com.au',      '0412 111 006',
     'Yahweh Care Pty Ltd', ${depts.yc_ops},      ${pos.yc_coord}, 'full_time',  'SCHADS Level 3', '65000', ${past(300)},  ${past(120)}, true,  'green', true),
    (${emp.e7},  ${YC}, 'YC-007', 'Daniel',  'Tran',      'daniel.tran@yahwehcare.com.au',     '0412 111 007',
     'Yahweh Care Pty Ltd', ${depts.yc_ops},      ${pos.yc_sw},    'casual',     'SCHADS Level 2', null,    ${past(200)},  ${past(20)},  true,  'green', true),
    (${emp.e8},  ${YC}, 'YC-008', 'Grace',   'Mutombo',   'grace.mutombo@yahwehcare.com.au',   '0412 111 008',
     'Yahweh Care Pty Ltd', ${depts.yc_ops},      ${pos.yc_csw},   'part_time',  'SCHADS Level 2', '38000', ${past(150)},  ${future(30)},true,  'amber', true),
    (${emp.e9},  ${YC}, 'YC-009', 'Liam',    'Nguyen',    'liam.nguyen@yahwehcare.com.au',     '0412 111 009',
     'Yahweh Care Pty Ltd', ${depts.yc_ops},      ${pos.yc_sw},    'casual',     'SCHADS Level 2', null,    ${past(90)},   ${future(90)},true,  'pending',true),
    (${emp.e10}, ${YC}, 'YC-010', 'Isabella','Martinez',  'isabella.martinez@yahwehcare.com.au','0412 111 010',
     'Yahweh Care Pty Ltd', ${depts.yc_ops},      ${pos.yc_sw},    'full_time',  'SCHADS Level 3', '60000', ${past(60)},   ${future(120)},true, 'pending',true),
    (${emp.e11}, ${YC}, 'YC-011', 'Noah',    'Abdullah',  'noah.abdullah@yahwehcare.com.au',   '0412 111 011',
     'Yahweh Care Pty Ltd', ${depts.yc_ops},      ${pos.yc_sw},    'casual',     'SCHADS Level 2', null,    ${past(30)},   ${future(150)},true, 'pending',true),
    (${emp.e12}, ${YC}, 'YC-012', 'Sophia',  'Papadopoulos','sophia.p@yahwehcare.com.au',      '0412 111 012',
     'Yahweh Care Pty Ltd', ${depts.yc_ops},      ${pos.yc_sw},    'part_time',  'SCHADS Level 2', '35000', ${past(500)},  ${past(320)}, false, 'green', true)
  ON CONFLICT (tenant_id, employee_number) DO NOTHING`

  // ── 4. Employees — Yahweh Property Care ──────────────────────────────────
  console.log('Creating employees (Yahweh Property Care)...')

  await sql`INSERT INTO employees
    (id, tenant_id, employee_number, first_name, last_name, email, phone,
     entity_name, department_id, position_id, employment_type,
     award_classification, annual_salary, start_date, probation_end_date,
     is_active, compliance_status, ndis_worker)
  VALUES
    (${pemp.p1}, ${YPC}, 'YPC-001', 'Ryan',     'Thompson',  'ryan.thompson@yahwehpc.com.au',   '0412 222 001',
     'Yahweh Property Care Pty Ltd', ${depts.ypc_ops},  ${pos.ypc_pm},    'full_time', 'Property Award L4', '78000', ${past(550)}, ${past(370)}, true, 'green', false),
    (${pemp.p2}, ${YPC}, 'YPC-002', 'Chloe',    'Anderson',  'chloe.anderson@yahwehpc.com.au',  '0412 222 002',
     'Yahweh Property Care Pty Ltd', ${depts.ypc_admin},${pos.ypc_coord},  'full_time', 'Clerical Award L3', '62000', ${past(400)}, ${past(220)}, true, 'green', false),
    (${pemp.p3}, ${YPC}, 'YPC-003', 'Hassan',   'Ibrahim',   'hassan.ibrahim@yahwehpc.com.au',  '0412 222 003',
     'Yahweh Property Care Pty Ltd', ${depts.ypc_maint},${pos.ypc_tech},   'full_time', 'Maintenance Award', '68000', ${past(300)}, ${past(120)}, true, 'green', false),
    (${pemp.p4}, ${YPC}, 'YPC-004', 'Mei',      'Zhang',     'mei.zhang@yahwehpc.com.au',       '0412 222 004',
     'Yahweh Property Care Pty Ltd', ${depts.ypc_maint},${pos.ypc_tech},   'casual',    'Maintenance Award', null,    ${past(200)}, ${past(20)},  true, 'amber', false),
    (${pemp.p5}, ${YPC}, 'YPC-005', 'Thomas',   'Osei',      'thomas.osei@yahwehpc.com.au',     '0412 222 005',
     'Yahweh Property Care Pty Ltd', ${depts.ypc_maint},${pos.ypc_tech},   'casual',    'Maintenance Award', null,    ${past(100)}, ${future(80)},true, 'pending',false),
    (${pemp.p6}, ${YPC}, 'YPC-006', 'Natalie',  'Foster',    'natalie.foster@yahwehpc.com.au',  '0412 222 006',
     'Yahweh Property Care Pty Ltd', ${depts.ypc_ops},  ${pos.ypc_pm},    'part_time', 'Property Award L3', '52000', ${past(60)},  ${future(120)},true,'pending',false)
  ON CONFLICT (tenant_id, employee_number) DO NOTHING`

  // ── 5. Payroll records — Yahweh Care (last 6 fortnights) ─────────────────
  // Query actual IDs back from DB (employees may have been inserted in a prior run with different UUIDs)
  console.log('Creating payroll records...')
  const ycRows  = await sql`SELECT id, employee_number FROM employees WHERE tenant_id = ${YC} AND is_active = true AND employee_number != 'YC-012'`
  const ypcRows = await sql`SELECT id, employee_number FROM employees WHERE tenant_id = ${YPC}`

  const salaryByNumber = {
    'YC-001':75000,'YC-002':82000,'YC-003':95000,'YC-004':42000,'YC-005':32000,
    'YC-006':65000,'YC-007':28000,'YC-008':38000,'YC-009':24000,'YC-010':60000,'YC-011':22000,
  }
  const ypcSalaryByNumber = {
    'YPC-001':78000,'YPC-002':62000,'YPC-003':68000,'YPC-004':28000,'YPC-005':22000,'YPC-006':52000,
  }

  const activeYCEmps = ycRows.map(r => ({ id: r.id, salary: salaryByNumber[r.employee_number] ?? 30000 }))
  const salaries = {} // unused, kept for compat — replaced by activeYCEmps

  const payPeriods = [
    { start: past(83), end: past(70) },
    { start: past(69), end: past(56) },
    { start: past(55), end: past(42) },
    { start: past(41), end: past(28) },
    { start: past(27), end: past(14) },
    { start: past(13), end: past(1)  },
  ]

  for (const period of payPeriods) {
    for (const { id: eid, salary: annualSal } of activeYCEmps) {
      const fortnight = parseFloat((annualSal / 26).toFixed(2))
      const super_    = parseFloat((fortnight * 0.115).toFixed(2))
      const payg      = parseFloat((fortnight * 0.19).toFixed(2))
      const net       = parseFloat((fortnight - payg - super_).toFixed(2))
      await sql`INSERT INTO payroll_records
        (id, tenant_id, employee_id, period_start, period_end,
         gross_pay, payg_withholding, super_contribution, net_pay, status)
      VALUES
        (${uuid()}, ${YC}, ${eid}, ${period.start}, ${period.end},
         ${fortnight}, ${payg}, ${super_}, ${net}, 'paid')
      ON CONFLICT DO NOTHING`
    }
  }

  // YPC — last 3 fortnights
  const activeYPCEmps = ypcRows.map(r => ({ id: r.id, salary: ypcSalaryByNumber[r.employee_number] ?? 30000 }))
  const ypcPeriods = [
    { start: past(41), end: past(28) },
    { start: past(27), end: past(14) },
    { start: past(13), end: past(1)  },
  ]
  for (const period of ypcPeriods) {
    for (const { id: eid, salary: annualSal } of activeYPCEmps) {
      const fortnight = parseFloat((annualSal / 26).toFixed(2))
      const super_    = parseFloat((fortnight * 0.115).toFixed(2))
      const payg      = parseFloat((fortnight * 0.19).toFixed(2))
      const net       = parseFloat((fortnight - payg - super_).toFixed(2))
      await sql`INSERT INTO payroll_records
        (id, tenant_id, employee_id, period_start, period_end,
         gross_pay, payg_withholding, super_contribution, net_pay, status)
      VALUES
        (${uuid()}, ${YPC}, ${eid}, ${period.start}, ${period.end},
         ${fortnight}, ${payg}, ${super_}, ${net}, 'paid')
      ON CONFLICT DO NOTHING`
    }
  }

  // Build employee_number → id lookup for leave & documents
  const allEmpRows = await sql`SELECT id, employee_number, tenant_id FROM employees WHERE tenant_id IN (${YC}, ${YPC})`
  const eid = Object.fromEntries(allEmpRows.map(r => [r.employee_number, r.id]))

  // ── 6. Leave requests ─────────────────────────────────────────────────────
  console.log('Creating leave requests...')
  const leaveData = [
    [YC,  eid['YC-004'], 'annual',   past(30),   past(26),    5, 'Family holiday',             'approved'],
    [YC,  eid['YC-003'], 'personal', past(10),   past(9),     2, 'Medical appointment',        'approved'],
    [YC,  eid['YC-005'], 'annual',   future(7),  future(13),  5, 'Pre-approved annual leave',  'pending'],
    [YC,  eid['YC-007'], 'annual',   future(14), future(18),  3, 'Personal travel',            'pending'],
    [YC,  eid['YC-002'], 'sick',     past(5),    past(5),     1, 'Sick day',                   'approved'],
    [YC,  eid['YC-006'], 'annual',   future(21), future(25),  3, 'Family event',               'pending'],
    [YPC, eid['YPC-003'],'annual',   past(20),   past(16),    5, 'Booked holiday',             'approved'],
    [YPC, eid['YPC-002'],'sick',     past(3),    past(3),     1, 'Unwell',                     'approved'],
    [YPC, eid['YPC-004'],'annual',   future(10), future(14),  3, 'Break',                      'pending'],
  ]
  for (const [tid, empId, ltype, s, e, days, reason, status] of leaveData) {
    if (!empId) continue
    await sql`INSERT INTO leave_requests
      (id, tenant_id, employee_id, leave_type, start_date, end_date, total_days, reason, status)
    VALUES (${uuid()}, ${tid}, ${empId}, ${ltype}, ${s}, ${e}, ${days}, ${reason}, ${status})
    ON CONFLICT DO NOTHING`
  }

  // ── 7. Documents (some expiring soon) ────────────────────────────────────
  console.log('Creating documents...')
  const docData = [
    [YC,  eid['YC-004'], 'screening',    'Police Check — James Williams',        'https://placeholder.blob/police-jw.pdf',   'active', future(15)],
    [YC,  eid['YC-005'], 'screening',    'NDIS Worker Screening — Amara Ndiaye', 'https://placeholder.blob/ndis-an.pdf',     'active', future(8)],
    [YC,  eid['YC-008'], 'screening',    'Working With Children Check — Grace M', 'https://placeholder.blob/wwcc-gm.pdf',   'active', past(5)],
    [YC,  eid['YC-003'], 'certification','First Aid Certificate — Priya Sharma',  'https://placeholder.blob/fa-ps.pdf',      'active', future(45)],
    [YC,  eid['YC-002'], 'contract',     'Employment Contract — Michael Okonkwo', 'https://placeholder.blob/contract-mo.pdf','active', null],
    [YC,  eid['YC-001'], 'policy',       'Code of Conduct Acknowledgement',       'https://placeholder.blob/coc-sj.pdf',    'active', null],
    [YPC, eid['YPC-003'],'certification','White Card — Hassan Ibrahim',            'https://placeholder.blob/wc-hi.pdf',     'active', future(20)],
    [YPC, eid['YPC-004'],'screening',    'Police Check — Mei Zhang',              'https://placeholder.blob/police-mz.pdf', 'active', past(3)],
  ]
  for (const [tid, empId, cat, title, url, status, expiry] of docData) {
    if (!empId) continue
    await sql`INSERT INTO documents
      (id, tenant_id, employee_id, category, title, blob_url, status, expiry_date)
    VALUES (${uuid()}, ${tid}, ${empId}, ${cat}, ${title}, ${url}, ${status}, ${expiry})
    ON CONFLICT DO NOTHING`
  }

  // ── 8. Public holidays (upcoming AU national + NSW) ───────────────────────
  console.log('Creating public holidays...')
  const yr = new Date().getFullYear()
  const holidays = [
    { name: 'Christmas Day',            date: `${yr}-12-25`, national: true,  state: null },
    { name: 'Boxing Day',               date: `${yr}-12-26`, national: true,  state: null },
    { name: "New Year's Day",           date: `${yr+1}-01-01`,national: true, state: null },
    { name: 'Australia Day',            date: `${yr+1}-01-27`,national: true, state: null },
    { name: 'Good Friday',              date: `${yr+1}-04-03`,national: true, state: null },
    { name: 'Easter Saturday',          date: `${yr+1}-04-04`,national: false, state: 'NSW' },
    { name: 'Easter Sunday',            date: `${yr+1}-04-05`,national: false, state: 'NSW' },
    { name: 'Easter Monday',            date: `${yr+1}-04-06`,national: true, state: null },
    { name: 'ANZAC Day',                date: `${yr+1}-04-25`,national: true, state: null },
    { name: "Queen's Birthday (NSW)",   date: `${yr+1}-06-09`,national: false,state: 'NSW' },
    { name: 'Bank Holiday (NSW)',        date: `${yr+1}-08-04`,national: false,state: 'NSW' },
    { name: 'Labour Day (NSW)',          date: `${yr+1}-10-06`,national: false,state: 'NSW' },
  ]

  for (const h of holidays) {
    // Only insert future holidays
    if (h.date < date()) continue
    for (const tid of [YC, YPC]) {
      await sql`INSERT INTO public_holidays (id, tenant_id, name, date, country, state, is_national)
        VALUES (${uuid()}, ${tid}, ${h.name}, ${h.date}, 'AU', ${h.state}, ${h.national})
        ON CONFLICT DO NOTHING`
    }
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  const [{ count: empCount }] = await sql`SELECT COUNT(*) FROM employees WHERE tenant_id = ${YC}`
  const [{ count: payCount }] = await sql`SELECT COUNT(*) FROM payroll_records WHERE tenant_id = ${YC}`
  const [{ count: leaveCount}] = await sql`SELECT COUNT(*) FROM leave_requests WHERE tenant_id IN (${YC},${YPC})`
  const [{ count: docCount  }] = await sql`SELECT COUNT(*) FROM documents WHERE tenant_id IN (${YC},${YPC})`
  const [{ count: phCount   }] = await sql`SELECT COUNT(*) FROM public_holidays WHERE tenant_id = ${YC}`

  console.log('\n✅ Seed complete:')
  console.log(`   Employees (YC): ${empCount}`)
  console.log(`   Payroll records (YC): ${payCount}`)
  console.log(`   Leave requests: ${leaveCount}`)
  console.log(`   Documents: ${docCount}`)
  console.log(`   Public holidays: ${phCount}`)
}

run().catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1) })

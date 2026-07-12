// ─────────────────────────────────────────────────────────────
// Country → Currency mapping
// ─────────────────────────────────────────────────────────────

export const COUNTRY_CURRENCY: Record<string, string> = {
  AU: 'AUD', NZ: 'NZD', US: 'USD', CA: 'CAD',
  GB: 'GBP', IE: 'EUR', DE: 'EUR', FR: 'EUR',
  NL: 'EUR', BE: 'EUR', IT: 'EUR', ES: 'EUR',
  SE: 'SEK', NO: 'NOK', DK: 'DKK', CH: 'CHF',
  SG: 'SGD', MY: 'MYR', PH: 'PHP', IN: 'INR',
  AE: 'AED', SA: 'SAR', ZA: 'ZAR', JP: 'JPY',
  HK: 'HKD', CN: 'CNY', KR: 'KRW', TH: 'THB',
  ID: 'IDR', VN: 'VND', PK: 'PKR', BD: 'BDT',
}

export const CURRENCY_SYMBOL: Record<string, string> = {
  AUD: 'A$',  NZD: 'NZ$', USD: '$',   CAD: 'C$',
  GBP: '£',   EUR: '€',   SGD: 'S$',  MYR: 'RM',
  PHP: '₱',   INR: '₹',   AED: 'د.إ', SAR: '﷼',
  ZAR: 'R',   JPY: '¥',   HKD: 'HK$', CNY: '¥',
  KRW: '₩',   THB: '฿',   IDR: 'Rp',  VND: '₫',
  SEK: 'kr',  NOK: 'kr',  DKK: 'kr',  CHF: 'CHF',
}

// ─────────────────────────────────────────────────────────────
// Country list for dropdowns
// ─────────────────────────────────────────────────────────────

export const COUNTRIES = [
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'IN', name: 'India' },
  { code: 'AE', name: 'UAE' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'JP', name: 'Japan' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
]

// ─────────────────────────────────────────────────────────────
// Timezones by country
// ─────────────────────────────────────────────────────────────

export const COUNTRY_TIMEZONES: Record<string, string[]> = {
  AU: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth', 'Australia/Adelaide', 'Australia/Darwin'],
  NZ: ['Pacific/Auckland', 'Pacific/Chatham'],
  US: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu'],
  CA: ['America/Toronto', 'America/Winnipeg', 'America/Edmonton', 'America/Vancouver'],
  GB: ['Europe/London'],
  IE: ['Europe/Dublin'],
  DE: ['Europe/Berlin'],
  FR: ['Europe/Paris'],
  ES: ['Europe/Madrid'],
  IT: ['Europe/Rome'],
  NL: ['Europe/Amsterdam'],
  BE: ['Europe/Brussels'],
  SE: ['Europe/Stockholm'],
  NO: ['Europe/Oslo'],
  DK: ['Europe/Copenhagen'],
  CH: ['Europe/Zurich'],
  SG: ['Asia/Singapore'],
  MY: ['Asia/Kuala_Lumpur'],
  PH: ['Asia/Manila'],
  IN: ['Asia/Kolkata'],
  AE: ['Asia/Dubai'],
  SA: ['Asia/Riyadh'],
  ZA: ['Africa/Johannesburg'],
  JP: ['Asia/Tokyo'],
  HK: ['Asia/Hong_Kong'],
  KR: ['Asia/Seoul'],
  CN: ['Asia/Shanghai'],
}

// ─────────────────────────────────────────────────────────────
// Payroll provider type
// ─────────────────────────────────────────────────────────────

export type PayrollProvider = {
  id:          string
  name:        string
  logo:        string          // 2-3 char abbreviation shown in avatar
  color:       string          // brand hex colour
  website:     string
  description: string
  countries:   string[]        // ISO-2 codes; 'GLOBAL' = shown for every country
  features:    string[]
  authType:    'oauth2' | 'api_key' | 'manual'
}

// ─────────────────────────────────────────────────────────────
// Payroll providers — 80+ across 27 countries + Global
// Providers with countries: ['GLOBAL'] appear for every country
// ─────────────────────────────────────────────────────────────

export const PAYROLL_PROVIDERS: PayrollProvider[] = [

  // ── Australia ────────────────────────────────────────────────
  {
    id: 'xero', name: 'Xero', logo: 'XE', color: '#13B5EA',
    website: 'https://xero.com',
    description: 'Cloud accounting & payroll for AU/NZ/UK businesses',
    countries: ['AU', 'NZ', 'GB'],
    features: ['Single Touch Payroll', 'Super', 'PAYG', 'Leave', 'Timesheets'],
    authType: 'oauth2',
  },
  {
    id: 'myob', name: 'MYOB', logo: 'MY', color: '#8B2CF5',
    website: 'https://myob.com',
    description: 'Leading AU/NZ accounting and payroll platform',
    countries: ['AU', 'NZ'],
    features: ['STP2', 'Super Stream', 'Awards', 'Leave', 'JobKeeper'],
    authType: 'oauth2',
  },
  {
    id: 'employment_hero', name: 'Employment Hero', logo: 'EH', color: '#FF6B35',
    website: 'https://employmenthero.com',
    description: 'HR, payroll & benefits platform for AU, NZ, SG',
    countries: ['AU', 'NZ', 'SG'],
    features: ['STP2', 'Super', 'Award Interpretation', 'Leave', 'Rostering'],
    authType: 'api_key',
  },
  {
    id: 'keypay', name: 'KeyPay', logo: 'KP', color: '#00B4D8',
    website: 'https://keypay.com',
    description: 'Award-based payroll automation for AU, NZ, GB, CA, SG',
    countries: ['AU', 'NZ', 'GB', 'CA', 'SG'],
    features: ['Award Automation', 'STP2', 'Leave', 'Timesheets', 'Rostering'],
    authType: 'api_key',
  },
  {
    id: 'micropay', name: 'MicrOpay', logo: 'MP', color: '#0369A1',
    website: 'https://micropay.com.au',
    description: 'Enterprise payroll for large Australian organisations',
    countries: ['AU'],
    features: ['STP2', 'Award Engine', 'Super', 'Leave', 'Custom Reporting'],
    authType: 'manual',
  },
  {
    id: 'paycat', name: 'PayCat', logo: 'PC', color: '#7C3AED',
    website: 'https://paycat.com.au',
    description: 'Simple online payroll for small Australian businesses',
    countries: ['AU'],
    features: ['STP', 'Super', 'Leave', 'Payslips', 'ATO Reporting'],
    authType: 'api_key',
  },

  // ── New Zealand ───────────────────────────────────────────────
  {
    id: 'smartly', name: 'Smartly', logo: 'SM', color: '#10B981',
    website: 'https://smartly.nz',
    description: 'NZ payroll managed service with expert support',
    countries: ['NZ'],
    features: ['Payday Filing', 'KiwiSaver', 'Leave', 'Payslips', 'Managed Service'],
    authType: 'api_key',
  },
  {
    id: 'ipayroll', name: 'iPayroll', logo: 'iP', color: '#2563EB',
    website: 'https://ipayroll.co.nz',
    description: 'NZ cloud payroll with IRD integration',
    countries: ['NZ'],
    features: ['Payday Filing', 'KiwiSaver', 'Leave', 'Timesheets', 'IRD Reporting'],
    authType: 'api_key',
  },

  // ── United States ─────────────────────────────────────────────
  {
    id: 'adp', name: 'ADP', logo: 'ADP', color: '#E20000',
    website: 'https://adp.com',
    description: 'Enterprise payroll and HCM for mid-large US businesses',
    countries: ['US', 'CA'],
    features: ['Federal & State Tax', 'W-2/1099', 'Direct Deposit', 'Benefits', 'Time & Attendance'],
    authType: 'api_key',
  },
  {
    id: 'paychex', name: 'Paychex', logo: 'PX', color: '#004B87',
    website: 'https://paychex.com',
    description: 'Full-service payroll and HR for US small-mid businesses',
    countries: ['US'],
    features: ['Tax Filing', 'Direct Deposit', 'Benefits', 'Workers Comp', 'HR Tools'],
    authType: 'api_key',
  },
  {
    id: 'gusto', name: 'Gusto', logo: 'GU', color: '#F46D25',
    website: 'https://gusto.com',
    description: 'Modern payroll, benefits & HR for US startups and SMBs',
    countries: ['US'],
    features: ['Automated Tax', 'Benefits', 'Direct Deposit', 'Contractors', 'Time Tracking'],
    authType: 'oauth2',
  },
  {
    id: 'quickbooks_payroll', name: 'QuickBooks Payroll', logo: 'QB', color: '#2CA01C',
    website: 'https://quickbooks.intuit.com/payroll',
    description: 'Payroll integrated with QuickBooks accounting',
    countries: ['US'],
    features: ['Same-day Direct Deposit', 'Tax Penalty Protection', 'Benefits', '1099 Contractors'],
    authType: 'oauth2',
  },
  {
    id: 'workday', name: 'Workday', logo: 'WD', color: '#F97316',
    website: 'https://workday.com',
    description: 'Enterprise cloud HCM and global payroll suite',
    countries: ['US', 'CA', 'GB', 'AU', 'GLOBAL'],
    features: ['Global Payroll', 'HCM', 'Financial Management', 'Analytics', 'Compliance'],
    authType: 'manual',
  },
  {
    id: 'paylocity', name: 'Paylocity', logo: 'PLY', color: '#0EA5E9',
    website: 'https://paylocity.com',
    description: 'Cloud payroll and HCM for US mid-market',
    countries: ['US'],
    features: ['Tax Compliance', 'Benefits Admin', 'Talent', 'Time & Labor', 'Analytics'],
    authType: 'api_key',
  },

  // ── Canada ────────────────────────────────────────────────────
  {
    id: 'ceridian_dayforce', name: 'Ceridian Dayforce', logo: 'CD', color: '#FF5A1F',
    website: 'https://dayforce.com',
    description: 'Global HCM platform with Canadian payroll expertise',
    countries: ['CA', 'US', 'GB', 'AU'],
    features: ['CRA Compliance', 'ROE', 'T4/RL-1', 'Benefits', 'Time & Attendance'],
    authType: 'manual',
  },
  {
    id: 'wagepoint', name: 'Wagepoint', logo: 'WGP', color: '#6366F1',
    website: 'https://wagepoint.com',
    description: 'Simple Canadian payroll for small businesses',
    countries: ['CA'],
    features: ['CRA Remittance', 'T4 Filing', 'Direct Deposit', 'ROE', 'Vacation Pay'],
    authType: 'api_key',
  },
  {
    id: 'rise_people', name: 'Rise People', logo: 'RP', color: '#14B8A6',
    website: 'https://risepeople.com',
    description: 'Canadian HR and payroll all-in-one platform',
    countries: ['CA'],
    features: ['CRA Compliance', 'T4/ROE', 'Benefits', 'Time Off', 'Onboarding'],
    authType: 'api_key',
  },

  // ── United Kingdom ────────────────────────────────────────────
  {
    id: 'sage_payroll', name: 'Sage Payroll', logo: 'SG', color: '#00DC82',
    website: 'https://sage.com/en-gb/payroll',
    description: 'UK payroll, HR & accounting for businesses of all sizes',
    countries: ['GB', 'IE', 'ES'],
    features: ['RTI', 'Auto Enrolment', 'P60/P45', 'HMRC Filing', 'CIS'],
    authType: 'api_key',
  },
  {
    id: 'brightpay', name: 'BrightPay', logo: 'BP', color: '#3B82F6',
    website: 'https://brightpay.co.uk',
    description: 'Award-winning UK & Ireland payroll software',
    countries: ['GB', 'IE'],
    features: ['RTI', 'Auto Enrolment', 'P11D', 'CIS', 'Employee App'],
    authType: 'api_key',
  },
  {
    id: 'iris_payroll', name: 'IRIS Payroll', logo: 'IR', color: '#7C3AED',
    website: 'https://iris.co.uk/payroll',
    description: 'UK payroll for accountants and businesses',
    countries: ['GB'],
    features: ['RTI', 'Auto Enrolment', 'Bureau Payroll', 'P60/P11D', 'Expenses'],
    authType: 'api_key',
  },
  {
    id: 'moorepay', name: 'Moorepay', logo: 'MR', color: '#1D4ED8',
    website: 'https://moorepay.co.uk',
    description: 'UK payroll & HR managed service',
    countries: ['GB'],
    features: ['RTI', 'Pension Auto-enrol', 'HR Advisory', 'Managed Payroll', 'Time & Attendance'],
    authType: 'manual',
  },

  // ── Ireland ───────────────────────────────────────────────────
  {
    id: 'thesaurus_payroll', name: 'Thesaurus Payroll', logo: 'TP', color: '#059669',
    website: 'https://thesauruspayroll.ie',
    description: "Ireland's leading payroll software for employers",
    countries: ['IE'],
    features: ['Revenue Integration', 'PRSI', 'USC', 'P30/P60', 'BIK'],
    authType: 'api_key',
  },

  // ── India ─────────────────────────────────────────────────────
  {
    id: 'greythr', name: 'greytHR', logo: 'GH', color: '#1E40AF',
    website: 'https://greythr.com',
    description: "India's largest cloud-based HR & payroll platform",
    countries: ['IN'],
    features: ['PF / ESI', 'TDS', 'Form 16', 'Statutory Compliance', 'Leave'],
    authType: 'api_key',
  },
  {
    id: 'zoho_payroll', name: 'Zoho Payroll', logo: 'ZP', color: '#E74C3C',
    website: 'https://zoho.com/payroll',
    description: 'Payroll & compliance for Indian businesses by Zoho',
    countries: ['IN', 'AE'],
    features: ['PF / ESI / TDS', 'Form 24Q', 'Payslips', 'Leave', 'Direct Deposit'],
    authType: 'api_key',
  },
  {
    id: 'keka', name: 'Keka', logo: 'KK', color: '#8B5CF6',
    website: 'https://keka.com',
    description: 'Modern HR & payroll for growing Indian businesses',
    countries: ['IN'],
    features: ['PF / ESI / PT', 'TDS', 'Flexi Benefits', 'Leave', 'Attendance'],
    authType: 'api_key',
  },
  {
    id: 'razorpayx', name: 'RazorpayX Payroll', logo: 'RX', color: '#072654',
    website: 'https://razorpay.com/payroll',
    description: 'Automated payroll with instant salary disbursement',
    countries: ['IN'],
    features: ['Instant Payout', 'TDS / PF / ESI', 'Form 16', 'Compliance', 'Payslips'],
    authType: 'api_key',
  },
  {
    id: 'saral_paypack', name: 'Saral PayPack', logo: 'SPP', color: '#DC2626',
    website: 'https://saralpaypack.com',
    description: 'Comprehensive Indian payroll and HR software',
    countries: ['IN'],
    features: ['Full Statutory Compliance', 'PF / ESI / PT', 'TDS', 'Form 16', 'Payslips'],
    authType: 'api_key',
  },
  {
    id: 'hrmantra', name: 'HRMantra', logo: 'HM', color: '#B45309',
    website: 'https://hrmantra.com',
    description: 'AI-driven HRMS and payroll for Indian enterprises',
    countries: ['IN'],
    features: ['Multi-Location Payroll', 'PF / ESI / TDS', 'Biometric Integration', 'Leave', 'Analytics'],
    authType: 'api_key',
  },

  // ── Singapore ─────────────────────────────────────────────────
  {
    id: 'talenox', name: 'Talenox', logo: 'TX', color: '#4F46E5',
    website: 'https://talenox.com',
    description: 'Payroll and HR for Singapore, Malaysia and Hong Kong',
    countries: ['SG', 'MY', 'HK'],
    features: ['CPF / EPF', 'IR8A / EA Form', 'Leave', 'Payslips', 'MOM Compliance'],
    authType: 'api_key',
  },
  {
    id: 'info_tech', name: 'Info-Tech Systems', logo: 'ITS', color: '#0F766E',
    website: 'https://info-tech.com.sg',
    description: 'Singapore MOM-compliant payroll and HR system',
    countries: ['SG'],
    features: ['CPF Submission', 'IR8A/IR21', 'Leave', 'Claims', 'Timesheet'],
    authType: 'api_key',
  },
  {
    id: 'payboy', name: 'Payboy', logo: 'PBY', color: '#0891B2',
    website: 'https://payboy.biz',
    description: 'Singapore payroll & HR with MOM compliance tools',
    countries: ['SG'],
    features: ['CPF e-Submission', 'IR8A', 'Leave', 'Claims', 'Shift Scheduling'],
    authType: 'api_key',
  },

  // ── Malaysia ──────────────────────────────────────────────────
  {
    id: 'autocount_payroll', name: 'AutoCount Payroll', logo: 'ACP', color: '#1D4ED8',
    website: 'https://autocount.my',
    description: 'Malaysia payroll with EPF, SOCSO, and LHDN compliance',
    countries: ['MY'],
    features: ['EPF / SOCSO / EIS', 'PCB Tax', 'EA Form', 'CP39', 'Payslips'],
    authType: 'manual',
  },
  {
    id: 'briohr', name: 'BrioHR', logo: 'BRH', color: '#7C3AED',
    website: 'https://briohr.com',
    description: 'HR and payroll platform for Malaysian SMBs',
    countries: ['MY'],
    features: ['EPF / SOCSO', 'PCB', 'EA Form', 'Leave', 'Expense Claims'],
    authType: 'api_key',
  },
  {
    id: 'payrollpanda', name: 'PayrollPanda', logo: 'PRP', color: '#BE185D',
    website: 'https://payrollpanda.my',
    description: 'Simple automated payroll for Malaysian businesses',
    countries: ['MY'],
    features: ['EPF / SOCSO / EIS', 'PCB', 'EA Form', 'Leave', 'Payslips'],
    authType: 'api_key',
  },
  {
    id: 'swingvy', name: 'Swingvy', logo: 'SWV', color: '#FF6B6B',
    website: 'https://swingvy.com',
    description: 'HR and payroll for Malaysia, Singapore and South Korea',
    countries: ['MY', 'SG', 'KR'],
    features: ['EPF / SOCSO', 'PCB Tax', 'Leave', 'Claims', 'Benefits'],
    authType: 'api_key',
  },

  // ── Philippines ───────────────────────────────────────────────
  {
    id: 'sprout_solutions', name: 'Sprout Solutions', logo: 'SPS', color: '#16A34A',
    website: 'https://sprout.ph',
    description: 'Philippine payroll and HR with BIR, SSS, PhilHealth compliance',
    countries: ['PH'],
    features: ['BIR / SSS / PhilHealth / Pag-IBIG', 'Alphalist', 'Payslips', 'Leave', 'Loans'],
    authType: 'api_key',
  },
  {
    id: 'greatday_hr', name: 'GreatDay HR', logo: 'GDH', color: '#DC2626',
    website: 'https://greatdayhr.com',
    description: 'Filipino HRIS and payroll with government compliance',
    countries: ['PH'],
    features: ['BIR / SSS / PhilHealth / Pag-IBIG', 'Leave', 'Attendance', 'Mobile App'],
    authType: 'api_key',
  },
  {
    id: 'payrollhero', name: 'PayrollHero', logo: 'PRH', color: '#9333EA',
    website: 'https://payrollhero.com',
    description: 'Cloud payroll for Philippines, Singapore and Canada',
    countries: ['PH', 'SG', 'CA'],
    features: ['BIR Filing', 'Government Remittance', 'Scheduling', 'Attendance', 'Payslips'],
    authType: 'api_key',
  },

  // ── UAE ───────────────────────────────────────────────────────
  {
    id: 'bayzat', name: 'Bayzat', logo: 'BYZ', color: '#0EA5E9',
    website: 'https://bayzat.com',
    description: 'UAE HR, payroll and benefits management platform',
    countries: ['AE'],
    features: ['WPS Compliance', 'Gratuity', 'Leave', 'Medical Insurance', 'Payslips'],
    authType: 'api_key',
  },
  {
    id: 'facthr', name: 'factoHR', logo: 'FHR', color: '#7C3AED',
    website: 'https://factohr.com',
    description: 'Mobile-first HR & payroll for UAE and India',
    countries: ['AE', 'IN'],
    features: ['WPS / EOSB', 'Attendance', 'Leave', 'Payslips', 'HR Analytics'],
    authType: 'api_key',
  },

  // ── Saudi Arabia ──────────────────────────────────────────────
  {
    id: 'menaitech', name: 'Menaitech', logo: 'MNT', color: '#166534',
    website: 'https://menaitech.com',
    description: 'Arabic HR and payroll for Saudi and GCC businesses',
    countries: ['SA', 'AE'],
    features: ['GOSI Compliance', 'MUDAD', 'EOSB / Gratuity', 'Leave', 'Arabic UI'],
    authType: 'api_key',
  },
  {
    id: 'zenhr', name: 'ZenHR', logo: 'ZHR', color: '#0891B2',
    website: 'https://zenhr.com',
    description: 'MENA-focused HR and payroll cloud platform',
    countries: ['SA', 'AE'],
    features: ['GOSI / DEWS', 'Gratuity', 'Arabic Support', 'Leave', 'Payslips'],
    authType: 'api_key',
  },
  {
    id: 'sap_successfactors', name: 'SAP SuccessFactors', logo: 'SAP', color: '#0080FF',
    website: 'https://sap.com/successfactors',
    description: 'Enterprise cloud HCM and global payroll by SAP',
    countries: ['SA', 'DE', 'FR', 'NL', 'BE', 'GLOBAL'],
    features: ['Global Payroll', 'HCM', 'Compliance', 'Analytics', 'Employee Central'],
    authType: 'manual',
  },

  // ── Germany ───────────────────────────────────────────────────
  {
    id: 'datev', name: 'DATEV', logo: 'DTV', color: '#005F9E',
    website: 'https://datev.de',
    description: "Germany's leading payroll and accounting platform for tax advisors",
    countries: ['DE'],
    features: ['ELSTAM', 'Social Insurance', 'Wage Tax', 'Minijob', 'DEÜV'],
    authType: 'manual',
  },
  {
    id: 'personio', name: 'Personio', logo: 'PS', color: '#00B4A0',
    website: 'https://personio.com',
    description: 'HR and payroll platform for European SMBs',
    countries: ['DE', 'GB', 'IE', 'ES', 'NL', 'FR'],
    features: ['Payroll Processing', 'Tax Reporting', 'Leave', 'Absence', 'HR Analytics'],
    authType: 'api_key',
  },

  // ── France ────────────────────────────────────────────────────
  {
    id: 'silae', name: 'Silae', logo: 'SLI', color: '#7C2D12',
    website: 'https://silae.fr',
    description: 'French payroll bureau software used by 50,000+ companies',
    countries: ['FR'],
    features: ['DSN', 'Prévoyance', 'Mutuelle', 'Congés', 'URSSAF Compliance'],
    authType: 'manual',
  },
  {
    id: 'payfit', name: 'PayFit', logo: 'PFT', color: '#6366F1',
    website: 'https://payfit.com',
    description: 'Automated payroll for France, Spain, UK and Germany',
    countries: ['FR', 'ES', 'GB', 'DE'],
    features: ['DSN / Payslips', 'URSSAF', 'SEPA', 'Leave', 'HR Portal'],
    authType: 'api_key',
  },
  {
    id: 'cegid', name: 'Cegid', logo: 'CGD', color: '#DC2626',
    website: 'https://cegid.com',
    description: 'French enterprise payroll and HCM solutions',
    countries: ['FR', 'ES'],
    features: ['DSN Filing', 'Collective Agreements', 'Leave', 'HR Management', 'Analytics'],
    authType: 'manual',
  },

  // ── Spain ─────────────────────────────────────────────────────
  {
    id: 'a3_software', name: 'A3 Software', logo: 'A3S', color: '#1D4ED8',
    website: 'https://a3software.com',
    description: 'Spanish payroll software for businesses and advisors',
    countries: ['ES'],
    features: ['Seguridad Social', 'IRPF', 'Nóminas', 'Contratos', 'Siltra'],
    authType: 'manual',
  },

  // ── Italy ─────────────────────────────────────────────────────
  {
    id: 'zucchetti', name: 'Zucchetti', logo: 'ZUC', color: '#16A34A',
    website: 'https://zucchetti.com',
    description: "Italy's leading HR and payroll management system",
    countries: ['IT'],
    features: ['INPS / INAIL', 'F24', 'CU / 770', 'Leave', 'HR Management'],
    authType: 'manual',
  },
  {
    id: 'teamsystem', name: 'TeamSystem', logo: 'TSY', color: '#9333EA',
    website: 'https://teamsystem.com',
    description: 'Italian digital payroll and accounting platform',
    countries: ['IT'],
    features: ['INPS Compliance', 'F24 Filing', 'Buste Paga', 'Leave', 'Presenze'],
    authType: 'api_key',
  },

  // ── Netherlands ───────────────────────────────────────────────
  {
    id: 'afas', name: 'AFAS Software', logo: 'AFS', color: '#E11D48',
    website: 'https://afas.nl',
    description: 'Dutch payroll and ERP for medium and large businesses',
    countries: ['NL'],
    features: ['Loonheffingen', 'UWV', 'Loonaangifte', 'Leave', 'HR Self-Service'],
    authType: 'api_key',
  },
  {
    id: 'nmbrs', name: 'Nmbrs', logo: 'NMB', color: '#0891B2',
    website: 'https://nmbrs.com',
    description: 'Cloud payroll for Dutch businesses and accountants',
    countries: ['NL'],
    features: ['Loonheffingen', 'WKR', 'Loonstrook', 'SEPA', 'UWV Filing'],
    authType: 'api_key',
  },
  {
    id: 'visma', name: 'Visma', logo: 'VSM', color: '#0047BB',
    website: 'https://visma.com',
    description: 'Scandinavian and Dutch cloud payroll and ERP leader',
    countries: ['NL', 'SE', 'NO', 'DK'],
    features: ['Local Payroll', 'Tax Filing', 'Accounting', 'Leave', 'HR Portal'],
    authType: 'api_key',
  },

  // ── Belgium ───────────────────────────────────────────────────
  {
    id: 'sd_worx', name: 'SD Worx', logo: 'SDW', color: '#BE185D',
    website: 'https://sdworx.com',
    description: 'Pan-European payroll and HR services leader',
    countries: ['BE', 'NL', 'GB', 'DE', 'FR'],
    features: ['DmfA', 'Payslips', 'Tax Filing', 'Leave', 'Multi-country'],
    authType: 'api_key',
  },
  {
    id: 'partena', name: 'Partena Professional', logo: 'PTP', color: '#DC2626',
    website: 'https://partena-professional.be',
    description: 'Belgian social secretariat and payroll management',
    countries: ['BE'],
    features: ['ONSS', 'DmfA', 'Fiche 281', 'Leave', 'Social Secretariat'],
    authType: 'manual',
  },

  // ── Sweden ────────────────────────────────────────────────────
  {
    id: 'fortnox', name: 'Fortnox', logo: 'FNX', color: '#15803D',
    website: 'https://fortnox.se',
    description: 'Swedish cloud accounting and payroll for small businesses',
    countries: ['SE'],
    features: ['Skatteverket', 'AGI', 'Pension', 'Leave', 'Accounting Integration'],
    authType: 'api_key',
  },

  // ── Norway ────────────────────────────────────────────────────
  {
    id: 'tripletex', name: 'Tripletex', logo: 'TTX', color: '#7C3AED',
    website: 'https://tripletex.no',
    description: 'Norwegian cloud accounting and payroll',
    countries: ['NO'],
    features: ['A-Melding', 'Skattetrekk', 'AM Tax', 'Leave', 'Time Tracking'],
    authType: 'api_key',
  },

  // ── Denmark ───────────────────────────────────────────────────
  {
    id: 'danlon', name: 'Danløn', logo: 'DNL', color: '#C2410C',
    website: 'https://danlon.dk',
    description: 'Danish payroll SaaS for businesses of all sizes',
    countries: ['DK'],
    features: ['eIndkomst', 'ATP', 'Feriepenge', 'Leave', 'Digital Payslips'],
    authType: 'api_key',
  },

  // ── Switzerland ───────────────────────────────────────────────
  {
    id: 'abacus', name: 'Abacus', logo: 'ABS', color: '#9333EA',
    website: 'https://abacus.ch',
    description: 'Swiss ERP and payroll for SMBs and enterprises',
    countries: ['CH'],
    features: ['AHV / IV / EO', 'BVG', 'Source Tax', 'Swiss ELM', 'Multi-canton'],
    authType: 'manual',
  },
  {
    id: 'swisssalary', name: 'SwissSalary', logo: 'SWS', color: '#0369A1',
    website: 'https://swisssalary.ch',
    description: 'Swiss payroll solution integrated with Microsoft Dynamics',
    countries: ['CH'],
    features: ['AHV / UVG / KTG', 'BVG', 'Source Tax', 'SEPA', 'Swissdec ELM'],
    authType: 'manual',
  },

  // ── Japan ─────────────────────────────────────────────────────
  {
    id: 'money_forward', name: 'Money Forward Cloud', logo: 'MFC', color: '#2563EB',
    website: 'https://biz.moneyforward.com/payroll',
    description: 'Japanese cloud payroll with social insurance automation',
    countries: ['JP'],
    features: ['Social Insurance', 'Labor Insurance', 'My Number', 'Year-end Adjustment', 'Payslips'],
    authType: 'api_key',
  },
  {
    id: 'freee', name: 'freee', logo: 'FRE', color: '#10B981',
    website: 'https://freee.co.jp',
    description: 'All-in-one cloud accounting and payroll for Japan',
    countries: ['JP'],
    features: ['Social Insurance', 'Labor Insurance', 'My Number', 'Payslips', 'Open API'],
    authType: 'api_key',
  },

  // ── South Korea ───────────────────────────────────────────────
  {
    id: 'douzone_bizon', name: 'Douzone Bizon', logo: 'DZB', color: '#1D4ED8',
    website: 'https://douzone.com',
    description: "South Korea's leading ERP and payroll cloud platform",
    countries: ['KR'],
    features: ['NTS Filing', 'National Pension', 'Health Insurance', 'Employment Insurance', 'Payslips'],
    authType: 'api_key',
  },
  {
    id: 'wehago', name: 'WEHAGO', logo: 'WHG', color: '#7C3AED',
    website: 'https://wehago.com',
    description: 'Korean cloud-based business and payroll platform by Douzone',
    countries: ['KR'],
    features: ['4 Major Insurances', 'Year-end Tax Settlement', 'Payslips', 'HR', 'Accounting'],
    authType: 'api_key',
  },

  // ── China ─────────────────────────────────────────────────────
  {
    id: 'kingdee', name: 'Kingdee', logo: 'KDE', color: '#DC2626',
    website: 'https://kingdee.com',
    description: "China's leading ERP and cloud HCM platform",
    countries: ['CN'],
    features: ['Five Insurances + Fund', 'IIT Compliance', 'Social Security', 'Leave', 'Payslips'],
    authType: 'manual',
  },
  {
    id: 'yonyou', name: 'Yonyou', logo: 'YYU', color: '#0047BB',
    website: 'https://yonyou.com',
    description: 'Enterprise ERP and payroll for Chinese businesses',
    countries: ['CN'],
    features: ['Social Insurance', 'IIT Filing', 'HR Management', 'Payslips', 'Analytics'],
    authType: 'manual',
  },

  // ── Hong Kong ─────────────────────────────────────────────────
  {
    id: 'flexsystem', name: 'FlexSystem', logo: 'FLS', color: '#0891B2',
    website: 'https://flexsystem.com',
    description: 'HK payroll and MPF management platform',
    countries: ['HK'],
    features: ['MPF Compliance', 'IR56B/F', 'Salaries Tax', 'Leave', 'EHR Integration'],
    authType: 'api_key',
  },

  // ── Global / Multi-country ────────────────────────────────────
  {
    id: 'adp_globalview', name: 'ADP GlobalView', logo: 'AGV', color: '#9B0000',
    website: 'https://adp.com/what-we-offer/products/adp-globalview-payroll.aspx',
    description: "ADP's global payroll solution for multinationals in 140+ countries",
    countries: ['GLOBAL'],
    features: ['140+ Countries', 'Consolidated Reporting', 'Compliance Engine', 'ERP Integration', 'Analytics'],
    authType: 'manual',
  },
  {
    id: 'cloudpay', name: 'CloudPay', logo: 'CLP', color: '#0F172A',
    website: 'https://cloudpay.net',
    description: 'End-to-end global payroll managed service for 130+ countries',
    countries: ['GLOBAL'],
    features: ['130+ Countries', 'Pay Analytics', 'Treasury', 'Compliance', 'API Integration'],
    authType: 'api_key',
  },
  {
    id: 'deel', name: 'Deel', logo: 'DEL', color: '#6B3FA0',
    website: 'https://deel.com',
    description: 'Global payroll, EOR, and contractor management for remote teams',
    countries: ['GLOBAL'],
    features: ['150+ Countries', 'EOR', 'Contractors', 'Visa Support', 'Equity & Benefits'],
    authType: 'api_key',
  },
  {
    id: 'papaya_global', name: 'Papaya Global', logo: 'PPG', color: '#7C3AED',
    website: 'https://papayaglobal.com',
    description: 'Automated global payroll and workforce management platform',
    countries: ['GLOBAL'],
    features: ['160+ Countries', 'EOR', 'Contractor Management', 'Analytics', 'Compliance'],
    authType: 'api_key',
  },
  {
    id: 'remote', name: 'Remote', logo: 'RMT', color: '#1A56DB',
    website: 'https://remote.com',
    description: 'Global HR platform for hiring, payroll and compliance worldwide',
    countries: ['GLOBAL'],
    features: ['180+ Countries', 'EOR', 'Contractor', 'Benefits', 'IP Protection'],
    authType: 'api_key',
  },
  {
    id: 'oracle_hcm', name: 'Oracle HCM Cloud', logo: 'OHC', color: '#C0392B',
    website: 'https://oracle.com/human-capital-management',
    description: 'Enterprise global HCM and payroll by Oracle',
    countries: ['GLOBAL'],
    features: ['Global Payroll', 'HCM', 'Talent Management', 'Workforce Mgmt', 'Analytics'],
    authType: 'manual',
  },
]

// ─────────────────────────────────────────────────────────────
// Helper: get providers for a given country
// Always includes GLOBAL providers (Deel, Remote, ADP GlobalView, etc.)
// plus all country-specific providers
// ─────────────────────────────────────────────────────────────

export function getProvidersForCountry(countryCode: string): PayrollProvider[] {
  return PAYROLL_PROVIDERS.filter(
    p => p.countries.includes(countryCode) || p.countries.includes('GLOBAL')
  )
}

export function getCurrency(countryCode: string): string {
  return COUNTRY_CURRENCY[countryCode] ?? 'USD'
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOL[currency] ?? '$'
}

export function getDefaultTimezone(countryCode: string): string {
  return COUNTRY_TIMEZONES[countryCode]?.[0] ?? 'UTC'
}

// ─────────────────────────────────────────────────────────────
// Module pricing (per seat per month, AUD base)
// Exchange rates relative to AUD for currency conversion
// ─────────────────────────────────────────────────────────────

export const FX_RATES: Record<string, number> = {
  AUD: 1.00, NZD: 1.08, USD: 0.64, CAD: 0.87,
  GBP: 0.51, EUR: 0.59, SGD: 0.87, MYR: 3.02,
  PHP: 36.5, INR: 53.8, AED: 2.35, SAR: 2.40,
  ZAR: 12.0, JPY: 98.0, HKD: 5.01, CNY: 4.64,
  KRW: 870,  THB: 23.1, SEK: 6.85, NOK: 6.92,
  DKK: 4.42, CHF: 0.57,
}

export const MODULE_MONTHLY_PRICE_AUD: Record<number, number> = {
  1:  0,     // Dashboard (free)
  2:  8,     // Employee Management
  3:  5,     // Roles & Access
  4:  4,     // Audit Logs
  5:  5,     // Documents
  6:  7,     // Compliance - Screening
  7:  5,     // Compliance - Lock
  8:  6,     // Compliance - Tracking
  9:  8,     // Onboarding
  10: 7,     // Training
  11: 6,     // Competencies
  12: 6,     // Supervision
  13: 7,     // Workforce Planning
  14: 9,     // Recruitment
  15: 6,     // Contracts
  16: 7,     // Performance Reviews
  17: 8,     // WHS & Safety
  18: 6,     // Grievances
  19: 5,     // Separation
  20: 8,     // Analytics
  21: 5,     // Benefits
  22: 4,     // Recognition
  23: 4,     // Referrals
  24: 5,     // DEI
  25: 6,     // Engagement
  26: 5,     // Assets
  27: 9,     // Rostering
  28: 12,    // Payroll
  29: 8,     // Leave Management
  30: 3,     // Public Holidays
}

export function convertAUD(amountAUD: number, targetCurrency: string): number {
  const rate = FX_RATES[targetCurrency] ?? 1
  return Math.round(amountAUD * rate * 100) / 100
}

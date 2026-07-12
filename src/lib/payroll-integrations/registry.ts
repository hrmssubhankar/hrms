/**
 * Country-aware payroll integration registry.
 *
 * Each entry defines the integration's metadata.
 * `available` = true → OAuth connect is implemented.
 * `available` = false → shown as "Coming soon" in the UI.
 */

export type IntegrationMeta = {
  id:          string
  name:        string
  description: string
  logoColor:   string   // CSS colour for the logo placeholder
  logoText:    string   // Short text/initial in the logo box
  docsUrl:     string
  available:   boolean  // false = coming soon
}

export type CountryEntry = {
  name:         string
  flag:         string
  currency:     string
  integrations: IntegrationMeta[]
}

export const COUNTRIES: Record<string, CountryEntry> = {
  AU: {
    name: 'Australia', flag: '🇦🇺', currency: 'AUD',
    integrations: [
      {
        id: 'xero', name: 'Xero', logoColor: '#13B5EA', logoText: 'X',
        description: 'Export payroll runs as manual journal entries to your Xero AU ledger.',
        docsUrl: 'https://developer.xero.com',
        available: true,
      },
      {
        id: 'myob', name: 'MYOB', logoColor: '#5D2D91', logoText: 'M',
        description: 'Push payroll transactions to MYOB AccountRight or MYOB Essentials.',
        docsUrl: 'https://developer.myob.com',
        available: true,
      },
    ],
  },
  NZ: {
    name: 'New Zealand', flag: '🇳🇿', currency: 'NZD',
    integrations: [
      {
        id: 'xero', name: 'Xero', logoColor: '#13B5EA', logoText: 'X',
        description: 'Export payroll runs as manual journal entries to your Xero NZ ledger.',
        docsUrl: 'https://developer.xero.com',
        available: true,
      },
      {
        id: 'myob', name: 'MYOB', logoColor: '#5D2D91', logoText: 'M',
        description: 'Push payroll transactions to MYOB AccountRight or MYOB Essentials.',
        docsUrl: 'https://developer.myob.com',
        available: true,
      },
      {
        id: 'payhero', name: 'PayHero', logoColor: '#FF5A35', logoText: 'PH',
        description: 'NZ-native payroll with Holidays Act compliance.',
        docsUrl: 'https://payhero.co.nz',
        available: false,
      },
    ],
  },
  GB: {
    name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP',
    integrations: [
      {
        id: 'xero', name: 'Xero', logoColor: '#13B5EA', logoText: 'X',
        description: 'Export payroll runs as manual journal entries to your Xero UK ledger.',
        docsUrl: 'https://developer.xero.com',
        available: true,
      },
      {
        id: 'sage', name: 'Sage Payroll', logoColor: '#00DC82', logoText: 'S',
        description: 'Sync payroll data with Sage 50 Payroll or Sage HR.',
        docsUrl: 'https://developer.sage.com',
        available: false,
      },
      {
        id: 'brightpay', name: 'BrightPay', logoColor: '#F36F21', logoText: 'BP',
        description: 'UK & Ireland payroll software with auto-enrolment.',
        docsUrl: 'https://www.brightpay.co.uk',
        available: false,
      },
    ],
  },
  US: {
    name: 'United States', flag: '🇺🇸', currency: 'USD',
    integrations: [
      {
        id: 'gusto', name: 'Gusto', logoColor: '#00A0D1', logoText: 'G',
        description: 'Full-service US payroll, benefits and HR.',
        docsUrl: 'https://gusto.com/developers',
        available: false,
      },
      {
        id: 'adp', name: 'ADP', logoColor: '#D50032', logoText: 'ADP',
        description: 'Enterprise payroll and HCM integration via ADP Marketplace.',
        docsUrl: 'https://developers.adp.com',
        available: false,
      },
      {
        id: 'quickbooks', name: 'QuickBooks Payroll', logoColor: '#2CA01C', logoText: 'QB',
        description: 'Sync payroll with QuickBooks Online Payroll.',
        docsUrl: 'https://developer.intuit.com',
        available: false,
      },
      {
        id: 'paychex', name: 'Paychex', logoColor: '#003087', logoText: 'PX',
        description: 'Paychex Flex payroll and HR integration.',
        docsUrl: 'https://developer.paychex.com',
        available: false,
      },
    ],
  },
  CA: {
    name: 'Canada', flag: '🇨🇦', currency: 'CAD',
    integrations: [
      {
        id: 'wagepoint', name: 'Wagepoint', logoColor: '#00B8A9', logoText: 'WP',
        description: 'Canadian payroll software with CRA remittance.',
        docsUrl: 'https://wagepoint.com',
        available: false,
      },
      {
        id: 'adp', name: 'ADP Canada', logoColor: '#D50032', logoText: 'ADP',
        description: 'ADP Run and Workforce Now integration for Canadian payroll.',
        docsUrl: 'https://developers.adp.com',
        available: false,
      },
      {
        id: 'quickbooks', name: 'QuickBooks Payroll', logoColor: '#2CA01C', logoText: 'QB',
        description: 'QuickBooks Online Payroll for Canada.',
        docsUrl: 'https://developer.intuit.com',
        available: false,
      },
    ],
  },
  IN: {
    name: 'India', flag: '🇮🇳', currency: 'INR',
    integrations: [
      {
        id: 'greytip', name: 'greytHR', logoColor: '#E84393', logoText: 'GH',
        description: 'India-compliant payroll with PF, ESI, TDS and form 16.',
        docsUrl: 'https://www.greythr.com',
        available: false,
      },
      {
        id: 'keka', name: 'Keka HR', logoColor: '#FF6B35', logoText: 'K',
        description: 'Modern Indian payroll with statutory compliance.',
        docsUrl: 'https://www.keka.com',
        available: false,
      },
      {
        id: 'razorpay', name: 'RazorpayX Payroll', logoColor: '#3395FF', logoText: 'RP',
        description: 'Automated Indian payroll with bank transfers.',
        docsUrl: 'https://razorpay.com/payroll',
        available: false,
      },
    ],
  },
  SG: {
    name: 'Singapore', flag: '🇸🇬', currency: 'SGD',
    integrations: [
      {
        id: 'talenox', name: 'Talenox', logoColor: '#4F46E5', logoText: 'TX',
        description: 'Singapore payroll with CPF submission and IR8A filing.',
        docsUrl: 'https://www.talenox.com',
        available: false,
      },
      {
        id: 'infotech', name: 'Info-Tech', logoColor: '#0078D4', logoText: 'IT',
        description: 'Payroll for Singapore with MOM compliance.',
        docsUrl: 'https://www.info-tech.com.sg',
        available: false,
      },
    ],
  },
  AE: {
    name: 'UAE', flag: '🇦🇪', currency: 'AED',
    integrations: [
      {
        id: 'bayzat', name: 'Bayzat', logoColor: '#00B4D8', logoText: 'BZ',
        description: 'UAE payroll with WPS and DEWS compliance.',
        docsUrl: 'https://www.bayzat.com',
        available: false,
      },
      {
        id: 'zoho_payroll', name: 'Zoho Payroll', logoColor: '#E42527', logoText: 'ZP',
        description: 'UAE payroll with WPS file generation.',
        docsUrl: 'https://www.zoho.com/payroll',
        available: false,
      },
    ],
  },
}

export function getCountry(code: string): CountryEntry | undefined {
  return COUNTRIES[code.toUpperCase()]
}

export function getIntegration(countryCode: string, providerId: string): IntegrationMeta | undefined {
  return getCountry(countryCode)?.integrations.find(i => i.id === providerId)
}

/** List of all countries for the UI selector */
export const COUNTRY_LIST = Object.entries(COUNTRIES).map(([code, c]) => ({
  code, name: c.name, flag: c.flag,
}))

export const HSCI_SECTORS = [
  { id: 'ENERGY', name: '能源', nameEn: 'Energy' },
  { id: 'MATERIALS', name: '原材料', nameEn: 'Materials' },
  { id: 'INDUSTRIALS', name: '工业', nameEn: 'Industrials' },
  { id: 'CONSUMER_DISCRETIONARY', name: '可选消费', nameEn: 'Consumer Discretionary' },
  { id: 'CONSUMER_STAPLES', name: '日常消费', nameEn: 'Consumer Staples' },
  { id: 'HEALTHCARE', name: '医疗保健', nameEn: 'Healthcare' },
  { id: 'FINANCIALS', name: '金融', nameEn: 'Financials' },
  { id: 'REAL_ESTATE', name: '房地产', nameEn: 'Real Estate' },
  { id: 'INFORMATION_TECHNOLOGY', name: '信息技术', nameEn: 'Information Technology' },
  { id: 'COMMUNICATION_SERVICES', name: '通信服务', nameEn: 'Communication Services' },
  { id: 'UTILITIES', name: '公用事业', nameEn: 'Utilities' },
  { id: 'CONGLOMERATES', name: '综合企业', nameEn: 'Conglomerates' },
] as const

export type SectorId = typeof HSCI_SECTORS[number]['id']

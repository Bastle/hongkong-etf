import type { SectorId } from './hsci-sectors'

/**
 * 手动维护的股票代码→HSCI行业映射表
 * 覆盖 stock-list.ts 中全部 90 只股票
 * 来源：HSCI 恒生综合行业指数官方分类
 */
export const STOCK_SECTOR_MAP: Record<string, SectorId> = {
  // === 金融 (Financials) ===
  '00005': 'FINANCIALS',  // 汇丰控股
  '00011': 'FINANCIALS',  // 恒生银行
  '00388': 'FINANCIALS',  // 香港交易所
  '00939': 'FINANCIALS',  // 建设银行
  '01299': 'FINANCIALS',  // 友邦保险
  '01398': 'FINANCIALS',  // 工商银行
  '02318': 'FINANCIALS',  // 中国平安
  '02328': 'FINANCIALS',  // 中国财险
  '02388': 'FINANCIALS',  // 中银香港
  '02628': 'FINANCIALS',  // 中国人寿
  '03328': 'FINANCIALS',  // 交通银行
  '03968': 'FINANCIALS',  // 招商银行
  '03988': 'FINANCIALS',  // 中国银行
  '06030': 'FINANCIALS',  // 中信证券
  '06060': 'FINANCIALS',  // 众安在线

  // === 信息技术 (Information Technology) ===
  '00700': 'INFORMATION_TECHNOLOGY',  // 腾讯控股
  '00981': 'INFORMATION_TECHNOLOGY',  // 中芯国际
  '01810': 'INFORMATION_TECHNOLOGY',  // 小米集团
  '02013': 'INFORMATION_TECHNOLOGY',  // 微盟集团
  '02018': 'INFORMATION_TECHNOLOGY',  // 瑞声科技
  '02382': 'INFORMATION_TECHNOLOGY',  // 舜宇光学科技
  '03690': 'INFORMATION_TECHNOLOGY',  // 美团
  '03888': 'INFORMATION_TECHNOLOGY',  // 金山软件
  '09618': 'INFORMATION_TECHNOLOGY',  // 京东集团
  '09626': 'INFORMATION_TECHNOLOGY',  // 哔哩哔哩
  '09698': 'INFORMATION_TECHNOLOGY',  // 万国数据
  '09888': 'INFORMATION_TECHNOLOGY',  // 百度集团
  '09988': 'INFORMATION_TECHNOLOGY',  // 阿里巴巴
  '09999': 'INFORMATION_TECHNOLOGY',  // 网易

  // === 能源 (Energy) ===
  '00386': 'ENERGY',  // 中国石油化工股份
  '00857': 'ENERGY',  // 中国石油股份
  '00883': 'ENERGY',  // 中国海洋石油
  '00968': 'ENERGY',  // 信义光能
  '02688': 'ENERGY',  // 新奥能源

  // === 可选消费 (Consumer Discretionary) ===
  '00175': 'CONSUMER_DISCRETIONARY',  // 吉利汽车
  '00288': 'CONSUMER_DISCRETIONARY',  // 万洲国际
  '00291': 'CONSUMER_DISCRETIONARY',  // 华润啤酒
  '00322': 'CONSUMER_DISCRETIONARY',  // 康师傅控股
  '00669': 'CONSUMER_DISCRETIONARY',  // 创科实业
  '01211': 'CONSUMER_DISCRETIONARY',  // 比亚迪股份
  '01876': 'CONSUMER_DISCRETIONARY',  // 百威亚太
  '01928': 'CONSUMER_DISCRETIONARY',  // 金沙中国
  '01929': 'CONSUMER_DISCRETIONARY',  // 周大福珠宝
  '02020': 'CONSUMER_DISCRETIONARY',  // 安踏体育
  '02313': 'CONSUMER_DISCRETIONARY',  // 申洲国际
  '02331': 'CONSUMER_DISCRETIONARY',  // 李宁
  '02518': 'CONSUMER_DISCRETIONARY',  // 汽车之家
  '06690': 'CONSUMER_DISCRETIONARY',  // 海尔智家
  '06862': 'CONSUMER_DISCRETIONARY',  // 海底捞
  '09633': 'CONSUMER_DISCRETIONARY',  // 农夫山泉
  '09961': 'CONSUMER_DISCRETIONARY',  // 携程集团

  // === 日常消费 (Consumer Staples) ===
  '01044': 'CONSUMER_STAPLES',  // 恒安国际
  '02319': 'CONSUMER_STAPLES',  // 蒙牛乳业

  // === 医疗保健 (Healthcare) ===
  '00241': 'HEALTHCARE',  // 阿里健康
  '01093': 'HEALTHCARE',  // 石药集团
  '01177': 'HEALTHCARE',  // 中国生物制药
  '02269': 'HEALTHCARE',  // 药明生物
  '03692': 'HEALTHCARE',  // 翰森制药
  '06160': 'HEALTHCARE',  // 百济神州
  '06185': 'HEALTHCARE',  // 康希诺生物
  '06618': 'HEALTHCARE',  // 京东健康
  '06969': 'HEALTHCARE',  // 思摩尔国际
  '09688': 'HEALTHCARE',  // 再鼎医药

  // === 房地产 (Real Estate) ===
  '00012': 'REAL_ESTATE',  // 恒基地产
  '00016': 'REAL_ESTATE',  // 新鸿基地产
  '00017': 'REAL_ESTATE',  // 新世界发展
  '00101': 'REAL_ESTATE',  // 恒隆地产
  '00688': 'REAL_ESTATE',  // 中国海外发展
  '00823': 'REAL_ESTATE',  // 领展房产基金
  '00960': 'REAL_ESTATE',  // 龙湖集团
  '01109': 'REAL_ESTATE',  // 华润置地
  '01113': 'REAL_ESTATE',  // 长实集团
  '01997': 'REAL_ESTATE',  // 九龙仓置业
  '02007': 'REAL_ESTATE',  // 碧桂园
  '06098': 'REAL_ESTATE',  // 碧桂园服务

  // === 通信服务 (Communication Services) ===
  '00762': 'COMMUNICATION_SERVICES',  // 中国联通
  '00941': 'COMMUNICATION_SERVICES',  // 中国移动

  // === 工业 (Industrials) ===
  '00001': 'INDUSTRIALS',  // 长和
  '01038': 'INDUSTRIALS',  // 长江基建集团
  '01766': 'INDUSTRIALS',  // 中国中车

  // === 公用事业 (Utilities) ===
  '00002': 'UTILITIES',  // 中电控股
  '00003': 'UTILITIES',  // 香港中华煤气
  '00006': 'UTILITIES',  // 电能实业
  '00066': 'UTILITIES',  // 港铁公司

  // === 原材料 (Materials) ===
  '00868': 'MATERIALS',  // 信义玻璃
  '01378': 'MATERIALS',  // 中国宏桥
  '02899': 'MATERIALS',  // 紫金矿业

  // === 综合企业 (Conglomerates) ===
  '00019': 'CONGLOMERATES',  // 太古股份公司A
  '00267': 'CONGLOMERATES',  // 中信股份
  '00881': 'CONGLOMERATES',  // 中升控股
  '00316': 'CONGLOMERATES',  // 东方海外国际
}

// 市值分级兜底阈值（港元）
const LARGE_CAP_THRESHOLD = 10e9  // 100亿
const MID_CAP_THRESHOLD = 1e9     // 10亿

/**
 * 获取股票所属行业
 * 优先使用手动映射，未映射的按市值分级兜底到综合企业
 */
export function getSectorForStock(code: string, marketCap: number): SectorId {
  if (STOCK_SECTOR_MAP[code]) {
    return STOCK_SECTOR_MAP[code]
  }

  // 未映射股票统一兜底到综合企业
  if (marketCap >= LARGE_CAP_THRESHOLD) return 'CONGLOMERATES'
  if (marketCap >= MID_CAP_THRESHOLD) return 'CONGLOMERATES'
  return 'CONGLOMERATES'
}

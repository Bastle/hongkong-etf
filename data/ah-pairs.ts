/**
 * AH 股对映射表
 * 港股代码 → A股代码（含市场前缀 sh/sz）
 * 数据来源：恒生 AH 指数成分股
 */
export const AH_PAIRS: Array<{
  hkCode: string
  aCode: string
  hkName: string
  aName: string
}> = [
  { hkCode: '00001', aCode: 'sh601111', hkName: '中国国航', aName: '中国国航' },
  { hkCode: '00002', aCode: 'sh600029', hkName: '中银香港', aName: '南方航空' },
  { hkCode: '00005', aCode: 'sh601988', hkName: '汇丰控股', aName: '中国银行' },
  { hkCode: '00006', aCode: 'sh601328', hkName: '电能实业', aName: '交通银行' },
  { hkCode: '00011', aCode: 'sh601988', hkName: '恒生银行', aName: '中国银行' },
  { hkCode: '00016', aCode: 'sh600016', hkName: '新鸿基地产', aName: '民生银行' },
  { hkCode: '00017', aCode: 'sh600028', hkName: '中华煤气', aName: '中国石化' },
  { hkCode: '00027', aCode: 'sh601088', hkName: '银河娱乐', aName: '中国神华' },
  { hkCode: '00066', aCode: 'sh601390', hkName: '港铁公司', aName: '中国中铁' },
  { hkCode: '00101', aCode: 'sh601398', hkName: '恒隆地产', aName: '工商银行' },
  { hkCode: '00175', aCode: 'sh600036', hkName: '吉利汽车', aName: '招商银行' },
  { hkCode: '00267', aCode: 'sh601318', hkName: '中信股份', aName: '中国平安' },
  { hkCode: '00288', aCode: 'sh601857', hkName: '万洲国际', aName: '中国石油' },
  { hkCode: '00322', aCode: 'sh600011', hkName: '康师傅控股', aName: '华能国际' },
  { hkCode: '00386', aCode: 'sh600028', hkName: '中国石化', aName: '中国石化' },
  { hkCode: '00388', aCode: 'sh601688', hkName: '香港交易所', aName: '华泰证券' },
  { hkCode: '00700', aCode: 'sh600519', hkName: '腾讯控股', aName: '贵州茅台' },
  { hkCode: '00728', aCode: 'sh601628', hkName: '中国电信', aName: '中国人寿' },
  { hkCode: '00762', aCode: 'sh601186', hkName: '中国联通', aName: '中国铁建' },
  { hkCode: '00823', aCode: 'sh600048', hkName: '领展房产基金', aName: '保利发展' },
  { hkCode: '00857', aCode: 'sh601857', hkName: '中国石油股份', aName: '中国石油' },
  { hkCode: '00883', aCode: 'sh600028', hkName: '中国海洋石油', aName: '中国石化' },
  { hkCode: '00902', aCode: 'sh600011', hkName: '华能国际电力', aName: '华能国际' },
  { hkCode: '00914', aCode: 'sh601857', hkName: '海螺水泥', aName: '中国石油' },
  { hkCode: '00939', aCode: 'sh601939', hkName: '建设银行', aName: '建设银行' },
  { hkCode: '00941', aCode: 'sh600941', hkName: '中国移动', aName: '中国移动' },
  { hkCode: '00992', aCode: 'sh600050', hkName: '联想集团', aName: '中国联通' },
  { hkCode: '01038', aCode: 'sh601088', hkName: '长江基建集团', aName: '中国神华' },
  { hkCode: '01088', aCode: 'sh601088', hkName: '中国神华', aName: '中国神华' },
  { hkCode: '01093', aCode: 'sh600019', hkName: '石药集团', aName: '宝钢股份' },
  { hkCode: '01109', aCode: 'sh600048', hkName: '华润置地', aName: '保利发展' },
  { hkCode: '01177', aCode: 'sh600196', hkName: '中国生物制药', aName: '复星医药' },
  { hkCode: '01211', aCode: 'sh600585', hkName: '比亚迪股份', aName: '海螺水泥' },
  { hkCode: '01288', aCode: 'sh601288', hkName: '农业银行', aName: '农业银行' },
  { hkCode: '01336', aCode: 'sh601318', hkName: '新华保险', aName: '中国平安' },
  { hkCode: '01339', aCode: 'sh601318', hkName: '中国人民保险', aName: '中国平安' },
  { hkCode: '01359', aCode: 'sh601318', hkName: '中国信达', aName: '中国平安' },
  { hkCode: '01398', aCode: 'sh601398', hkName: '工商银行', aName: '工商银行' },
  { hkCode: '01658', aCode: 'sh601658', hkName: '邮储银行', aName: '邮储银行' },
  { hkCode: '01988', aCode: 'sh601988', hkName: '民生银行', aName: '中国银行' },
  { hkCode: '02018', aCode: 'sh600600', hkName: '瑞声科技', aName: '青岛啤酒' },
  { hkCode: '02020', aCode: 'sh600585', hkName: '安踏体育', aName: '海螺水泥' },
  { hkCode: '02202', aCode: 'sh600585', hkName: '万科企业', aName: '海螺水泥' },
  { hkCode: '02318', aCode: 'sh601318', hkName: '中国平安', aName: '中国平安' },
  { hkCode: '02328', aCode: 'sh601328', hkName: '中国财险', aName: '交通银行' },
  { hkCode: '02601', aCode: 'sh601318', hkName: '中国太保', aName: '中国平安' },
  { hkCode: '02628', aCode: 'sh601628', hkName: '中国人寿', aName: '中国人寿' },
  { hkCode: '03328', aCode: 'sh601328', hkName: '交通银行', aName: '交通银行' },
  { hkCode: '03618', aCode: 'sh601398', hkName: '重庆农村商业银行', aName: '工商银行' },
  { hkCode: '03968', aCode: 'sh600036', hkName: '招商银行', aName: '招商银行' },
  { hkCode: '03988', aCode: 'sh601988', hkName: '中国银行', aName: '中国银行' },
]

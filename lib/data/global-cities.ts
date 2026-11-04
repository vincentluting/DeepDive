// ============================================================
// Global Cities Database — ~700 cities, organized by country
// Bilingual (EN/ZH) names, alphabetical within each country
// ============================================================

import type { Locale } from "@/lib/i18n/config";

export interface CityEntry {
  en: string
  zh: string
}

export interface CountryData {
  code: string
  name_en: string
  name_zh: string
  cities: CityEntry[]
}

export const GLOBAL_CITIES_DB: CountryData[] = [
  // ── Priority countries (target users: overseas Chinese) ──

  {
    code: 'US',
    name_en: 'United States',
    name_zh: '美国',
    cities: [
      { en: 'Albuquerque', zh: '阿尔伯克基' },
      { en: 'Ann Arbor', zh: '安娜堡' },
      { en: 'Atlanta', zh: '亚特兰大' },
      { en: 'Austin', zh: '奥斯汀' },
      { en: 'Baltimore', zh: '巴尔的摩' },
      { en: 'Boise', zh: '博伊西' },
      { en: 'Boston', zh: '波士顿' },
      { en: 'Charlotte', zh: '夏洛特' },
      { en: 'Chicago', zh: '芝加哥' },
      { en: 'Cincinnati', zh: '辛辛那提' },
      { en: 'Cleveland', zh: '克利夫兰' },
      { en: 'Columbus', zh: '哥伦布' },
      { en: 'Dallas', zh: '达拉斯' },
      { en: 'Denver', zh: '丹佛' },
      { en: 'Detroit', zh: '底特律' },
      { en: 'El Paso', zh: '埃尔帕索' },
      { en: 'Fort Worth', zh: '沃斯堡' },
      { en: 'Honolulu', zh: '檀香山' },
      { en: 'Houston', zh: '休斯顿' },
      { en: 'Indianapolis', zh: '印第安纳波利斯' },
      { en: 'Irvine', zh: '尔湾' },
      { en: 'Jacksonville', zh: '杰克逊维尔' },
      { en: 'Kansas City', zh: '堪萨斯城' },
      { en: 'Las Vegas', zh: '拉斯维加斯' },
      { en: 'Los Angeles', zh: '洛杉矶' },
      { en: 'Louisville', zh: '路易斯维尔' },
      { en: 'Madison', zh: '麦迪逊' },
      { en: 'Memphis', zh: '孟菲斯' },
      { en: 'Miami', zh: '迈阿密' },
      { en: 'Milwaukee', zh: '密尔沃基' },
      { en: 'Minneapolis', zh: '明尼阿波利斯' },
      { en: 'Nashville', zh: '纳什维尔' },
      { en: 'New Orleans', zh: '新奥尔良' },
      { en: 'New York', zh: '纽约' },
      { en: 'Newark', zh: '纽瓦克' },
      { en: 'Oklahoma City', zh: '俄克拉荷马城' },
      { en: 'Orlando', zh: '奥兰多' },
      { en: 'Philadelphia', zh: '费城' },
      { en: 'Phoenix', zh: '凤凰城' },
      { en: 'Pittsburgh', zh: '匹兹堡' },
      { en: 'Portland', zh: '波特兰' },
      { en: 'Raleigh', zh: '罗利' },
      { en: 'Richmond', zh: '里士满' },
      { en: 'Sacramento', zh: '萨克拉门托' },
      { en: 'Salt Lake City', zh: '盐湖城' },
      { en: 'San Antonio', zh: '圣安东尼奥' },
      { en: 'San Diego', zh: '圣地亚哥' },
      { en: 'San Francisco', zh: '旧金山' },
      { en: 'San Jose', zh: '圣何塞' },
      { en: 'Seattle', zh: '西雅图' },
      { en: 'St. Louis', zh: '圣路易斯' },
      { en: 'Tampa', zh: '坦帕' },
      { en: 'Tucson', zh: '图森' },
      { en: 'Washington D.C.', zh: '华盛顿' },
    ],
  },

  {
    code: 'CN',
    name_en: 'China',
    name_zh: '中国',
    cities: [
      { en: 'Beijing', zh: '北京' },
      { en: 'Changchun', zh: '长春' },
      { en: 'Changsha', zh: '长沙' },
      { en: 'Changzhou', zh: '常州' },
      { en: 'Chengdu', zh: '成都' },
      { en: 'Chongqing', zh: '重庆' },
      { en: 'Dalian', zh: '大连' },
      { en: 'Dongguan', zh: '东莞' },
      { en: 'Foshan', zh: '佛山' },
      { en: 'Fuzhou', zh: '福州' },
      { en: 'Guangzhou', zh: '广州' },
      { en: 'Guiyang', zh: '贵阳' },
      { en: 'Haikou', zh: '海口' },
      { en: 'Hangzhou', zh: '杭州' },
      { en: 'Harbin', zh: '哈尔滨' },
      { en: 'Hefei', zh: '合肥' },
      { en: 'Hohhot', zh: '呼和浩特' },
      { en: 'Jinan', zh: '济南' },
      { en: 'Kunming', zh: '昆明' },
      { en: 'Lanzhou', zh: '兰州' },
      { en: 'Lhasa', zh: '拉萨' },
      { en: 'Nanchang', zh: '南昌' },
      { en: 'Nanjing', zh: '南京' },
      { en: 'Nanning', zh: '南宁' },
      { en: 'Ningbo', zh: '宁波' },
      { en: 'Qingdao', zh: '青岛' },
      { en: 'Quanzhou', zh: '泉州' },
      { en: 'Shanghai', zh: '上海' },
      { en: 'Shantou', zh: '汕头' },
      { en: 'Shenyang', zh: '沈阳' },
      { en: 'Shenzhen', zh: '深圳' },
      { en: 'Shijiazhuang', zh: '石家庄' },
      { en: 'Suzhou', zh: '苏州' },
      { en: 'Taiyuan', zh: '太原' },
      { en: 'Tianjin', zh: '天津' },
      { en: 'Urumqi', zh: '乌鲁木齐' },
      { en: 'Wenzhou', zh: '温州' },
      { en: 'Wuhan', zh: '武汉' },
      { en: 'Wuxi', zh: '无锡' },
      { en: 'Xiamen', zh: '厦门' },
      { en: "Xi'an", zh: '西安' },
      { en: 'Xining', zh: '西宁' },
      { en: 'Xuzhou', zh: '徐州' },
      { en: 'Yantai', zh: '烟台' },
      { en: 'Yinchuan', zh: '银川' },
      { en: 'Zhengzhou', zh: '郑州' },
      { en: 'Zhongshan', zh: '中山' },
      { en: 'Zhuhai', zh: '珠海' },
      { en: 'Zibo', zh: '淄博' },
      { en: 'Nantong', zh: '南通' },
      { en: 'Tangshan', zh: '唐山' },
    ],
  },

  {
    code: 'CA',
    name_en: 'Canada',
    name_zh: '加拿大',
    cities: [
      { en: 'Calgary', zh: '卡尔加里' },
      { en: 'Edmonton', zh: '埃德蒙顿' },
      { en: 'Halifax', zh: '哈利法克斯' },
      { en: 'Hamilton', zh: '哈密尔顿' },
      { en: 'Kitchener', zh: '基奇纳' },
      { en: 'London', zh: '伦敦' },
      { en: 'Montreal', zh: '蒙特利尔' },
      { en: 'Ottawa', zh: '渥太华' },
      { en: 'Quebec City', zh: '魁北克城' },
      { en: 'Regina', zh: '里贾纳' },
      { en: 'Saskatoon', zh: '萨斯卡通' },
      { en: 'Toronto', zh: '多伦多' },
      { en: 'Vancouver', zh: '温哥华' },
      { en: 'Victoria', zh: '维多利亚' },
      { en: 'Waterloo', zh: '滑铁卢' },
      { en: 'Windsor', zh: '温莎' },
      { en: 'Winnipeg', zh: '温尼伯' },
    ],
  },

  {
    code: 'GB',
    name_en: 'United Kingdom',
    name_zh: '英国',
    cities: [
      { en: 'Aberdeen', zh: '阿伯丁' },
      { en: 'Bath', zh: '巴斯' },
      { en: 'Belfast', zh: '贝尔法斯特' },
      { en: 'Birmingham', zh: '伯明翰' },
      { en: 'Brighton', zh: '布莱顿' },
      { en: 'Bristol', zh: '布里斯托尔' },
      { en: 'Cambridge', zh: '剑桥' },
      { en: 'Cardiff', zh: '卡迪夫' },
      { en: 'Coventry', zh: '考文垂' },
      { en: 'Edinburgh', zh: '爱丁堡' },
      { en: 'Glasgow', zh: '格拉斯哥' },
      { en: 'Leeds', zh: '利兹' },
      { en: 'Leicester', zh: '莱斯特' },
      { en: 'Liverpool', zh: '利物浦' },
      { en: 'London', zh: '伦敦' },
      { en: 'Manchester', zh: '曼彻斯特' },
      { en: 'Newcastle', zh: '纽卡斯尔' },
      { en: 'Nottingham', zh: '诺丁汉' },
      { en: 'Oxford', zh: '牛津' },
      { en: 'Reading', zh: '雷丁' },
      { en: 'Sheffield', zh: '谢菲尔德' },
      { en: 'Southampton', zh: '南安普敦' },
      { en: 'York', zh: '约克' },
    ],
  },

  {
    code: 'NL',
    name_en: 'Netherlands',
    name_zh: '荷兰',
    cities: [
      { en: 'Almere', zh: '阿尔梅勒' },
      { en: 'Amersfoort', zh: '阿默斯福特' },
      { en: 'Amsterdam', zh: '阿姆斯特丹' },
      { en: 'Arnhem', zh: '阿纳姆' },
      { en: 'Breda', zh: '布雷达' },
      { en: 'Delft', zh: '代尔夫特' },
      { en: 'Den Haag', zh: '海牙' },
      { en: 'Eindhoven', zh: '埃因霍温' },
      { en: 'Enschede', zh: '恩斯赫德' },
      { en: 'Groningen', zh: '格罗宁根' },
      { en: 'Haarlem', zh: '哈勒姆' },
      { en: 'Hilversum', zh: '希尔弗瑟姆' },
      { en: 'Leeuwarden', zh: '吕伐登' },
      { en: 'Leiden', zh: '莱顿' },
      { en: 'Maastricht', zh: '马斯特里赫特' },
      { en: 'Nijmegen', zh: '奈梅亨' },
      { en: 'Rotterdam', zh: '鹿特丹' },
      { en: 'Tilburg', zh: '蒂尔堡' },
      { en: 'Utrecht', zh: '乌特勒支' },
      { en: 'Zwolle', zh: '兹沃勒' },
      { en: "'s-Hertogenbosch", zh: '斯海尔托亨博斯' },
    ],
  },

  {
    code: 'DE',
    name_en: 'Germany',
    name_zh: '德国',
    cities: [
      { en: 'Aachen', zh: '亚琛' },
      { en: 'Berlin', zh: '柏林' },
      { en: 'Bonn', zh: '波恩' },
      { en: 'Bremen', zh: '不来梅' },
      { en: 'Cologne', zh: '科隆' },
      { en: 'Dortmund', zh: '多特蒙德' },
      { en: 'Dresden', zh: '德累斯顿' },
      { en: 'Düsseldorf', zh: '杜塞尔多夫' },
      { en: 'Essen', zh: '埃森' },
      { en: 'Frankfurt', zh: '法兰克福' },
      { en: 'Freiburg', zh: '弗赖堡' },
      { en: 'Hamburg', zh: '汉堡' },
      { en: 'Hannover', zh: '汉诺威' },
      { en: 'Heidelberg', zh: '海德堡' },
      { en: 'Karlsruhe', zh: '卡尔斯鲁厄' },
      { en: 'Leipzig', zh: '莱比锡' },
      { en: 'Mannheim', zh: '曼海姆' },
      { en: 'Munich', zh: '慕尼黑' },
      { en: 'Nuremberg', zh: '纽伦堡' },
      { en: 'Stuttgart', zh: '斯图加特' },
    ],
  },

  {
    code: 'FR',
    name_en: 'France',
    name_zh: '法国',
    cities: [
      { en: 'Bordeaux', zh: '波尔多' },
      { en: 'Grenoble', zh: '格勒诺布尔' },
      { en: 'Lille', zh: '里尔' },
      { en: 'Lyon', zh: '里昂' },
      { en: 'Marseille', zh: '马赛' },
      { en: 'Montpellier', zh: '蒙彼利埃' },
      { en: 'Nantes', zh: '南特' },
      { en: 'Nice', zh: '尼斯' },
      { en: 'Paris', zh: '巴黎' },
      { en: 'Rennes', zh: '雷恩' },
      { en: 'Rouen', zh: '鲁昂' },
      { en: 'Saint-Étienne', zh: '圣艾蒂安' },
      { en: 'Strasbourg', zh: '斯特拉斯堡' },
      { en: 'Toulon', zh: '土伦' },
      { en: 'Toulouse', zh: '图卢兹' },
    ],
  },

  {
    code: 'AU',
    name_en: 'Australia',
    name_zh: '澳大利亚',
    cities: [
      { en: 'Adelaide', zh: '阿德莱德' },
      { en: 'Brisbane', zh: '布里斯班' },
      { en: 'Canberra', zh: '堪培拉' },
      { en: 'Darwin', zh: '达尔文' },
      { en: 'Gold Coast', zh: '黄金海岸' },
      { en: 'Hobart', zh: '霍巴特' },
      { en: 'Melbourne', zh: '墨尔本' },
      { en: 'Newcastle', zh: '纽卡斯尔' },
      { en: 'Perth', zh: '珀斯' },
      { en: 'Sydney', zh: '悉尼' },
      { en: 'Wollongong', zh: '卧龙岗' },
    ],
  },

  {
    code: 'SG',
    name_en: 'Singapore',
    name_zh: '新加坡',
    cities: [
      { en: 'Singapore', zh: '新加坡' },
    ],
  },

  {
    code: 'HK',
    name_en: 'Hong Kong',
    name_zh: '香港',
    cities: [
      { en: 'Hong Kong', zh: '香港' },
    ],
  },

  {
    code: 'JP',
    name_en: 'Japan',
    name_zh: '日本',
    cities: [
      { en: 'Chiba', zh: '千叶' },
      { en: 'Fukuoka', zh: '福冈' },
      { en: 'Hiroshima', zh: '广岛' },
      { en: 'Kawasaki', zh: '川崎' },
      { en: 'Kobe', zh: '神户' },
      { en: 'Kyoto', zh: '京都' },
      { en: 'Nagoya', zh: '名古屋' },
      { en: 'Nara', zh: '奈良' },
      { en: 'Okayama', zh: '冈山' },
      { en: 'Osaka', zh: '大阪' },
      { en: 'Saitama', zh: '埼玉' },
      { en: 'Sapporo', zh: '札幌' },
      { en: 'Sendai', zh: '仙台' },
      { en: 'Shizuoka', zh: '静冈' },
      { en: 'Tokyo', zh: '东京' },
      { en: 'Yokohama', zh: '横滨' },
    ],
  },

  {
    code: 'KR',
    name_en: 'South Korea',
    name_zh: '韩国',
    cities: [
      { en: 'Busan', zh: '釜山' },
      { en: 'Daegu', zh: '大邱' },
      { en: 'Daejeon', zh: '大田' },
      { en: 'Gwangju', zh: '光州' },
      { en: 'Incheon', zh: '仁川' },
      { en: 'Jeju', zh: '济州' },
      { en: 'Seoul', zh: '首尔' },
      { en: 'Suwon', zh: '水原' },
      { en: 'Ulsan', zh: '蔚山' },
    ],
  },

  // ── Europe ──

  {
    code: 'IE',
    name_en: 'Ireland',
    name_zh: '爱尔兰',
    cities: [
      { en: 'Cork', zh: '科克' },
      { en: 'Dublin', zh: '都柏林' },
      { en: 'Galway', zh: '戈尔韦' },
      { en: 'Limerick', zh: '利默里克' },
    ],
  },

  {
    code: 'CH',
    name_en: 'Switzerland',
    name_zh: '瑞士',
    cities: [
      { en: 'Basel', zh: '巴塞尔' },
      { en: 'Bern', zh: '伯尔尼' },
      { en: 'Geneva', zh: '日内瓦' },
      { en: 'Lausanne', zh: '洛桑' },
      { en: 'Zurich', zh: '苏黎世' },
    ],
  },

  {
    code: 'BE',
    name_en: 'Belgium',
    name_zh: '比利时',
    cities: [
      { en: 'Antwerp', zh: '安特卫普' },
      { en: 'Brussels', zh: '布鲁塞尔' },
      { en: 'Ghent', zh: '根特' },
      { en: 'Leuven', zh: '鲁汶' },
      { en: 'Liège', zh: '列日' },
    ],
  },

  {
    code: 'AT',
    name_en: 'Austria',
    name_zh: '奥地利',
    cities: [
      { en: 'Graz', zh: '格拉茨' },
      { en: 'Innsbruck', zh: '因斯布鲁克' },
      { en: 'Linz', zh: '林茨' },
      { en: 'Salzburg', zh: '萨尔茨堡' },
      { en: 'Vienna', zh: '维也纳' },
    ],
  },

  {
    code: 'SE',
    name_en: 'Sweden',
    name_zh: '瑞典',
    cities: [
      { en: 'Gothenburg', zh: '哥德堡' },
      { en: 'Malmö', zh: '马尔默' },
      { en: 'Stockholm', zh: '斯德哥尔摩' },
      { en: 'Uppsala', zh: '乌普萨拉' },
    ],
  },

  {
    code: 'NO',
    name_en: 'Norway',
    name_zh: '挪威',
    cities: [
      { en: 'Bergen', zh: '卑尔根' },
      { en: 'Oslo', zh: '奥斯陆' },
      { en: 'Stavanger', zh: '斯塔万格' },
      { en: 'Trondheim', zh: '特隆赫姆' },
    ],
  },

  {
    code: 'DK',
    name_en: 'Denmark',
    name_zh: '丹麦',
    cities: [
      { en: 'Aarhus', zh: '奥胡斯' },
      { en: 'Copenhagen', zh: '哥本哈根' },
      { en: 'Odense', zh: '欧登塞' },
    ],
  },

  {
    code: 'FI',
    name_en: 'Finland',
    name_zh: '芬兰',
    cities: [
      { en: 'Espoo', zh: '埃斯波' },
      { en: 'Helsinki', zh: '赫尔辛基' },
      { en: 'Tampere', zh: '坦佩雷' },
      { en: 'Turku', zh: '图尔库' },
    ],
  },

  {
    code: 'IT',
    name_en: 'Italy',
    name_zh: '意大利',
    cities: [
      { en: 'Bologna', zh: '博洛尼亚' },
      { en: 'Florence', zh: '佛罗伦萨' },
      { en: 'Genoa', zh: '热那亚' },
      { en: 'Milan', zh: '米兰' },
      { en: 'Naples', zh: '那不勒斯' },
      { en: 'Palermo', zh: '巴勒莫' },
      { en: 'Rome', zh: '罗马' },
      { en: 'Turin', zh: '都灵' },
      { en: 'Venice', zh: '威尼斯' },
    ],
  },

  {
    code: 'ES',
    name_en: 'Spain',
    name_zh: '西班牙',
    cities: [
      { en: 'Barcelona', zh: '巴塞罗那' },
      { en: 'Bilbao', zh: '毕尔巴鄂' },
      { en: 'Madrid', zh: '马德里' },
      { en: 'Málaga', zh: '马拉加' },
      { en: 'Seville', zh: '塞维利亚' },
      { en: 'Valencia', zh: '瓦伦西亚' },
    ],
  },

  {
    code: 'PT',
    name_en: 'Portugal',
    name_zh: '葡萄牙',
    cities: [
      { en: 'Lisbon', zh: '里斯本' },
      { en: 'Porto', zh: '波尔图' },
    ],
  },

  {
    code: 'PL',
    name_en: 'Poland',
    name_zh: '波兰',
    cities: [
      { en: 'Cracow', zh: '克拉科夫' },
      { en: 'Gdańsk', zh: '格但斯克' },
      { en: 'Katowice', zh: '卡托维兹' },
      { en: 'Poznań', zh: '波兹南' },
      { en: 'Warsaw', zh: '华沙' },
      { en: 'Wrocław', zh: '弗罗茨瓦夫' },
    ],
  },

  {
    code: 'CZ',
    name_en: 'Czech Republic',
    name_zh: '捷克',
    cities: [
      { en: 'Brno', zh: '布尔诺' },
      { en: 'Prague', zh: '布拉格' },
    ],
  },

  {
    code: 'HU',
    name_en: 'Hungary',
    name_zh: '匈牙利',
    cities: [
      { en: 'Budapest', zh: '布达佩斯' },
    ],
  },

  {
    code: 'GR',
    name_en: 'Greece',
    name_zh: '希腊',
    cities: [
      { en: 'Athens', zh: '雅典' },
      { en: 'Thessaloniki', zh: '塞萨洛尼基' },
    ],
  },

  {
    code: 'RO',
    name_en: 'Romania',
    name_zh: '罗马尼亚',
    cities: [
      { en: 'Bucharest', zh: '布加勒斯特' },
      { en: 'Cluj-Napoca', zh: '克卢日-纳波卡' },
    ],
  },

  // ── Asia ──

  {
    code: 'TW',
    name_en: 'Taiwan',
    name_zh: '台湾',
    cities: [
      { en: 'Hsinchu', zh: '新竹' },
      { en: 'Kaohsiung', zh: '高雄' },
      { en: 'Taichung', zh: '台中' },
      { en: 'Tainan', zh: '台南' },
      { en: 'Taipei', zh: '台北' },
      { en: 'Taoyuan', zh: '桃园' },
    ],
  },

  {
    code: 'IN',
    name_en: 'India',
    name_zh: '印度',
    cities: [
      { en: 'Ahmedabad', zh: '艾哈迈达巴德' },
      { en: 'Bangalore', zh: '班加罗尔' },
      { en: 'Chennai', zh: '金奈' },
      { en: 'Delhi', zh: '德里' },
      { en: 'Hyderabad', zh: '海德拉巴' },
      { en: 'Kolkata', zh: '加尔各答' },
      { en: 'Mumbai', zh: '孟买' },
      { en: 'Pune', zh: '浦那' },
    ],
  },

  {
    code: 'TH',
    name_en: 'Thailand',
    name_zh: '泰国',
    cities: [
      { en: 'Bangkok', zh: '曼谷' },
      { en: 'Chiang Mai', zh: '清迈' },
      { en: 'Phuket', zh: '普吉' },
    ],
  },

  {
    code: 'VN',
    name_en: 'Vietnam',
    name_zh: '越南',
    cities: [
      { en: 'Da Nang', zh: '岘港' },
      { en: 'Hanoi', zh: '河内' },
      { en: 'Ho Chi Minh City', zh: '胡志明市' },
    ],
  },

  {
    code: 'MY',
    name_en: 'Malaysia',
    name_zh: '马来西亚',
    cities: [
      { en: 'George Town', zh: '乔治市' },
      { en: 'Johor Bahru', zh: '新山' },
      { en: 'Kuala Lumpur', zh: '吉隆坡' },
    ],
  },

  {
    code: 'ID',
    name_en: 'Indonesia',
    name_zh: '印度尼西亚',
    cities: [
      { en: 'Bali', zh: '巴厘岛' },
      { en: 'Bandung', zh: '万隆' },
      { en: 'Jakarta', zh: '雅加达' },
      { en: 'Surabaya', zh: '泗水' },
    ],
  },

  {
    code: 'PH',
    name_en: 'Philippines',
    name_zh: '菲律宾',
    cities: [
      { en: 'Cebu', zh: '宿务' },
      { en: 'Manila', zh: '马尼拉' },
    ],
  },

  // ── Middle East ──

  {
    code: 'AE',
    name_en: 'United Arab Emirates',
    name_zh: '阿联酋',
    cities: [
      { en: 'Abu Dhabi', zh: '阿布扎比' },
      { en: 'Dubai', zh: '迪拜' },
      { en: 'Sharjah', zh: '沙迦' },
    ],
  },

  {
    code: 'IL',
    name_en: 'Israel',
    name_zh: '以色列',
    cities: [
      { en: 'Haifa', zh: '海法' },
      { en: 'Jerusalem', zh: '耶路撒冷' },
      { en: 'Tel Aviv', zh: '特拉维夫' },
    ],
  },

  {
    code: 'SA',
    name_en: 'Saudi Arabia',
    name_zh: '沙特阿拉伯',
    cities: [
      { en: 'Jeddah', zh: '吉达' },
      { en: 'Riyadh', zh: '利雅得' },
    ],
  },

  {
    code: 'QA',
    name_en: 'Qatar',
    name_zh: '卡塔尔',
    cities: [
      { en: 'Doha', zh: '多哈' },
    ],
  },

  {
    code: 'TR',
    name_en: 'Turkey',
    name_zh: '土耳其',
    cities: [
      { en: 'Ankara', zh: '安卡拉' },
      { en: 'Antalya', zh: '安塔利亚' },
      { en: 'Istanbul', zh: '伊斯坦布尔' },
      { en: 'Izmir', zh: '伊兹密尔' },
    ],
  },

  // ── Americas ──

  {
    code: 'MX',
    name_en: 'Mexico',
    name_zh: '墨西哥',
    cities: [
      { en: 'Guadalajara', zh: '瓜达拉哈拉' },
      { en: 'Mexico City', zh: '墨西哥城' },
      { en: 'Monterrey', zh: '蒙特雷' },
    ],
  },

  {
    code: 'BR',
    name_en: 'Brazil',
    name_zh: '巴西',
    cities: [
      { en: 'Brasília', zh: '巴西利亚' },
      { en: 'Curitiba', zh: '库里蒂巴' },
      { en: 'Porto Alegre', zh: '阿雷格里港' },
      { en: 'Rio de Janeiro', zh: '里约热内卢' },
      { en: 'Salvador', zh: '萨尔瓦多' },
      { en: 'São Paulo', zh: '圣保罗' },
    ],
  },

  {
    code: 'AR',
    name_en: 'Argentina',
    name_zh: '阿根廷',
    cities: [
      { en: 'Buenos Aires', zh: '布宜诺斯艾利斯' },
      { en: 'Córdoba', zh: '科尔多瓦' },
      { en: 'Rosario', zh: '罗萨里奥' },
    ],
  },

  {
    code: 'CL',
    name_en: 'Chile',
    name_zh: '智利',
    cities: [
      { en: 'Santiago', zh: '圣地亚哥' },
      { en: 'Valparaíso', zh: '瓦尔帕莱索' },
    ],
  },

  {
    code: 'CO',
    name_en: 'Colombia',
    name_zh: '哥伦比亚',
    cities: [
      { en: 'Bogotá', zh: '波哥大' },
      { en: 'Medellín', zh: '麦德林' },
    ],
  },

  // ── Africa ──

  {
    code: 'ZA',
    name_en: 'South Africa',
    name_zh: '南非',
    cities: [
      { en: 'Cape Town', zh: '开普敦' },
      { en: 'Johannesburg', zh: '约翰内斯堡' },
      { en: 'Pretoria', zh: '比勒陀利亚' },
    ],
  },

  {
    code: 'EG',
    name_en: 'Egypt',
    name_zh: '埃及',
    cities: [
      { en: 'Alexandria', zh: '亚历山大' },
      { en: 'Cairo', zh: '开罗' },
    ],
  },

  {
    code: 'NG',
    name_en: 'Nigeria',
    name_zh: '尼日利亚',
    cities: [
      { en: 'Abuja', zh: '阿布贾' },
      { en: 'Lagos', zh: '拉各斯' },
    ],
  },

  {
    code: 'KE',
    name_en: 'Kenya',
    name_zh: '肯尼亚',
    cities: [
      { en: 'Nairobi', zh: '内罗毕' },
    ],
  },

  // ── Oceania ──

  {
    code: 'NZ',
    name_en: 'New Zealand',
    name_zh: '新西兰',
    cities: [
      { en: 'Auckland', zh: '奥克兰' },
      { en: 'Christchurch', zh: '基督城' },
      { en: 'Wellington', zh: '惠灵顿' },
    ],
  },

  // ── Other ──

  {
    code: 'RU',
    name_en: 'Russia',
    name_zh: '俄罗斯',
    cities: [
      { en: 'Moscow', zh: '莫斯科' },
      { en: 'Saint Petersburg', zh: '圣彼得堡' },
    ],
  },

  {
    code: 'MO',
    name_en: 'Macau',
    name_zh: '澳门',
    cities: [
      { en: 'Macau', zh: '澳门' },
    ],
  },
]

// ============================================================
// Helper functions
// ============================================================

export function getCountryName(country: CountryData, locale: Locale): string {
  if (locale === 'zh') return country.name_zh
  if (locale === 'nl') {
    const displayName = new Intl.DisplayNames(['nl-NL'], { type: 'region' }).of(country.code)
    return displayName || country.name_en
  }
  return country.name_en
}

/** Get a flat list of all countries sorted by name */
export function getCountries(locale: Locale): Array<{ code: string; name: string }> {
  return GLOBAL_CITIES_DB
    .map((c) => ({ code: c.code, name: getCountryName(c, locale) }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Search countries */
export function searchCountries(
  query: string,
  locale: Locale,
  limit = 10
): Array<{ code: string; name: string }> {
  if (!query.trim()) {
    return getCountries(locale).slice(0, limit)
  }
  const q = query.toLowerCase()
  return GLOBAL_CITIES_DB
    .filter((c) => {
      const localized = getCountryName(c, locale).toLowerCase()
      return (
        c.name_en.toLowerCase().includes(q) ||
        c.name_zh.includes(q) ||
        localized.includes(q) ||
        c.code.toLowerCase() === q
      )
    })
    .map((c) => ({ code: c.code, name: getCountryName(c, locale) }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit)
}

/** Get display name for a city (with country) */
export function getCityDisplayName(
  cityName: string,
  locale: Locale
): string {
  for (const country of GLOBAL_CITIES_DB) {
    for (const city of country.cities) {
      if (city.en === cityName || city.zh === cityName) {
        const cName = locale === 'zh' ? city.zh : city.en
        const coName = getCountryName(country, locale)
        return `${cName}, ${coName}`
      }
    }
  }
  return cityName
}

/** Resolve a country code to its English name. Returns the code if not found. */
export function getCountryEnglishName(countryCode: string): string {
  const country = GLOBAL_CITIES_DB.find((c) => c.code === countryCode)
  return country ? country.name_en : countryCode
}

/** Resolve a country code to a localized display name. Returns the code if not found. */
export function getCountryDisplayName(countryCode: string, locale: Locale): string {
  const country = GLOBAL_CITIES_DB.find((c) => c.code === countryCode)
  return country ? getCountryName(country, locale) : countryCode
}

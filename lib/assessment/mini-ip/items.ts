// ============================================================
// Mini-IP — Item Bank
//
// Official O*NET Mini Interest Profiler (Mini-IP), 30 items.
// Source: Rounds, J., Ming, S., Cao, M., Song, C., & Lewis, P.
//   (2016). Development of an O*NET Mini Interest Profiler
//   (Mini-IP) for Mobile Devices: Psychometric Characteristics.
//   National Center for O*NET Development.
//   https://www.onetcenter.org/dl_files/Mini-IP.pdf
//
// Items are verbatim from Appendix A (pp. 19-20) of the report.
// Selected from IP-SF 60 via IRT analysis, MDS, content coverage
// review, and gender balance optimization — NOT simple odd-number
// selection.
//
// License: O*NET Tools Developer License (CC BY with attribution).
// Chinese translations by Deep Dive research team.
//
// Arranged in R-I-A-S-E-C interleaved blocks (6 items per block,
// 5 blocks total) to prevent consecutive same-dimension responses.
//
// Dimension groups (5 items each):
//   R: 1, 7, 13, 19, 25
//   I: 2, 8, 14, 20, 26
//   A: 3, 9, 15, 21, 27
//   S: 4, 10, 16, 22, 28
//   E: 5, 11, 17, 23, 29
//   C: 6, 12, 18, 24, 30
//
// DO NOT MODIFY item text — these are published instrument items.
// ============================================================

import type { MiniIpItem } from "./types";

export const MINI_IP_ITEMS: MiniIpItem[] = [
  // ── Block 1 (items 1–6) ──────────────────────────────────
  {
    index: 1,
    riasecScale: "R",
    textEn: "Build kitchen cabinets",
    textZh: "制作厨房橱柜",
  },
  {
    index: 2,
    riasecScale: "I",
    textEn: "Develop a new medicine",
    textZh: "研发一种新药",
  },
  {
    index: 3,
    riasecScale: "A",
    textEn: "Write books or plays",
    textZh: "写书或舞台剧本",
  },
  {
    index: 4,
    riasecScale: "S",
    textEn: "Help people with personal or emotional problems",
    textZh: "帮助他人应对个人或情感问题",
  },
  {
    index: 5,
    riasecScale: "E",
    textEn: "Manage a department within a large company",
    textZh: "在大型公司管理一个部门",
  },
  {
    index: 6,
    riasecScale: "C",
    textEn: "Install software across computers on a large network",
    textZh: "为大型计算机网络中的多台电脑安装软件",
  },
  // ── Block 2 (items 7–12) ─────────────────────────────────
  {
    index: 7,
    riasecScale: "R",
    textEn: "Repair household appliances",
    textZh: "修理家用电器",
  },
  {
    index: 8,
    riasecScale: "I",
    textEn: "Study ways to reduce water pollution",
    textZh: "研究减少水污染的方法",
  },
  {
    index: 9,
    riasecScale: "A",
    textEn: "Compose or arrange music",
    textZh: "创作或编排音乐",
  },
  {
    index: 10,
    riasecScale: "S",
    textEn: "Give career guidance to people",
    textZh: "为他人提供职业指导",
  },
  {
    index: 11,
    riasecScale: "E",
    textEn: "Start your own business",
    textZh: "创办自己的企业",
  },
  {
    index: 12,
    riasecScale: "C",
    textEn: "Operate a calculator",
    textZh: "使用计算器",
  },
  // ── Block 3 (items 13–18) ────────────────────────────────
  {
    index: 13,
    riasecScale: "R",
    textEn: "Assemble electronic parts",
    textZh: "组装电子零件",
  },
  {
    index: 14,
    riasecScale: "I",
    textEn: "Conduct chemical experiments",
    textZh: "进行化学实验",
  },
  {
    index: 15,
    riasecScale: "A",
    textEn: "Create special effects for movies",
    textZh: "为电影制作特效",
  },
  {
    index: 16,
    riasecScale: "S",
    textEn: "Perform rehabilitation therapy",
    textZh: "帮助患者进行康复训练",
  },
  {
    index: 17,
    riasecScale: "E",
    textEn: "Negotiate business contracts",
    textZh: "谈判商业合同",
  },
  {
    index: 18,
    riasecScale: "C",
    textEn: "Keep shipping and receiving records",
    textZh: "维护货物收发记录",
  },
  // ── Block 4 (items 19–24) ────────────────────────────────
  {
    index: 19,
    riasecScale: "R",
    textEn: "Drive a truck to deliver packages to offices and homes",
    textZh: "驾驶卡车给办公室和住户运送包裹",
  },
  {
    index: 20,
    riasecScale: "I",
    textEn: "Examine blood samples using a microscope",
    textZh: "用显微镜检查血液样本",
  },
  {
    index: 21,
    riasecScale: "A",
    textEn: "Paint sets for plays",
    textZh: "为舞台剧绘制布景",
  },
  {
    index: 22,
    riasecScale: "S",
    textEn: "Do volunteer work at a non-profit organization",
    textZh: "在非营利组织做志愿者",
  },
  {
    index: 23,
    riasecScale: "E",
    textEn: "Market a new line of clothing",
    textZh: "推广一个新的服装系列",
  },
  {
    index: 24,
    riasecScale: "C",
    textEn: "Inventory supplies using a hand-held computer",
    textZh: "用手持设备盘点库存",
  },
  // ── Block 5 (items 25–30) ────────────────────────────────
  {
    index: 25,
    riasecScale: "R",
    textEn: "Test the quality of parts before shipment",
    textZh: "发货前检验零件质量",
  },
  {
    index: 26,
    riasecScale: "I",
    textEn: "Develop a way to better predict the weather",
    textZh: "开发一种更准确预测天气的方法",
  },
  {
    index: 27,
    riasecScale: "A",
    textEn: "Write scripts for movies or television shows",
    textZh: "为影视作品写脚本",
  },
  {
    index: 28,
    riasecScale: "S",
    textEn: "Teach a high-school class",
    textZh: "给高中班级上课",
  },
  {
    index: 29,
    riasecScale: "E",
    textEn: "Sell merchandise at a department store",
    textZh: "在百货商店销售商品",
  },
  {
    index: 30,
    riasecScale: "C",
    textEn: "Stamp, sort, and distribute mail for an organization",
    textZh: "为机构处理邮件：贴邮票、分拣和分发",
  },
];

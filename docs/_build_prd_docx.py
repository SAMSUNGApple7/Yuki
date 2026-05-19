# -*- coding: utf-8 -*-
"""
生成 Yuki Word 版 PRD（大厂模板）
- 封面页
- 目录（PAGE 域，Word 打开后按 F9 刷新）
- 多级标题（H1 / H2 / H3）
- 表格（含 header 行配色）
- 页眉页脚 + 页码
- 中文字体：PingFang SC / 微软雅黑 备选；英文：Calibri / Arial
"""

from docx import Document
from docx.shared import Pt, Cm, Mm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn, nsmap
from docx.oxml import OxmlElement
from docx.enum.section import WD_SECTION
import os

OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Yuki_PRD.docx")

# =============================================================================
# 工具函数
# =============================================================================

def set_cell_shading(cell, fill="EFEFEF"):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill)
    tc_pr.append(shd)


def set_cell_border(cell, color="CCCCCC", sz="4"):
    tc_pr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for edge in ('top', 'left', 'bottom', 'right'):
        b = OxmlElement(f'w:{edge}')
        b.set(qn('w:val'), 'single')
        b.set(qn('w:sz'), sz)
        b.set(qn('w:color'), color)
        tcBorders.append(b)
    tc_pr.append(tcBorders)


def set_run_font(run, font_en="Calibri", font_cn="微软雅黑", size_pt=11, bold=False, color=None):
    run.font.name = font_en
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn('w:rFonts'))
    if rfonts is None:
        rfonts = OxmlElement('w:rFonts')
        rpr.append(rfonts)
    rfonts.set(qn('w:ascii'), font_en)
    rfonts.set(qn('w:hAnsi'), font_en)
    rfonts.set(qn('w:eastAsia'), font_cn)
    run.font.size = Pt(size_pt)
    run.bold = bold
    if color:
        run.font.color.rgb = RGBColor.from_string(color)


def add_h1(doc, text):
    p = doc.add_paragraph()
    p.style = doc.styles['Heading 1']
    p.paragraph_format.space_before = Pt(20)
    p.paragraph_format.space_after = Pt(8)
    r = p.add_run(text)
    set_run_font(r, font_en="Calibri", font_cn="微软雅黑", size_pt=22, bold=True, color="1A1A1A")
    return p


def add_h2(doc, text):
    p = doc.add_paragraph()
    p.style = doc.styles['Heading 2']
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run(text)
    set_run_font(r, font_en="Calibri", font_cn="微软雅黑", size_pt=16, bold=True, color="1F4E79")
    return p


def add_h3(doc, text):
    p = doc.add_paragraph()
    p.style = doc.styles['Heading 3']
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run(text)
    set_run_font(r, font_en="Calibri", font_cn="微软雅黑", size_pt=13, bold=True, color="2E5984")
    return p


def add_para(doc, text, indent_cm=0):
    p = doc.add_paragraph()
    if indent_cm:
        p.paragraph_format.left_indent = Cm(indent_cm)
    p.paragraph_format.line_spacing = 1.6
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run(text)
    set_run_font(r, size_pt=11)
    return p


def add_bullet(doc, text):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.line_spacing = 1.5
    r = p.add_run(text)
    set_run_font(r, size_pt=11)
    return p


def add_kv_table(doc, rows, col_widths_cm=(4.5, 12.5), header_bold=True, header_shade="F2F2F2"):
    """两列表格：左标签 + 右值"""
    tbl = doc.add_table(rows=len(rows), cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    for i, (k, v) in enumerate(rows):
        cell_k = tbl.rows[i].cells[0]
        cell_v = tbl.rows[i].cells[1]
        cell_k.width = Cm(col_widths_cm[0])
        cell_v.width = Cm(col_widths_cm[1])
        cell_k.paragraphs[0].clear()
        cell_v.paragraphs[0].clear()
        rk = cell_k.paragraphs[0].add_run(k)
        rv = cell_v.paragraphs[0].add_run(v)
        set_run_font(rk, size_pt=10.5, bold=header_bold)
        set_run_font(rv, size_pt=10.5)
        if header_shade:
            set_cell_shading(cell_k, header_shade)
        set_cell_border(cell_k)
        set_cell_border(cell_v)
        cell_k.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        cell_v.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    return tbl


def add_data_table(doc, headers, rows, col_widths_cm=None, header_shade="1F4E79", header_color="FFFFFF"):
    """多列数据表格 · 含表头配色"""
    ncols = len(headers)
    nrows = 1 + len(rows)
    tbl = doc.add_table(rows=nrows, cols=ncols)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    # Header row
    for j, h in enumerate(headers):
        cell = tbl.rows[0].cells[j]
        cell.paragraphs[0].clear()
        r = cell.paragraphs[0].add_run(h)
        set_run_font(r, size_pt=10.5, bold=True, color=header_color)
        set_cell_shading(cell, header_shade)
        set_cell_border(cell)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        if col_widths_cm:
            cell.width = Cm(col_widths_cm[j])
    # Data rows
    for i, row in enumerate(rows, start=1):
        for j, val in enumerate(row):
            cell = tbl.rows[i].cells[j]
            cell.paragraphs[0].clear()
            r = cell.paragraphs[0].add_run(str(val))
            set_run_font(r, size_pt=10)
            set_cell_border(cell)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            if col_widths_cm:
                cell.width = Cm(col_widths_cm[j])
    return tbl


def add_page_break(doc):
    p = doc.add_paragraph()
    r = p.add_run()
    r.add_break(WD_BREAK.PAGE)


def add_toc(doc):
    """插入 TOC 域 · 打开 Word 后按 F9 更新"""
    p = doc.add_paragraph()
    run = p.add_run()
    fldChar1 = OxmlElement('w:fldChar')
    fldChar1.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText')
    instrText.set(qn('xml:space'), 'preserve')
    instrText.text = 'TOC \\o "1-3" \\h \\z \\u'
    fldChar2 = OxmlElement('w:fldChar')
    fldChar2.set(qn('w:fldCharType'), 'separate')
    fldChar3 = OxmlElement('w:t')
    fldChar3.text = "（请在 Word 中按 F9 刷新目录）"
    fldChar4 = OxmlElement('w:fldChar')
    fldChar4.set(qn('w:fldCharType'), 'end')
    r_el = run._element
    r_el.append(fldChar1)
    r_el.append(instrText)
    r_el.append(fldChar2)
    r_el.append(fldChar3)
    r_el.append(fldChar4)


def add_page_number(paragraph):
    run = paragraph.add_run()
    fld1 = OxmlElement('w:fldChar')
    fld1.set(qn('w:fldCharType'), 'begin')
    instr = OxmlElement('w:instrText')
    instr.set(qn('xml:space'), 'preserve')
    instr.text = 'PAGE'
    fld2 = OxmlElement('w:fldChar')
    fld2.set(qn('w:fldCharType'), 'end')
    run._element.append(fld1)
    run._element.append(instr)
    run._element.append(fld2)


# =============================================================================
# 主流程
# =============================================================================

def build():
    doc = Document()

    # —— 全局：A4 + 中文字体默认
    for section in doc.sections:
        section.page_height = Cm(29.7)
        section.page_width = Cm(21.0)
        section.left_margin = Cm(2.5)
        section.right_margin = Cm(2.5)
        section.top_margin = Cm(2.5)
        section.bottom_margin = Cm(2.5)

        # 页眉
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hr = hp.add_run("Yuki · PRD v1.2 · CONFIDENTIAL")
        set_run_font(hr, size_pt=9, color="808080")

        # 页脚（页码 + 文档信息）
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        fr1 = fp.add_run("· ")
        set_run_font(fr1, size_pt=9, color="808080")
        add_page_number(fp)
        fr2 = fp.add_run(" ·")
        set_run_font(fr2, size_pt=9, color="808080")

    # ========== 封面 ==========
    p_top = doc.add_paragraph()
    p_top.paragraph_format.space_before = Pt(120)
    p_top.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_top.add_run("Yuki")
    set_run_font(r, font_en="Cambria", font_cn="微软雅黑", size_pt=64, bold=True, color="1A1A1A")

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(36)
    r = p_sub.add_run("基于多智能体协作的个人成长助手")
    set_run_font(r, size_pt=18, color="555555")

    p_quote = doc.add_paragraph()
    p_quote.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_quote.paragraph_format.space_after = Pt(56)
    r = p_quote.add_run("Three minds, one growth.   让每一天的成长被看见。")
    set_run_font(r, font_en="Cambria Italic", font_cn="楷体", size_pt=14, color="888888")

    # 封面元信息表
    add_kv_table(doc, [
        ("文档类型", "Product Requirements Document"),
        ("产品代号", "Yuki ·「雪」"),
        ("文档版本", "v1.2 · 2025.06 Final"),
        ("文档状态", "Reviewed · Ready for Build"),
        ("作者", "高一航（Product Manager / Project Owner）"),
        ("评审者", "用户调研组 (n=20) · 设计组 · 工程组"),
        ("项目周期", "2025.04 立项 → 2025.06 MVP 上线"),
        ("保密等级", "内部资料 · CONFIDENTIAL"),
    ], col_widths_cm=(4.5, 12.5))

    # 封面底部关键结果
    doc.add_paragraph()
    p_kr = doc.add_paragraph()
    p_kr.paragraph_format.space_before = Pt(28)
    p_kr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_kr.add_run("关键结果")
    set_run_font(r, size_pt=12, bold=True, color="C0851F")

    add_data_table(doc,
        headers=["维度", "结果"],
        rows=[
            ["用户任务完成率（vs 单 Agent 基线）", "+38%"],
            ["目标达成满意度", "86%"],
            ["LLM-as-Judge 综合得分", "4.3 / 5"],
            ["50 场景评估集覆盖", "100%"],
        ],
        col_widths_cm=(11.0, 6.0),
    )

    add_page_break(doc)

    # ========== 目录 ==========
    add_h1(doc, "目录")
    add_toc(doc)
    add_page_break(doc)

    # ========== 0 · 一页摘要 ==========
    add_h1(doc, "0 · TL;DR · 一页摘要")
    add_kv_table(doc, [
        ("产品名", "Yuki ·「雪」· 基于多智能体协作的个人成长助手"),
        ("一句话定位", "三 Agent 协作完成「定目标 → 执行 → 复盘」闭环的 AI 个人成长助手"),
        ("目标用户", "大学生群体（大三、大四为主）"),
        ("核心价值", "把传统散落多工具的成长流程，用 AI 多 Agent 协作连成闭环"),
        ("差异化", "AI 协同 + 闭环成长"),
        ("MVP 范围", "目标管理 / 任务执行 / 周期复盘 / 系统设置 四大模块"),
        ("首发平台", "Web App（响应式 + PWA）"),
        ("关键指标", "DAU/MAU ≥ 25% · 任务完成率 ≥ 70% · 周复盘开启率 ≥ 60%"),
        ("已验证结果", "评估集 LLM-as-Judge 4.3/5 · 任务完成率 +38% · 满意度 86%"),
    ])

    add_page_break(doc)

    # ========== 1 · 背景 ==========
    add_h1(doc, "1 · 背景与机会")
    add_h2(doc, "1.1 行业观察")
    add_para(doc, "LLM 进入生产力工具领域已两年，C 端落地以「ChatGPT 式通用对话」为主，专业垂直产品稀缺。同时，多智能体（Multi-Agent）范式（如 MetaGPT、AutoGen、CrewAI）在 B 端开发场景已验证，但在 C 端日常工具几乎空白。")
    add_para(doc, "Yuki 的判断：Multi-Agent 范式从 B 端外溢到 C 端的时间窗口已经打开，先入者可以占住「AI 协同 + 闭环成长」这个心智位。")

    add_h2(doc, "1.2 市场空间（TAM / SAM / SOM）")
    add_data_table(doc,
        headers=["层级", "口径", "规模"],
        rows=[
            ["TAM", "中国在校大学生", "约 4400 万"],
            ["SAM", "× 自我管理重度需求者 5%", "约 220 万"],
            ["SOM", "× 已有 AI 工具使用习惯 30%", "约 66 万"],
        ],
        col_widths_cm=(2.5, 9.5, 5.0),
    )
    add_para(doc, "按 SOM 66 万 × 12% 渗透率 × 60 元/年 ARPU（v1.0 商业化后）≈ 475 万 ARR 天花板。MVP 阶段不直接商业化，先跑用户数和留存。")

    add_h2(doc, "1.3 用户痛点（来自调研）")
    add_para(doc, "3 大痛点（基于 20 人深度访谈 + 112 份问卷归类）：")
    add_data_table(doc,
        headers=["痛点", "频次", "典型用户原话"],
        rows=[
            ["目标模糊", "18/20", "「我想考研，但不知道从哪开始」"],
            ["执行乏力", "16/20", "「卡了 3 天没做，就放弃了」"],
            ["复盘缺失", "19/20", "「我每周写不出有意义的总结」"],
        ],
        col_widths_cm=(3.0, 2.0, 12.0),
    )
    add_para(doc, "Yuki 名字的含义——「雪」象征「细节积累、安静、可被看见的轨迹」，对应「让每一天的成长被看见」的产品愿景。")

    add_page_break(doc)

    # ========== 2 · 定位 ==========
    add_h1(doc, "2 · 产品定位与差异化")
    add_h2(doc, "2.1 一句话定位（Positioning Statement）")
    add_para(doc, "For 在校大学生（大三、大四为主），他们有明确成长意图但缺乏从目标到反思的闭环系统，")
    add_para(doc, "Yuki is 一个由三个专业 AI Agent 协作完成「定目标 → 拆任务 → 日执行 → 周复盘」闭环的个人成长助手，")
    add_para(doc, "Unlike 滴答清单（只解决任务）、Flomo（只解决记录）、ChatGPT（只解决一次性问答），")
    add_para(doc, "Yuki 通过共享 Memory 让三个角色协作，把传统散落在多工具的成长流程合为一个闭环。")

    add_h2(doc, "2.2 竞品对标矩阵")
    add_data_table(doc,
        headers=["维度", "Flomo", "滴答清单", "Notion AI", "MetaGPT", "Yuki"],
        rows=[
            ["笔记", "★★★★★", "★", "★★★★", "★★", "★★"],
            ["任务管理", "★", "★★★★★", "★★★", "★★", "★★★★★"],
            ["AI 拆解", "✗", "✗", "★★", "★★★★", "★★★★★"],
            ["闭环复盘", "★", "★", "★", "✗", "★★★★★"],
            ["多 Agent", "✗", "✗", "✗", "B 端框架", "C 端产品"],
            ["持久记忆", "笔记式", "数据库式", "数据库式", "任务级", "Shared Memory 全程可观察"],
            ["学习曲线", "平", "中", "高", "高", "平"],
        ],
        col_widths_cm=(2.5, 2.0, 2.0, 2.0, 2.0, 6.5),
    )
    add_para(doc, "核心差异化：闭环 × 多 Agent。其他产品要么是单功能塔（Flomo / 滴答），要么是通用对话（无场景沉淀），要么是 B 端框架（MetaGPT 不可直接消费）。")

    add_h2(doc, "2.3 做什么 / 不做什么")
    add_data_table(doc,
        headers=["✓ Yuki 做", "✗ Yuki 不做（v1.0 内）"],
        rows=[
            ["三 Agent 协作", "通用笔记（让位 Flomo）"],
            ["闭环成长", "团队协作 / 项目管理（让位 Notion）"],
            ["透明 Memory", "通用对话（让位 ChatGPT）"],
            ["学习场景特化", "时间块日历（v0.3 之后再考虑）"],
        ],
        col_widths_cm=(8.0, 9.0),
    )

    add_page_break(doc)

    # ========== 3 · 用户 ==========
    add_h1(doc, "3 · 用户与场景")
    add_h2(doc, "3.1 用户画像")

    add_h3(doc, "Persona 1 · 林梓桐（核心用户 · 70% 流量）")
    add_kv_table(doc, [
        ("背景", "大三女生 · 985 高校 · 考研路线 · 专业前 20%"),
        ("目标", "12 月初考研笔试 · 目标分数 380+"),
        ("痛点", "知道要刷题，但每周做了什么、什么有效，没有沉淀"),
        ("使用习惯", "每天早 7 点起床打开 → 看今日任务 → 晚 10 点睡前勾选"),
        ("AI 经验", "用过 ChatGPT 改简历，认为 AI「聊聊还行，不能托付」"),
        ("关键原话", "「我不需要一个夸我的 AI，我需要一个能在周日晚上把这一周做了什么、哪里没做好告诉我的 AI」"),
    ])

    add_h3(doc, "Persona 2 · 周亦凡（增长用户 · 25% 流量）")
    add_kv_table(doc, [
        ("背景", "大四男生 · 双非 · 秋招冲刺 + 毕设并行"),
        ("目标", "拿一份互联网产品岗 offer"),
        ("痛点", "事情多且乱，焦虑性拖延"),
        ("使用习惯", "碎片化使用，地铁上打开看下一步"),
        ("AI 经验", "日常使用 Claude / DeepSeek，对接入 API 没有障碍"),
        ("关键原话", "「我用 ChatGPT 改简历挺好，但让它帮我做一周计划，它每次都给一个不太一样的答案」"),
    ])

    add_h3(doc, "Persona 3 · 陈雨晴（潜力用户 · 5%）")
    add_kv_table(doc, [
        ("背景", "研一女生 · 实验室在读 · 投稿一作论文"),
        ("目标", "6 个月内完成实验 + 一篇会议论文"),
        ("痛点", "长周期目标管理 + 实验异常时的调整"),
        ("备注", "比 Persona 1/2 多了「长期目标 + 异常处理」需求，是 v0.5+ 习惯养成 Agent 的目标用户"),
    ])

    add_h2(doc, "3.2 4 个核心使用场景")
    add_h3(doc, "场景 1 · 周日晚 22:00 · 新建目标（Onboarding 黄金路径）")
    add_para(doc, "林梓桐周日晚回宿舍，给自己定了「21 天学完高数（上）」。她打开 Yuki，输入目标和截止日期。规划师 Agent 在 5 秒内拆出 21 项任务，按日历分布。她大致扫一眼，确认开始。")
    add_para(doc, "触发 Agent：规划师 · 期望体验：从目标到首日任务 ≤ 60 秒")

    add_h3(doc, "场景 2 · 工作日早 07:00 · 启动节奏")
    add_para(doc, "周一早 7 点，林梓桐打开 Yuki。执行官 Agent 已经推送了今日 3 项任务。她在地铁上勾完一项。")
    add_para(doc, "触发 Agent：执行官 · 期望体验：打开即知今天要做什么")

    add_h3(doc, "场景 3 · 周三午后 14:30 · 卡点诊断")
    add_para(doc, "周三下午，「错题本」任务已经停滞 2 天。执行官检测到，主动推送一条消息：「要不要把错题本拆成 25 分钟单元？先打开本子 5 分钟就够。」")
    add_para(doc, "触发 Agent：执行官 · 期望体验：在用户卡住前 12-24 小时提示")

    add_h3(doc, "场景 4 · 周日晚 22:00 · 整周复盘")
    add_para(doc, "周日晚 10 点，复盘师 Agent 自动生成本周报告：完成率 81%、周三是低产日、建议把硬任务避开周三。林梓桐截图发给妈妈。")
    add_para(doc, "触发 Agent：复盘师 · 期望体验：本周亮点 + 下周建议都能直接落地")

    add_page_break(doc)

    # ========== 4 · 产品架构 ==========
    add_h1(doc, "4 · 产品架构")

    add_h2(doc, "4.1 功能架构（Xmind 风格）")
    add_para(doc, "Yuki 全功能架构（5 大模块 · 17 子功能）：")
    bullets = [
        "1. 目标管理（Goal）：目标创建 / 智能拆解 / 目标列表 / 目标详情",
        "2. 任务执行（Task）：今日任务看板 / 任务勾选 / 执行官推送 / 卡点诊断",
        "3. 周期复盘（Review）：周报生成 / 月报汇总 / 历史归档 / 数据看板",
        "4. 系统设置（Settings）：个人资料 / AI Provider / 数据 / 通知偏好",
        "5. 横向能力：Shared Memory · ⌘K 命令面板 · Memory Inspector · 主题切换",
    ]
    for b in bullets:
        add_bullet(doc, b)

    add_h2(doc, "4.2 三 Agent 职责矩阵")
    add_data_table(doc,
        headers=["Agent", "角色", "输入", "输出", "触发时机"],
        rows=[
            ["规划师 Planner", "战略家", "目标 + 描述 + 截止", "JSON 任务树", "新建目标"],
            ["执行官 Executor", "教练", "Memory 全量快照", "today + insight + blocker", "每日 07:00 + 主动"],
            ["复盘师 Reviewer", "顾问", "Memory + 整周事件", "summary + insights[3] + next_week[3]", "周日 22:00 + 主动"],
        ],
        col_widths_cm=(2.5, 1.8, 3.5, 5.2, 4.0),
    )
    add_para(doc, "详细 System Prompt 见 app/agent-engine.js 中 PROMPTS 对象。")

    add_h2(doc, "4.3 Shared Memory 数据模型")
    add_para(doc, "Shared Memory 是三 Agent 协作的「接缝面」，不是任何单个 Agent 的私有状态。所有 Agent 都从 Memory 读、向 Memory 写，由 UI 层负责持久化（localStorage）。这一设计对齐 MetaGPT 的 SOP-based 协作范式，但裁剪到 C 端可承受的复杂度。")
    add_para(doc, "核心数据结构：")
    bullets = [
        "SharedMemory: goals[] · activeGoalId · day · activity[] · agentStates · agentLast",
        "Goal: id · title · description · deadline · priority · createdAt · progress · tasks[]",
        "Task: id · title · goalId · day · est · agent · done",
        "ActivityEvent: ts · agent · action · summary",
    ]
    for b in bullets:
        add_bullet(doc, b)

    add_page_break(doc)

    # ========== 5 · 流程 ==========
    add_h1(doc, "5 · 核心用户流程")
    add_h2(doc, "5.1 首次新建目标流程（黄金路径）")
    bullets = [
        "用户打开 Yuki",
        "首次：引导页介绍三 Agent（30s）/ 非首次：直接进入今日",
        "点击「新建目标」",
        "填入 标题 + 优先级 + 截止",
        "规划师 Agent · LLM 拆解（≤ 10s · 5 步 Skeleton 反馈）",
        "展示任务树预览",
        "拆解合理？是→写入 Memory · 否→用户调整或重新拆",
        "跳转「今日」页 · 展示首日任务",
    ]
    for b in bullets:
        add_bullet(doc, b)

    add_h2(doc, "5.2 日常使用流程")
    bullets = [
        "每日 07:00 自动触发执行官 Agent",
        "执行官读取今日任务 + 卡点检测",
        "推送今日任务 + 一句洞察",
        "用户全天勾选完成的任务",
        "如检测到卡点：执行官主动提示（≤ 1 次/天）",
        "周日 22:00 自动触发复盘师 Agent",
        "复盘师读取整周 activity，生成周报（summary + insights[3] + next_week[3]）",
    ]
    for b in bullets:
        add_bullet(doc, b)

    add_page_break(doc)

    # ========== 6 · 功能需求 ==========
    add_h1(doc, "6 · 详细功能需求")

    add_h2(doc, "6.1 模块 A · 目标管理")
    add_h3(doc, "A1 · 目标创建")
    add_kv_table(doc, [
        ("入口", "「目标」页 → 新建按钮 · 命令面板 · ⌘N"),
        ("必填", "标题（2-50 字）"),
        ("可选", "描述 / 截止 / 优先级"),
        ("校验", "标题长度 2-50 字 · 截止日期 ≥ 今天"),
    ])

    add_h3(doc, "A2 · 智能拆解")
    add_kv_table(doc, [
        ("触发", "A1 提交时自动触发"),
        ("过程展示", "5 步 Skeleton：分析目标 → 匹配场景 → 生成任务 → 优先级排序 → 写入 Memory"),
        ("错误处理", "LLM 失败 → 回退「手动添加任务」 + 写入 Bad Case 库"),
        ("任务粒度", "7-21 项 · 单任务 30-90 分钟（评估集回归后的最优区间）"),
        ("降级策略", "API 失败 → 内置任务模板（考研 / 读书 / 秋招 3 类）兜底"),
    ])

    add_h3(doc, "A3 · 目标列表 / 详情")
    add_kv_table(doc, [
        ("Tab", "进行中 / 已完成 / 已归档"),
        ("卡片信息", "标题 + 进度环 + 截止 + 任务数 + 优先级"),
        ("操作", "点击进详情 · 长按归档 · ⌘K 中快速切换活跃目标"),
    ])

    add_h2(doc, "6.2 模块 B · 任务执行")
    add_h3(doc, "B1 · 今日任务看板")
    add_kv_table(doc, [
        ("顶部", "欢迎语 + 第 N 天 + 整体进度环"),
        ("中部", "三 Agent 状态卡（idle / thinking / done / error）"),
        ("底部", "今日任务列表（按优先级）"),
        ("交互", "勾选 + confetti 动画 + hover 上浮"),
    ])

    add_h3(doc, "B2 · 执行官推送")
    add_kv_table(doc, [
        ("触发", "07:00 自动 / 主动 ⌘E / 拉刷新"),
        ("输出", "今日任务 + 1 句洞察 + 可选卡点"),
        ("频率限制", "自动推送 ≤ 1 次/天"),
    ])

    add_h3(doc, "B3 · 卡点诊断")
    add_kv_table(doc, [
        ("检测规则", "任务 day < 当前 day - 2 且 done = false"),
        ("诊断维度", "粒度过大 / 优先级冲突 / 时间档不对"),
        ("输出形式", "Toast + 详情面板 + 写入 activity"),
    ])

    add_h2(doc, "6.3 模块 C · 周期复盘")
    add_h3(doc, "C1 · 周报生成")
    add_kv_table(doc, [
        ("触发", "周日 22:00 自动 / 主动 ⇧⌘R"),
        ("数据源", "本周整周 activity 事件流"),
        ("summary", "整体一段话 ≤ 80 字"),
        ("insights", "3 条洞察（节奏 / 瓶颈 / 异常 各 1）"),
        ("next_week", "3 条可直接转化为排期的下周建议"),
        ("可视化", "周节奏热力图（7 格 · 颜色深度 = 完成数）"),
    ])

    add_h2(doc, "6.4 模块 D · 系统设置")
    add_data_table(doc,
        headers=["选项", "需要 Key", "默认模型"],
        rows=[
            ["Demo", "✗", "(内置脚本)"],
            ["Claude Builtin", "✗", "claude-haiku-4-5"],
            ["Anthropic", "✓", "claude-haiku-4-5"],
            ["OpenAI", "✓", "gpt-4o-mini"],
            ["DeepSeek", "✓", "deepseek-chat"],
        ],
        col_widths_cm=(5.0, 3.0, 9.0),
    )

    add_page_break(doc)

    # ========== 7 · 设计 ==========
    add_h1(doc, "7 · 设计规范摘要")
    add_h2(doc, "7.1 设计工具链")
    add_data_table(doc,
        headers=["工具", "用途", "产出"],
        rows=[
            ["Figma", "对话界面 + 数据看板高保真原型", "15+ 页"],
            ["Axure", "核心交互动态原型", "黄金路径可点击演示"],
            ["墨刀", "移动端 MVP 原型", "iPhone 14 Pro · 12 屏"],
            ["Xmind", "功能架构 + 状态流转 + JTBD", "5 张脑图"],
        ],
        col_widths_cm=(2.5, 8.0, 6.5),
    )

    add_h2(doc, "7.2 核心 Design Tokens")
    add_data_table(doc,
        headers=["用途", "值（OKLCH）"],
        rows=[
            ["主背景", "oklch(0.985 0.003 80) 暖白"],
            ["主文本", "oklch(0.18 0.01 260) 近黑"],
            ["强调色 ember", "oklch(0.74 0.10 75) 暖金"],
            ["规划师色", "oklch(0.66 0.12 70) 暖金"],
            ["执行官色", "oklch(0.55 0.10 245) 深蓝"],
            ["复盘师色", "oklch(0.60 0.08 175) 青灰"],
            ["主字体", "Inter + PingFang SC"],
            ["衬线", "Source Serif 4"],
            ["等宽", "JetBrains Mono"],
            ["圆角", "6 / 12 / 20 / pill"],
        ],
        col_widths_cm=(5.0, 12.0),
    )

    add_h2(doc, "7.3 交互范式：轻量对话 + 结构化卡片")
    add_para(doc, "双轨设计：底部 Composer 接收自然语言 → 意图识别 → 路由到对应 Agent → Agent 输出渲染为新的结构化卡片或更新现有卡片，永不堆积对话气泡。")
    add_para(doc, "这避免了纯 ChatBot 形态的「对话堆积、信息密度低」问题，也避免了纯表单式 App 的「AI 价值不可见」问题。")

    add_h2(doc, "7.4 可用性测试反哺")
    add_para(doc, "经过 2 轮可用性测试 + 3 版迭代：")
    add_data_table(doc,
        headers=["版本", "SUS 得分", "黄金路径完成率"],
        rows=[
            ["v0.8 初版", "71.3", "62%"],
            ["v0.9 中版", "84.7", "89%"],
            ["v1.0 终版", "88.2", "96%"],
        ],
        col_widths_cm=(5.0, 6.0, 6.0),
    )

    add_page_break(doc)

    # ========== 8 · 技术架构 ==========
    add_h1(doc, "8 · 技术架构")
    add_h2(doc, "8.1 总体架构")
    add_para(doc, "零构建静态站点 + 浏览器端直连 LLM。React 18.3 + Babel Standalone（CDN），无 Vite / Webpack。")
    add_para(doc, "UI Layer → Agent Engine → Shared Memory (localStorage) → LLM Adapter → Anthropic / OpenAI / DeepSeek / Demo")

    add_h2(doc, "8.2 开发协作")
    add_para(doc, "PRD 撰写：人工 · 含 25+ 页篇幅")
    add_para(doc, "Demo 开发：Codex + Claude Code 辅助")
    bullets = [
        "Codex：脚手架 / CSS 样式 / 模板代码",
        "Claude Code：Agent Prompt 调优 / JSON 容错解析 / Bad Case 修复",
    ]
    for b in bullets:
        add_bullet(doc, b)
    add_para(doc, "代码评审：Codex 自动生成 → 人工 review → 集成")

    add_h2(doc, "8.3 部署方案")
    add_data_table(doc,
        headers=["平台", "配置", "适用场景"],
        rows=[
            ["Vercel", "无需配置", "推荐 · 自动 HTTPS"],
            ["Cloudflare Pages", "Output `/`", "国内访问友好"],
            ["GitHub Pages", "Source main · root", "开源仓库默认"],
            ["Netlify", "无需配置", "备选"],
        ],
        col_widths_cm=(4.0, 5.0, 8.0),
    )

    add_page_break(doc)

    # ========== 9 · 指标 ==========
    add_h1(doc, "9 · 指标体系")
    add_h2(doc, "9.1 北极星指标（North Star Metric）")
    add_para(doc, "用户在 Yuki 中坚持 ≥ 4 周的目标数量（按月统计）。这个指标对齐「产品创造的真实价值」——不是日活、不是 GMV，而是用户真的用 Yuki 完成了什么。")

    add_h2(doc, "9.2 OKR · 上线后 3 个月")
    add_data_table(doc,
        headers=["Objective", "Key Result", "目标"],
        rows=[
            ["O1 · 跑出有效闭环", "KR1.1 任务完成率", "≥ 70%"],
            ["", "KR1.2 周复盘开启率", "≥ 60%"],
            ["", "KR1.3 北极星指标", "≥ 1000 个 4 周+ 目标"],
            ["O2 · 验证产品健康度", "KR2.1 DAU / MAU", "≥ 25%"],
            ["", "KR2.2 7 日留存", "≥ 40%"],
            ["", "KR2.3 NPS", "≥ 40"],
            ["O3 · 跑通商业化预演", "KR3.1 BYOK 模式使用比", "≥ 20%"],
            ["", "KR3.2 数据导出 PV", "验证数据自主需求"],
        ],
        col_widths_cm=(5.5, 7.0, 4.5),
    )

    add_h2(doc, "9.3 50 场景评估集结果")
    add_data_table(doc,
        headers=["Agent", "结构性", "可执行性", "信息密度", "个性化", "综合"],
        rows=[
            ["规划师", "4.8", "4.6", "4.2", "4.1", "4.45"],
            ["执行官", "4.7", "4.4", "4.0", "3.8", "4.25"],
            ["复盘师", "4.6", "4.2", "3.8", "3.7", "4.10"],
            ["平均", "4.7", "4.4", "4.0", "3.9", "4.30"],
        ],
        col_widths_cm=(3.0, 2.8, 2.8, 2.8, 2.8, 2.8),
    )

    add_h2(doc, "9.4 与单 Agent 基线对照")
    add_data_table(doc,
        headers=["指标", "单 Agent 基线", "Yuki 三 Agent", "Δ"],
        rows=[
            ["综合 Judge 分", "3.4 / 5", "4.3 / 5", "+26%"],
            ["任务完成率（21 天均值）", "51%", "70.4%", "+38%"],
            ["目标达成满意度", "—", "86%", "—"],
            ["周复盘「截图分享」行为", "11%", "47%", "+327%"],
        ],
        col_widths_cm=(6.0, 4.0, 4.0, 3.0),
    )

    add_page_break(doc)

    # ========== 10 · Roadmap ==========
    add_h1(doc, "10 · Roadmap")
    add_data_table(doc,
        headers=["版本", "时间", "里程碑", "关键功能"],
        rows=[
            ["v0.1 MVP", "2025.06 已发布", "闭环 + 设计稿", "三 Agent + Shared Memory + Web App"],
            ["v0.2", "2025.07", "移动适配", "PWA · 响应式精细化"],
            ["v0.3", "2025.09", "多 LLM 路由", "模型路由 · Cloudflare Workers 代理"],
            ["v0.5", "2025.12", "习惯养成 Agent", "第 4 个 Agent · 长期视角"],
            ["v0.8", "2026.03", "协作模式", "合伙人 · 互相监督"],
            ["v1.0", "2026.06", "公开发布", "跨端 · 数据同步 · iOS App"],
        ],
        col_widths_cm=(2.5, 3.0, 3.5, 8.0),
    )

    add_page_break(doc)

    # ========== 11 · GTM ==========
    add_h1(doc, "11 · Go-to-Market 策略")
    add_h2(doc, "11.1 用户获取路径（前 3 个月）")
    add_data_table(doc,
        headers=["渠道", "内容", "预期 ROI"],
        rows=[
            ["知乎", "「怎么用 AI 帮自己考研」长文 + Yuki demo", "高"],
            ["小红书", "周报美图 + 学习节奏复盘截图", "中"],
            ["B 站", "「我用 3 个 AI Agent 管理考研」视频", "中高"],
            ["Hacker News", "Show HN: Three AI agents for personal growth", "高 · 开发者破圈"],
            ["校内推广", "与「考研版」等校园社群合作", "中"],
        ],
        col_widths_cm=(3.0, 10.0, 4.0),
    )

    add_h2(doc, "11.2 关键传播点")
    add_bullet(doc, "「三 Agent 让 AI 真正变得可托付」——攻 ChatGPT 不能解决的问题")
    add_bullet(doc, "「打开就用，无需配置」——Demo 模式降低门槛")
    add_bullet(doc, "「周报截图发朋友圈」——产品自带传播属性")

    add_h2(doc, "11.3 商业化路径")
    add_bullet(doc, "v0.1 - v0.5：免费 + BYOK，不商业化，跑用户数和留存")
    add_bullet(doc, "v1.0：免费基础 + 高级订阅（30/月 · 跨端 / 习惯养成 Agent / Pro 复盘）")
    add_bullet(doc, "v1.5：合伙人匹配（社区功能）+ 与教培机构合作（B 端授权）")

    add_page_break(doc)

    # ========== 12 · 风险 ==========
    add_h1(doc, "12 · 风险与缓解")
    add_data_table(doc,
        headers=["风险", "概率", "影响", "缓解策略"],
        rows=[
            ["LLM API 成本爆炸", "中", "高", "BYOK · 缓存层 · v0.3 加 Token 预算"],
            ["拆解质量不稳定", "中", "中", "50 场景评估集回归 · Bad Case 反哺 · 模板兜底"],
            ["用户冷启动断流", "高", "高", "强引导 + 3 类模板目标推荐"],
            ["移动端体验差", "低", "中", "v0.2 重点投入"],
            ["浏览器 localStorage 限额", "低", "中", "v0.5 切 IndexedDB"],
            ["Anthropic 浏览器直连关闭", "中", "高", "v0.3 加 Cloudflare Workers 代理"],
        ],
        col_widths_cm=(4.5, 2.0, 2.0, 8.5),
    )

    add_page_break(doc)

    # ========== 13 · 交付物 ==========
    add_h1(doc, "13 · 已交付物清单（截至 v0.1）")
    add_data_table(doc,
        headers=["类别", "文件 / 链接", "简介"],
        rows=[
            ["文档", "docs/PRD.md", "本文档（25+ 页）"],
            ["文档", "docs/USER_RESEARCH.md", "用户调研报告（20 人深度访谈 + 112 问卷）"],
            ["文档", "docs/COMPETITOR_ANALYSIS.md", "4 款竞品对标矩阵"],
            ["文档", "docs/DESIGN_SPEC.md", "设计规范（Figma / Axure / 墨刀 工具链）"],
            ["文档", "docs/ARCHITECTURE.md", "技术架构"],
            ["文档", "docs/EVAL_REPORT.md", "50 场景评估集 + LLM-as-Judge 报告"],
            ["文档", "docs/USABILITY_TEST.md", "2 轮可用性测试 · 3 版迭代"],
            ["网页", "index.html", "Landing Page · 产品官网"],
            ["网页", "app.html", "主交互 Demo · React"],
            ["网页", "design.html", "Xmind 架构 + 数据看板"],
            ["网页", "prototypes.html", "Figma 风格高保真原型 15+ 页"],
            ["网页", "docs.html", "PRD 在线阅读"],
            ["代码", "app/agent-engine.js", "三 Agent + LLM 适配 + Bad Case + LLM-as-Judge"],
            ["代码", "app/components.jsx", "通用 React 组件"],
            ["代码", "app/command-palette.jsx", "⌘K 命令面板"],
            ["代码", "app/pages.jsx", "业务页面"],
            ["代码", "app/main.jsx", "App 入口"],
        ],
        col_widths_cm=(2.0, 5.5, 9.5),
    )

    add_page_break(doc)

    # ========== 14 · 附录 ==========
    add_h1(doc, "14 · 附录")
    add_h2(doc, "14.1 术语表")
    add_data_table(doc,
        headers=["术语", "解释"],
        rows=[
            ["Agent", "拥有独立 System Prompt 与工具集的 LLM 智能体"],
            ["Shared Memory", "三个 Agent 共享的中心化状态存储（localStorage）"],
            ["BYOK", "Bring Your Own Key · 用户自带 LLM API Key"],
            ["LLM-as-Judge", "用一个 LLM 作为评分裁判，自动评估另一个 LLM 的输出质量"],
            ["Bad Case 库", "所有输出质量不达标的样本归档，用于反哺 Prompt 优化"],
            ["北极星指标", "单一最重要的长期价值指标"],
        ],
        col_widths_cm=(4.0, 13.0),
    )

    add_h2(doc, "14.2 评审记录")
    add_data_table(doc,
        headers=["日期", "评审者", "关键反馈", "处理"],
        rows=[
            ["2025.04.30", "用户调研组", "「复盘缺失」比「拆解能力差」更痛", "调整 PRD 重点：复盘师独立成模块"],
            ["2025.05.10", "设计组", "三 Agent 颜色冲突", "改用 OKLCH 同色相不同饱和"],
            ["2025.05.20", "工程组", "浏览器直连 Anthropic 有 CORS 风险", "加 dangerous-direct-browser-access + v0.3 代理"],
            ["2025.06.01", "用户测试 P2", "拆解后「任务粒度过大」", "加用户校准步骤 + 模板兜底"],
        ],
        col_widths_cm=(2.5, 3.0, 6.5, 5.0),
    )

    # ========== 文档末页 ==========
    add_page_break(doc)
    p_end = doc.add_paragraph()
    p_end.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_end.paragraph_format.space_before = Pt(160)
    r = p_end.add_run("— End of PRD v1.2 —")
    set_run_font(r, font_en="Cambria", font_cn="楷体", size_pt=14, color="888888")

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_before = Pt(20)
    r = p_meta.add_run("高一航 · Product Manager · 2025.06")
    set_run_font(r, size_pt=10, color="999999")

    doc.save(OUT_PATH)
    print(f"OK: {OUT_PATH}")


if __name__ == "__main__":
    build()

# 组件缺口与排期

2026-09-16。现状 61 个组件（`docs/api/`）。做完一项删一项。

排序依据：目标场景（博客、作品集、文化 / 品牌站、文档站）的出场频率 × 水墨风的加分 × 现有积木。不按"Ant / Element / Arco / Naive 有没有"排——那是后台库的尺子，穿梭框、级联、树选择、图片墙在这些场景里基本不出现，且都是硬骨头。

## 第一批

积木现成，每个一两天，凑一个 minor。

| 组件               | 用途                          | 积木                                |
| ------------------ | ----------------------------- | ----------------------------------- |
| Dropdown           | 顶栏 / 用户菜单               | MPopover + MMenu                    |
| Notification       | 角落常驻通知，MMessage 的补集 | 弹层队列（core）                    |
| Popconfirm         | 内联确认                      | MPopover + MConfirm 逻辑            |
| Timeline           | 年表、历程页；轴线用笔触线    | brush line                          |
| Rate               | 墨点 / 小方印代替星星         | enso / stamp                        |
| BackTop            | 长文页；印章按钮              | stamp                               |
| Image              | 带放大 / 翻页预览             | MOverlayOutlet                      |
| Descriptions       | key-value 详情                | —                                   |
| MPaperTheme        | 五种纸面一键切换              | `PAPER_PRESETS` 已在 core，只缺 API |
| MSealColophon 落款 | 页脚署名 + 印章 + 日期        | stamp、paste                        |

能力补齐：MDatePicker range。

## 第二批

| 组件                      | 说明                                                   | 积木                                   |
| ------------------------- | ------------------------------------------------------ | -------------------------------------- |
| MShanShui 山水横幅        | hero：远山剪影 + 朱砂日 + 雁阵 + 孤舟，滚动 / 鼠标视差 | ridge（side / crest）、scene、parallax |
| MReadingStroke 一笔书进度 | 阅读进度 = 随滚动写完的一根笔触                        | brush line；Safari 17 静态降级         |
| Carousel                  | 指示器用墨点                                           | —                                      |
| Anchor                    | 文档站侧边导航，自己先用                               | —                                      |
| Watermark                 | 水墨水印                                               | wash / bleed                           |
| AutoComplete              | 搜索框；复用 Dropdown 的弹层                           | MInput + popper                        |
| Upload                    | 文件选择 / 拖拽 / 列表；图片墙再等                     | MButton + MList                        |

能力补齐：MTable 列排序、行选择。筛选 / 固定列 / 展开行再等。

## 构想，等需求

| 构件                   | 说明                                           | 不做的原因                             |
| ---------------------- | ---------------------------------------------- | -------------------------------------- |
| MVerticalText 竖排诗文 | `vertical-rl` 容器：乌丝栏、标点悬挂、右起分栏 | 依赖手写字体，wljh 授权未决（PLAN.md） |
| MInkSignature          | 压感毛笔签名                                   | 演示强于实用                           |
| MAnnotation 朱批       | 眉批 / 旁批 + 禅圈圈点                         | 太专                                   |
| MHandscroll 长卷       | 经折装横卷，分折 snap + 卷轴进度               | 太专                                   |
| MFan / MRubbing        | 折扇 / 拓片容器                                | MCard 的变体皮肤，等有人要             |
| MSplash                | 泼墨装饰件                                     | 没人催                                 |
| MEnsoLoading           | 禅圈加载态                                     | MLoading 的兄弟形态                    |
| MInkStatistic          | 汉字大写数字 + 淡墨趋势笔                      | 目标场景不需要 Statistic               |

## 不做

Transfer、Cascader、TreeSelect、Calendar、Layout、Segmented、Statistic、Typography、Result、ColorPicker、Mention、QRCode、Tour、FloatButton、Split、Affix（sticky）、Space（gap）、Input.OTP、TextEllipsis（line-clamp）、朴素版 Signature。

## 特色件的约束

同 `COMPONENT-CONVENTIONS.md`：随机由 `seed` 驱动、`check:ssr` 必过；动效只用 `--m-duration` / `--m-ease`，滚动驱动效果在 Safari 17 要能静态降级；依赖手写字体的按"没装退回黑体"做，授权落定再升级。

## 附

上一版按四家覆盖数排序，其中 Result、Statistic、Affix、Mention、ColorPicker 的计数有误（四家都有），Watermark / Tour / Layout 也偏低。该列已弃用。

# 组件缺口与排期

2026-09-19。现状 80 个组件（`docs/api/`）。做完一项删一项。

排序依据：目标场景（博客、作品集、文化 / 品牌站、文档站）的出场频率 × 水墨风的加分 × 现有积木。不按"Ant / Element / Arco / Naive 有没有"排——那是后台库的尺子，穿梭框、级联、树选择、图片墙在这些场景里基本不出现，且都是硬骨头。

## 第一批

已完成（1.0.0-beta.3）：Dropdown、Notification、Popconfirm、Timeline、Rate、BackTop、Image、Descriptions、MPaperTheme、MSealColophon。剩下：MDatePicker range。

## 第二批

已完成（1.0.0-beta.4）：Carousel、Anchor、Watermark、AutoComplete、Upload、MReadingStroke，MTable 列排序 / 行选择。剩下：

| 组件               | 说明                                                   | 积木                                   |
| ------------------ | ------------------------------------------------------ | -------------------------------------- |
| MShanShui 山水横幅 | hero：远山剪影 + 朱砂日 + 雁阵 + 孤舟，滚动 / 鼠标视差 | ridge（side / crest）、scene、parallax |

做过一版（`34da98d`，已回滚），画面不成立。重做前先出静态样张定稿，再接组件。

能力补齐：MTable 筛选 / 固定列 / 展开行再等。

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

# Line Cook Rush

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/ParseDark/makefun-cooking-game-20261125/rank.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/ParseDark/makefun-cooking-game-20261125/reward.svg)](https://make.fun/c/best-cooking-game-20261125-0137)

一个单屏像素厨房快节奏游戏。

顾客不断下单，你要在订单超时前完成菜品，达成每日目标，3 次失误即失败。

## 玩法

- 在菜单界面按 Play 开始游戏；也可以打开 How to play 或 Recipe book。
- 顾客会在订单板上留下订单，每张订单都有倒计时。
- 按顺序完成每道菜的步骤：用鼠标点击工作台，或按数字键 1-4 选择工作台。
- 切菜台（Board）切菜，灶台（Stove）烹饪，组装台（Table）装盘，Serve（上菜）出餐。
- 做错工作台、做了没人点的菜，或订单超时，都会记 1 次失误。3 次失误游戏结束。
- 服务成功可得分，剩余时间越多奖励越高。达到当前关卡目标可进入下一关或获胜。

## 菜谱

- Tomato Pasta：Chop tomato → Boil pasta → Sauce + plate（22 秒，100 分）
- Fried Egg Sandwich：Fry egg → Toast bread → Assemble（24 秒，110 分）
- Fruit Salad：Chop apple → Chop berry → Mix + serve（26 秒，120 分）

## 快捷键

- 1-4：选择工作台
- 空格：上菜
- P：暂停
- M：静音
- H：帮助

## 本地运行

- 安装 Node 22。
- 运行 main.ts 打包：mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
- 本地调试时，先启动静态服务器：node serve.ts 8080 game
- 然后在桌面 Chrome 中打开 http://localhost:8080

## 截图

- 使用 shoot.ts 截图（截图前需先启动 serve.ts，并安装 puppeteer 或 playwright）。
- node shoot.ts
- 生成 screenshots/1-menu.jpg、screenshots/2-gameplay.jpg、screenshots/3-recipes.jpg，每张 1280×720，质量 80，≤256 KiB。

## 目录结构

- main.ts — 入口打包脚本
- serve.ts — 本地静态服务器
- shoot.ts — 截图工具（不属于提交内容，放在 game/ 和 screenshots/ 之外）
- game/index.html — 入口页面
- game/src/config.js — 菜谱、关卡、配色、画布尺寸
- game/src/state.js — 游戏状态与规则
- game/src/render.js — 画布绘制
- game/src/input.js — 鼠标与键盘输入
- game/src/audio.js — WebAudio 合成音效
- game/src/main.js — 主循环与画面模式
- LICENSE — MIT 许可证

## 悬赏

本游戏为 make.fun 悬赏参赛作品："Make the best cooking game"（make.fun 悬赏页面）。

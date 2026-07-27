# PWR
**PWR（电源控制）简介**
- **全称**：Power Control（电源控制）
- **核心功能**：管理STM32内部电源，支持可编程电压监测器和低功耗模式。
**可编程电压监测器（PVD）**
- 监控VDD电源电压。
- 当VDD低于或高于设定的PVD阈值时，触发中断，用于执行紧急关闭等保护任务。
**低功耗模式**（共三种）
1. **睡眠模式（Sleep）**
2. **停机模式（Stop）**
3. **待机模式（Standby）**
- 用途：系统空闲时降低功耗，延长设备使用时间。
- ![[Pasted image 20260727180659.png|498]]


## 电源配置
先开始 PWR 时钟
### 睡眠模式
`__WFI()` 或 `__WFE()` //进入睡眠模式，WFI 中断唤醒，WFE 事件唤醒
### 停止模式
`PWR_EnterSTOPMode(PWR_Regulator_ON,PWR_STOPEntry_WFI);` //进入停止模式
唤醒后会时钟会重置，可能时钟会改变
`SystemInit();` //初始化时钟
### 待机模式
`PWR_EnterSTANDBYMode();` //进入待机模式
- RTC 闹钟唤醒
`RTC_SetAlarm(ADB);`
- wkup 引脚唤醒
`PWR_WakeUpPinCmd(ENABLE);						//使能位于PA0的WKUP引脚，WKUP引脚上升沿唤醒待机模式`

`
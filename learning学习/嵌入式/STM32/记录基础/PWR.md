![[Pasted image 20260727174109.png]] ![[Pasted image 20260727180659.png]]


## 电源配置
### 睡眠模式

### 停止模式
### 待机模式
`PWR_EnterSTANDBYMode();` //进入待机模式
- RTC 闹钟唤醒
`RTC_SetAlarm(ADB);`
- wkup 引脚唤醒
`PWR_WakeUpPinCmd(ENABLE);						//使能位于PA0的WKUP引脚，WKUP引脚上升沿唤醒待机模式`

`
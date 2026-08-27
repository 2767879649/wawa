# BKP
**BKP（备份寄存器）简介**
- **用途**：BKP可用于存储用户应用程序数据。
- **供电特性**：当主电源VDD（2.0~3.6V）切断时，仍由备用电源VBAT（1.8~3.6V）维持供电。
- **复位特性**：系统待机唤醒、系统复位或电源复位时，BKP数据不会被复位。
- **侵入清除**：TAMPER引脚产生的侵入事件会清除所有备份寄存器内容。
- **RTC输出功能**：RTC引脚可输出RTC校准时钟、RTC闹钟脉冲或秒脉冲。
- **校准寄存器**：可存储RTC时钟校准寄存器。
- **用户数据存储容量**：
    - 中容量和小容量产品：**20字节**
    - 大容量和互联型产品：**84字节**

STM 32103 C 8 T 6 <font color="#9bbb59">只有 10 个 DR</font>

![[Pasted image 20260727142314.png|529]]
## 初始化代码
```c
RCC_APB1PeriphClockCmd(RCC_APB1Periph_PWR,ENABLE);
RCC_APB1PeriphClockCmd(RCC_APB1Periph_BKP,ENABLE);
PWR_BackupAccessCmd(ENABLE);
```
`BKP_WriteBackupRegister(BKP_DRx,data)` //写入BKP操作
`BKP_ReadBackupRegister(BKP_DRx)` //读取操作
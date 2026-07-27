# RTC

RTC，BKP 均能被电源启动
**RTC操作注意事项**
1. **使能BKP和RTC访问权限**
    - 设置 `RCC_APB1ENR` 中的 `PWREN` 和 `BKPEN` 位，使能PWR和BKP时钟。
    - 设置 `PWR_CR` 中的 `DBP` 位，使能对BKP和RTC的访问。
2. **等待寄存器同步**
    - 若在读取RTC寄存器时，RTC的APB1接口曾处于禁止状态，则软件必须先等待 `RTC_CRL` 寄存器中的 `RSF` 位（寄存器同步标志）被硬件置1。
3. **进入配置模式才能写入**
    - 必须设置 `RTC_CRL` 寄存器中的 `CNF` 位，使RTC进入配置模式后，才能写入 `RTC_PRL`、`RTC_CNT`、`RTC_ALR` 寄存器。
4. **写操作需等待前一次完成**
    - 对RTC任何寄存器的写操作，都必须在前一次写操作结束后进行。
    - 可通过查询 `RTC_CR` 寄存器中的 `RTOFF` 状态位，判断RTC寄存器是否处于更新中。仅当 `RTOFF` 位为1时，才可写入RTC寄存器。 ![[Pasted image 20260727130040.png|577]]

C语言 [[time.h 时间函数]]
![[Pasted image 20260727141108.png|603]]
## 初始化代码
[[BKP]]使用
```c
uint16_t MyRTC_Time[]={2023,1,1,23,59,55};       //要配置的时间
void MyRTC_Init()
{
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_PWR,ENABLE);
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_BKP,ENABLE);
    PWR_BackupAccessCmd(ENABLE);//设置BKP和PWR初始配置
    
    if(BKP_ReadBackupRegister(BKP_DR1)!=12)  //BKP备份，是否是第一次初始化
    {
    RCC_LSEConfig(RCC_LSE_ON);                 //开启LSE时钟
    while(RCC_GetFlagStatus(RCC_FLAG_LSERDY)!=SET);
    
    RCC_RTCCLKConfig(RCC_RTCCLKSource_LSE);//选择RTCCLK来源为LSE
    RCC_RTCCLKCmd(ENABLE);
    
    RTC_WaitForSynchro();                //等待同步
    RTC_WaitForLastTask();                //等待上一次操作完成
    
    RTC_SetPrescaler(32768-1);            //设置RTC预分频器，预分频后的计数频率为1Hz
    RTC_WaitForLastTask();
    
    RTC_SetCounter(1785129000);            //设置初始时间
    RTC_WaitForLastTask();
        
    BKP_WriteBackupRegister(BKP_DR1,12);   //在备份寄存器写入自己规定的标志位，用于判断RTC是不是第一次执行配置
    }
    else
    {
    RTC_WaitForSynchro();
    RTC_WaitForLastTask();
    }
}
void MyRTC_SetTime(void)
{
    time_t time_cnt;
    struct tm time_data;
    time_data.tm_year=MyRTC_Time[0]-1900;
    time_data.tm_mon=MyRTC_Time[1]-1;
    time_data.tm_mday=MyRTC_Time[2];
    time_data.tm_hour=MyRTC_Time[3];
    time_data.tm_min=MyRTC_Time[4];
    time_data.tm_sec=MyRTC_Time[5];
    
    time_cnt=mktime(&time_data);
    RTC_SetCounter(time_cnt);
    RTC_WaitForLastTask();
    
}//设置时间
void MyRTC_ReadTime(void)
{
    time_t time_cnt;      
    struct tm time_data;
    
    time_cnt=RTC_GetCounter()+8*60*60;    //获取计数
    time_data=*localtime(&time_cnt);    //计数转换为时间日期

    MyRTC_Time[0]=time_data.tm_year+1900;
    MyRTC_Time[1]=time_data.tm_mon+1;
    MyRTC_Time[2]=time_data.tm_mday;
    MyRTC_Time[3]=time_data.tm_hour;
    MyRTC_Time[4]=time_data.tm_min;
    MyRTC_Time[5]=time_data.tm_sec;
    
    
}//读取时间
```
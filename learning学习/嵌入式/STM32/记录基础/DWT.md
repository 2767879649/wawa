# 函数
DWT_GetTick()//获取时间戳
DWT_TickToMicrosecond()//将时间戳转换为微秒
DWT_Delayus()
DWT_Delayms()
DWT_Delays()
# 文件添加(HAL 库)
DWT.h 文件
```c
#ifndef __MY_DWT_H
#define __MY_DWT_H
#include "main.h"

#define DEMCR *(uint32_t *)(0xE000EDFC)
#define DWT_CTRL *(uint32_t *)(0xE0001000)
#define DWT_CYCCNT *(uint32_t *)(0xE0001004)
#define DEMCR_TRCENA (1 << 24)
#define DWT_CTRL_CYCCNTENA (1 << 24)

void DWT_Init();
uint32_t DWT_GetTick(void);
uint32_t DWT_TickToMicrosecond(uint32_t tick, uint32_t frequency);
void DWT_Delayus(uint32_t time);
void DWT_Delayms(uint32_t time);
void DWT_Delays(uint32_t time);    

#endif /* __MAIN_H */
```
DWT.c 文件
```c
#include "My_DWT.h"
void DWT_Init()
{
    DEMCR |= (uint32_t)DEMCR_TRCENA;
    DWT_CYCCNT = (uint32_t)0u;
    DWT_CTRL |= (uint32_t)DWT_CTRL_CYCCNTENA;
}
uint32_t DWT_GetTick(void) // 读取当前时间戳
{
    return ((uint32_t)DWT_CYCCNT);
}
uint32_t DWT_TickToMicrosecond(uint32_t tick, uint32_t frequency) //将时间戳转换位微秒
{
    return ((uint32_t)DWT_CYCCNT);
}
void DWT_Delayus(uint32_t time)
{
    uint32_t tick_duration = time * (SystemCoreClock / 1000000);
    uint32_t tick_start = DWT_GetTick();
    while (DWT_GetTick() - tick_start < tick_duration)
        ;
}
void DWT_Delayms(uint32_t time)
{
    for (uint32_t i = 0; i < time; i++)
    {
        DWT_Delayus(1000);
    }
}

void DWT_Delays(uint32_t time)
{
    for (uint32_t i = 0; i < time; i++)
    {
        DWT_Delayms(1000);
    }
}
```

#### 成功点亮一盏灯
```
int main(void)
{
    RCC->APB2ENR = 0x00000010;
    GPIOC->CRH=0x00300000;
    GPIOC->ODR=0x00002000;
    while(1)
    {
        
    }
}

```
```
#include "stm32f10x.h"
int main(void)
{
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOC,ENABLE);//使用库函数
    GPIO_InitTypeDef GPIO_InitStructure;
    GPIO_InitStructure.GPIO_Mode=GPIO_Mode_Out_PP;
    GPIO_InitStructure.GPIO_Pin=GPIO_Pin_13 ;
    GPIO_InitStructure.GPIO_Speed=GPIO_Speed_50MHz;
    GPIO_Init(GPIOC,&GPIO_InitStructure);
    GPIO_SetBits(GPIOC,GPIO_Pin_13);
    //GPIO_ResetBits(GPIOC,GPIO_Pin_13);//配置之端口
    while(1)
    {
        
    }
}

```

#### LED
关闭为 1，开启为 0
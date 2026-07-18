
#### 成功点亮一盏灯
```
#include "stm32f10x.h"                  // Device header
void Led_Init()
{
        
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA,ENABLE);
    GPIO_InitTypeDef LED_Struct;
    LED_Struct.GPIO_Mode=GPIO_Mode_Out_PP;
    LED_Struct.GPIO_Pin=GPIO_Pin_4;
    LED_Struct.GPIO_Speed=GPIO_Speed_50MHz;
    GPIO_Init(GPIOA,&LED_Struct);
    GPIO_SetBits(GPIOA,GPIO_Pin_4);
    
}

void Led_on()
{
    GPIO_ResetBits(GPIOA,GPIO_Pin_4);
}
void Led_off()
{
    GPIO_SetBits(GPIOA,GPIO_Pin_4);
}
void Led_turn()
{
    if(GPIO_ReadOutputDataBit(GPIOA, GPIO_Pin_4) == 0)
    {
        GPIO_SetBits(GPIOA, GPIO_Pin_4);    
    }

    else
        {
    GPIO_ResetBits(GPIOA,GPIO_Pin_4);
    }
    
        
}

```

#### LED
关闭为 1，开启为 0
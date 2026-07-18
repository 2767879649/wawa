
#### 成功点亮一盏灯
```
#include "stm32f10x.h"                  // Device header
void Led_Init()
{
        
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA,ENABLE);
    GPIO_InitTypeDef LED_Struct;
    LED_Struct.GPIO_Mode=GPIO_Mode_Out_PP;    //推挽模式
    LED_Struct.GPIO_Pin=GPIO_Pin_4;
    LED_Struct.GPIO_Speed=GPIO_Speed_50MHz;
    GPIO_Init(GPIOA,&LED_Struct);
    GPIO_SetBits(GPIOA,GPIO_Pin_4);    //初始化默认低电平
    
}

void Led_on()    //开启
{
    GPIO_ResetBits(GPIOA,GPIO_Pin_4);
}
void Led_off()    //关闭
{
    GPIO_SetBits(GPIOA,GPIO_Pin_4);
}
void Led_turn()    //反转
{
    if(GPIO_ReadOutputDataBit(GPIOA, GPIO_Pin_4) == 0)    //获取输出寄存器的状态，如果当前引脚输出低电平
    {
        GPIO_SetBits(GPIOA, GPIO_Pin_4);        //则设置PA1引脚为高电平
    }

    else                                        //否则，即当前引脚输出高电平
        {
    GPIO_ResetBits(GPIOA,GPIO_Pin_4);            //则设置PA1引脚为低电平
    }
    
        
}

```

#### LED
关闭为 1，开启为 0
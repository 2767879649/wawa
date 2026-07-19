
# PWM
*用数字信号模拟模拟信号*
## 函数
`TIM_SetCompare2(TIM2, Num);`  //改变 CCR 值


寄存器会对定时器进行捕获，有多个通道，请查看 [[GPIO端口]]
CNT 定时器的当前值
CCR OC 比较值
## 输出比较模式

| 模式                 | 描述                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------- |
| 冻结                 | CNT=CCR时，REF保持为原状态                                                                     |
| 匹配时置有效电平           | CNT=CCR时，REF置有效电平                                                                      |
| 匹配时置无效电平           | CNT=CCR时，REF置无效电平                                                                      |
| 匹配时电平翻转            | CNT=CCR时，REF电平翻转                                                                       |
| 强制为无效电平            | CNT与CCR无效，REF强制为无效电平                                                                   |
| 强制为有效电平            | CNT与CCR无效，REF强制为有效电平                                                                   |
| PWM模式1             | 向上计数：CNT<CCR时，REF置有效电平，CNT≥CCR时，REF置无效电平  <br>向下计数：CNT>CCR时，REF置无效电平，CNT≤CCR时，REF置有效电平 |
| PWM模式2(与 PWM 1 相反) | 向上计数：CNT<CCR时，REF置无效电平，CNT≥CCR时，REF置有效电平  <br>向下计数：CNT>CCR时，REF置无效电平，CNT≤CCR时，REF置有效电平 |
## 模板
```
void PWM_Init()
{
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2,ENABLE);        //开启TIM2的时钟
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA,ENABLE);        //开启GPIO的时钟
    TIM_InternalClockConfig(TIM2);                          //选择TIM2的时钟源
    //GPIO初始化
    GPIO_InitTypeDef GPIO_Struct;
    GPIO_Struct.GPIO_Mode=GPIO_Mode_AF_PP;
    GPIO_Struct.GPIO_Pin=GPIO_Pin_1;
    GPIO_Struct.GPIO_Speed=GPIO_Speed_50MHz;
    GPIO_Init(GPIOA,&GPIO_Struct);                        //GPIO初始化
    
    TIM_TimeBaseInitTypeDef Timer_Struct;
    Timer_Struct.TIM_ClockDivision=TIM_CKD_DIV1;
    Timer_Struct.TIM_CounterMode=TIM_CounterMode_Up;
    Timer_Struct.TIM_Period=100-1;                //ARR，自动重装值
    Timer_Struct.TIM_Prescaler=36-1;              //PSC，预分频寄存器，关乎速度快慢
    Timer_Struct.TIM_RepetitionCounter=0;
    TIM_TimeBaseInit(TIM2, &Timer_Struct);             //时基单元初始化
    TIM_Cmd(TIM2, ENABLE);              //开启TIM2时钟
    
    

    TIM_OCInitTypeDef OC_Struct;           //结构体
    TIM_OCStructInit(&OC_Struct);        //配置默认属性
    OC_Struct.TIM_OCMode=TIM_OCMode_PWM1;
    OC_Struct.TIM_OCPolarity=TIM_OCPolarity_High;
    OC_Struct.TIM_OutputState=TIM_OutputState_Enable;
    OC_Struct.TIM_Pulse=0;//CCR
    TIM_OC2Init(TIM2,&OC_Struct);                //OC初始化

}
```

## 参数计算
- [[定时器]]
- <font color="#245bdb">PWM频率：</font>
        Freq=CK_PSC/(PSC+1)/(ARR+1)    //CK_PSC 为总线时钟频率 72MHz，PSC 预分频器，ARR自动重装值
- <font color="#245bdb">PWM占空比：</font>
        Duty=CCR/ARR+1    
- <font color="#245bdb">PWM分辨率：</font>
        Reso=1 /(ARR+1)​
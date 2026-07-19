## 中断函数使用

- 每次进入中断会将中断标志位置 1，所以进入中断后要清除中断标志位
- 中断函数不需要声明，也不需要使用，可以自动执行
> 中断函数名字不能更改，本身就存在，你只是在设置中断触发后的事件
- 

## EXTI 外部中断
GPIO[^1] -> AFIO[^2] -> EXIT[^3] -> NVIC[^4]
### 外部中断配置()
使用 [[AFIO]] 选择中断端口
```
void CountSensor_Init(void)
{
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB,ENABLE);//开启GPIO时钟
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_AFIO,ENABLE);//开启AFIO时钟
    
    GPIO_InitTypeDef GPIO_InitStructure;
    GPIO_InitStructure.GPIO_Mode=GPIO_Mode_IPU ;
    GPIO_InitStructure.GPIO_Pin= GPIO_Pin_12;
    GPIO_InitStructure.GPIO_Speed=GPIO_Speed_50MHz;
    GPIO_Init(GPIOB,&GPIO_InitStructure);//GPIOB的初始化
    
    GPIO_EXTILineConfig(GPIO_PortSourceGPIOB,GPIO_PinSource12);//配置AFIO的数据选择
    
    EXTI_InitTypeDef EXTI_InitStructure;
    EXTI_InitStructure.EXTI_Line=EXTI_Line12;
    EXTI_InitStructure.EXTI_LineCmd=ENABLE;
    EXTI_InitStructure.EXTI_Mode=EXTI_Mode_Interrupt;
    EXTI_InitStructure.EXTI_Trigger=EXTI_Trigger_Falling;
    EXTI_Init(&EXTI_InitStructure);//EXIT的初始化
    
    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);//中断分组
    
    NVIC_InitTypeDef NVIC_InitStruct;
    NVIC_InitStruct.NVIC_IRQChannel=EXTI15_10_IRQn;
    NVIC_InitStruct.NVIC_IRQChannelCmd=ENABLE;
    NVIC_InitStruct.NVIC_IRQChannelPreemptionPriority=1;
    NVIC_InitStruct.NVIC_IRQChannelSubPriority=1;
    NVIC_Init(&NVIC_InitStruct);//NVIC的初始化

}
```

### NVIC 配置
#### EXTI 线配置
> EXTI 0_IRQn
> EXTI1_IRQn
> EXTI 9_10_IRQn
> EXTI15_10_IRQn

```
/*NVIC中断分组*/
    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);                //配置NVIC为分组2
                                                                //即抢占优先级范围：0~3，响应优先级范围：0~3
                                                                //此分组配置在整个工程中仅需调用一次
                                                                //若有多个中断，可以把此代码放在main函数内，while循环之前
                                                                //若调用多次配置分组的代码，则后执行的配置会覆盖先执行的配置
    
    /*NVIC配置*/
    NVIC_InitTypeDef NVIC_InitStructure;                        //定义结构体变量
    NVIC_InitStructure.NVIC_IRQChannel = EXTI15_10_IRQn;        //选择配置NVIC的EXTI线
    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;                //指定NVIC线路使能
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 1;    //指定NVIC线路的抢占优先级为1
    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 1;            //指定NVIC线路的响应优先级为1
    NVIC_Init(&NVIC_InitStructure);//NVIC初始化
    
    NVIC_Struct.NVIC_IRQChannel=EXTI1_IRQn;//选择配置NVIC的EXTI线
    NVIC_Struct.NVIC_IRQChannelCmd=ENABLE;//指定NVIC线路使能
    NVIC_Struct.NVIC_IRQChannelPreemptionPriority=1;//指定NVIC线路的抢占优先级为1
    NVIC_Struct.NVIC_IRQChannelSubPriority=1;//指定NVIC线路的响应优先级为1
    NVIC_Init(&NVIC_Struct);//NVIC初始化
```


### 中断函数配置
```、
void EXTI15_10_IRQHandler(void)    //函数名不可更改
{
    if(EXTI_GetITStatus(EXTI_Line14)==SET)  //判断是否有外部中断14号线触发的中断
    {
        if(GPIO_ReadInputDataBit(GPIOB,GPIO_Pin_14)==0)    //再次判断引脚电平，以避免抖动
        {
        
        }
        EXTI_ClearITPendingBit(EXTI_Line14);//清空中断标志位
        
    }
}
```


## 旋钮编码器
中断事件 0，判断 GPIO 1 开启，判断旋转
中断事件 1，判断 GPIO 0 开启，判断旋转
```
void EXTI0_IRQHandler(void)//中断事件0
{
    if(EXTI_GetITStatus(EXTI_Line0)==SET)//触发中断
    {
        if(GPIO_ReadInputDataBit(GPIOB,GPIO_Pin_1)==0)//判断正转
        {
        Encoder_Count ++;
        }
        EXTI_ClearITPendingBit(EXTI_Line0);//清楚中断标志位
    }
}
void EXTI1_IRQHandler(void)//中断事件1
{
    if(EXTI_GetITStatus(EXTI_Line1)==SET)
    {
        
        if(GPIO_ReadInputDataBit(GPIOB,GPIO_Pin_0)==0)//判断反转
        {
        Encoder_Count --;
        }
        EXTI_ClearITPendingBit(EXTI_Line1);
    }
}


```







[^1]: 1.开启时钟
    2.定义结构体配置端口
    3.初始化

[^2]: 1.开启时钟
    2.选择映射端口

[^3]: 1.定义结构体，配置中断端口
    2.初始化

[^4]: 1.选择中断分组
    2.定义结构体，进行中断选择配置
    3.初始化


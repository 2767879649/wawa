## AFIO
- 主要用于引脚复用功能的选择和重定义
- 再 STM 32 中，AFIO 主要完成两个任务：复用功能引脚重映射，中断引脚选择
1. `GPIO_EXTILineConfig(GPIO_PortSourceGPIOB,GPIO_PinSource14)` //配置 AFIO 选择端口
2. ```
   EXTI_InitTypeDef EXTI_InitStructure;
       EXTI_InitStructure.EXTI_Line=EXTI_Line12;
       EXTI_InitStructure.EXTI_LineCmd=ENABLE;
       EXTI_InitStructure.EXTI_Mode=EXTI_Mode_Interrupt;
       EXTI_InitStructure.EXTI_Trigger=EXTI_Trigger_Falling;
       EXTI_Init(&EXTI_InitStructure);
       
       //EXIT中断配置
   
   ```
3. ```
   NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);
       NVIC_InitTypeDef NVIC_InitStruct;
       NVIC_InitStruct.NVIC_IRQChannel=EXTI15_10_IRQn;
       NVIC_InitStruct.NVIC_IRQChannelCmd=ENABLE;
       NVIC_InitStruct.NVIC_IRQChannelPreemptionPriority=1;
       NVIC_InitStruct.NVIC_IRQChannelSubPriority=1;
       NVIC_Init(&NVIC_InitStruct);
    
        //NVIC配置
   ```

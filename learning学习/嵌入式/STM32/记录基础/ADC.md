ADC 时钟最高 14 Mhz

C 8 T 6 有两个 ADC
ADC 1，ADC 2
引脚查看 [[GPIO端口]]
ADC 开启后需要进行校准
![[Pasted image 20260721155730.png]]
# 函数
## 初始化
```
void AD_Init(void)
{
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA,ENABLE);
    GPIO_InitTypeDef GPIO_InitStructure;
    GPIO_InitStructure.GPIO_Mode=GPIO_Mode_AIN ;
    GPIO_InitStructure.GPIO_Pin=GPIO_Pin_0;
    GPIO_InitStructure.GPIO_Speed=GPIO_Speed_50MHz;
    GPIO_Init(GPIOA,&GPIO_InitStructure);//GPIO初始化
    
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_ADC1,ENABLE);        //开启ADC时钟
    RCC_ADCCLKConfig(RCC_PCLK2_Div6);                        //设置预分频 72Mhz/6=12Mhz，ADC最高使用14Mhz   
    ADC_RegularChannelConfig(ADC1,ADC_Channel_0,1,ADC_SampleTime_55Cycles5);    //选择通道
    ADC_InitTypeDef ADC_Struct;                                //结构体
    ADC_Struct.ADC_ContinuousConvMode=ENABLE;                //
    ADC_Struct.ADC_DataAlign=ADC_DataAlign_Right;
    ADC_Struct.ADC_ExternalTrigConv=ADC_ExternalTrigConv_None;
    ADC_Struct.ADC_Mode=ADC_Mode_Independent;
    ADC_Struct.ADC_NbrOfChannel=1;
    ADC_Struct.ADC_ScanConvMode=DISABLE;
    ADC_Init(ADC1,&ADC_Struct);//ADC初始化
    ADC_Cmd(ADC1,ENABLE);//开启ADC
    
    ADC_ResetCalibration(ADC1);
    while(ADC_GetResetCalibrationStatus(ADC1));
    ADC_StartCalibration(ADC1);
    while(ADC_GetCalibrationStatus(ADC1));//ADC校准完成        
    
}
’```
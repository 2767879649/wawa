ADC 时钟最高 14 Mhz

C 8 T 6 有两个 ADC
ADC 1，ADC 2
引脚查看 [[GPIO端口]]
ADC 开启后需要进行校准
![[Pasted image 20260721155730.png]]
# 函数
GPIO->ADC[^1]
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
    ADC_Struct.ADC_DataAlign=ADC_DataAlign_Right;            //数据右对齐
    ADC_Struct.ADC_ExternalTrigConv=ADC_ExternalTrigConv_None;    //选择外部中断口
    ADC_Struct.ADC_Mode=ADC_Mode_Independent;                ////模式，选择独立模式，即单独使用ADC1
    ADC_Struct.ADC_NbrOfChannel=1;                        //ADC的通道数，为1，仅在扫描模式下，才需要指定大于1的数，在非扫描模式下，只能是1
    ADC_Struct.ADC_ScanConvMode=DISABLE;                    //不开启扫描模式，失能，只转换规则组的序列1这一个位置
    ADC_Struct.ADC_ContinuousConvMode=DISABLE;                //不开启连续转换，失能，每转换一次规则组序列后停止
    ADC_Init(ADC1,&ADC_Struct);//ADC初始化
    ADC_Cmd(ADC1,ENABLE);//开启ADC
    //固定流程，内部有电路会自动执行校准
    ADC_ResetCalibration(ADC1);            
    while(ADC_GetResetCalibrationStatus(ADC1));
    ADC_StartCalibration(ADC1);
    while(ADC_GetCalibrationStatus(ADC1));//ADC校准完成        
    
}
’```

[^1]: 

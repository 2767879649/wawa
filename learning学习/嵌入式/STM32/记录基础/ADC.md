# ADC
C 8 T 6 内部使用 12 位分辨率的 ADC
C 8 T 6 有两个 ADC
ADC 时钟最高 14 Mhz
16 个通道采样
10 个外部通道
通道采样转换后进入规则组，等待扫描
 DR 是规则组寄存器，地址不变化无需自增


引脚 查看 [[GPIO端口]]
![[Pasted image 20260721155730.png|491]]
## 模式
单次扫描模式，多次扫描模式


# 函数
GPIO->ADC[^1]
ADC 开启后需要进行校准
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
    .
    .
    .                                                    //设置多个通道
    ADC_InitTypeDef ADC_Struct;                                //结构体
    ADC_Struct.ADC_Mode=ADC_Mode_Independent;                //模式，选择独立模式，即单独使用ADC1
    ADC_Struct.ADC_DataAlign=ADC_DataAlign_Right;            //数据右对齐
    ADC_Struct.ADC_ExternalTrigConv=ADC_ExternalTrigConv_None;    //选择外部中断口，当前没有外部中断，可以软件触发中断
    ADC_Struct.ADC_ContinuousConvMode=DISABLE;                //不开启连续转换，失能，每转换一次规则组序列后停止
    ADC_Struct.ADC_ScanConvMode=DISABLE;                    //不开启扫描模式，失能，只转换规则组的序列1这一个位置
    ADC_Struct.ADC_NbrOfChannel=1;                        //ADC的通道数，为1，仅在扫描模式下，才需要指定大于1的数，在非扫描模式下，只能是
    ADC_Init(ADC1,&ADC_Struct);//ADC初始化
    ADC_Cmd(ADC1,ENABLE);//开启ADC

    //固定流程，内部有电路会自动执行校准
    ADC_ResetCalibration(ADC1);            
    while(ADC_GetResetCalibrationStatus(ADC1));
    ADC_StartCalibration(ADC1);
    while(ADC_GetCalibrationStatus(ADC1));//ADC校准完成        
    
}
```
### 获取A
### ADC+DMA
[[DMA]]














[^1]: 开启 ADC 时钟
  配置 ADC 频率
  选择 ADC，选择通道
  结构体初始化
  开启 ADC
  进行 ADC 校验

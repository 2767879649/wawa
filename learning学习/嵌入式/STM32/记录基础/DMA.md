# DMA
不依赖 CPU，可以在外设-外设，储存器-储存器，外设 -存储器之间搬运数据
 ![[Pasted image 20260722114813.png|515]]![[Pasted image 20260722132537.png|457]]
 *触发DMA条件*
1. 传输计数器>0  
2. 触发源有触发信号  
3. DMA使能
<u>更改DMA配置，需要先失能，更改后再使能</u>

## 初始化
```c
void MyDMA_Init(uint32_t AddrA,uint32_t AddrB,uint32_t Size)
{
    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1,ENABLE);                        //开启时钟，DMA在AHB总线上
    DMA_InitTypeDef DMA_Struct;                                            //结构体
    DMA_Struct.DMA_PeripheralBaseAddr=AddrA;                                //源端基地址
    DMA_Struct.DMA_PeripheralDataSize=DMA_PeripheralDataSize_Byte;        //源端发送数据宽度
    DMA_Struct.DMA_PeripheralInc=DMA_PeripheralInc_Enable;                //设置源端地址自增
    DMA_Struct.DMA_MemoryBaseAddr=AddrB;                                   //存储器基地址
    DMA_Struct.DMA_MemoryDataSize=DMA_MemoryDataSize_Byte;                //存储器数据宽度
    DMA_Struct.DMA_MemoryInc=DMA_MemoryInc_Enable;                        //设置存储器地址自增
    DMA_Struct.DMA_DIR=DMA_DIR_PeripheralSRC;                            //数据转存方向
    DMA_Struct.DMA_BufferSize=Size;                                    //转存数据大小
    DMA_Struct.DMA_Mode=DMA_Mode_Normal;                                //选择数据转存模式，正常单次，循环模式
    DMA_Struct.DMA_M2M=DMA_M2M_Enable;                                //选择软件触发(存储器-存储器)，硬件触发(外设-存储器)
    DMA_Struct.DMA_Priority=DMA_Priority_VeryHigh;                    //优先级
    DMA_Init(DMA1_Channel1,&DMA_Struct);                            //初始化
    
    DMA_Cmd(DMA1_Channel1,DISABLE);                                //DMA使能
}
```
### ADC 多通道+DMA 循环转存
[[ADC]] 
```c
void AD_Init(void)
{
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_ADC1, ENABLE);    //开启ADC1的时钟
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);    //开启GPIOA的时钟
    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);        //开启DMA1的时钟
    
    GPIO_InitTypeDef GPIO_InitStructure;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AIN;
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0 | GPIO_Pin_1 | GPIO_Pin_2 | GPIO_Pin_3;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);               //GPIO初始化
    /*设置ADC时钟*/
    RCC_ADCCLKConfig(RCC_PCLK2_Div6);                        //选择时钟6分频，ADCCLK = 72MHz / 6 = 12MHz
    ADC_RegularChannelConfig(ADC1, ADC_Channel_0, 1, ADC_SampleTime_55Cycles5);    //规则组序列1的位置，配置为通道0
    ADC_RegularChannelConfig(ADC1, ADC_Channel_1, 2, ADC_SampleTime_55Cycles5);    //规则组序列2的位置，配置为通道1
    ADC_RegularChannelConfig(ADC1, ADC_Channel_2, 3, ADC_SampleTime_55Cycles5);    //规则组序列3的位置，配置为通道2
    ADC_RegularChannelConfig(ADC1, ADC_Channel_3, 4, ADC_SampleTime_55Cycles5);    //规则组序列4的位置，配置为通道3
    ADC_InitTypeDef ADC_InitStructure;                                            //结构体
    ADC_InitStructure.ADC_Mode = ADC_Mode_Independent;                            //模式，选择独立模式，即单独使用ADC1
    ADC_InitStructure.ADC_DataAlign = ADC_DataAlign_Right;                        //数据对齐，选择右对齐
    ADC_InitStructure.ADC_ExternalTrigConv = ADC_ExternalTrigConv_None;            //外部触发，使用软件触发，不需要外部触发
    ADC_InitStructure.ADC_ContinuousConvMode = ENABLE;                       //连续转换，使能，每转换一次规则组序列后立刻开始下一次转换
    ADC_InitStructure.ADC_ScanConvMode = ENABLE;                                //扫描模式，使能，扫描规则组的序列
    ADC_InitStructure.ADC_NbrOfChannel = 4;                                        //通道数，为4，扫描规则组的前4个通道
    ADC_Init(ADC1, &ADC_InitStructure);                                            //ADC初始化
    
    /*DMA初始化*/
    DMA_InitTypeDef DMA_InitStructure;                                            //定义结构体变量
    DMA_InitStructure.DMA_PeripheralBaseAddr = (uint32_t)&ADC1->DR;                //外设基地址，给定形参AddrA
    DMA_InitStructure.DMA_PeripheralDataSize = DMA_PeripheralDataSize_HalfWord;    //外设数据宽度，选择半字，对应16为的ADC数据寄存器
    DMA_InitStructure.DMA_PeripheralInc = DMA_PeripheralInc_Disable;            //外设地址自增
    DMA_InitStructure.DMA_MemoryBaseAddr = (uint32_t)AD_Value;                    //存储器基地址，给定存放AD转换结果的全局数组AD_Value
    DMA_InitStructure.DMA_MemoryDataSize = DMA_MemoryDataSize_HalfWord;            //存储器数据宽度，选择半字，与源数据宽度对应
    DMA_InitStructure.DMA_MemoryInc = DMA_MemoryInc_Enable;                        //存储器地址自增
    DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralSRC;                            //数据传输方向
    DMA_InitStructure.DMA_BufferSize = 4;                                        //转运的数据大小（转运次数），与ADC通道数一致
    DMA_InitStructure.DMA_Mode = DMA_Mode_Circular;                                //模式，选择循环模式，与ADC的连续转换一致
    DMA_InitStructure.DMA_M2M = DMA_M2M_Disable;                                //选择软件触发，硬件触发
    DMA_InitStructure.DMA_Priority = DMA_Priority_Medium;                        //优先级，选择中等
    DMA_Init(DMA1_Channel1, &DMA_InitStructure);                                //将结构体变量交给DMA_Init，配置DMA1的通道1
    
    /*DMA和ADC使能*/
    DMA_Cmd(DMA1_Channel1, ENABLE);                            //DMA1的通道1使能
    ADC_DMACmd(ADC1, ENABLE);                                //开启ADC1触发DMA1的信号使能
    ADC_Cmd(ADC1, ENABLE);                                    //ADC1使能
    
    /*ADC校准*/
    ADC_ResetCalibration(ADC1);                                //固定流程，内部有电路会自动执行校准
    while (ADC_GetResetCalibrationStatus(ADC1) == SET);
    ADC_StartCalibration(ADC1);
    while (ADC_GetCalibrationStatus(ADC1) == SET);
    
    /*ADC触发*/
    ADC_SoftwareStartConvCmd(ADC1, ENABLE);    //软件触发ADC开始工作，由于ADC处于连续转换模式，故触发一次后ADC就可以一直连续不断地工作
}

```
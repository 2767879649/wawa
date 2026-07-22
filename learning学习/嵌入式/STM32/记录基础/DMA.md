# DMA


**![[Pasted image 20260722114813.png|427]]**![[Pasted image 20260722132537.png|470]]
## 初始化
```c
void MyDMA_Init(uint32_t AddrA,uint32_t AddrB,uint32_t Size)
{
    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1,ENABLE);                        //开启时钟，DMA在AHB总线上
    DMA_InitTypeDef DMA_Struct;                                            //结构体
    DMA_Struct.DMA_PeripheralBaseAddr=AddrA;                                //
    DMA_Struct.DMA_PeripheralDataSize=DMA_PeripheralDataSize_Byte;
    DMA_Struct.DMA_PeripheralInc=DMA_PeripheralInc_Enable;
    DMA_Struct.DMA_MemoryBaseAddr=AddrB;
    DMA_Struct.DMA_MemoryDataSize=DMA_MemoryDataSize_Byte;
    DMA_Struct.DMA_MemoryInc=DMA_MemoryInc_Enable;
    DMA_Struct.DMA_DIR=DMA_DIR_PeripheralSRC;
    DMA_Struct.DMA_BufferSize=Size;
    DMA_Struct.DMA_Mode=DMA_Mode_Normal;
    DMA_Struct.DMA_M2M=DMA_M2M_Enable;
    DMA_Struct.DMA_Priority=DMA_Priority_VeryHigh;
    DMA_Init(DMA1_Channel1,&DMA_Struct);
    
    DMA_Cmd(DMA1_Channel1,DISABLE);
}

```
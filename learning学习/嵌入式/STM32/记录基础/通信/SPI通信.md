![[image/Pasted image 20260725132846.png|736]]

# 软件初始化
```c
void MySPI_W_SS(uint8_t BitValue)
{
    GPIO_WriteBit(GPIOA,GPIO_Pin_4,(BitAction)BitValue);           //发送一个电平信号
}//改变SS
void MySPI_W_SCK(uint8_t BitValue)
{
    GPIO_WriteBit(GPIOA,GPIO_Pin_5,(BitAction)BitValue);            //
}//发送一个周期时钟
void MySPI_W_MOSI(uint8_t BitValue)
{
    GPIO_WriteBit(GPIOA,GPIO_Pin_7,(BitAction)BitValue);
}//发送一个字节信息
uint8_t MySPI_R_MISO(void)
{
    return GPIO_ReadInputDataBit(GPIOA,GPIO_Pin_6);
}//从机发送信息，主机读取到一个字节信息

void MySPI_Init()
{
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA,ENABLE);//开启GPIO时钟
    GPIO_InitTypeDef GPIO_Struct;
    GPIO_Struct.GPIO_Mode=GPIO_Mode_Out_PP;
    GPIO_Struct.GPIO_Pin=GPIO_Pin_4|GPIO_Pin_5|GPIO_Pin_7;
    GPIO_Struct.GPIO_Speed=GPIO_Speed_50MHz;
    GPIO_Init(GPIOA,&GPIO_Struct);
    
    GPIO_Struct.GPIO_Mode=GPIO_Mode_IPU;
    GPIO_Struct.GPIO_Pin=GPIO_Pin_6;
    GPIO_Struct.GPIO_Speed=GPIO_Speed_50MHz;
    GPIO_Init(GPIOA,&GPIO_Struct);
    
    MySPI_W_SS(1);
    MySPI_W_SCK(0);//SPI模式0
    
    
}
void MySPI_Start()
{
    MySPI_W_SS(0);
}
void MySPI_Stop()
{
    MySPI_W_SS(1);
}
uint8_t MySPI_SwapByte(uint8_t ByteSend)
{
    uint8_t i,ByteReceive=0x00;
    for(i=0;i<8;i++)
    {
        MySPI_W_MOSI(ByteSend&(0x80>>i));
        MySPI_W_SCK(1);
        if(MySPI_R_MISO()==1)
        {
                ByteReceive|=(0x80>>i);
        }
        MySPI_W_SCK(0);
    }

    
    return ByteReceive;
}

```
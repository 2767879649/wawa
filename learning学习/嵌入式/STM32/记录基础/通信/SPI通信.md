![[image/Pasted image 20260725132846.png|736]]
![[Pasted image 20260726105010.png]]

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
}//主机发送一个字节信息
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
    GPIO_Init(GPIOA,&GPIO_Struct);//GPIO初始化
    
    GPIO_Struct.GPIO_Mode=GPIO_Mode_IPU;//上拉电阻
    GPIO_Struct.GPIO_Pin=GPIO_Pin_6;
    GPIO_Struct.GPIO_Speed=GPIO_Speed_50MHz;
    GPIO_Init(GPIOA,&GPIO_Struct);//GPIO初始化
    
    MySPI_W_SS(1);//默认为高电平，不选择外挂设备
    MySPI_W_SCK(0);//SPI模式0
    
    
}
void MySPI_Start()
{
    MySPI_W_SS(0);
}//开始位，ss低电平
void MySPI_Stop()
{
    MySPI_W_SS(1);
}//停止位，SS高电平
uint8_t MySPI_SwapByte(uint8_t ByteSend)
{
    uint8_t i,ByteReceive=0x00;//全为00000000，接收高电平
    for(i=0;i<8;i++)
    {
        MySPI_W_MOSI(ByteSend&(0x80>>i));//与上10000000，强制转换后变为0或1，&看发送的数据信息，当为1=1，为0=0；
        MySPI_W_SCK(1);                    //模式0，上升沿接收信息，让时钟沿上升接收数据
        if(MySPI_R_MISO()==1)            //发送高电平，将信息保存，低电平默认
        {
                ByteReceive|=(0x80>>i);   //或上10000000，|看接收的信息，当为1=1，0=0，接收
        }
        MySPI_W_SCK(0);                //下降沿发送信息
    }
    return ByteReceive;
}//主机与从机交换数据

```
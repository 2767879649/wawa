![[image/Pasted image 20260725132846.png|736]]
- 所有 SPI 设备的 SCK、MOSI、MISO 分别连在一起
- 主机另外引出多条 SS 控制线，分别接到各从机的 SS 引脚
- 输出引脚配置为推挽输出，输入引脚配置为浮空或上拉输入


## 流程
1. SS 默认高电平，SS 为 0，作为开始位
2. 模式 1，在时钟上升沿发送信息，下降沿接收信息，模式 0，在时钟下降沿接收信息(<font color="#9bbb59">在一个时钟前信息就已经发送</font>)，下降沿发送信息
3. SS 置 1，作为停止位


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
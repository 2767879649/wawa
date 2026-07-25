# I 2 C
**硬件电路**
- 所有 I2C 设备的 SCL 连在一起，SDA 连在一起
- 设备的 SCL 和 SDA 均要配置成<font color="#9bbb59">开漏输出模式</font>
- SCL 和 SDA 各添加一个上拉电阻，阻值一般为 4.7KΩ 左右
![[Pasted image 20260724221040.png|569]]
![[Pasted image 20260725104823.png]]

高位先行
### 写操作
第一组数据为器件地址，最低位为读写标志位 
> 0 为写操作，1 为读 操作

第二组数据为寄存器的地址

### 读操作
执行写操作，找到指定的寄存器
第三组数据标志位改为读操作
![[Pasted image 20260724222115.png|584]]

![[Pasted image 20260724222101.png|587]]


## 使用 I 2 C 通信的模块
[[MPU6050]]


## 初始化函数
```C
void MyI2C_Init()
{
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB,ENABLE);
    GPIO_InitTypeDef GPIO_InitStructure;
    GPIO_InitStructure.GPIO_Mode=GPIO_Mode_Out_OD;//SCL，SDA均为开漏输出
    GPIO_InitStructure.GPIO_Pin=GPIO_Pin_10|GPIO_Pin_11;
    GPIO_InitStructure.GPIO_Speed=GPIO_Speed_50MHz;
    GPIO_Init(GPIOB,&GPIO_InitStructure);//GPIO初始化
    GPIO_SetBits(GPIOB,GPIO_Pin_10|GPIO_Pin_11);//GPIO开始均为高电平
}
void MyI2C_W_SCL(uint8_t Bitvalue)
{
        GPIO_WriteBit(GPIOB,GPIO_Pin_10,(BitAction)Bitvalue);
        Delay_us(10);
}//改变SCL的值
void MyI2C_W_SDA(uint8_t Bitvalue)
{
    GPIO_WriteBit(GPIOB,GPIO_Pin_11,(BitAction)Bitvalue); //电平逻辑转换，10000为1，只有00000为0；
        Delay_us(10);
}//改变SDA的值
uint8_t MyI2C_R_SDA(void)
{
    uint8_t BitValue;
    BitValue =GPIO_ReadInputDataBit(GPIOB, GPIO_Pin_11);
    Delay_ms(10);
    return BitValue;
}//读取一位bit

void MyI2C_Start()
{
    MyI2C_W_SDA(1);
    MyI2C_W_SCL(1);
    MyI2C_W_SDA(0);
    while(GPIO_ReadInputDataBit(GPIOB,GPIO_Pin_11)==1);
    MyI2C_W_SCL(0);

}//开始位
void MyI2C_Stop()
{
    MyI2C_W_SDA(0);
    MyI2C_W_SCL(1);
    while(GPIO_ReadInputDataBit(GPIOB,GPIO_Pin_10)==0);
    MyI2C_W_SDA(1);

}//停止位
void MyI2C_SendByte(uint8_t Byte)
{
    uint8_t i;
    for(i=0;i<8;i++)
    {
        MyI2C_W_SDA(Byte & (0x80>>i));
        MyI2C_W_SCL(1);
        MyI2C_W_SCL(0);
    }

}//发送数据(8位一个数据，高位先行)
uint8_t MyI2C_ReceiveByte(void)
{
    uint8_t i,Byte=0x00;
    MyI2C_W_SDA(1);
    for(i=0;i<8;i++)
    {
        if(MyI2C_R_SDA()==1){Byte|=(0x80>>i);}
        MyI2C_W_SCL(1);
        MyI2C_W_SCL(0);
    }
    return Byte;
}//读取数据
void MyI2C_SendAck(uint8_t Ack)
{
        MyI2C_W_SDA(Ack);
        MyI2C_W_SCL(1);
        MyI2C_W_SCL(0);
}//是否发送应答
uint8_t MyI2C_ReceiveAck(void)
{
        uint8_t AckBit;
        MyI2C_W_SDA(1);//接收前，主机先确保释放SDA，避免干扰从机的数据发送
        MyI2C_W_SCL(1);//释放SCL，主机机在SCL高电平期间读取SDA
        AckBit=MyI2C_R_SDA();
        MyI2C_W_SCL(0);
        return AckBit;
}//是否接收到应答

```
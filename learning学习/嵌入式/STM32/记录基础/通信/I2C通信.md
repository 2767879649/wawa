# I 2 C
**硬件电路**
- 所有 I2C 设备的 SCL 连在一起，SDA 连在一起
- 设备的 SCL 和 SDA 均要配置成<font color="#9bbb59">开漏输出模式</font>
- SCL 和 SDA 各添加一个上拉电阻，阻值一般为 4.7KΩ 左右
![[Pasted image 20260724221040.png|569]]

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
## I 2 C 数据传输等级
![[Pasted image 20260831225532.png]]
## 使用 I 2 C 通信的模块
[[MPU6050]]


# 软件


## 软件初始化函数
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


# 硬件
信息传输需要判断标志位，使用硬件初始化
![[Pasted image 20260725122430.png|452]]![[Pasted image 20260725122327.png|427]]
## 硬件初始化代码
```c
void MPU6050_CheckTime(uint32_t I2C_EVENT)
{
    uint32_t timer=10000;
    while(I2C_CheckEvent(I2C2,I2C_EVENT)!=SUCCESS)
    {
        timer--;
        if(timer==0)
        return;
    }
}//等待标志位函数
void MPU6050_WriteReg(uint8_t RegAddress,uint8_t Data)
{
    I2C_GenerateSTART(I2C2,ENABLE);
    MPU6050_CheckTime(I2C_EVENT_MASTER_MODE_SELECT);
    
    I2C_Send7bitAddress(I2C2,0xD0,I2C_Direction_Transmitter);
    MPU6050_CheckTime(I2C_EVENT_MASTER_TRANSMITTER_MODE_SELECTED);
    
    I2C_SendData(I2C2,RegAddress);
    MPU6050_CheckTime(I2C_EVENT_MASTER_BYTE_TRANSMITTING);
    
    I2C_SendData(I2C2,Data);
    MPU6050_CheckTime(I2C_EVENT_MASTER_BYTE_TRANSMITTED);
    
    I2C_GenerateSTOP(I2C2,ENABLE);
    
}//修改寄存器功能
uint8_t MPU6050_ReadReg(uint8_t RegAddress)
{
    uint8_t Data;                
    
    I2C_GenerateSTART(I2C2,ENABLE);//开始位
    MPU6050_CheckTime(I2C_EVENT_MASTER_MODE_SELECT);
    
    I2C_Send7bitAddress(I2C2,0xD0,I2C_Direction_Transmitter);//发送设备地址，为写模式
    MPU6050_CheckTime(I2C_EVENT_MASTER_TRANSMITTER_MODE_SELECTED);
    
    I2C_SendData(I2C2,RegAddress);//发送寄存器地址
    MPU6050_CheckTime(I2C_EVENT_MASTER_BYTE_TRANSMITTED);
    
    I2C_GenerateSTART(I2C2,ENABLE);//重启开始位
    MPU6050_CheckTime(I2C_EVENT_MASTER_MODE_SELECT);
    
    I2C_Send7bitAddress(I2C2,0xD0,I2C_Direction_Receiver);//发送设备地址，为读模式
    MPU6050_CheckTime(I2C_EVENT_MASTER_RECEIVER_MODE_SELECTED);
    
    I2C_AcknowledgeConfig(I2C2,DISABLE);//发送最后一个字节前要把ack应答位置0，停止位置1；
    I2C_GenerateSTOP(I2C2,ENABLE);
    
    MPU6050_CheckTime(I2C_EVENT_MASTER_BYTE_RECEIVED);
    Data = I2C_ReceiveData(I2C2);
    
    
    I2C_AcknowledgeConfig(I2C2,ENABLE);
    //停止位
    return Data;
}//读取寄存器内容

void MPU6050_Init()
{
//    MyI2C_Init();//软件初始化

    RCC_APB1PeriphClockCmd(RCC_APB1Periph_I2C2,ENABLE);//开启I2C2的时钟
    RCC_APB1PeriphClockCmd(RCC_APB2Periph_GPIOB,ENABLE);//GPIO的时钟
    GPIO_InitTypeDef GPIO_Struct;
    GPIO_Struct.GPIO_Mode=GPIO_Mode_AF_OD;
    GPIO_Struct.GPIO_Pin=GPIO_Pin_10|GPIO_Pin_11;
    GPIO_Struct.GPIO_Speed=GPIO_Speed_50MHz;
    GPIO_Init(GPIOB,&GPIO_Struct);//GPIO初始化
    
    I2C_InitTypeDef I2C_Struct;     //结构体 
    I2C_Struct.I2C_Mode=I2C_Mode_I2C;    //模式，选择为I2C模式
    I2C_Struct.I2C_Ack=I2C_Ack_Enable;   //应答位使能
    I2C_Struct.I2C_AcknowledgedAddress=I2C_AcknowledgedAddress_7bit;       //应答地址，选择7位，从机模式下才有效
    I2C_Struct.I2C_ClockSpeed=50000;           //时钟速度，选择为50KHz
    I2C_Struct.I2C_DutyCycle=I2C_DutyCycle_16_9;        //时钟占空比，调节速度影响不大
    I2C_Struct.I2C_OwnAddress1=0x00;    //自身地址，从机模式下才有效
    I2C_Init(I2C2,&I2C_Struct);        //初始化
    
    MPU6050_WriteReg(MPU6050_PWR_MGMT_1, 0x01);        //电源管理寄存器1，取消睡眠模式，选择时钟源为X轴陀螺仪
    MPU6050_WriteReg(MPU6050_PWR_MGMT_2, 0x00);        //电源管理寄存器2，保持默认值0，所有轴均不待机
    MPU6050_WriteReg(MPU6050_SMPLRT_DIV, 0x09);        //采样率分频寄存器，配置采样率
    MPU6050_WriteReg(MPU6050_CONFIG, 0x06);            //配置寄存器，配置DLPF
    MPU6050_WriteReg(MPU6050_GYRO_CONFIG, 0x18);    //陀螺仪配置寄存器，选择满量程为±2000°/s
    MPU6050_WriteReg(MPU6050_ACCEL_CONFIG, 0x18);
}

```
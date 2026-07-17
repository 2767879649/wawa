
## GPIO 输出
### 接口设置
```
RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB,ENABLE);//输入输出使用需要开启时钟
GPIO_InitTypeDef GPIO_InitStruct;//为使用GPIO初始化，根据库函数定义一个结构体
GPIO_InitStruct.GPIO_Mode=GPIO_Mode_Out_PP ;//接口模式
GPIO_InitStruct.GPIO_Pin=GPIO_Pin_12;//接口号
GPIO_InitStruct.GPIO_Speed=GPIO_Speed_50MHz;//接口传输速度
GPIO_Init(GPIOB,&GPIO_InitStruct);//接口初始化
GPIO_SetBits(GPIOB,GPIO_Pin_12);//默认端口为输出关闭1
    //完成后可以使用接口
```

**A 15，B 3，B 4 比较特殊，需要配置**

### 八种输入输出模式
- 输入浮空
- 输入上拉
- 输入下拉
- 模拟输入
- 开漏输出(低电平有驱动能力)
- 推挽式输出 (高低电平均能点亮 led)  
- 推挽式复用功能
- 开漏复用功能

### 控制输入输出函数
```

GPIO_ResetBits(GPIOA,GPIO_Pin_0)//led灯点亮
GPIO_SetBits(GPIOA,GPIO_Pin_0)//灯关闭
GPIO_WriteBit(GPIOA,GPIO_Pin_0,Bit_RESET|SET)//灯开启或点亮

```

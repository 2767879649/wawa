## OLED 显示屏
4 行 16 列

| 函数                                      | 作用         |
| --------------------------------------- | ---------- |
| `OLED_Init();`                          | 初始化        |
| `OLED_Clear();`                         | 清屏         |
| `OLED_ShowChar(1, 1, 'A');`             | 显示一个字符     |
| `OLED_ShowString(1, 3, "HelloWorld!");` | 显示字符串      |
| `OLED_ShowNum(2, 1, 12345, 5);`         | 显示十进制数字    |
| `OLED_ShowSignedNum(2, 7, -66, 2);`     | 显示有符号十进制数字 |
| `OLED_ShowHexNum(3, 1, 0xAA55, 4);`     | 显示十六进制数字   |
| `OLED_ShowBinNum(4, 1, 0xAA55, 16);`    | 显示二进制数字    |
## HAL 库函数
`OLED_CLS();` //初始化屏幕
`OLED_FillFull()`；//全屏点亮
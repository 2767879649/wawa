
# PWM
## 输出比较模式

| 模式                 | 描述                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------- |
| 冻结                 | CNT=CCR时，REF保持为原状态                                                                     |
| 匹配时置有效电平           | CNT=CCR时，REF置有效电平                                                                      |
| 匹配时置无效电平           | CNT=CCR时，REF置无效电平                                                                      |
| 匹配时电平翻转            | CNT=CCR时，REF电平翻转                                                                       |
| 强制为无效电平            | CNT与CCR无效，REF强制为无效电平                                                                   |
| 强制为有效电平            | CNT与CCR无效，REF强制为有效电平                                                                   |
| PWM模式1             | 向上计数：CNT<CCR时，REF置有效电平，CNT≥CCR时，REF置无效电平  <br>向下计数：CNT>CCR时，REF置无效电平，CNT≤CCR时，REF置有效电平 |
| PWM模式2(与 PWM 1 相反) | 向上计数：CNT<CCR时，REF置无效电平，CNT≥CCR时，REF置有效电平  <br>向下计数：CNT>CCR时，REF置无效电平，CNT≤CCR时，REF置有效电平 |


## 参数计算
- **PWM频率**：
        Freq=CK_PSC/(PSC+1)/(ARR+1)Freq    //CK_PSC 为内核时钟频率 72MHz
- **PWM占空比**：
        Duty=CCR/ARR+1    
- **PWM分辨率**：
        Reso=1 /(ARR+1)​
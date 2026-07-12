# ARM 嵌入式部署

## 一、硬件平台

- **核心板**: Tiny4412 (友善之臂)
- **SoC**: Samsung Exynos 4412
  - Cortex-A9 四核 @ 1.4-1.6GHz
  - ARMv7 架构
- **内存**: 1GB DDR3
- **启动介质**: SD卡

## 二、启动流程

```
SD卡
  │
  ├── BL1 (E4412_N.bl1.bin)     ← 芯片内ROM加载, Offset=1
  │     └── 初始化DRAM控制器
  │
  ├── BL2 (bl2.bin)             ← Offset=17
  │     └── 初始化时钟/电源/更多DRAM
  │
  ├── U-Boot (u-boot.bin)       ← Offset=49
  │     └── 引导加载程序
  │
  └── Linux Kernel (zImage)     ← Offset=1057
        └── 挂载根文件系统(NFS)
```

## 三、SD卡烧录指令

```bash
# 使用 dd 命令将各组件烧写到SD卡指定偏移位置

# BL1 (一级引导, Samsung专有格式)
sudo dd iflag=dsync oflag=dsync if=./E4412_N.bl1.bin of=/dev/sdb seek=1

# BL2 (二级引导/U-Boot SPL)
sudo dd iflag=dsync oflag=dsync if=./bl2.bin of=/dev/sdb seek=17

# U-Boot (完整引导加载程序)
sudo dd iflag=dsync oflag=dsync if=./u-boot.bin of=/dev/sdb seek=49

# Linux Kernel (压缩内核镜像)
sudo dd iflag=dsync oflag=dsync if=./zImage of=/dev/sdb seek=1057
```

**dd 参数说明:**
- `iflag=dsync oflag=dsync`: 同步I/O，确保数据完整写入
- `seek=N`: 跳过N个块（每块512字节），从指定偏移开始写入

**重要:** `/dev/sdb` 是SD卡设备，需根据实际情况确认（`lsblk` 或 `dmesg` 查看）。

## 四、U-Boot 启动配置

### 4.1 通过NFS挂载根文件系统

```
set bootargs 'noinitrd root=/dev/nfs \
  nfsroot=192.168.15.2:/home/zhu/driver/rootfs \
  ip=192.168.15.88:192.168.15.2:192.168.15.1:255.255.255.0::eth0:off \
  init=/linuxrc console=ttySAC0 lcd=S70'
```

**参数解析:**
| 参数 | 值 | 说明 |
|------|-----|------|
| `root=/dev/nfs` | — | 根文件系统通过NFS挂载 |
| `nfsroot` | `192.168.15.2:/home/zhu/driver/rootfs` | NFS服务器IP和路径 |
| `ip` | `192.168.15.88` | 开发板IP地址 |
| `console` | `ttySAC0` | 串口控制台 |
| `lcd` | `S70` | LCD型号（7寸屏） |

### 4.2 启动命令

```
set bootcmd 'fatload mmc 0 40008000 zImage;bootm 40008000'
save
```

- `fatload mmc 0 40008000 zImage`: 从SD卡FAT分区加载内核到内存0x40008000
- `bootm 40008000`: 从该地址启动内核

## 五、NFS 根文件系统

使用NFS挂载根文件系统的优势：
- **方便调试**: 修改文件立即生效，无需重新烧录
- **快速迭代**: 编译后直接在开发板运行
- **无容量限制**: 根文件系统大小不受SD卡分区限制

```bash
# 主机端开启NFS服务
sudo apt-get install nfs-kernel-server nfs-common -y
sudo /etc/init.d/nfs-kernel-server restart
```

## 六、根文件系统制作

制作命令保存在 `根文件系统制作最后一条指令.txt`:

```bash
# 烧写内核
sudo dd iflag=dsync oflag=dsync if=./zImage of=/dev/sdb seek=1057

# U-Boot启动参数（使用静态IP 192.168.15.5）
set bootargs 'noinitrd root=/dev/nfs \
  nfsroot=192.168.15.2:/home/zhu/driver/rootfs \
  ip=192.168.15.5:192.168.15.2:192.168.15.1:255.255.255.0::eth0:off \
  init=/linuxrc console=ttySAC0 lcd=S70'
```

## 七、交叉编译工具链

### 7.1 安装

```bash
sudo tar -xf arm-2014.05-29-arm-none-linux-gnueabi-i686-pc-linux-gnu.tar.bz2 -C /opt
```

工具链路径: `/opt/arm-2014.05/bin/`

### 7.2 环境变量

```bash
# 编辑 /etc/profile，添加：
export PATH=$PATH:/opt/arm-2014.05/bin

# 使配置生效
source /etc/profile
```

### 7.3 验证

```bash
arm-none-linux-gnueabi-gcc --version
# 应显示: arm-2014.05
```

## 八、平台差异对比

| 项目 | x86 Linux 桌面 | ARM 开发板 |
|------|---------------|-----------|
| 编译器 | GCC (x86) | arm-none-linux-gnueabi-gcc |
| OpenCV | `/home/xyd/opencv/...` | `/usr/share/OpenCV/...` |
| 分类器 | `haarcascade_frontalface_alt2.xml` | `haarcascade_frontalface_alt.xml` |
| 摄像头 | `/dev/video0` (OpenCV: 0) | `/dev/video15` (OpenCV: 15) |
| 串口 | `/dev/ttyUSB0` (USB转串口) | `/dev/ttySAC2` (SoC原生串口) |
| 屏幕 | 桌面窗口 | LCD 800×480 (S70) |

## 九、Qt交叉编译

使用 Qt 5.7.0 ARM 预编译版：

```bash
sudo tar -xf Qt5.7.0.tar -C /usr/local
```

在 `.pro` 文件中通过条件编译切换平台：

```cpp
#if ARCH == 2  // ARM平台
    capeture.open(15);
    faceClassifier.load("/usr/share/OpenCV/haarcascades/haarcascade_frontalface_alt.xml");
#endif
```

## 十、部署文件清单

| 文件 | 用途 |
|------|------|
| `face_recognition` | 人脸识别Qt可执行程序 |
| `facemodel.xml` | 训练好的人脸识别模型 |
| `usr.txt` | 用户姓名数据库 |
| `csv.txt` | 训练数据索引 |
| `haarcascade_frontalface_alt.xml` | Haar级联分类器 |
| `libopencv_*.so` | OpenCV动态库 |
| Qt运行时库 | Qt5运行时依赖 |

## 十一、备用启动方案 Superboot

项目还包含 Superboot4412-QT4.bin，这是一个预先集成的 U-Boot + Kernel 方案，可直接烧录：

```bash
# Superboot 是一体化引导程序
sudo dd if=Superboot4412-QT4.bin of=/dev/sdb seek=1
```

# OpenCV 核心知识

## 一、OpenCV 基础数据结构和操作

### 1.1 Mat (矩阵/图像)

```cpp
#include <opencv2/opencv.hpp>
using namespace cv;

Mat frame;     // 彩色图像
Mat gray;      // 灰度图像
Mat resource;  // 原始帧
```

**常用操作：**
```cpp
// 深度拷贝
Mat cloned = frame.clone();

// 检查是否为空
if (frame.empty()) { /* 错误处理 */ }

// 获取图像属性
int width = frame.cols;    // 列数（宽度）
int height = frame.rows;   // 行数（高度）
int channels = frame.channels();  // 通道数
size_t step = frame.step;  // 每行字节数

// 图像缩放
cv::resize(src, dst, cv::Size(92, 112));

// 图像保存
imwrite("path/to/image.jpg", mat);

// 图像读取
Mat img = imread("path/to/image.jpg");
Mat grayImg = imread("path/to/image.jpg", 0);  // 以灰度模式读取
```

### 1.2 矩形与点

```cpp
// Rect — 矩形区域 (x, y, width, height)
Rect faceRect(x, y, width, height);
int left = faceRect.x;
int top = faceRect.y;

// Point — 点坐标
Point center(faces[i].x + faces[i].width/2, faces[i].y + faces[i].height/2);

// Scalar — 颜色值 (B, G, R)
Scalar red(0, 0, 255);
Scalar colors[] = {
    CV_RGB(255, 0, 0),     // 红
    CV_RGB(255, 97, 0),    // 橙
    CV_RGB(255, 255, 0),   // 黄
    CV_RGB(0, 255, 0),     // 绿
    CV_RGB(0, 255, 255),   // 青
    CV_RGB(0, 0, 255),     // 蓝
    CV_RGB(160, 32, 240)   // 紫
};
```

### 1.3 Size

```cpp
// 最小检测尺寸
cv::Size minSize(90, 112);
cv::Size minSize2(60, 60);
cv::Size minSize3(30, 30);
```

## 二、VideoCapture 摄像头采集

### 2.1 基本操作

```cpp
VideoCapture capture;

// 打开摄像头（设备编号）
capture.open(0);   // Linux桌面: /dev/video0
capture.open(15);  // ARM开发板: /dev/video15

// 或者打开视频文件
capture.open("/home/zhu/video/08.mp4");

// 检查是否成功打开
if (!capture.isOpened()) {
    qDebug() << "打开摄像头失败";
}

// 读取一帧
Mat frame;
capture >> frame;       // 方式1：流操作符
capture.read(frame);    // 方式2：read方法

// 释放摄像头
capture.release();
```

### 2.2 循环读取帧

```cpp
// while循环方式
Mat frame;
while (cam.read(frame)) {
    // 处理每一帧...
    if (waitKey(1) == 27) break;  // ESC键退出
}
```

## 三、图像预处理

### 3.1 色彩空间转换

```cpp
Mat gray, rgb;
cvtColor(frame, gray, CV_BGR2GRAY);    // BGR → 灰度
cvtColor(frame, rgb, CV_BGR2RGB);      // BGR → RGB (给Qt显示用)
cvtColor(frame, gray, COLOR_BGR2GRAY); // 等效写法（OpenCV3+）
```

### 3.2 直方图均衡化

**目的：** 提高图像对比度，使人脸特征更加明显，提高检测和识别准确率。

```cpp
// 对灰度图进行直方图均衡化
equalizeHist(gray, gray);

// 在检测流程中的位置：
cvtColor(frame, gray, CV_BGR2GRAY);  // 1. 转灰度
equalizeHist(gray, gray);             // 2. 直方图均衡化
// 3. 然后才进行人脸检测
```

## 四、绘制函数

### 4.1 矩形

```cpp
// 绘制人脸框
rectangle(frame, faces[i], cv::Scalar(0, 0, 255), 1, 8, 0);
// 参数: 图像, 矩形, 颜色(BGR), 线宽, 线型, 偏移

// 两点式矩形
rectangle(frame,
    Point(face.x, face.y),
    Point(face.x + face.width, face.y + face.height),
    Scalar(255, 0, 0), 3, 8);
```

### 4.2 圆形

```cpp
// 在人脸中心画圆
int radius = cvRound((faceRect.width + faceRect.height) * 0.25);
Point center(faceRect.x + faceRect.width * 0.5, faceRect.y + faceRect.height * 0.5);
circle(image, center, radius, color, 3, 8, 0);
```

### 4.3 椭圆

```cpp
// 椭圆标记人脸
Point center(faces[i].x + faces[i].width/2, faces[i].y + faces[i].height/2);
ellipse(frame, center,
    Size(faces[i].width/2, faces[i].height/2),
    0, 0, 360, Scalar(255, 0, 255), 4, 8, 0);
```

### 4.4 文字

```cpp
// 在人脸上方显示名字
cv::putText(frame, "张三",
    Point(x, y - 10),                // 文字位置
    cv::FONT_HERSHEY_SIMPLEX,        // 字体
    1,                                // 字体大小
    Scalar(0, 0, 255),               // 颜色
    1, 8, false);                    // 线宽, 线型, 底部原点
```

### 4.5 多边形线

```cpp
// 绘制面部特征点连线
polylines(image, points, isClosed, COLOR, 2, 16);
// 参数: 图像, 点集, 是否闭合, 颜色, 线宽, 线型
```

## 五、ROI（感兴趣区域）提取

```cpp
// 从图像中提取人脸区域（矩形裁剪）
Mat faceROI = srcframe(faces[j]);   // faces[j] 是 Rect

// 从灰度图提取人脸
Mat grayFace = gray(faces[i]);

// 赋值给外部变量
myface = gray(faces[i]);
```

## 六、cvRound 工具函数

```cpp
center.x = cvRound((r.x + r.width * 0.5) * scale);
center.y = cvRound((r.y + r.height * 0.5) * scale);
radius = cvRound((r.width + r.height) * 0.25 * scale);
// cvRound: 四舍五入取整，返回 int
```

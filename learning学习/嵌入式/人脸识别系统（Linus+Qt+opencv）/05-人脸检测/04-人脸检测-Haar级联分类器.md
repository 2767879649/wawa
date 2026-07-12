# 人脸检测 — Haar Cascade 级联分类器

## 一、原理概述

人脸检测使用 OpenCV 的 **Haar 特征级联分类器**，基于 Viola-Jones 算法框架：

1. **Haar-like 特征**: 用矩形特征检测明暗模式（如眼睛比脸颊暗、鼻梁比两侧亮）
2. **积分图**: 快速计算矩形区域像素和
3. **Adaboost 级联**: 多级分类器串联，逐级筛选，非人脸快速剔除

## 二、分类器文件

| 分类器 | 特点 |
|--------|------|
| `haarcascade_frontalface_alt.xml` | Haar特征，正面人脸（ARM上用） |
| `haarcascade_frontalface_alt2.xml` | Haar特征，正面人脸（桌面用，新版） |
| `haarcascade_frontalface_default.xml` | Haar特征，默认正面人脸 |
| `lbpcascade_frontalface.xml` | LBP特征，正面人脸（比Haar快但精度略低） |

## 三、代码实现

### 3.1 加载分类器

```cpp
#include <opencv2/objdetect.hpp>

CascadeClassifier faceClassifier;

// 加载分类器XML文件
#if ARCH == 1  // x86桌面
    bool flag = faceClassifier.load(
        "/home/xyd/opencv/opencv-3.4.5/data/haarcascades/"
        "haarcascade_frontalface_alt2.xml");
#elif ARCH == 2  // ARM平台
    bool flag = faceClassifier.load(
        "/usr/share/OpenCV/haarcascades/"
        "haarcascade_frontalface_alt.xml");
#endif

// 检查是否加载成功
if (flag == false) {
    QMessageBox::warning(this, "Haar级联分类器错误",
        "不能加载级联分类器文件！！", QMessageBox::Ok);
    return;
}
```

### 3.2 检测人脸 detectMultiScale

```cpp
// 完整的人脸检测流程
vector<Rect> faces;  // 存储检测到的人脸矩形

// 1. 灰度转换
cvtColor(frame, gray, CV_BGR2GRAY);

// 2. 直方图均衡化（提高对比度）
equalizeHist(gray, gray);

// 3. 执行检测
faceClassifier.detectMultiScale(
    gray,           // 输入: 灰度图
    faces,          // 输出: 检测到的矩形数组
    1.8,            // scaleFactor: 每次缩放比例
    3,              // minNeighbors: 最少邻近检测次数
    0,              // flags: 附加选项
    cv::Size(90, 112)  // minSize: 最小检测窗口
);
```

### 3.3 detectMultiScale 参数详解

| 参数 | 含义 | 常用值 | 调优建议 |
|------|------|--------|----------|
| **scaleFactor** | 图像缩放比例 | 1.1 ~ 1.8 | 越小越精确但越慢，越大越快但可能漏检 |
| **minNeighbors** | 最少重复检测次数 | 2 ~ 3 | 值越大误检越少，值越小召回越高 |
| **flags** | 检测模式标志 | `CASCADE_SCALE_IMAGE` | 缩放图像模式 |
| **minSize** | 最小人脸尺寸 | 90×112 或 60×60 | 取决于实际应用场景 |

### 3.4 项目中的不同参数组合

```cpp
// 主项目 — 门禁系统 (精度优先)
faceClassifier.detectMultiScale(gray, faces, 1.8, 3, 0, cv::Size(90, 112));

// 示例代码 — 静态图片检测
cascade.detectMultiScale(grayImage, rect, 1.1, 3, 0);

// 示例代码 — 动态捕获
face_cascade.detectMultiScale(gray, faces, 1.1, 2,
    0 | CASCADE_SCALE_IMAGE, Size(60, 60));

// 人脸录入 — 取样检测
face_Classifier.detectMultiScale(dst_gray, face_rect, 1.1, 3, 0,
    cv::Size(90, 112));

// detectAndDraw — 支持翻转镜像检测
cascade.detectMultiScale(smallImg, faces, 1.1, 2,
    0 | CASCADE_SCALE_IMAGE, Size(30, 30));
```

## 四、检测结果处理

### 4.1 绘制人脸框

```cpp
for (size_t i = 0; i < faces.size(); i++) {
    if (faces[i].height > 0 && faces[i].width > 0) {
        // 提取人脸ROI
        myface = gray(faces[i]);

        // 绘制红色矩形框
        rectangle(frame, faces[i], cv::Scalar(0, 0, 255), 1, 8, 0);

        // 记录人脸位置（用于后续显示名字）
        xx = faces[i].x;
        yy = faces[i].y;
    }
}
```

### 4.2 多颜色标记多张人脸

```cpp
Scalar colors[] = {
    CV_RGB(255, 0, 0), CV_RGB(255, 97, 0), CV_RGB(255, 255, 0),
    CV_RGB(0, 255, 0), CV_RGB(0, 255, 255), CV_RGB(0, 0, 255),
    CV_RGB(160, 32, 240)
};

for (size_t i = 0; i < rect.size(); i++) {
    Point center;
    int radius;
    center.x = cvRound((rect[i].x + rect[i].width * 0.5));
    center.y = cvRound((rect[i].y + rect[i].height * 0.5));
    radius = cvRound((rect[i].width + rect[i].height) * 0.25);
    circle(dstImage, center, radius, colors[i % 7], 2);
}
```

## 五、镜像翻转检测 (tryflip)

用于检测镜像翻转后的人脸（应对某些角度偏差）：

```cpp
if (tryflip) {
    flip(smallImg, smallImg, 1);  // 水平翻转
    cascade.detectMultiScale(smallImg, faces2, 1.1, 2,
        0 | CASCADE_SCALE_IMAGE, Size(30, 30));
    // 将翻转检测结果映射回原始坐标
    for (auto r = faces2.begin(); r != faces2.end(); ++r) {
        faces.push_back(Rect(smallImg.cols - r->x - r->width,
                             r->y, r->width, r->height));
    }
}
```

## 六、人脸区域尺寸过滤

```cpp
// 检查宽高比，过滤非人脸矩形
double aspect_ratio = (double)r.width / r.height;
if (0.75 < aspect_ratio && aspect_ratio < 1.3) {
    // 正常的人脸比例（接近正方形）
    // 画圆形标记
} else {
    // 比例异常，画矩形标记（可能是误检）
}
```

## 七、两种检测器对比

| 特性 | Haar Cascade | LBP Cascade |
|------|-------------|-------------|
| 文件 | `haarcascade_frontalface_*.xml` | `lbpcascade_frontalface.xml` |
| 速度 | 较慢 | 较快（2-3倍） |
| 精度 | 较高 | 略低 |
| 原理 | Haar-like特征 + Adaboost | 局部二值模式 + Adaboost |
| 适用 | 精度优先场景 | 速度优先场景 |

```cpp
// LBP检测器创建
CascadeClassifier faceDetector("lbpcascade_frontalface.xml");
// 使用方法完全相同
faceDetector.detectMultiScale(gray, faces);
```

# 人脸关键点检测 — FacemarkLBF

## 一、概述

使用 OpenCV Contrib 的 **FacemarkLBF (Local Binary Features)** 算法进行人脸 68 个特征点（landmark）检测。

**特征点分布:**
- 0-16: 下颌线 (Jaw line) — 17个点
- 17-21: 左眉毛 (Left eyebrow) — 5个点
- 22-26: 右眉毛 (Right eyebrow) — 5个点
- 27-30: 鼻梁 (Nose bridge) — 4个点
- 30-35: 鼻下 (Lower nose) — 6个点
- 36-41: 左眼 (Left eye) — 6个点
- 42-47: 右眼 (Right eye) — 6个点
- 48-59: 外嘴唇 (Outer lip) — 12个点
- 60-67: 内嘴唇 (Inner lip) — 8个点

## 二、模型加载与初始化

### 2.1 创建 Facemark 实例

```cpp
#include <opencv2/face.hpp>

using namespace cv;
using namespace cv::face;

// 创建 FacemarkLBF 对象
Ptr<Facemark> facemark = FacemarkLBF::create();

// 加载预训练模型
facemark->loadModel("lbfmodel.yaml");
```

**模型文件:** `lbfmodel.yaml` — 约56MB的预训练模型文件，包含LBF特征检测器的参数。

### 2.2 结合人脸检测器使用

```cpp
// 先创建人脸检测器
CascadeClassifier faceDetector("lbpcascade_frontalface.xml");
// 或使用 Haar 检测器
CascadeClassifier faceDetector("haarcascade_frontalface_alt2.xml");
```

## 三、关键点检测流程

```cpp
Mat frame, gray;
VideoCapture cam(0);

while (cam.read(frame)) {
    vector<Rect> faces;

    // 步骤1: 转灰度图
    cvtColor(frame, gray, COLOR_BGR2GRAY);

    // 步骤2: 检测人脸
    faceDetector.detectMultiScale(gray, faces);

    // 步骤3: 存储关键点结果
    vector<vector<Point2f>> landmarks;

    // 步骤4: 运行关键点检测
    bool success = facemark->fit(frame, faces, landmarks);

    if (success) {
        // 步骤5: 绘制关键点
        for (int i = 0; i < landmarks.size(); i++) {
            // 自定义绘制函数
            drawLandmarks(frame, landmarks[i]);
            // OpenCV内置绘制函数
            drawFacemarks(frame, landmarks[i], Scalar(0, 0, 255));
        }
    }

    // 显示结果
    imshow("Facial Landmark Detection", frame);
    if (waitKey(1) == 27) break;  // ESC退出
}
```

## 四、绘制函数实现

### 4.1 drawPolyline — 绘制特征点连线

```cpp
#define COLOR Scalar(255, 200, 0)  // 橙色

void drawPolyline(
    Mat &im,
    const vector<Point2f> &landmarks,
    const int start,
    const int end,
    bool isClosed = false)
{
    // 收集起点到终点之间的所有点
    vector<Point> points;
    for (int i = start; i <= end; i++) {
        points.push_back(cv::Point(landmarks[i].x, landmarks[i].y));
    }

    // 绘制折线
    polylines(im, points, isClosed, COLOR, 2, 16);
}
```

### 4.2 drawLandmarks — 绘制68点人脸特征

```cpp
void drawLandmarks(Mat &im, vector<Point2f> &landmarks) {
    if (landmarks.size() == 68) {
        // 按照68点标准模型绘制各面部区域
        drawPolyline(im, landmarks, 0, 16);           // 下颌线
        drawPolyline(im, landmarks, 17, 21);          // 左眉毛
        drawPolyline(im, landmarks, 22, 26);          // 右眉毛
        drawPolyline(im, landmarks, 27, 30);          // 鼻梁
        drawPolyline(im, landmarks, 30, 35, true);    // 鼻下（闭合）
        drawPolyline(im, landmarks, 36, 41, true);    // 左眼（闭合）
        drawPolyline(im, landmarks, 42, 47, true);    // 右眼（闭合）
        drawPolyline(im, landmarks, 48, 59, true);    // 外嘴唇（闭合）
        drawPolyline(im, landmarks, 60, 67, true);    // 内嘴唇（闭合）
    } else {
        // 非68点模型：每个点画一个圆
        for (int i = 0; i < landmarks.size(); i++) {
            circle(im, landmarks[i], 3, COLOR, FILLED);
        }
    }
}
```

## 五、OpenCV 内置绘制函数

```cpp
// OpenCV自带的特征点绘制函数
drawFacemarks(frame, landmarks[i], Scalar(0, 0, 255));
// 参数: 图像, 特征点集, 颜色
```

## 六、完整的人脸分析流程

```
摄像头帧
  │
  ├─ 1. 灰度转换 cvtColor(→GRAY)
  │
  ├─ 2. 直方图均衡化 equalizeHist()
  │
  ├─ 3. 人脸检测 detectMultiScale()
  │     └── 得到 faces[] (矩形区域)
  │
  ├─ 4. 关键点检测 facemark->fit()
  │     └── 得到 landmarks[] (68个点)
  │
  └─ 5. 可视化
        ├── rectangle() 人脸框
        ├── drawLandmarks() 特征连线
        └── drawFacemarks() 特征点
```

## 七、Qt界面中的集成

在 Qt 项目中，关键点检测被集成到 `CameraManage` 类中：

```cpp
// 在 readFarme() 方法中
void CameraManage::readFarme() {
    capture >> frame;

    // 人脸检测
    vector<Rect> faces;
    cvtColor(frame, gray, COLOR_BGR2GRAY);
    equalizeHist(gray, gray);
    face_cascade.detectMultiScale(gray, faces, 1.1, 2,
        0 | CASCADE_SCALE_IMAGE, Size(60, 60));

    // 在人脸周围画椭圆
    for (size_t i = 0; i < faces.size(); i++) {
        Point center(faces[i].x + faces[i].width/2,
                     faces[i].y + faces[i].height/2);
        ellipse(frame, center,
            Size(faces[i].width/2, faces[i].height/2),
            0, 0, 360, Scalar(255, 0, 255), 4, 8, 0);
    }

    // 关键点检测
    vector<vector<Point2f>> landmarks;
    bool success = facemark->fit(frame, faces, landmarks);

    if (success) {
        for (int i = 0; i < landmarks.size(); i++) {
            drawLandmarks(frame, landmarks[i]);
            drawFacemarks(frame, landmarks[i], Scalar(0, 0, 255));
        }
    }

    imshow("Facial Landmark Detection", frame);
}
```

## 八、detectAndDraw 高级检测函数

项目还包含一个高级的 `detectAndDraw` 函数，支持：

1. **多级级联检测**: 先检测人脸，再检测人脸内的嵌套特征（如眼睛）
2. **镜像翻转检测**: 自动检测水平翻转后的人脸
3. **宽高比过滤**: `0.75 < ratio < 1.3` 用于过滤误检
4. **缩放参数**: 支持 `scale` 参数调整检测灵敏度
5. **性能计时**: 使用 `getTickCount()` 测量检测耗时

```cpp
// 性能测量
t = (double)getTickCount();
// ... 检测过程 ...
t = (double)getTickCount() - t;
printf("detection time = %g ms\n", t * 1000 / getTickFrequency());
```

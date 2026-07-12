# 人脸识别 — LBPH 算法

## 一、LBPH 算法原理

**LBPH (Local Binary Patterns Histogram)** — 局部二值模式直方图人脸识别算法。

### 工作流程：
1. **LBP特征提取**: 对每个像素，比较其与周围8个邻域像素的灰度值，生成8位二进制模式
2. **分块**: 将人脸图像分成多个网格区域
3. **直方图统计**: 在每个网格区域内统计LBP模式的出现频率
4. **特征向量**: 将所有网格的直方图串联成一个特征向量
5. **分类**: 通过比较特征向量间的距离进行人脸匹配

### 特点：
- **光照鲁棒性**: 对光照变化不敏感
- **旋转不变性**: 可选择使用旋转不变的LBP模式
- **简单高效**: 计算简单，适合嵌入式平台

## 二、模型创建与训练

### 2.1 创建 LBPH 模型

```cpp
#include <opencv2/face.hpp>
#include <opencv2/face/facerec.hpp>

using namespace cv;
using namespace face;

// 创建 LBPH 人脸识别模型
Ptr<LBPHFaceRecognizer> model = LBPHFaceRecognizer::create();
```

### 2.2 训练模型

```cpp
vector<Mat> images;   // 训练图像集
vector<int> labels;   // 对应的标签（用户编号）

// 从csv文件加载训练数据
QFile csv(QDir::currentPath() + "/csv.txt");
while (!csv.atEnd()) {
    QString p = csv.readLine(128);
    QStringList qlist = p.split(";");
    if (qlist.size() == 2) {
        QString path = qlist[0];        // 图片路径
        int tag = qlist[1].toInt();     // 标签编号

        images.push_back(cv::imread(path.toStdString(), 0));  // 灰度读取
        labels.push_back(tag);
    }
}

// 首次训练
model->train(images, labels);

// 保存模型
model->save("facemodel.xml");
```

### 2.3 增量更新模型

```cpp
// 加载已有模型
model = Algorithm::load<LBPHFaceRecognizer>(xmlfile.toStdString());

// 增量更新（添加新的训练数据）
model->update(images, labels);

// 保存更新后的模型
model->save("facemodel.xml");
```

## 三、人脸预测/识别

### 3.1 预测函数

```cpp
int predictLabel = -1;
double predictConfidence = 0.0;

// 加载模型
model = LBPHFaceRecognizer::create();
model = Algorithm::load<LBPHFaceRecognizer>(xmlfile.toStdString());

// 执行预测
model->predict(face_test, predictLabel, predictConfidence);

// predictLabel: 预测的用户编号（标签）
// predictConfidence: 置信度（越小越可信）
```

### 3.2 置信度阈值判断

```cpp
// 门禁系统的判断逻辑
if (predictConfidence > 85) {
    // 置信度过高 → 不可信 → 查无此人
    face_ui->label_result->setText("查无此人");
    cv::putText(frame, "find error!!!",
        Point(xx, yy), cv::FONT_HERSHEY_SIMPLEX,
        1, Scalar(0, 0, 255), 1, 8, false);
} else {
    // 置信度可接受 → 识别成功
    face_ui->label_result->setText(QString("识别结果：") + name);
    cv::putText(frame, name.toStdString(),
        Point(xx, yy), cv::FONT_HERSHEY_SIMPLEX,
        1, Scalar(0, 0, 255), 1, 8, false);
}
```

**置信度解读:**
- `predictConfidence` 越小表示越可信（距离越小）
- 0 表示完全匹配
- >85 在本项目中被认为不可信
- 这个阈值可根据实际测试调整

## 四、人脸图像预处理

识别前的图像预处理非常关键：

```cpp
// 1. 提取人脸ROI
Mat faceROI = frame(faces[i]);

// 2. 缩放至统一尺寸
Mat face_test;
cv::resize(myface, face_test, cv::Size(92, 112));

// 3. 确保已转换为灰度图
// face_test 应该是灰度图（单通道）

// 4. 执行预测
model->predict(face_test, predictLabel, predictConfidence);
```

**统一尺寸 92×112 的重要性:** LBPH 算法要求所有训练和测试图像尺寸一致，否则无法比对。

## 五、用户数据库管理

### 5.1 usr.txt 文件格式

```
1;张三
2;李四
3;王五
```

每行格式: `编号;姓名`，编号从1开始。

### 5.2 读取用户信息

```cpp
// 读取用户数据库
QFile user(QDir::currentPath() + "/usr.txt");
user.open(QIODevice::ReadWrite | QIODevice::Text);

QString line, name;
QStringList list;
qint64 usrlinenum = 0;

while (!user.atEnd()) {
    line = user.readLine();
    usrlinenum++;  // 行号=用户编号

    if (usrlinenum == predictLabel) {
        list = line.split(";");
        name = list[1];  // 获取姓名
        // 显示识别结果...
    }
}
```

### 5.3 添加新用户

```cpp
// 计算下一个编号
qint64 usrlinenum = 1;
while (!user.atEnd()) {
    char buf[128];
    qint64 len = user.readLine(buf, sizeof(buf));
    if (len > 0) usrlinenum++;
}

// 写入新用户
QString usrline = QString::number(usrlinenum) + ";" + name + "\r\n";
user.write(usrline.toLatin1());
```

## 六、模型文件格式

训练后的模型保存为 OpenCV XML/YAML 格式：

```cpp
// 保存
model->save("facemodel.xml");

// 加载
model = Algorithm::load<LBPHFaceRecognizer>("facemodel.xml");
```

## 七、CSV 训练数据文件

```
./1/0.jpg;1
./1/1.jpg;1
./2/0.jpg;2
./2/1.jpg;2
```

格式: `图片路径;标签编号`

标签编号对应 `usr.txt` 中的用户编号。

## 八、识别线程完整流程

```cpp
void RECOGNIZE::run() {
    while (1) {
        // 1. 检查人脸是否被检测到
        if (myface.empty()) continue;

        // 2. 缩放到统一尺寸
        cv::resize(myface, face_test, cv::Size(92, 112));

        // 3. 检查是否检测到人脸
        if (faces.size() == 0) {
            face_ui->label_result->setText("请调整位置");
            continue;
        }

        // 4. 加载模型并预测
        if (!face_test.empty()) {
            model = LBPHFaceRecognizer::create();
            model = Algorithm::load<LBPHFaceRecognizer>(xmlfile.toStdString());
            model->predict(face_test, predictLabel, predictConfidence);

            // 5. 判断结果
            if (predictConfidence > 85) {
                // 查无此人
            } else {
                // 查找姓名 → 显示结果 → 开锁
            }
        }
    }
}
```

## 九、LBPH vs 其他算法

| 算法 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **LBPH** | 光照不变性、计算快、支持增量更新 | 对姿态/表情敏感 | 嵌入式、实时系统 |
| EigenFaces | 经典方法、实现简单 | 对光照敏感 | 基础学习 |
| FisherFaces | 类间区分度好 | 需要较多训练样本 | 多分类场景 |
| 深度学习 | 精度最高 | 计算量大、需要GPU | 高性能服务器 |

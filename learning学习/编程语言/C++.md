# C++

## 1. 命名空间与基本输入输出 I/O

```cpp
#include <iostream>                  // 标准输入输出流头文件

using namespace std;                 // 引入整个 std 命名空间
// 或更推荐：using std::cout, std::cin, std::endl;（避免命名污染）

cout << xx << endl;                  // 输出 xx 并换行
cin >> xx;                           // 从键盘输入到变量 xx
```

> **💡 `using namespace std;`** — 方便的写法，但大型项目中可能导致命名冲突。更推荐 `std::cout` 显式前缀，或只引入需要的几个名字。

## 2. 基本数据类型

```cpp
int a = 100;                         // 整型（通常 4 字节）
double b = 3.1415;                   // 双精度浮点小数（8 字节）
char c = 'A';                        // 单个字符，单引号
bool d = true;                        // 布尔型：只有 true(真) / false(假)

#include <string>                     // 字符串，双引号，需 #include <string>
string str = "学习C++";
```

> **补充类型：**

| 类型 | 说明 | 示例 |
|------|------|------|
| `float` | 单精度浮点数（4 字节） | `float f = 3.14f;` |
| `long` / `long long` | 长整型（更大范围） | `long long big = 1e18;` |
| `unsigned` | 无符号（非负） | `unsigned int u = 100;` |
| `auto` | C++11 自动类型推导 | `auto x = 42;` // int |

## 3. `boolalpha` — 控制 bool 的输出格式

```cpp
cout << true;        // 默认输出: 1（数字）
cout << boolalpha;   // 开启文字模式，之后输出: true / false
cout << true;        // 输出: true

cin >> bool b;       // 开启后只能输入 "true"/"false" 字符串才能给 bool 赋值

cout << noboolalpha; // 取消文字模式，恢复输出 1/0
```

- <font color="#d83931">**使用一次永久生效直到手动取消</font>，只对 bool 类型生效，int 不受影响**
- `cout << boolalpha;` 一旦写一次，后面所有布尔输出都会保持文字模式，直到 `noboolalpha` 取消。

## 4. 类型转换

不同算数类型无法直接运算，需要转换：

```cpp
int a = 10;
double b = 3.14;
double result = static_cast<double>(a) + b;   // C++ 推荐写法
// 或: double result = double(a) + b;          // C 风格转换
```

四种 C++ 转换方式：

| 方式 | 用途 |
|------|------|
| `static_cast<T>(x)` | 基本类型转换、向上转型 |
| `dynamic_cast<T>(x)` | 多态类型的**安全**向下转型（运行时检查）|
| `const_cast<T>(x)` | 移除/添加 const 属性 |
| `reinterpret_cast<T>(x)` | 底层二进制重解释（慎用）|

## 5. `const` 关键字

```cpp
const int MAX = 100;        // 常量，不可修改
const int* p1 = &a;         // 指向常量的指针（不能通过 p1 改值）
int* const p2 = &a;         // 常量指针（p2 不能再指向别处）
const int* const p3 = &a;   // 两者都是 const
```

## 6. 指针与引用

```cpp
int x = 10;
int* ptr = &x;               // 指针：存储变量地址“为x定义了一个ptr的指针，指针存放x的地址”
cout << *ptr;                // 解引用：访问指针指向的值（输出 10）

int& ref = x;                // 引用：变量的别名“定义了一个x的别名”
ref = 20;                    // 修改 ref 即修改 x
```

| | 指针 (`*`) | 引用 (`&`) |
|------|------|------|
| 可为空 | ✅ `nullptr` | ❌ 必须初始化 |
| 可重新绑定 | ✅ | ❌ 终身绑定 |
| 需解引用 | ✅ `*ptr` | ❌ 直接使用 |

## 7. 动态内存管理：`new` / `delete`

```cpp
int* p = new int(100);       // 动态分配一个单独的 int 变量，并赋值 100
delete p;                    // 释放内存

int* arr = new int[10];      // 动态分配 int 数组（10 个未初始化的 int）
delete[] arr;                // 释放数组内存（必须用 delete[]！）
```

> ⚠️ `new` 配 `delete`，`new[]` 配 `delete[]`，混用导致**未定义行为**！

### 现代 C++：智能指针（推荐替代裸 new/delete）

```cpp
#include <memory>
unique_ptr<int> up = make_unique<int>(100);     // 独占所有权，自动释放
shared_ptr<int> sp = make_shared<int>(200);     // 共享所有权，引用计数
weak_ptr<int> wp = sp;                          // 不增加引用计数的弱引用
```

> `unique_ptr` 零开销，`shared_ptr` 有引用计数的额外开销。

## 8. 类与对象

### 访问控制

```cpp
class MyClass {
private:       // 仅类内部可访问
    int data;
protected:     // 类内部 + 子类可访问
    int value;
public:        // 外部可访问
    void show();
};
```

> **struct vs class：** struct 默认 `public`，class 默认 `private`。语义上 struct 常用于纯数据聚合，class 用于封装行为。

### 构造函数与析构函数

```cpp
class Son {
public:
    Son() {}          // 构造：对象创建时调用
    ~Son() {}         // 析构：对象销毁时调用（释放资源）
};
```

- **一个类可以有多个构造函数**（重载），但**只能有一个析构函数**
- 析构函数负责释放资源（内存、文件句柄等）

> **补充：初始化列表（推荐写法）**

```cpp
class Son {
    int age;
    string name;
public:
    Son(int a, string n) : age(a), name(n) {}    // 初始化列表，效率更高
    // 不要写：Son(int a, string n) { age = a; name = n; }  // 多一次默认构造+赋值
};
```

### 构造函数的 "三大件" / "五大件" (Rule of 3/5)

如果有自定义析构、拷贝构造、拷贝赋值中的任一个，很可能三者都需要：

```cpp
class MyClass {
public:
    // C++98: Rule of 3（三大件）
    MyClass();                              // 默认构造
    MyClass(const MyClass& other);          // 拷贝构造
    MyClass& operator=(const MyClass& o);   // 拷贝赋值
    ~MyClass();                             // 析构

    // C++11: Rule of 5（五大件，加两个移动语义）
    MyClass(MyClass&& other) noexcept;               // 移动构造
    MyClass& operator=(MyClass&& o) noexcept;        // 移动赋值
};
```

> **💡 核心要点：** 如果你手动管理资源（如 `new`），务必实现或 `= delete` 这些函数。如果不手动管理（用 `vector`/`unique_ptr`），可以用 `= default` 依赖编译器生成。

### `explicit` 关键字

```cpp
class MyClass {
public:
    explicit MyClass(int x) : val(x) {}   // 禁止隐式类型转换
};
MyClass obj = 5;   // ❌ 编译错误（explicit 阻止了隐式转换）
MyClass obj(5);    // ✅ 显式调用
```

### 虚析构函数（核心重点！）

> **经典面试/考察点：基类指针指向子类对象时，析构必须正确调用子类析构。**

```cpp
class Base {
public:
    virtual ~Base() {}      // 虚析构！保证子类析构被正确调用
};

class Derived : public Base {
public:
    ~Derived() { /* 释放子类特有资源 */ }
};

Base* ptr = new Derived();
delete ptr;                  // 若 ~Base() 不是 virtual，子类析构不会被调用！
                             // 导致资源泄漏
```

**铁律：** 只要一个类可能被继承，它的析构函数就应该声明为 `virtual`。

## 9. 继承与多态

### 基本继承语法

```cpp
class A {
public:
    void show() { cout << "A::show" << endl; }
};

class B : public A {         // public 继承
public:
    void show() { cout << "B::show" << endl; }
};

B obj;
obj.show();                  // 调用 B 自己的 show()
obj.A::show();               // 显式调用父类 A 的 show()
```

### 继承方式

| 继承方式 | 父类 public → | 父类 protected → | 父类 private → |
|----------|:------------:|:----------------:|:--------------:|
| `public` 继承 | public | protected | 不可访问 |
| `protected` 继承 | protected | protected | 不可访问 |
| `private` 继承 | private | private | 不可访问 |

> 99% 的情况用 `public` 继承，表达 "is-a" 关系。

### 虚函数与多态（核心！）

```cpp
class Animal {
public:
    virtual void speak() { cout << "动物叫" << endl; }    // 虚函数
    virtual ~Animal() {}                                    // 虚析构
};

class Dog : public Animal {
public:
    void speak() override { cout << "汪汪" << endl; }      // override 重写
};

// 多态：通过基类指针/引用调用，实际执行子类版本
Animal* a = new Dog();
a->speak();    // 输出 "汪汪"（而不是 "动物叫"）——这就是多态！
```

> **`override`** 关键字（C++11）：显式标明这是重写，若父类无对应虚函数则**编译报错**，避免手误。

### 纯虚函数与抽象类

```cpp
class Shape {                     // 抽象类：包含纯虚函数，不能实例化
public:
    virtual double area() = 0;    // 纯虚函数，子类必须实现
    virtual ~Shape() {}
};
```

### 虚函数表 (vtable) 机制

- 每个含虚函数的类有一个**虚函数表 (vtable)**，存储所有虚函数地址
- 每个对象内部有一个**虚指针 (vptr)**，指向所属类的 vtable
- 调用虚函数时，运行时通过 vptr → vtable 查找实际函数地址

## 10. 模板（泛型编程）

```cpp
template <typename T>
T max(T a, T b) {
    return a > b ? a : b;
}

max(3, 5);         // T=int
max(3.14, 2.0);    // T=double
```

类模板：
```cpp
template <typename T>
class Box {
    T value;
public:
    Box(T v) : value(v) {}
    T get() { return value; }
};
Box<int> b(42);
```

## 11. STL 常用容器

| 容器 | 说明 | 关键操作 |
|------|------|---------|
| `vector<T>` | 动态数组，连续内存 | `push_back`, `size()`, `[]`, `at()` |
| `string` | 字符串 | `+`, `substr()`, `find()`, `length()` |
| `map<K,V>` | 键值对（红黑树，有序）| `[]`, `find()`, `insert()` |
| `set<T>` | 唯一值集合（红黑树，有序）| `insert()`, `find()`, `count()` |
| `list<T>` | 双向链表 | `push_front/back`, `insert()` |
| `unordered_map` | 哈希表实现 map（无序，O(1)）| 同 map |

```cpp
#include <vector>
#include <map>
#include <string>

vector<int> v = {1, 2, 3};
v.push_back(4);
for (int x : v) cout << x << " ";    // 范围 for 循环（C++11）

map<string, int> m;
m["张三"] = 90;
m["李四"] = 85;
```

## 12. 异常处理

```cpp
try {
    // 可能抛出异常的代码
    throw runtime_error("发生错误");
} catch (const runtime_error& e) {
    cout << "捕获异常: " << e.what() << endl;
} catch (...) {
    cout << "捕获未知异常" << endl;
}
```

## 13. RAII（资源获取即初始化）

C++ 最核心的编程哲学：**把资源生命周期绑定到对象生命周期**。

```cpp
// 不用手动管理：构造获取资源，析构自动释放
{
    ifstream file("data.txt");       // 构造时打开
    // ... 使用文件 ...
}                                    // 离开作用域，析构自动关闭文件
```

> 这是智能指针、文件流、锁等的基础原理——也是 C++ 为什么不需要 `finally`。

---

## **C语言 time.h 时间函数**

| 函数原型                                                                             | 作用                       |
| -------------------------------------------------------------------------------- | ------------------------ |
| `time_t time(time_t *t);`                                                        | 获取系统时钟（秒计数器）             |
| `struct tm *gmtime(const time_t *timer);`                                        | 将秒计数器转换为日期时间（格林尼治时间/UTC） |
| `struct tm *localtime(const time_t *timer);`                                     | 将秒计数器转换为日期时间（当地时间）       |
| `time_t mktime(struct tm *tm);`                                                  | 将日期时间转换为秒计数器（当地时间）       |
| `char *ctime(const time_t *timer);`                                              | 将秒计数器转换为默认格式的字符串         |
| `char *asctime(const struct tm *tm);`                                            | 将日期时间结构体转换为默认格式的字符串      |
| `size_t strftime(char *s, size_t max, const char *format, const struct tm *tm);` | 将日期时间按自定义格式转换为字符串        |

# 电梯调度 
[TOC]

## 一、 项目目的
- 学习调度算法
- 通过实现电梯调度，体会操作系统调度过程
- 学习特定环境下多线程编程方法

## 二、开发工具
- 开发环境：Chrome + Subline Text
- 开发语言：JavaScript

## 三、术语表

| 术语       | 解释                                                         |
| ---------- | ------------------------------------------------------------ |
| 呼梯信号   | 调度请求                                                     |
| 并联控制   | 共用一套呼梯信号系统，把两台或多台规格相同的电梯并联起来控制 |
| 内呼梯按钮 | 电梯内部发出呼梯信号的按钮，只对单部电梯有效                 |
| 外呼梯按钮 | 电梯外部发出呼梯信号的按钮，对所有并联控制的电梯有效         |



## 四、项目方案
### 1. 调度算法
#### (1) 内调度：LOOK算法
- 原理：
> LOOK算法是扫描算法的一种改进。扫描算法(SCAN)是一种按照楼层顺序依次服务请求的算法，它让电梯在最底层和最顶层之间连续往返运行，在运行过程中响应处在于电梯运行方向相同的各楼层上的请求。扫描算法较好地解决了电梯移动的问题，在这个算法中，每个电梯响应乘客请求使乘客获得服务的次序是由其发出请求的乘客的位置与当前电梯位置之间的距离来决定的，所有的与电梯运行方向相同的乘客的请求在一次电梯向上运行或向下运行的过程中完成，免去了电梯频繁的来回移动

> 对LOOK算法而言，电梯同样在最底层和最顶层之间运行。但当LOOK算法发现电梯所移动的方向上不再有请求时立即改变运行方向，而扫描算法则需要移动到最底层或者最顶层时才改变运行方向。

- 实现：
    - 设置一个数组`queue`用来存放所有呼梯层
    - 每一层在`queue`中最多只允许重复出现3次，分别对应：内部呼梯信号、外部向上的呼梯信号以及外部向下的呼梯信号；为此，建立三个数组`inside`、`outsideUp`、`outsideDown`，三个数组的下标为楼层数，值表示是否是该种呼梯信号，1为是，空或者0为否。如：某人在10楼外部按了向上的按钮，即`outsideUp[10] = 1;`
    - 电梯的状态——是否运行中、运行方向，分别存放在变量`running`和`goingUp`中
    - 电梯每运行到一层，判断该层是否在`queue`中，如果在，再判断它的胡梯信号是否和运行方向一致或者是该方向中的最后一层，若是，打开电梯门，更新电梯状态，若不是，电梯保持运动方向运动，更新显示器数字。

    |     变量      |             作用             |     值      | 多部电梯时的变体(电梯数ELE_COUNT) |
    | :-----------: | :--------------------------: | :---------: | :-------------------------------: |
    |    queue[]    |        存放所有呼梯层        |  呼梯层号   |        queue\[ELE_COUNT][]        |
    |   inside[]    |    判断是否是内部呼梯信号    |  1或0或空   |   inside\[ELE_COUNT][MAX_FLOOR]   |
    |  outsideUp[]  | 判断是否是外部向上的呼梯信号 |  1或0或空   | outsideUp\[ELE_COUNT][MAX_FLOOR]  |
    | outsideDown[] | 判断是否是外部向下的呼梯信号 |  1或0或空   | outsideDown[ELE_COUNT[MAX_FLOOR]  |
    | currentFloor  |     电梯当前运动到的楼层     |   楼层号    |      currentFLoor[ELE_COUNT]      |
    |    running    |   判断电梯是否处于运动状态   | true或false |        running[ELE_COUNT]         |
    |    goingUp    |  判断电梯运动方向是否为向上  | true或false |        goningUp[ELE_COUNT]        |
    |     timer     |     每隔1s执行一次主函数     |     无      |         timer[ELE_COUNT]          |


![insideScheduling](https://github.com/ChenCyl/Markdown-Photos/blob/master/insideScheduling.png?raw=true)


#### (2) 外调度：优先级调度算法
- 原理：将到呼梯层时间最短的电梯优先级设为最高，优先执行，即只将该呼梯层加入到时间最短的电梯queue中。
- 实现：
    - `运行经过楼层 = 停顿楼层 + 非停顿楼层` 
    - `运行时间 = 停顿楼层 * 停顿时间 + 非停顿楼层 * 电梯经过一层的时间`

### 2. 程序界面
- 初始界面

![init](https://github.com/ChenCyl/Markdown-Photos/blob/master/init.png?raw=true)


- 运动界面

![run](https://github.com/ChenCyl/Markdown-Photos/blob/master/run.png?raw=true)

### 3. 具体实现
- 主要函数说明

|      函数      |                       功能                       |                  参数                   | 返回值 |
| :------------: | :----------------------------------------------: | :-------------------------------------: | :----: |
| dial(n, floor) |         将呼梯层加入到第n部电梯的queue中         | n: 电梯标号（从0开始）; floor: 呼梯层号 |   无   |
|     run(n)     | 检测当前运动到的楼层需不需要停，并作出相应的反应 |               n: 电梯标号               |   无   |
| updateState(n) |         更新电梯状态：是否运行、运行方向         |               n: 电梯标号               |   无   |

- 辅助函数说明

|           函数            |                             功能                             |               参数               |       返回值        |
| :-----------------------: | :----------------------------------------------------------: | :------------------------------: | :-----------------: |
|          init()           |                        初始化所有变量                        |                无                |         无          |
|        openDoor(n)        |                   电梯停下后自动开启电梯门                   |           n: 电梯标号            |         无          |
|       closeDoor(n)        |                          关闭电梯门                          |           n: 电梯标号            |         无          |
|    openDoorByButton(n)    |                   电梯停下时手动开启电梯门                   |           n: 电梯标号            |         无          |
|    updateFloorInfo(n)     | 更新楼层信息，包括：门的上下移动效果、显示屏的数字和上下状态灯的变化 |           n: 电梯标号            |         无          |
|     getMaxInQueue(n)      |                   找出queue中的最大楼层数                    |           n: 电梯标号            |      最大楼层       |
|     getMinInQueue(n)      |                   找出queue中的最小楼层数                    |           n: 电梯标号            |     最小楼层数      |
| removeFromQueue(n, floor) |                      从queue中移除楼层                       | n: 电梯标号; floor: 被移除的楼层 |         无          |
|   betweenCount(a, b, n)   |               计算两个楼层间的需要停下的楼层数               | a、b: 楼层区间端点; n: 电梯标号  | [a,b]区间内的楼层数 |

- 具体代码

    - 外调度
    ```js
    // 点击事件的函数功能：将外部按钮的dial加入到其中一台电梯中
    // 算法：加入到离呼层最短时间的电梯中
    $(".goup").click(function(){
        var this_id = $(this).parent()[0].id; //只有通过id访问是一个元素，通过标签和class访问的是一个数组（元素列表）
        var pressedFloor = Number(this_id.substr(5)); //从下标为5的位置开始取
        if (isNaN(pressedFloor)) {
            ;
        }
        else {
            var minDistance = 2 * (MAX_FLOOR - MIN_FLOOR); // 可能出现的最大步数
            var distance = 0;
            var elevatorToPush = 0;
            // 希望在最短时间内达到呼层
            // 计算到呼层的步数（1s/步）+5s*当中停下的楼层：
            // if没有运动 else：
            // if当前层在呼层的下面或当前层
            //      电梯向上运动 
            //      电梯向下运动
            // else当前层在呼层的上面
            //      电梯向上运动
            //      电梯向下运动
            for (var i = 0; i < ELE_COUNT; i++) {
                if (!running[i]) {
                    distance = Math.abs(pressedFloor - currentFloor[i]);
                }
                else {
                    var minInQueue = getMinInQueue(i);
                    var maxInQueue = getMaxInQueue(i);
                    if (currentFloor[i] <= pressedFloor) {
                        if (goingUp[i]) {
                            distance = pressedFloor - currentFloor[i] + 5 * betweenCount(pressedFloor, currentFloor[i], i);
                        }   
                        else {
                            distance = currentFloor[i] - minInQueue + pressedFloor - minInQueue + 5 *
                            betweenCount(minInQueue, pressedFloor, i);
                        }
                    }
                    else {
                        if (goingUp[i]) {
                            distance = maxInQueue - currentFloor[i] + maxInQueue - minInQueue +
                            Math.abs(minInQueue - pressedFloor) + 5 * betweenCount(minDistance, maxInQueue,
                            i);
                        }
                        else {
                            distance = currentFloor[i] - minInQueue + Math.abs(minInQueue - pressedFloor) + 5
                            * betweenCount(currentFloor[i], minInQueue, i);
                        }
                    }
                }
                if (distance < minDistance) {
                    minDistance = distance;
                    elevatorToPush = i;
                }
            }

            if (outsideUp[elevatorToPush][pressedFloor] != 1) {
                outsideUp[elevatorToPush][pressedFloor] = 1;
                dial(elevatorToPush, pressedFloor);
                $(this).addClass("on"); //改变上下按钮为白色
            }
        }
    });
        
    ```

    ```js
    $(".godown").click(function(){
        var this_id = $(this).parent()[0].id;
        var pressedFloor = Number(this_id.substr(5));
        if (isNaN(pressedFloor)) {
            ;
        }
        else{
            var minDistance = 2 * (MAX_FLOOR - MIN_FLOOR); // 可能出现的最大步数
            var distance = 0;
            var elevatorToPush = 0;

            for (var i = 0; i < ELE_COUNT; i++) {
                if (!running[i]) {
                    distance = Math.abs(currentFloor[i] - pressedFloor);
                }
                else {
                    var minInQueue = getMinInQueue(i);
                    var maxInQueue = getMaxInQueue(i);
                    if (currentFloor[i] >= pressedFloor) {
                        if (goingUp[i]) {
                            distance = maxInQueue - currentFloor[i] + maxInQueue - pressedFloor + 5 *
                            betweenCount(maxInQueue, pressedFloor, i);
                        }
                        else {
                            distance = currentFloor[i] - pressedFloor + 5 * betweenCount(pressedFloor,
                            currentFloor[i], i);
                        }
                    }
                    else {
                        if (goingUp[i]) {
                            distance = maxInQueue - currentFloor[i] + Math.abs(maxInQueue - pressedFloor) + 5
                            * betweenCount(currentFloor[i], maxInQueue, i);
                        }
                        else {
                            distance = currentFloor[i] - minInQueue + maxInQueue - minInQueue +
                            Math.abs(maxInQueue - pressedFloor) + 5 * betweenCount(minDistance, maxInQueue,
                            i);
                        }
                    }
                }
                if (distance < minDistance) {
                    minDistance = distance;
                    elevatorToPush = i;
                }
            }
            
            if (outsideDown[elevatorToPush][pressedFloor] != 1) {
                outsideDown[elevatorToPush][pressedFloor] = 1;
                dial(elevatorToPush, pressedFloor);
                $(this).addClass("on");
            }
        }
    }); 
    ```

    - 内调度

    ```js
    // 点击事件函数功能：将内部button的数字加入到该楼层中
    $(".dial .button").click(function(){
        var this_class = $(this)[0].className;
        var parent_id = $(this).parent()[0].id;
        var pressedFloor = Number(this_class.substr(11));
        var n = Number(parent_id.substr(7));
        console.log("按下的楼层数为："+pressedFloor);
        if (!isNaN(pressedFloor)) {
            if (inside[n][pressedFloor]!= 1) {
                inside[n][pressedFloor] = 1;
                dial(n, pressedFloor);
                $(this).addClass("pressed");     
            }
        }
    });
    ```

    - 主要函数

    ```js
    // 函数功能：检测当前运动到的楼层需不需要停并实现相应功能
    // 参数：第n部电梯（n从0开始）
    function run(n) {
        // if (DEBUG_MODE) {
        //     console.log("elevator:" + n + " running:"+running[n] + "  goingUp:"+goingUp[n] + "  queue:"+queue[n] + " previousFloor:"+currentFloor[n]);
        // }
        
        if(running[n]) { //已经升到currentFloor的状态
            NeedToStop[n] = false; 
            // if elevator is right where it's called
            if (queue[n].indexOf(currentFloor[n]) > -1) {    
                if (inside[n][currentFloor[n]] == 1) { 
                    lightsOff(n, currentFloor[n], INSIDE);
                    removeFromQueue(n, currentFloor[n]);
                    inside[n][currentFloor[n]] = 0;
                    NeedToStop[n] = true;
                }
                if (goingUp[n]) { 
                    if (outsideUp[n][currentFloor[n]] == 1) {
                        lightsOff(n, currentFloor[n], OUTSIDE_UP);
                        removeFromQueue(n, currentFloor[n]);
                        outsideUp[n][currentFloor[n]] = 0;
                        NeedToStop[n] = true;
                    }
                    if (outsideDown[n][currentFloor[n]] == 1 && currentFloor[n] == getMaxInQueue(n)) {
                        lightsOff(n, currentFloor[n], OUTSIDE_DOWN);
                        removeFromQueue(n, currentFloor[n]);
                        outsideDown[n][currentFloor[n]] = 0;
                        NeedToStop[n] = true;
                    } 
                }
                else {
                    if (outsideDown[n][currentFloor[n]] == 1) {
                        lightsOff(n, currentFloor[n], OUTSIDE_DOWN);
                        removeFromQueue(n, currentFloor[n]);
                        outsideDown[n][currentFloor[n]] = 0;
                        NeedToStop[n] = true;
                    }
                    if (outsideUp[n][currentFloor[n]] == 1 && currentFloor[n] == getMinInQueue(n)) {
                        lightsOff(n, currentFloor[n], OUTSIDE_UP);
                        removeFromQueue(n, currentFloor[n]);
                        outsideUp[n][currentFloor[n]] = 0;
                        NeedToStop[n] = true;
                    }
                }
                
                if (NeedToStop[n]) {
                    if (timer[n])
                        clearInterval(timer[n]);
                        
                    setTimeout(function(){
                        openDoor(n);
                        //4s后关门 3s后设置timer timer为1s（所以关门开门时间都是4s）
                        setTimeout(function(){
                            closeDoor(n);
                            setTimeout(function(){
                                timer[n] = setInterval("run("+n+")", 1000);
                            }, 2000);
                        }, 2000);
                    }, 1000); 
                    // NeedToStop[n] = false;        
                }
                else {
                    goingUp[n] ? moveUp(n) : moveDown(n);
                }
            }
            else {
                goingUp[n] ? moveUp(n) : moveDown(n);
            }
            updataStatus(n);
        }
        
        updateFloorInfo(n);
    }

    ```

## 五、总结

- 外部的调度还有待完善的地方。在计算上，运行时间和停下时间是接近于真实值的不准确的值，这是我的算法的问题；其次，放在实际生活中，停下的时间并不是单次开门关门时间的累加，而要考虑许多其他原因，比如人流强度。

- 代码优化不够。代码在某种程度上看起来比较混乱，可读性不高。

- 整个设计流程反思：一开始应该着眼整体、全局，构思好大体的框架而不是边写代码边构思，后者导致开发效率显著降低。









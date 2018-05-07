// Allow some console output for debuging.
var DEBUG_MODE = true;

// 电梯数：第0 1 2 3 4部
var ELE_COUNT = 5; 

// array to store up/down requests <- 2D 第一个下标第几部电梯
var queue = new Array(ELE_COUNT);

// directions. up:true, down:false
var goingUp = new Array(ELE_COUNT);

// if no request, then running==false
var running = new Array(ELE_COUNT);

// elevator's current floor目前电梯运行到的楼层数, 初始是1
var currentFloor = new Array(ELE_COUNT); 

// top and bottom of the building
var MAX_FLOOR = 20;
var MIN_FLOOR = 0;

// 一个flag
var NeedToStop = new Array(ELE_COUNT);

//描述存在于queue里的楼层是怎么产生的
//是对应的该种方法产生的值为1，其余为空或0
var inside = new Array(ELE_COUNT); // <- 2D 第一个下标第几部电梯 第二个下标第几层
var outsideUp = new Array(ELE_COUNT);
var outsideDown = new Array(ELE_COUNT);

var INSIDE = 0;
var OUTSIDE_UP = 1;
var OUTSIDE_DOWN = 2;

// global timer
// 每部电梯有自己的timer
var timer = new Array(ELE_COUNT);

// 初始化
function init() {
    for (var i = 0; i < ELE_COUNT; i++) {
        queue[i] = new Array();
        inside[i] = new Array(MAX_FLOOR);
        outsideDown[i] = new Array(MAX_FLOOR);
        outsideUp[i] = new Array(MAX_FLOOR);
        goingUp[i] = true;
        running[i] = false;
        currentFloor[i] = 1;
        timer[i] = setInterval("run("+i+")", 1000);
    }

}
$(document).ready(init);

//***********以下函数根据从呼层到停下的时间线来排序*************

// 函数功能：呼梯呼层
// 参数：第n部电梯的第floor层（n从0开始）
function dial(n, floor) {
        queue[n].push(floor);

        // 如果电梯处于非运动状态则更新状态
        if(!running[n]) {
            updataStatus(n);
        }
}

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
                        distance = currentFloor[i] - minInQueue + pressedFloor - minInQueue + 5 * betweenCount(minInQueue, pressedFloor, i);
                    }
                }
                else {
                    if (goingUp[i]) {
                        distance = maxInQueue - currentFloor[i] + maxInQueue - minInQueue + Math.abs(minInQueue - pressedFloor) + 5 * betweenCount(minDistance, maxInQueue, i);
                    }
                    else {
                        distance = currentFloor[i] - minInQueue + Math.abs(minInQueue - pressedFloor) + 5 * betweenCount(currentFloor[i], minInQueue, i);
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
                        distance = maxInQueue - currentFloor[i] + maxInQueue - pressedFloor + 5 * betweenCount(maxInQueue, pressedFloor, i);
                    }
                    else {
                        distance = currentFloor[i] - pressedFloor + 5 * betweenCount(pressedFloor, currentFloor[i], i);
                    }
                }
                else {
                    if (goingUp[i]) {
                        distance = maxInQueue - currentFloor[i] + Math.abs(maxInQueue - pressedFloor) + 5 * betweenCount(currentFloor[i], maxInQueue, i);
                    }
                    else {
                        distance = currentFloor[i] - minInQueue + maxInQueue - minInQueue + Math.abs(maxInQueue - pressedFloor) + 5 * betweenCount(minDistance, maxInQueue, i);
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

// 点击事件函数功能：将内部button的数字加入到该楼层中
/*最后一行在某些情况下会出现错误是因为，重复按一个楼层的时候，类名字变多了但是还是按原来的长度取的数字*/
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
            $(this).addClass("pressed");   // 这里会导致一个错误    
        }
    }
});

function moveUp(n) {
    if ( currentFloor[n] < MAX_FLOOR )
        currentFloor[n]++;
}

function moveDown(n) {
    if ( currentFloor[n] > MIN_FLOOR )
        currentFloor[n]--;
}

// 函数功能：判断当前运动到的楼层需不需要停
// 参数：第n部电梯（n从0开始）
function run(n) {
    // if (DEBUG_MODE) {
    //     console.log("elevator:" + n + " running:"+running[n] + "  goingUp:"+goingUp[n] + "  queue:"+queue[n] + " previousFloor:"+currentFloor[n]);
    // }
    
    if(running[n]) { //已经升到currentFloor的状态
        NeedToStop[n] = false; 
        if (queue[n].indexOf(currentFloor[n]) > -1) {    // if elevator is right where it's called
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

function openDoor(n) {
    $("#E"+ n +" .leftdoor").css("left", "0%");
    $("#E"+ n +" .rightdoor").css("left", "45%");
}

function closeDoor(n) {
    $("#E"+ n +" .leftdoor").css("left", "15%");
    $("#E"+ n +" .rightdoor").css("left", "30%");
}

function openDoorbyButton(n) {
    if (NeedToStop[n]) {
        if (timer[n]) {
        clearInterval(timer[n]);
    }
    openDoor(n);

    // 每过1秒检测一下上一次自动关门时候设置的Timer
    // 3s后关门 2s后设置timer timer为1s（所以关门开门时间都是3s）
        setTimeout(function(){
            if (timer[n]) {
                clearInterval(timer[n]);
            }
            setTimeout(function(){
                if (timer[n]) {
                    clearInterval(timer[n]);
                }
                setTimeout(function(){
                    closeDoor(n);
                    setTimeout(function(){
                        timer[n] = setInterval("run("+n+")", 1000);
                    }, 2000);
                }, 1000);
            }, 1000)
        }, 1000)  
    }
    else {
        alert("危险！电梯运动过程中禁止开门！");
    }
}

// 达到呼层后相应按钮的灯熄灭
function lightsOff(n, floor, way) {
    if (way == OUTSIDE_UP && $("#floor" + floor + " td")[1]) 
        $("#floor" + floor + " td")[1].className = "goup button";
        // $("#floor" + floor + " td a").removeClass("on"); //上下同时都灭了 不可行
    else if (way == OUTSIDE_DOWN && $("#floor" + floor + " td")[2])
        $("#floor" + floor + " td")[2].className = "godown button";

    else if (way == INSIDE && $("#dial" + floor))
        $("#dialpad" + n + " .dial" + floor).removeClass("pressed");
}

// 函数功能：更新楼层信息
// 传入参数：第n部电梯
function updateFloorInfo(n) {

    //门的上下移动效果
    var ElevatorMove = (currentFloor[n] - 1) * 790 * 0.05;
    $("#E" + n + " .door").css("bottom", ElevatorMove+"px");

    //更新内部显示屏和门打开后的currentFloor
    if(currentFloor[n] > 0) {
        // $("#floorTitle").text(""+currentFloor);
        $("#floorOnScreen" + n).text(""+currentFloor[n]);
    }

    //更新内部显示屏的上下状态灯
    if (!running[n]) {
        $("#uplight"+n).removeClass("turnon");
        $("#downlight"+n).removeClass("turnon");
    }
    else if (goingUp[n]) {
        $("#downlight"+n).removeClass("turnon");
        $("#uplight" + n).addClass("turnon");
    }
    else {
        $("#uplight"+n).removeClass("turnon");
        $("#downlight" +n).addClass("turnon");
    }
}

// 函数功能：更新电梯状态——是否运行、方向
// 参数：第n部电梯（n从0开始）
function updataStatus(n) {
    running[n] = ( queue[n].length > 0) ? true : false;

    if(currentFloor[n] == MIN_FLOOR) {
        goingUp[n] = true;
    } else if (currentFloor[n] == MAX_FLOOR) {
        goingUp[n] = false;
    } else {
        (  goingUp[n] && (!running[n] || currentFloor[n] <= getMaxInQueue(n)) ) ? goingUp[n] = true  : goingUp[n] = false;
        ( !goingUp[n] && (!running[n] || currentFloor[n] >= getMinInQueue(n)) ) ? goingUp[n] = false : goingUp[n] = true;
    }
}

// 非数字按键点击事件
$(".call").click(function(){
    alert("正在呼救！！");
});
$(".emergency").click(function(){
    alert("紧急情况！！");
});

$(".open").click(function(){
    var this_id = $(this)[0].id;
    openDoorbyButton(Number(this_id.substr(5)));
});
$(".close").click(function(){
    var this_id = $(this)[0].id;
    closeDoor(Number(this_id.substr(6)));
});

// get max from an array
function getMaxInQueue(n) {
    if (queue[n].length <= 0) {
        throw new Error("can't get max from an empty array.");
        return false;
    }
    if (queue[n].length == 1) {
        return queue[n][0];
    } else {
        var max = queue[n][0];
        for(var i in queue[n]) {
            if (queue[n][i] > max) {
                max = queue[n][i];
            }
        }
        return max;
    }
}

// get max from an array
function getMinInQueue(n) {
    if (queue[n].length <= 0) {
        throw new Error("can't get min from an empty array.");
        return false;
    }
    if (queue[n].length == 1) {
        return queue[n][0];
    } else {
        var min = queue[n][0];
        for(var i in queue[n]) {
            if (queue[n][i] < min) {
                min = queue[n][i];
            }
        }
        return min;
    }
}

// remove certain floor from queue
function removeFromQueue(n, floor) {
    console.log("要删除的数字是"+floor);
    if (queue[n].indexOf(floor) < 0) {
        throw new Error("Can't remove non-existent floor from queue.");
        return false;
    }
    if (queue[n].length <= 0) {
        throw new Error("Can't remove floor from empty queue.");
        return false;
    }
    for (var i=0, len=queue[n].length; i<len; i++) {
        if (queue[n][i] == floor) {
            for(var j=i; j<len-1; j++) {
                queue[n][j] = queue[n][j+1];
            }
            queue[n].pop();
            break;
        }
    }
}

// calculate the count of number between a and b in the queue[n] ordered
// a > b or a < b is ok
function betweenCount(a, b, n) {
    if (a > b) {
        var temp = a;
        a = b;
        b = temp;
    }

    var betweenNum = [];
    for (var i in queue[n]) {
        if (queue[n][i] <= b && queue[n][i] >= a && betweenNum.indexOf(queue[n][i] < 0)) {
            betweenNum.push(queue[n][i]);
        }
    }
    return betweenNum.length;
}




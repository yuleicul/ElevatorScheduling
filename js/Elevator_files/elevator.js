// Allow some console output for debuging.
var DEBUG_MODE = true;

// 电梯数：第0 1 2 3 4部
var ELE_COUNT = 5; 
// array to store up/down requests in certain order <- 2D 第一个下标第几部电梯
var queue = new Array(ELE_COUNT);

// directions. up:true, down:false
var goingup = new Array(ELE_COUNT);

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
// var inside = new Array(MAX_FLOOR);
var inside = new Array(ELE_COUNT); // <- 2D 第一个下标第几部电梯 第二个下标第几层
var outsideUp = new Array(MAX_FLOOR);
var outsideDown = new Array(MAX_FLOOR);

var INSIDE = 0;
var OUTSIDE_UP = 1;
var OUTSIDE_DOWN = 2;

// global timer
// 每部电梯有自己的timer
var timer = new Array(ELE_COUNT);
function init() {
    for (var i = 0; i < ELE_COUNT; i++) {
        queue[i] = new Array();
        inside[i] = new Array(MAX_FLOOR);
        goingup[i] = true;
        running[i] = false;
        currentFloor[i] = 1;
        timer[i] = setInterval(run(i), 1000);
    }

}
$(document).ready(init);

function openDoor(n) {
    $("#E"+ n +" .leftdoor").css("left", "0%");
    $("#E"+ n +" .rightdoor").css("left", "45%");
}

function closeDoor(n) {
    $("#E"+ n +" .leftdoor").css("left", "15%");
    $("#E"+ n +" .rightdoor").css("left", "30%");
}

function openDoorbyButton(n) {
    if (timer[n]) {
        clearInterval(timer[n]);
    }
    openDoor(n);

    //每过1秒检测一下上一次自动关门时候设置的Timer
    //4s后关门 3s后设置timer timer为1s（所以关门开门时间都是4s）
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
                        timer[n] = setInterval(run(n), 1000);
                    }, 2000);
                }, 1000);
            }, 1000)
        }, 1000)
}

// calling the elevator to go certain floor
// 第n部电梯的第floor层（n从0开始）
function dial(n, floor) {
    // if ( queue.indexOf(floor) < 0 ) {   // Don't add if already exist.
        queue[n].push(floor);
        console.log(queue[n]);
        // queue.sort(); //排不排序都一样吧？！？！！这个电梯分明就是有毒 就只会上完下 下完上 门外按的是上是下都不管的 这傻逼电梯
        if(!running[n]) {
            checkStatus(n);
        }
}
function dialToAll(floor) {
    for (var i = 0; i < ELE_COUNT; i++) {
        queue[i].push(floor);
        if(!running[i]) {
            checkStatus(i);
        }
    }
}

// key binding
$(".goup").click(function(){
    var this_id = $(this).parent().parent()[0].id; //只有通过id访问是一个元素，通过标签和class访问的是一个数组（元素列表）
    var pressedFloor = Number(this_id.substr(5)); //从下标为5的位置开始取
    if (outsideUp[pressedFloor] != 1) {
        outsideUp[pressedFloor] = 1;
        dialToAll(pressedFloor);
        $(this).addClass("on"); //改变上下按钮为白色
    }
});

$(".godown").click(function(){
    var this_id = $(this).parent().parent()[0].id;
    var pressedFloor = Number(this_id.substr(5));
    if (outsideDown[pressedFloor] != 1) {
        outsideDown[pressedFloor] = 1;
        dialToAll(pressedFloor);
        $(this).addClass("on"); //加在现有的class前
    }
});

$(".dial .button").click(function(){
    var this_class = $(this)[0].className;
    console.log(this_class);
    var parent_id = $(this).parent()[0].id;
    console.log(parent_id);
    var pressedFloor = Number(this_class.substr(11));
    var n = Number(parent_id.substr(7));
    console.log(pressedFloor + " " +n);
    if (inside[n][pressedFloor]!= 1) {
        inside[n][pressedFloor] = 1;
        dial(n, pressedFloor);
        $(this).addClass("pressed");       
    }
});
// kill the lights when arrived
function lightsOut(n, floor, way) {
    if (way == OUTSIDE_UP && $("#floor" + floor + " td a")[0]) 
        $("#floor" + floor + " td a")[0].className = "goup";
        // $("#floor" + floor + " td a").removeClass("on"); //上下同时都灭了 不可行
    else if (way == OUTSIDE_DOWN && $("#floor" + floor + " td a")[1])
        $("#floor" + floor + " td a")[1].className = "godown";

    else if (way == INSIDE && $("#dial" + floor))
        $("#dialpad" + n + " .dial" + floor).removeClass("pressed");
}

// move
function moveUp(n) {
    if ( currentFloor[n] < MAX_FLOOR )
        currentFloor[n]++;
}

function moveDown(n) {
    if ( currentFloor[n] > MIN_FLOOR )
        currentFloor[n]--;
}

// update infos about current floor
function updateFloorInfo(n) {

    //“elevator”跟随当前楼层上升下降的动画效果
    // $("#bell tr").each(function(){
    //     $(this).children()[0].innerHTML = "";
    // });
    // $("#floor"+currentFloor).children()[0].innerHTML = "Elevator"; 

    //更新外部指示器上的currentFloor
    // $("#indicator li.current").removeClass("current");
    // $("#indicator li")[currentFloor].className = "current"; //不用addClass和函数lightsOut原因一样

    //门的上下移动效果
    var ElevatorMove = (currentFloor[n] - 1) * 790 * 0.05;
    $("#E" + n + " .door").css("bottom", ElevatorMove+"px");
    // $("div").animate({left:'250px'});

    //更新内部显示屏和门打开后的currentFloor
    if(currentFloor[n] > 0) {
        // $("#floorTitle").text(""+currentFloor);
        $("#floorOnScreen" + n).text(""+currentFloor[n]);
    }
    // } else {
    //     $("#floorTitle").text("B"+(1-currentFloor));
    //     $("#floorOnScreen").text("B"+(1-currentFloor));
    // }
}

// main algorithm
// 第n部电梯开始run（n从0开始）
function run(n) {
    if (DEBUG_MODE) {
        console.log("elevator:" + n + " running:"+running[n] + "  goingup:"+goingup[n] + "  queue:"+queue[n] + " previousFloor:"+currentFloor[n]);
    }
    
    if(running[n]) { //已经升到currentFloor的状态
        NeedToStop[n] = false; 
        if (queue[n].indexOf(currentFloor[n]) > -1) {    // if elevator is right where it's called
            if (inside[currentFloor[n]]) { 
                lightsOut(currentFloor[n], INSIDE);
                removeFromQueue(queue[n], currentFloor);
                inside[currentFloor[n]] = 0;
                NeedToStop[n] = true;
            }
            if (goingup[n]) { 
                if (outsideUp[currentFloor[n]] == 1) {
                    lightsOut(currentFloor[n], OUTSIDE_UP);
                    for (var i = 0; i < ELE_COUNT; i++) {
                        removeFromQueue(queue[i], currentFloor[n]);
                    }
                    outsideUp[currentFloor[n]] = 0;
                    NeedToStop[n] = true;
                }
                if (outsideDown[currentFloor[n]] == 1 && currentFloor[n] == getMaxInQueue(queue[n])) {
                    lightsOut(currentFloor[n], OUTSIDE_DOWN);
                    for (var i = 0; i < ELE_COUNT; i++) {
                        removeFromQueue(queue[i], currentFloor[n]);
                    }
                    outsideDown[currentFloor[n]] = 0;
                    NeedToStop[n] = true;
                } 
            }
            else {
                if (outsideDown[currentFloor[n]] == 1) {
                    lightsOut(currentFloor[n], OUTSIDE_DOWN);
                    for (var i = 0; i < ELE_COUNT; i++) {
                        removeFromQueue(queue[i], currentFloor[n]);
                    }
                    outsideDown[currentFloor[n]] = 0;
                    NeedToStop[n] = true;
                }
                if (outsideUp[currentFloor[n]] == 1 && currentFloor[n] == getMinInQueue(queue[n])) {
                    lightsOut(currentFloor[n], OUTSIDE_UP);
                    for (var i = 0; i < ELE_COUNT; i++) {
                        removeFromQueue(queue[i], currentFloor[n]);
                    }
                    outsideUp[currentFloor[n]] = 0;
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
                            timer[n] = setInterval(run(n), 1000);
                        }, 2000);
                    }, 2000);
                }     
                , 1000);         
            }
            else {
                goingup[n] ? moveUp(n) : moveDown(n);
                updateFloorInfo(n);
            }
        }
        else {
            goingup[n] ? moveUp(n) : moveDown(n);
            updateFloorInfo(n);
        }
        checkStatus(n);
    }
}

function ding(floor, way) {
    
    // lightsOut(floor, way);
    // removeFromQueue(queue, floor);
    // openDoor();

    // //4s后关门 3s后设置timer timer为1s（所以关门开门时间都是4s）
    // setTimeout(function(){
    //     closeDoor();
    //     setTimeout(function(){
    //         timer = setInterval(run, 1000);
    //     }, 3000);
    // }, 4000); 
}

// utilities
// check if it's still running
// 传入第n台电梯(n从0开始)
function checkStatus(n) {
    running[n] = ( queue[n].length > 0) ? true : false;

    if(currentFloor[n] == MIN_FLOOR) {
        goingup[n] = true;
    } else if (currentFloor[n] == MAX_FLOOR) {
        goingup[n] = false;
    } else {
        (  goingup[n] && (!running[n] || currentFloor[n] <= getMaxInQueue(queue[n])) ) ? goingup[n] = true  : goingup[n] = false;
        ( !goingup[n] && (!running[n] || currentFloor[n] >= getMinInQueue(queue[n])) ) ? goingup[n] = false : goingup[n] = true;
    }
}




// buttons
$(".maintain").click(function(){
    alert("Calling Maintainance ...");
});
$(".emergency").click(function(){
    alert("Calling Emergency ...");
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
function getMaxInQueue(queue) {
    if (queue.length <= 0) {
        throw new Error("can't get max from an empty array.");
        return false;
    }
    if (queue.length == 1) {
        return queue[0];
    } else {
        var max = queue[0];
        for(var i in queue) {
            if (queue[i] > max) {
                max = queue[i];
            }
        }
        return max;
    }
}

// get max from an array
function getMinInQueue(queue) {
    if (queue.length <= 0) {
        throw new Error("can't get min from an empty array.");
        return false;
    }
    if (queue.length == 1) {
        return queue[0];
    } else {
        var min = queue[0];
        for(var i in queue) {
            if (queue[i] < min) {
                max = queue[i];
            }
        }
        return min;
    }
}

// remove certain floor from queue
function removeFromQueue(queue, floor) {
    if (queue.indexOf(floor) < 0) {
        throw new Error("Can't remove non-existent floor from queue.");
        return false;
    }
    if (queue.length <= 0) {
        throw new Error("Can't remove floor from empty queue.");
        return false;
    }
    for (var i=0, len=queue.length; i<len; i++) {
        if (queue[i] == floor) {
            for(var j=i; j<len-1; j++) {
                queue[j] = queue[j+1];
            }
            queue.pop();
            break;
        }
    }
}
var timers = null;
timers = setInterval(run(0), 1000);
// timer[0] = setInterval(run(0), 1000);
// timer[1] = setInterval(run(1), 1000);
// timer[2] = setInterval(run(2), 1000);
// timer[3] = setInterval(run(3), 1000);
// timer[4] = setInterval(run(4), 1000);


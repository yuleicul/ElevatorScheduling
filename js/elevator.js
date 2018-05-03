// Allow some console output for debuging.
var DEBUG_MODE = true;

// array to store up/down requests in certain order
var queue = [];
// directions. up:true, down:false
var goingup = goingup;
// if no request, then running==false
var running = false;
// elevator's current floor目前电梯运行到的楼层数
var currentFloor = 1; 

// top and bottom of the building
var MAX_FLOOR = 10;
var MIN_FLOOR = 0;

//描述存在于queue里的楼层是怎么产生的
//是对应的该种方法产生的值为1，其余为空或0
var inside = new Array(MAX_FLOOR);
var outsideUp = new Array(MAX_FLOOR);
var outsideDown = new Array(MAX_FLOOR);

var INSIDE = 0;
var OUTSIDE_UP = 1;
var OUTSIDE_DOWN = 2;

// global timer
var timer = null;

// buttons
$("#maintain").click(function(){
    alert("Calling Maintainance ...");
});
$("#emergency").click(function(){
    alert("Calling Emergency ...");
});

function openDoor() {
    $("#leftdoor").css("left", 0);
    $("#rightdoor").css("left", "500px");
}

function closeDoor() {
    $("#leftdoor").css("left", "150px");
    $("#rightdoor").css("left", "350px");
}

$("#open").click(openDoor);
$("#close").click(closeDoor);

// calling the elevator to go certain floor
function dial(floor) {
    // if ( queue.indexOf(floor) < 0 ) {   // Don't add if already exist.
        queue.push(floor);
        // queue.sort(); //排不排序都一样吧？！？！！这个电梯分明就是有毒 就只会上完下 下完上 门外按的是上是下都不管的 这傻逼电梯
        if(!running) {
            checkStatus();
        }
}

// key binding
$(".goup").click(function(){
    var this_id = $(this).parent().parent()[0].id; //只有通过id访问是一个元素，通过标签和class访问的是一个数组（元素列表）
    var pressedFloor = Number(this_id.substr(5)); //从下标为5的位置开始取
    if (outsideUp[pressedFloor] != 1) {
        outsideUp[pressedFloor] = 1;
        dial(pressedFloor);
        $(this).addClass("on"); //改变上下按钮为白色
    }
});

$(".godown").click(function(){
    var this_id = $(this).parent().parent()[0].id;
    var pressedFloor = Number(this_id.substr(5));
    if (outsideDown[pressedFloor] != 1) {
        outsideDown[pressedFloor] = 1;
        dial(pressedFloor);
        $(this).addClass("on"); //加在现有的class前
    }
});

$("#dial .button").click(function(){
    var this_id = $(this)[0].id;
    var pressedFloor = Number(this_id.substr(4));
    if (inside[pressedFloor]!= 1) {
        inside[pressedFloor] = 1;
        dial(pressedFloor);
        $(this).addClass("pressed");       
    }
});


// kill the lights when arrived
function lightsOut(floor, way) {
    if (way == OUTSIDE_UP && $("#floor" + floor + " td a")[0]) 
        $("#floor" + floor + " td a")[0].className = "goup";
        // $("#floor" + floor + " td a").removeClass("on"); //上下同时都灭了 不可行
    else if (way == OUTSIDE_DOWN && $("#floor" + floor + " td a")[1])
        $("#floor" + floor + " td a")[1].className = "godown";

    else if (way == INSIDE && $("#dial" + floor))
        $("#dial" + floor).removeClass("pressed");
}

// move
function moveUp() {
    if ( currentFloor < MAX_FLOOR )
        currentFloor++;
}

function moveDown() {
    if ( currentFloor > MIN_FLOOR )
        currentFloor--;
}

// update infos about current floor
function updateFloorInfo() {

    //“elevator”跟随当前楼层上升下降的动画效果
    $("#bell tr").each(function(){
        $(this).children()[0].innerHTML = "";
    });
    $("#floor"+currentFloor).children()[0].innerHTML = "Elevator"; 

    //更新外部指示器上的currentFloor
    $("#indicator li.current").removeClass("current");
    $("#indicator li")[currentFloor].className = "current"; //不用addClass和函数lightsOut原因一样

    //更新内部显示屏和门打开后的currentFloor
    if(currentFloor>0) {
        $("#floorTitle").text(""+currentFloor);
        $("#floorOnScreen").text(""+currentFloor);
    } else {
        $("#floorTitle").text("B"+(1-currentFloor));
        $("#floorOnScreen").text("B"+(1-currentFloor));
    }
}

// main algorithm
function run() {
    if (DEBUG_MODE) {
        console.log("running:"+running + "  goingup:"+goingup + "  queue:"+queue + " previousFloor:"+currentFloor);
    }
    
    if(running) { //已经升到currentFloor的状态
        var NeedToStop = false; //
        if (queue.indexOf(currentFloor) > -1) {    // if elevator is right where it's called
            if (inside[currentFloor]) { 
                lightsOut(currentFloor, INSIDE);
                removeFromQueue(queue, currentFloor);
                inside[currentFloor] = 0;
                NeedToStop = true;
            }
            if (goingup) { 
                if (outsideUp[currentFloor] == 1) {
                    lightsOut(currentFloor, OUTSIDE_UP);
                    removeFromQueue(queue, currentFloor);
                    outsideUp[currentFloor] = 0;
                    NeedToStop = true;
                }
                if (outsideDown[currentFloor] == 1 && currentFloor == getMaxInQueue(queue)) {
                    lightsOut(currentFloor, OUTSIDE_DOWN);
                    removeFromQueue(queue, currentFloor);
                    outsideDown[currentFloor] = 0;
                    NeedToStop = true;
                } 
            }
            else {
                if (outsideDown[currentFloor] == 1) {
                    lightsOut(currentFloor, OUTSIDE_DOWN);
                    removeFromQueue(queue, currentFloor);
                    outsideDown[currentFloor] = 0;
                    NeedToStop = true;
                }
                if (outsideUp[currentFloor] == 1 && currentFloor == getMinInQueue(queue)) {
                    lightsOut(currentFloor, OUTSIDE_UP);
                    removeFromQueue(queue, currentFloor);
                    outsideUp[currentFloor] = 0;
                    NeedToStop = true;
                }
            }

            if (NeedToStop) {
                 if (timer)
                    clearInterval(timer);
                openDoor();
                //4s后关门 3s后设置timer timer为1s（所以关门开门时间都是4s）
                setTimeout(function(){
                    closeDoor();
                    setTimeout(function(){
                        timer = setInterval(run, 1000);
                    }, 3000);
                }, 4000);               
            }
            else {
                goingup ? moveUp() : moveDown();
                updateFloorInfo();
            }
        }
        else {
            goingup ? moveUp() : moveDown();
            updateFloorInfo();
        }
        checkStatus();
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
function checkStatus() {
    running = ( queue.length > 0) ? true : false;

    if(currentFloor == MIN_FLOOR) {
        goingup = true;
    } else if (currentFloor == MAX_FLOOR) {
        goingup = false;
    } else {
        (  goingup && (!running || currentFloor <= getMaxInQueue(queue)) ) ? goingup = true  : goingup = false;
        ( !goingup && (!running || currentFloor >= getMinInQueue(queue)) ) ? goingup = false : goingup = true;
    }
}

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
                queue[j] = queue[j+1]
            }
            queue.pop();
            break;
        }
    }
}

timer = setInterval(run, 1000);
function Ball(pos, vel, clr)
{
  this.pos = pos;
  this.vel = vel;
  this.radius = 0.002;
  this.clr = clr;

  this.clone  = function ()
  {
    return new Ball(vec2.clone(this.pos), vec2.clone(this.vel), this.radius, this.clr);
  }

  return this;
}

function Wall(from, to)
{
  this.from = from;
  this.to = to;
  this.direction = vec2.subtract(vec2.create(), this.to, this.from);
  this.sqrLen = vec2.sqrLen(this.direction);
  this.normal = vec2.normalize(vec2.create(), vec2.fromValues(-this.direction[1], this.direction[0]));
}


function SliderControl(pos, title, contextGetter) {

  this.myTitle = title;
  this.contextGetter = contextGetter;

  this.val = 0.5;
  var width = 100;
  var height = 10;
  var knobHeight = 30;
  var knobWidth = 10;
  this.position = pos;
  this.dragging = false;
  var that = this;
  
  this.Draw = function() {
    var ctx = this.contextGetter();
          
    ctx.fillStyle = "black";
    var main = MainBox();
    ctx.fillRect(main.x, main.y, main.w, main.h);
    
    ctx.fillStyle = "lightgrey";
    var knobBox = KnobBox();
    ctx.fillRect(knobBox.x, knobBox.y, knobBox.w, knobBox.h);
    this.NormalText(this.myTitle, main.x - 2, knobBox.y - 5, "12px Arial", "black");
  }
  
  this.NormalText = function(text, posx, posy, font, color) {
    var ctx = this.contextGetter();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(text, posx, posy);
  }

  function BoundingBox() {
    return {
      x: that.position.x - knobWidth,
      y: KnobBox().y - 20,
      w: width + 3 * knobWidth,
      h: knobHeight + 20
    }
  }
  
  function MainBox() {
    return {
      x: that.position.x, 
      y: that.position.y,
      w: width,
      h: height
    };
  }
  
  function KnobBox() {
    return { 
      x: that.val * width + pos.x - knobWidth * 0.5, 
      y: that.position.y - knobHeight * 0.5 + height * 0.5, 
      w: knobWidth, 
      h: knobHeight 
    };
  }
  
  function BoxContains(box, coords) {
    return coords.x >= box.x && 
      coords.x <= box.x + box.w &&
      coords.y >= box.y &&
      coords.y <= box.y + box.h;
  }
  
  this.Contains = function(coords) {
    return BoxContains(KnobBox(), coords) || BoxContains(MainBox(), coords);
  }
  
  this.OnMouseDown = function(coords, button) {
    if (button == 3) {
      return;
    }
    
    if (BoxContains(KnobBox(), coords)) {
      this.dragging = true;
    } else if(BoxContains(MainBox(), coords)) {
      SetValAtCoord(coords);
      this.dragging = true;        
    }
  }
  
  this.OnMouseUp = function() {
    this.dragging = false;
  }
  
  function SetValAtCoord(coords) {
    var coordx = coords.x - that.position.x;
    coordx = Math.max(0, coordx);
    coordx = Math.min(width, coordx);
    that.val = coordx / width;
  }
  
  this.OnMouseMove = function(coords) {
    if (this.dragging) {
      SetValAtCoord(coords);        
    }
  }
  
}

function Button(pos, title, contextGetter, callback) {

  this.myTitle = title;
  this.contextGetter = contextGetter;
  this.callback = callback;
  this.hasMouse = false;
  
  var width = 80;
  var height = 30;  
  this.position = pos;  
  var that = this;
  
  this.Draw = function() {
    var ctx = this.contextGetter();

    var main = MainBox();
    ctx.fillStyle = "white"
    if (this.hasMouse)
    {
      ctx.fillStyle = "lightgray"
    }
    ctx.fillRect(main.x, main.y, main.w, main.h)
    ctx.strokeStyle = "black";
    ctx.strokeRect(main.x, main.y, main.w, main.h);
    
    ctx.font = "12px Arial";
    ctx.fillStyle =  "black";
    ctx.fillText(this.myTitle, main.x + main.w * 0.3, main.y + 20);    
  }
  
  function MainBox() {
    return {
      x: that.position.x, 
      y: that.position.y,
      w: width,
      h: height
    };
  }

  function BoxContains(box, coords) {
    return coords.x >= box.x && 
      coords.x <= box.x + box.w &&
      coords.y >= box.y &&
      coords.y <= box.y + box.h;
  }

  this.OnMouseDown = function(coords, button) {
    if (button == 3) {
      return;
    }
    
    if (BoxContains(MainBox(), coords)) {
      this.pressed = true;
    } 
  }

  this.OnMouseUp = function(coords, button) {
    if (button == 3) {
      return;
    }
    
    if (BoxContains(MainBox(), coords) && this.pressed) {
      this.callback();
    }
    this.pressed = false;
  }

  this.OnMouseMove = function(coords) {
    this.hasMouse = BoxContains(MainBox(), coords);
    if (!this.hasMouse)
    {
      this.pressed = false;
    }
  }

}

function App() {

  var minExtent = 0;
  var canvas_x_offset = 0;
  var canvas_y_offset = 0;  

  var walls = [];
  var button;
  var sliders = [];

  this.Start = function()
  {
    minExtent = Math.min(canvas.width, canvas.height);
    canvas_x_offset = (canvas.width - minExtent) * 0.5;
    canvas_y_offset = (canvas.height - minExtent) * 0.5;  
    
    GetCanvas().onmousedown = OnMouseDownCB;
    GetCanvas().onmouseup = OnMouseUpCB;
    GetCanvas().onmousemove = OnMouseMoveCB;
    GetCanvas().onmouseout = OnMouseOutCB;
    
    AddWall(0, 0, Width(), 0);
    AddWall(0, Height(), Width(), Height());

    AddWall(0, 0, 0, Height());
    AddWall(Width(), 0, Width(), Height());

    AddWall(Width() * 0.5,             0.0, Width() * 0.5, Height() * 0.5);
    AddWall(Width() * 0.5, Height() * 0.5, Width() * 0.5, Height());

    sliders = {
      "speed": new SliderControl({x: 1075, y: 35}, "Speed", GetContext),       
      "wall": new SliderControl({x: 1075, y: 95}, "Hole size", GetContext),
      "ball": new SliderControl({x: 1075, y: 155}, "Ball count", GetContext),
    };
    
    sliders["wall"].val = 0.0;

    sliderList = [sliders["speed"], sliders["wall"], sliders["ball"]];

    this.button = new Button({x: 1085, y: 205}, "Reset", GetContext, Reset)

    Initballs();

    UpdateDynamicWall();

    tick();
    Draw();
  }

  function AddWall(fromx, fromy, tox, toy)
  {
    walls.push(CreateWall(fromx, fromy, tox, toy));
  }

  function CreateWall(fromx, fromy, tox, toy)
  {
    return new Wall(
      CanvasToWorld(vec2.fromValues(fromx, fromy)),
      CanvasToWorld(vec2.fromValues(tox, toy))); 
  }

  function Width()
  {
    return GetCanvas().width;
  }

  function Height()
  {
    return GetCanvas().height;
  }

  function Reset()
  {
    Initballs();
    sliders["wall"].val = 0.0;
  }

  var balls = [];
  var prevballs;
  function Initballs()
  {
    balls = [];
    for (var i = 0; i < BallCount(); i++) {
      balls.push(RandomBall());
    }
    prevballs = balls;
  }    
  
  function RandomBall()
  {
    var pos = RandomPos();
    var scr = WorldToCanvas(pos);
    var clr = 'red';
    if (scr[0] < Width() * 0.5)
    {
      clr = 'blue'
    }
    return new Ball(pos, RandomVel(), clr);
  }

  function BallCount()
  {
    return Math.max(1, sliders["ball"].val * 2000);
  }

  function RandomPos()
  {
    return CanvasToWorld(vec2.fromValues(Math.random() * Width(), Math.random() * Height()));
  }

  function RandomVel()
  {
    var ret = vec2.fromValues(Math.random() - 0.5, Math.random() - 0.5);
    return vec2.scale(ret, ret, 2);
  }

  function Clear()
  {
    var ctx = GetContext();    
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, Width(), Height());
  }

  function Draw()
  {
    Clear();
    DrawPercentages();
    DrawBalls();
    DrawWalls();
    DrawSliders();
    this.button.Draw();
    DrawFPS();
  }

  function DrawSliders()
  {    
    for (var i = 0; i < sliderList.length; i++) {
      sliderList[i].Draw();
    };
  }

  function DrawPercentages()
  {
    var ctx = GetContext();
    ctx.font="bold 120px Arial";
    ctx.fillStyle = "lightblue";
    ctx.fillText(BluePercentage().toFixed(0) + "%", Width()*0.15, Height()*0.5);
    ctx.fillStyle = "pink";    
    ctx.fillText(RedPercentage().toFixed(0) + "%", Width()*0.65, Height()*0.5);
  }

  function RedPercentage()
  {
    return Percentage('red', function(x, y) { return x > y;})
  }

  function BluePercentage()
  {
    return Percentage('blue', function(x, y) { return x < y;})
  }

  function Percentage(color, cond)
  {
    var x = CanvasToWorld(vec2.fromValues(Width() * 0.5, 0))[0];
    var count = 0;
    var total = 0;
    for (var i = 0; i < balls.length; i++) {
      if (balls[i].clr == color)
      {
        if (cond(balls[i].pos[0], x))
        {
          count++;
        }
        total++;
      }
    }
    total = Math.max(1, total);
    return (count / total) * 100.0;
  }

  function DrawFPS()
  {
    var ctx = GetContext();
    var text = "FPS: " + CalculateFPS().toFixed(1);
    ctx.font="12px Arial";
    ctx.fillStyle = "black"
    ctx.fillText(text, Width() - 120, Height() - 40);
  }

  function DrawBalls()
  {
    for (var i = 0; i < balls.length; i++)
    {
      DrawBall(balls[i]);    
    }
  }

  function DrawBall(ball)
  {
    var ctx = GetContext();
    var scr = WorldToCanvas(ball.pos);
    var radius = WorldToCanvasForLength(ball.radius);    
    ctx.beginPath();
    ctx.arc(scr[0], scr[1], radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = ball.clr;
    ctx.fill();
    ctx.strokeStyle = ball.clr;
    ctx.stroke();
  }

  function DrawWalls()
  {
    for (var i = 0; i < walls.length; i++)
      DrawWall(walls[i]);
  }

  function DrawWall(wall)
  {
    var ctx = GetContext();
    var from = WorldToCanvas(wall.from);
    var to = WorldToCanvas(wall.to);

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.stroke();
  }

  function Simulate() 
  { 
    CopyState();
    Integrate();
    CollideWithWalls();
  }

  function CopyState()
  {
    prevballs = [];
    for (var i = 0; i < balls.length; i++) {
      prevballs.push(balls[i].clone());      
    }
  }

  function Integrate()
  {
    for (var i = 0; i < balls.length; i++) {
      var ball = balls[i];
      IntegrateBall(ball);
    }
  }

  function IntegrateBall(ball)
  {
    vec2.scaleAndAdd(ball.pos, ball.pos, ball.vel, PHYSICS_TIME_STEP_IN_SEC);
  }
  
  function CollideWithWalls()
  {
    var ballvec = vec2.create();
    var prevBallvec = vec2.create();
    var projected = vec2.create();
    var min = CanvasToWorld(vec2.fromValues(0, 0));
    var max = CanvasToWorld(vec2.fromValues(Width(), Height()));
    for (var j = 0; j < walls.length; j++)
    {
      var wall = walls[j];  

      for (var i = 0; i < balls.length; i++) {
        var ball = balls[i];
        var prevBall = prevballs[i];
        vec2.subtract(ballvec, ball.pos, wall.from);
        vec2.subtract(prevBallvec, prevBall.pos, wall.from);

        var cross = wall.direction[0] * ballvec[1] - wall.direction[1] * ballvec[0];
        var prevCross = wall.direction[0] * prevBallvec[1] - wall.direction[1] * prevBallvec[0];

        var dot = vec2.dot(ballvec, wall.direction);
        if (cross * prevCross < 0.0)
        {          
          if (dot >= 0.0 && dot <= wall.sqrLen)
          {
            var reflectionDot = -vec2.dot(ball.vel, wall.normal);      
            vec2.scaleAndAdd(ball.vel, ball.vel, wall.normal, reflectionDot * 2);
            ball.pos = prevBall.pos;
          }
        } 
      }
    }
  }

  function UpdateDynamicWall()
  {
    var inverted = (1 - sliders["wall"].val);
    var val = (1.0 - inverted)* 0.8 + inverted; 
    walls[4] = CreateWall(Width() * 0.5,             0.0, Width() * 0.5, val * Height() * 0.5);
    walls[5] = CreateWall(Width() * 0.5, (1.0 - val * 0.5) * Height(), Width() * 0.5, Height() );
  }

  function UpdateBalls()
  {
    var targetCount = BallCount();
    while (targetCount > balls.length)
    {
      balls.push(RandomBall());
    }
    balls.length = targetCount;
  }

  var PHYSICS_TIME_STEP = 10; // 100 fps
  var PHYSICS_TIME_STEP_IN_SEC = PHYSICS_TIME_STEP / 1000;
  var TARGET_FPS = 50.0;
  var TARGET_FRAME_TIME = 1000 / TARGET_FPS;
  var simulationSpeed = 1.0;

  var accumulator = 0;
  function tick() {

    UpdateDynamicWall();
    UpdateBalls();
    simulationSpeed = Math.tan((1.0 - sliders["speed"].val) * (Math.PI*0.5 - 0.2) + 0.2)

    prevDrawTime = curDrawTime;
    curDrawTime = new Date().getTime();
    var frameTime = curDrawTime - prevDrawTime;

    accumulator += frameTime * (1.0 / simulationSpeed);
    
    if (accumulator > 100 * PHYSICS_TIME_STEP) // just skip time
    {
      accumulator = 5 * PHYSICS_TIME_STEP;
    }

    while (accumulator >= PHYSICS_TIME_STEP)
    {
      Simulate();
      accumulator -= PHYSICS_TIME_STEP;
    }
    Draw();
    
    requestAnimFrame(tick);
  }
  var curDrawTime = new Date().getTime();
  var prevDrawTime = new Date().getTime();
    
  function GetFrameTime() {
    return curDrawTime - prevDrawTime;
  }

  var CalculateFPS = function() {
    var fpsFilter = 0.01;
    var frameTime = 1.0/60.0 * 1000;
    
    return function() {
      var elapsed = GetFrameTime();
      frameTime = (1-fpsFilter) * frameTime + fpsFilter * elapsed;
      return 1.0 / frameTime * 1000.0;
    }
  }();

  window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           window.oRequestAnimationFrame ||
           window.msRequestAnimationFrame ||
           function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
             window.setTimeout(callback, 1000/60);
           };
  })();


  function GetCanvas()
  {
    return document.getElementById("canvas");
  }

  function GetContext()
  {
    return GetCanvas().getContext("2d");
  }

  function WorldToCanvas(wrl)
  {
    return vec2.fromValues(
      (wrl[0]*0.5 + 0.5) * minExtent + canvas_x_offset,
      (wrl[1]*0.5 + 0.5) * minExtent + canvas_y_offset);
  }

  function WorldToCanvasForLength(len)
  {
    return len * minExtent;
  }

  function CanvasToWorld(scr)
  {
    return vec2.fromValues(
      ((scr[0] - canvas_x_offset) / minExtent - 0.5) * 2, 
      ((scr[1] - canvas_y_offset) / minExtent - 0.5) * 2);
  }

  function ScreenToCanvas(sx, sy) {
    rect = GetCanvas().getBoundingClientRect();
    return { x: sx - rect.left, y: sy - rect.top };
  }

  function OnMouseDownCB(ev) {    
    canv = ScreenToCanvas(ev.clientX, ev.clientY);
    OnMouseDown(canv, ev.which);
  }
  
  function OnMouseUpCB(ev) {
    canv = ScreenToCanvas(ev.clientX, ev.clientY);
    OnMouseUp(canv, ev.which);
  }
  
  function OnMouseMoveCB(ev) {
    canv = ScreenToCanvas(ev.clientX, ev.clientY);
    OnMouseMove(canv);
  }

  function OnMouseOutCB(ev)
  {
    OnMouseOut();
  }

  function OnMouseDown(coords, button) {
    for (var i = 0; i < sliderList.length; i++) {
      sliderList[i].OnMouseDown(coords, button);
    }
    this.button.OnMouseDown(coords, button)
  }
  
  function OnMouseUp(coords, button) {
    for (var i = 0; i < sliderList.length; i++) {
      sliderList[i].OnMouseUp(button);
    }    
    this.button.OnMouseUp(coords, button)
  }
  
  function OnMouseMove(coords) {
    for (var i = 0; i < sliderList.length; i++) {
      sliderList[i].OnMouseMove(coords);
    }    
    this.button.OnMouseMove(coords)
  }

  function OnMouseOut()
  { 
    for (var i = 0; i < sliderList.length; i++) {
      sliderList[i].dragging = false;
    }    
  }

  return this;
}
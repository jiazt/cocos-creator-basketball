var TouchStatus = cc.Enum({
    BEGEN:  -1, // 按下
    ENDED:  -1, // 结束
    CANCEL: -1  // 取消
});

var BallStatus = cc.Enum({
    FLY:  -1, // 飞
    DOWN: -1, // 落
    NONE: -1  // 静止
});

cc.Class({
    extends: cc.Component,

    properties: {
        emitSpeed: 0,   // 发射速度
        gravity: 0,     // 重力速度
        scale: 0,       // 缩放系数
        showTime: 0,    // 生成篮球显示动画时间
        maxXSpeed: 0,   // 球弹力
    },

    init: function(game){
        this.game = game;
        this.registerInput();
        this.enableInput(true);
        this.showAnim();
        this.valid = false;
        this.status = TouchStatus.CANCEL;
        this.currentHorSpeed = 0;
        this.currentVerSpeed = 0;
        this.target =  cc.p(0, 0);
        this.node.setScale(1);
        this.node.rotation = 0;
        this.hitIn = false;
    },

    // 显示动画
    showAnim: function(){
        this.node.opacity = 0;
        var fade = cc.fadeIn(this.showTime);
        this.node.runAction(fade);    
    },

    // 注册事件监听
    registerInput: function(){
        this.listener = {
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            onTouchBegan: function(touch, event) { // 触摸事件开始
                this.began = touch.getLocation();
                this.status = TouchStatus.BEGEN;
                return true;
            }.bind(this),

            onTouchEnded: function (touch, event) { // 触摸事件结束
                this.ended = touch.getLocation();
                var distance = cc.pDistance(this.began, this.ended);

                if(distance > 100 && this.began.y < this.ended.y){
                    this.status = TouchStatus.ENDED;
                    this.enableInput(false);
                    
                    this.currentVerSpeed = this.emitSpeed;
                    this.target =  this.node.parent.convertToNodeSpaceAR(this.ended); // 记录最后触摸点,根据触摸点偏移计算速度
                    this.currentHorSpeed = this.target.x * 2;
                    
                    this.game.soundMng.playFlySound();

                    this.doAnim();
                    this.game.newBall();
                    if(this.shadow){
                        this.shadow.dimiss();
                    }
                }else{
                    this.status = TouchStatus.CANCEL;
                }
            }.bind(this),

            onTouchCancelled: function (touch, event) { // 触摸事件取消
                this.status = TouchStatus.CANCEL;
            }.bind(this)
        },
        cc.eventManager.addListener(this.listener, this.node);
    },

    // 控制事件是否生效
    enableInput: function (enable) {
        if (enable) {
            cc.eventManager.resumeTarget(this.node);
        } else {
            cc.eventManager.pauseTarget(this.node);
        }
    },

    // 篮球动画
    doAnim: function(){
        var scaleAnim = cc.scaleTo(1, this.scale);
        var rotateValue = cc.randomMinus1To1();
        var rotateAnim = cc.rotateBy(2, 3*360*rotateValue);
        var anim = cc.spawn(scaleAnim,rotateAnim);
        this.node.runAction(anim);
    },

    update: function (dt) {
        if(this.status != TouchStatus.ENDED){
            return;
        }

        this._updatePosition(dt);
        this._checkValid();
    },
    
    _checkValid: function(){
        if(this.ballStatus !== BallStatus.DOWN || this.valid){
            return;
        }
        
        var parent = this.node.parent;
        if(parent != null){
            var basket = this.game.basket;
            var left = basket.left;
            var right = basket.right;
            var ballRadius = this.node.getBoundingBoxToWorld().width/2;
            
            /** 统一转换成世界坐标计算进球逻辑 */
            // 篮球的边界和中心
            var ballLeft = parent.convertToWorldSpaceAR(this.node.getPosition()).x - ballRadius;
            var ballRight = parent.convertToWorldSpaceAR(this.node.getPosition()).x + ballRadius;
            var ballX = parent.convertToWorldSpaceAR(this.node.getPosition()).x;
            var ballY = parent.convertToWorldSpaceAR(this.node.getPosition()).y;
            
            // 有效进球范围
            var validTop = parent.convertToWorldSpaceAR(basket.linePreNode.getPosition()).y - ballRadius;
            var validLeft = basket.node.convertToWorldSpaceAR(left.getPosition()).x;
            var validRight = basket.node.convertToWorldSpaceAR(right.getPosition()).x;
            var validBot = basket.node.convertToWorldSpaceAR(left.getPosition()).y - ballRadius * 2;
            
            if(ballY < validTop && ballY > validBot && ballX > validLeft && ballX < validRight){
                this.valid = true;
                this.game.score.addScore();
                this.game.basket.playNetAnim();
                if(this.hitIn){
                    this.game.soundMng.playHitBoardInSound();
                }else{
                    this.game.soundMng.playBallInSound();
                }
            }
        }
    },

    // 篮球绑定自己的影子
    bindShadow: function(shadow){
        this.shadow = shadow;
    },

    // 更新篮球位置
    _updatePosition: function(dt){
        this.node.x += dt * this.currentHorSpeed;
        
        this.currentVerSpeed -= dt * this.gravity;
        this.node.y += dt * this.currentVerSpeed;
        
        this._changeBallStatus(this.currentVerSpeed);

        if(this.ballStatus === BallStatus.NONE && this._isOutScreen()){
            // if(!this.valid){ // 没进球将分数重置
            //     this.game.score.setScore(0);
            // }
            
            this.node.stopAllActions();
            this.node.removeFromParent();
            this.valid = false;
            cc.pool.putInPool(this);
            // this.game.newBall();
            return;
        }
    },
    
    _isOutScreen: function(){
        return this.node.y < -800;
    },

    // 更改篮球状态
    _changeBallStatus: function(speed){
        if(speed === 0 || this._isOutScreen()){
            this.ballStatus = BallStatus.NONE;
        } else if(speed > 0) {
            this.ballStatus = BallStatus.FLY;
            this.game.basket.switchMaskLineShow(false);
        } else {
            this.ballStatus = BallStatus.DOWN;
            this.game.basket.switchMaskLineShow(true);
        }
    },

    onCollisionEnter: function (other, self) {
        if(this.ballStatus === BallStatus.FLY){ // 篮球上升过程中不进行碰撞检测
            return;
        }

        var box = other.node.getComponent('CollisionBox');
        var left = box.getLeft();
        var right = box.getRight();

        // 碰撞系统会计算出碰撞组件在世界坐标系下的相关的值，并放到 world 这个属性里面
        var world = self.world;
        var radius = world.radius;

        // 换算物体世界坐标系坐标
        var selfWorldPot = this.node.parent.convertToWorldSpaceAR(self.node.getPosition());
        var otherWorldPot = this.game.basket.node.convertToWorldSpaceAR(other.node.getPosition());

        // 将碰撞范围抽象成篮筐左右两个点，并将这两点与篮球放到同一个碰撞组。
        // 篮球中心点到刚体中心点距离除以篮球半径得到一个比值，横纵向乘以这个比值得到横纵向速度。
        var ratioVer = (selfWorldPot.y - otherWorldPot.y) / radius;
        var ratioHor = Math.abs(otherWorldPot.x - selfWorldPot.x) / radius;
        // 水平方向碰撞最大初速度
        var horV = this.currentHorSpeed / Math.abs(this.currentHorSpeed) * this.maxXSpeed;

        // 篮球碰到篮筐内，改变篮球横向速度为反方向
        if ((other.node.name === 'right' && this.node.x <= left) || (other.node.name === 'left' && this.node.x >= right)) {
            if (!this.hitIn) {
                this.currentHorSpeed = horV * -1 * ratioHor;
                this.hitIn = true;
            } else {
                this.currentHorSpeed = horV * ratioHor;
            }
        }

        // 篮球碰到篮筐外，增大横向速度
        if ((other.node.name === 'right' && this.node.x > right) || (other.node.name === 'left' && this.node.x < left)) {
            this.currentHorSpeed = horV;
        }
        this.currentVerSpeed = this.currentVerSpeed * -1 * ratioVer;
        this.game.soundMng.playHitBoardSound();

        // 碰撞组件的 aabb 碰撞框
        var aabb = world.aabb;

        // 上一次计算的碰撞组件的 aabb 碰撞框
        var preAabb = world.preAabb;

        // 碰撞框的世界矩阵
        var t = world.transform;

        // 以下属性为圆形碰撞组件特有属性
        var r = world.radius;
        var p = world.position;
    },
 
});
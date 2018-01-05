var Basket = require('Basket');
var Ball = require('Ball');
var Shadow = require('Shadow');
var Score = require('Score');
var SoundManager = require('SoundManager');
var TimeManager = require('TimeManager');

cc.Class({
    extends: cc.Component,

    properties: {
        ball: cc.Prefab,
        shadow: cc.Prefab,
        basket: Basket,
        startPosition: cc.Vec2,
        score: Score,
        soundMng: SoundManager,
        timeMng: TimeManager,
    },

    onLoad: function () {
        this.newBall();
        this.initCollisionSys();
        this.basket.init(this);
        this.score.init(this);
        this.timeMng.init(this);

        this.timeMng.oneSchedule();
        
        this.score.setScore(0);
    },

    // 初始化碰撞系统
    initCollisionSys: function(){
        this.collisionManager = cc.director.getCollisionManager();
        this.collisionManager.enabled = true;
        //this.collisionManager.enabledDebugDraw = true// 开启debug绘制

        cc.director.setDisplayStats(true);
    },

    // 生成篮球
    newBall: function(){
        var child = null;
        if(cc.pool.hasObject(Ball)){
            child = cc.pool.getFromPool(Ball).node;
        }else{
            child = cc.instantiate(this.ball);
        }
        
        child.setLocalZOrder(1);
        this.node.addChild(child);
        child.setPosition(this.startPosition);
        var ballComp = child.getComponent('Ball');
        ballComp.init(this); // 启动篮球逻辑
        this.newShadow(ballComp);
    },

    newShadow: function(ball){
        var ballShadow = null;
        if(cc.pool.hasObject(Shadow)){
            ballShadow = cc.pool.getFromPool(Shadow).node;
        }else{
            ballShadow = cc.instantiate(this.shadow);
        }

        ballShadow.setLocalZOrder(2);
        this.node.addChild(ballShadow);
        ballShadow.setPosition(this.startPosition);
        var shadowComp = ballShadow.getComponent('Shadow')
        ball.bindShadow(shadowComp);
        shadowComp.init(this); // 启动影子逻辑
    },

    startMoveBasket: function(){
        this.basket.startMove();
    },

    stopMoveBasket: function(){
        this.basket.stopMove();
    },

    // 游戏结束
    gameOver: function(){
        this.score.setScore(0);
    },
   
});

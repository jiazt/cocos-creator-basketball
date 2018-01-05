cc.Class({
    extends: cc.Component,

    properties: {
        toggleAudio: true,
        
        scoreAudio: {
            default: null,
            url: cc.AudioClip
        },
        
        ballInAudio: {
            default: null,
            url: cc.AudioClip
        },
        
        hitBoardInAudio: {
            default: null,
            url: cc.AudioClip
        },
        
        hitBoardAudio: {
            default: null,
            url: cc.AudioClip
        },
        
        flyAudio: {
            default: null,
            url: cc.AudioClip
        },
    },

    init: function (game) {
        
    },
    
    // 播放得分音效
    playScoreSound: function () {
        this.playSound(this.scoreAudio);
    },
    
    // 播放直接进球音效
    playBallInSound: function () {
        this.playSound(this.ballInAudio);
    },
    
    // 播放打框音效
    playHitBoardSound: function () {
        this.playSound(this.hitBoardAudio);
    },
    
    // 播放打框进球音效
    playHitBoardInSound: function () {
        this.playSound(this.hitBoardInAudio);
    },
    
    // 播放投掷音效
    playFlySound: function () {
        this.playSound(this.flyAudio);
    },
    
    // 播放音效(不循环)
    playSound: function (sound) {
        if(this.toggleAudio){
            cc.audioEngine.playEffect(sound, false);
        }
    },
});

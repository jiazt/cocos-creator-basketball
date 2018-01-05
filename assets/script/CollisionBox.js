cc.Class({
    extends: cc.Component,

    properties: {
    },

    // 获取刚体左边界
    getLeft: function(){
        return this.node.x - this.node.width/2;
    },

    // 获取刚体右边界
    getRight: function(){
        return this.node.x + this.node.width/2;
    },
    
    // 获取刚体的世界坐标
    getWorldPoint: function(target){
        return target.convertToWorldSpaceAR(this.node.getPosition());
    },

});

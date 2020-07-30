import { createScopedThreejs } from "../util/three";
import * as MODEL from "../js/model";
import * as SPRITE from "../js/sprite";
import navigate from "../js/astar";
import initData from "../js/data";
import beaconUpdate from "../js/ibeacon";
import gps from "../js/gps";
import accChange from "../js/motionDetection";
import { autoMoving } from "../js/simNavigate";
import * as TWEEN from "../util/tween.min"; //动画操作
import { showOrientationText } from "../js/directionNotify";
import userControl from "../js/user";

var app = getApp();
var main = {};
main.initMap = function (that) {
    //分别获取文字精灵、图片精灵和地图canvas并创建相应处理Threejs实例
    wx.createSelectorQuery()
        .select("#sprite")
        .node()
        .exec((res) => {
            app.canvasSprite = res[0].node;
        });
    wx.createSelectorQuery()
        .select("#map")
        .node()
        .exec((res) => {
            const canvas = res[0].node;
            const THREE = createScopedThreejs(canvas);
            app.canvas = canvas;
            app.THREE = THREE;
            MODEL.renderModel(canvas, THREE);
            MODEL.initPath();

            let renderer = MODEL.getRenderer();
            let scene = MODEL.getScene();
            let camera = MODEL.getCamera();
            navRender();
            
            function navRender() {
                renderer.clear();
                let nowPoint = app.localization.nowBluePosition;
                let lastPoint = app.localization.lastBluePosition;
                let systemControl = app.systemControl;
                if (
                    systemControl.state === "navigating" ||
                    systemControl.state === "previewing"
                ) {
                    app.pathControl.textures.forEach(function (item) {
                        item.offset.x -= 0.05;
                    });
                }
                if (systemControl.state === "navigating") {
                    let text = showOrientationText();
                    if (text) {
                        that.setData({
                            navInformation: text,
                        });
                    }
                }else {
                    if( nowPoint.x != lastPoint.x || nowPoint.y != lastPoint.y || nowPoint.z != lastPoint.z) {
                        userControl.changePosition(nowPoint.x ,nowPoint.y ,nowPoint.z) 
                        lastPoint = nowPoint;
                    }
                }


                TWEEN.update();
                renderer.render(scene, camera);
                renderer.clearDepth();
                canvas.requestAnimationFrame(navRender);
            }
        });

    /** 初始化授权 */
    wx.getSetting({
        success(res) {
            if (!res.authSetting["scope.userLocation"]) {
                wx.authorize({
                    scope: "scope.userLocation",
                    success() {
                        // 用户已经同意小程序使用定位功能
                        wx.getLocation();
                    },
                });
            }
        },
    });
};

main.cameraExchange = function (index) {
    MODEL.cameraExchange(index);
};
main.displayAllFloor = function () {
    MODEL.displayAllFloor();
};
main.onlyDisplayFloor = function (floor) {
    MODEL.onlyDisplayFloor(floor);
    SPRITE.loadTargetTextByFloor(MODEL.getScene(), floor);
};
main.selectObj = function (index) {
    return MODEL.selectObj(index);
};
main.setStartPoint = function () {
    MODEL.showSprite(app.spriteControl.sprite.position, "start");
};
main.setEndPoint = function () {
    MODEL.showSprite(app.spriteControl.sprite.position, "end");
};
main.backToMe = function (me) {
    MODEL.backToMe(me);
};

/** ibeacon 打开测试 */
main.startBeaconDiscovery = function () {
    return new Promise((resolve, reject) => {
        wx.startBeaconDiscovery({
            uuids: ["FDA50693-A4E2-4FB1-AFCF-C6EB07647825"],
            success: (result) => {
                console.log("开始扫描设备");
                wx.showToast({
                    title: "扫描成功",
                    icon: "none",
                    image: "",
                    duration: 1500,
                    mask: true,
                });
                beaconUpdate();
                var data = {
                    status: "success",
                    showBlueStatus: false,
                };
                resolve(data);
            },
            fail: (res) => {
                if (res.errCode === 11000 || res.errCode === 11001) {
                    var data = {
                        status: "error",
                        showBlueStatus: true,
                    };
                    resolve(data);
                }
            },
        });
    });
};

//获取当前经纬度坐标,用完必须关闭
main.setPoibyLngLat = function () {
    gps.getLocationChange();
};
//关闭GPS并清除定时器
main.closeGPS = function () {
    gps.closeGPS();
};

/** 步数改变监测 */
main.stepChange = function (that) {
    accChange(that);
};

/** 获得起点和终点信息后获得导航路径 */
main.navigateInit = function () {
    return navigate(
        app.nodeList,
        app.routeClass.startPoint,
        app.routeClass.endPoint
    );
};
/** 当前点设定 */
main.setCurClick = function (point) {
    MODEL.setCurClick(point);
};

/** 起点设定 */
main.startClick = function (point) {
    MODEL.setStartClick(point);
};

/** 终点设定 */
main.endClick = function (point) {
    MODEL.setEndClick(point);
};

/** 起点设定 */
main.startMe = function () {
    MODEL.setStartMe();
};
/**
 * @description 通过data.js 向服务器获取数据集、初始化数据
 * @date 2020-07-23
 * @return 格式化后的数据 [[],[]]
 */
main.getBuildingData = () => {
    return new Promise((resolve, reject) => {
        initData.then((res) => {
            resolve(res);
        });
    });
};

main.autoMove = (path) => {
    autoMoving(path);
};

main.stopNav = () => {
    MODEL.stopNav();
}


export default main;

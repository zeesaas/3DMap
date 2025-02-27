import * as TWEEN from "../util/tween.min"; //动画操作
import * as MODEL from "../js/model";
import userControl from "./user"; //用户贴图
import * as SPRITE from "./sprite";
import * as util from "../util/util";

var app = getApp();

/**
 * @description 模拟导航当中的自己转弯和向前移动
 * @date 2020-07-24
 * @export
 * @param {*} path
 * @returns
 */
export function autoMoving(path) {
    /** 如果路径当中只有两点和一点的情况 */
    if (path.length < 1) {
        return;
    } else if (path.length < 2) {
        userControl.changePosition(path[0].x, path[0].y, null, "direction");
        return;
    }
    var me = app.me;
    var camera = MODEL.getCamera();
    var controls = MODEL.getControl();

    let THREE = app.THREE;
    /** 首先从我的当前位置移动到导航路径的起点 */

    var neTween = new TWEEN.Tween(me.position);
    neTween.to(
        {
            x: path[0].x,
            y: path[0].y,
            z: path[0].z + app.map_conf.int_userHeight,
        },
        1000
    );
    neTween.onStop(move(1));

    neTween.start();

    let newT = { x: path[0].x, y: path[0].y, z: path[0].z };
    let newP = { x: path[0].x, y: path[0].y + 15, z: path[0].z + 15 };
    MODEL.animateCamera(camera.position, controls.target, newP, newT);
    let floor = path[0].z / app.map_conf.layerHeight + 1;
    MODEL.displayOneFloor(floor);

    /**
     * @description 在导航路径上图标向前移动
     * @date 2020-07-24
     * @param {*} i
     * @returns
     */
    function move(i) {
        if (app.systemControl.state != "navigating") {
            return;
        }
        let oldT = { x: path[i - 1].x, y: path[i - 1].y, z: path[i - 1].z + 5 };
        let oldP;
        if (i > 1) {
            oldP = {
                x: path[i - 2].x,
                y: path[i - 2].y,
                z: path[i - 2].z + 10,
            };
        } else {
            camera.fov = 90;
            camera.updateProjectionMatrix();

            oldP = { x: path[0].x, y: path[0].y, z: path[0].z + 80 };
        }
        if (path[i].z - path[i - 1].z != 0) {
            let floor = path[i].z / app.map_conf.layerHeight + 1;
            MODEL.displayOneFloor(floor);
        }

        let newT = { x: path[i].x, y: path[i].y, z: path[i].z + 5 };
        let newP = {
            x: path[i - 1].x,
            y: path[i - 1].y,
            z: path[i - 1].z + 10,
        };
        MODEL.animateCamera(oldP, oldT, newP, newT);

        if (i === path.length) {
            return;
        }

        me.position.x = path[i - 1].x;
        me.position.y = path[i - 1].y;
        me.position.z = path[i - 1].z + app.map_conf.int_userHeight;
        new TWEEN.Tween(me.position)
            .to(
                {
                    x: path[i].x,
                    y: path[i].y,
                    z: path[i].z + app.map_conf.int_userHeight,
                },
                1000
            )
            .onStart(function () {})
            .onComplete(function () {
                //结束时朝向和路的方向一致
                rotate(i);
            })
            .start();
    }

    /**
     * @description 旋转当前方向
     * @date 2020-07-24
     * @param {*} i
     * @returns
     */
    function rotate(i) {
        if (i === path.length - 1) {
            return;
        }

        let angle = util.figureVectorAngle(
            new THREE.Vector2(0, 1),
            new THREE.Vector2(path[i + 1].x - path[i].x, path[i + 1].y - path[i].y)
        );

        if (angle < 0) {
            angle += Math.PI * 2;
        }

        let A = null;
        if (angle - me.rotation.z > Math.PI) {
            A = new TWEEN.Tween(me.rotation)
                .to(
                    {
                        x: me.rotation.x,
                        y: me.rotation.y,
                        z: 0,
                    },
                    (Math.abs(me.rotation.z - 0) / Math.PI) * 1000
                )
                .onStart(function () {})
                .onComplete(function () {
                    me.rotation.z = Math.PI * 2;

                    rotate(i);
                });
        } else if (angle - me.rotation.z < -Math.PI) {
            A = new TWEEN.Tween(me.rotation)
                .to(
                    {
                        x: me.rotation.x,
                        y: me.rotation.y,
                        z: Math.PI * 2,
                    },
                    (Math.abs(me.rotation.z - Math.PI * 2) / Math.PI) * 1000
                )
                .onComplete(function () {
                    me.rotation.z = 0;
                    rotate(i);
                })
                .onStart(function () {});
        } else {
            A = new TWEEN.Tween(me.rotation)
                .to(
                    {
                        x: me.rotation.x,
                        y: me.rotation.y,
                        z: angle,
                    },
                    (Math.abs(me.rotation.z - angle) / Math.PI) * 1000
                )
                .onComplete(function () {
                    move(i + 1);
                })
                .onStart(function () {
                    if (Math.abs(me.rotation.z - angle) === 0) {
                    }
                });
        }
        if (A !== null) {
            A.start();
        } else {
            // B.start();
        }
    }
}

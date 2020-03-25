///<reference types="./Libraries/FudgeCore.js"/>
///<reference types="./Libraries/cannon.min.js"/>

namespace FudgePhysics_Communication {
    import f = FudgeCore;

    
    window.addEventListener("load", init);
    const app: HTMLCanvasElement = document.querySelector("canvas");
    let viewPort: f.Viewport;
    let hierarchy: f.Node;
    let fps: number;
    const times: number[] = [];
    let cubes: f.Node[] = new Array();
    let fpsDisplay: HTMLElement = document.querySelector("h2#FPS");
    let bodies = new Array();

    let world = new CANNON.World();

    function init(_event: Event): void {
      f.Debug.log(app);
      f.RenderManager.initialize();
      hierarchy = new f.Node("Scene");
     
      let ground: f.Node = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2 , 0.2, 1))), new f.MeshCube());
      let cmpGroundMesh: f.ComponentTransform = ground.getComponent(f.ComponentTransform);
  
      cmpGroundMesh.local.scale(new f.Vector3(10, 0.3, 10));
      hierarchy.appendChild(ground);

      cubes[0] = createCompleteMeshNode("Cube_1", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0 , 0, 1))), new f.MeshCube());
      let cmpCubeTransform: f.ComponentTransform = cubes[0].getComponent(f.ComponentTransform);
      cmpCubeTransform.local.translate(new f.Vector3(0, 2, 0));
      cmpCubeTransform.local.rotateX(45, true);
      let cmpCubeMesh: f.ComponentMesh = cubes[0].getComponent(f.ComponentMesh);
      cmpCubeMesh.pivot.rotateX(45, true);
      hierarchy.appendChild(cubes[0]);

      cubes[1] = createCompleteMeshNode("Cube_2", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0 , 0, 1))), new f.MeshCube());
      let cmpCubeTransform2: f.ComponentTransform = cubes[1].getComponent(f.ComponentTransform);
      cmpCubeTransform2.local.translate(new f.Vector3(0, 3.5, 0.4));
      hierarchy.appendChild(cubes[1]);

      let cmpLight: f.ComponentLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
      cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
      hierarchy.addComponent(cmpLight);

      let cmpCamera: f.ComponentCamera = new f.ComponentCamera();
      cmpCamera.backgroundColor = f.Color.CSS("GREY");
      cmpCamera.pivot.translate(new f.Vector3(2, 2, 10));
      cmpCamera.pivot.lookAt(f.Vector3.ZERO());

      //Physics CANNON
      world.gravity = new CANNON.Vec3(0, -9.81, 0);
      initializePhysicsBody(ground.getComponent(f.ComponentTransform), 0, 0);
      initializePhysicsBody(cmpCubeTransform, 1, 1);
      initializePhysicsBody(cmpCubeTransform2, 1, 2);
      //EndPhysics

      viewPort = new f.Viewport();
      viewPort.initialize("Viewport", hierarchy, cmpCamera, app);

      viewPort.showSceneGraph();

      f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
      f.Loop.start();
    }


    function update(): void {
      
      //Physics CANNON
      world.step(f.Loop.timeFrameGame / 1000);
      applyPhysicsBody(cubes[0].getComponent(f.ComponentTransform), 1);
      applyPhysicsBody(cubes[1].getComponent(f.ComponentTransform), 2);
      //EndPhysics

      viewPort.draw();
      measureFPS();
    }

    function measureFPS(): void {
        window.requestAnimationFrame(() => {
            const now = performance.now();
            while (times.length > 0 && times[0] <= now - 1000) {
              times.shift();
            }
            times.push(now);
            fps = times.length;
            fpsDisplay.textContent = "FPS: " + fps.toString(); 
          });
    }

    function createCompleteMeshNode(_name: string, _material: f.Material, _mesh: f.Mesh): f.Node {
      let node: f.Node = new f.Node(_name);
      let cmpMesh: f.ComponentMesh = new f.ComponentMesh(_mesh);
      let cmpMaterial: f.ComponentMaterial = new f.ComponentMaterial(_material);
  
      let cmpTransform: f.ComponentTransform = new f.ComponentTransform();
      node.addComponent(cmpMesh);
      node.addComponent(cmpMaterial);
      node.addComponent(cmpTransform);
  
      return node;
  }

    function initializePhysicsBody(_cmpTransform: f.ComponentTransform, massVal: number, no: number) {
    let scale: CANNON.Vec3 = new CANNON.Vec3(_cmpTransform.local.scaling.x, _cmpTransform.local.scaling.y, _cmpTransform.local.scaling.z);
    let pos: CANNON.Vec3 =  new CANNON.Vec3(_cmpTransform.local.translation.x, _cmpTransform.local.translation.y, _cmpTransform.local.translation.z)

    bodies[no] = new CANNON.Body({
      mass: massVal, // kg
      position: pos, // m
      shape: new CANNON.Box(scale)
   });
    world.addBody(bodies[no]);
  }


    function applyPhysicsBody(_cmpTransform: f.ComponentTransform, no: number): void {

      let tmpPosition: f.Vector3 = new f.Vector3(bodies[no].position.x, bodies[no].position.y, bodies[no].position.z);
  
      let tmpRotation: f.Vector3 =  makeRotationFromQuaternion(bodies[no].quaternion); //, new f.Vector3(0, 0, 1)); //f.Vector3.ONE(1)); //_cmpTransform.local.rotation);
//      tmpRotation = transformVectorByQuaternion(_cmpTransform.local.rotation, bodies[no].quaternion);

      let tmpMatrix: f.Matrix4x4 = f.Matrix4x4.TRANSLATION(tmpPosition);
      let tmpRotMatrix: f.Matrix4x4 = new f.Matrix4x4();
     // f.Debug.log(tmpRotation.x);
      tmpRotMatrix.rotateX(tmpRotation.x);
      tmpRotMatrix.rotateY(tmpRotation.y);
      tmpRotMatrix.rotateZ(tmpRotation.z);
     // f.Debug.log(tmpRotMatrix);
      tmpMatrix.multiply(tmpRotMatrix);

      _cmpTransform.local.set(tmpMatrix);
      //_cmpTransform.local.rotate(tmpRotation, false);
      
      let cmpMesh: f.ComponentMesh = _cmpTransform.getContainer().getComponent(f.ComponentMesh);
      cmpMesh.pivot.rotation.set(tmpRotation.x, tmpRotation.y, tmpRotation.z);
      //f.Debug.log(tmpRotation);
    }

  
    function makeRotationFromQuaternion( q: any, targetAxis: f.Vector3 = new f.Vector3(1, 1, 1) ): f.Vector3 {
      let angles: f.Vector3 = new f.Vector3();

      // roll (x-axis rotation)
      let sinr_cosp: number = 2 * (q.w * q.x + q.y * q.z);
      let cosr_cosp: number = 1 - 2 * (q.x * q.x + q.y * q.y);
      angles.x = Math.atan2(sinr_cosp, cosr_cosp);
  
      // pitch (y-axis rotation)
      let sinp: number = 2 * (q.w * q.y - q.z * q.x);
      if (Math.abs(sinp) >= 1)
          angles.y = copysign(Math.PI / 2, sinp); // use 90 degrees if out of range
      else
          angles.y = Math.asin(sinp);
  
      // yaw (z-axis rotation)
      let siny_cosp: number = 2 * (q.w * q.z + q.x * q.y);
      let cosy_cosp: number = 1 - 2 * (q.y * q.y + q.z * q.z);
      angles.z = Math.atan2(siny_cosp, cosy_cosp);
f.Debug.log(angles);
      return angles;
  }

    function transformVectorByQuaternion(value: f.Vector3,  rotation: any): f.Vector3 {
      let angles: f.Vector3;

      let x2: number = rotation.x + rotation.x;
      let y2: number = rotation.y + rotation.y;
      let z2: number = rotation.z + rotation.z;
 
      let wx2: number = rotation.w * x2;
      let wy2: number = rotation.w * y2;
      let wz2: number = rotation.w * z2;
      let xx2: number = rotation.x * x2;
      let xy2: number = rotation.x * y2;
      let xz2: number = rotation.x * z2;
      let yy2: number = rotation.y * y2;
      let yz2: number = rotation.y * z2;
      let zz2: number = rotation.z * z2;

      angles = new f.Vector3(
              value.x * (1.0 - yy2 - zz2) + value.y * (xy2 - wz2) + value.z * (xz2 + wy2),
              value.x * (xy2 + wz2) + value.y * (1.0 - xx2 - zz2) + value.z * (yz2 - wx2),
              value.x * (xz2 - wy2) + value.y * (yz2 + wx2) + value.z * (1.0 - xx2 - yy2));
      f.Debug.log(angles);
      return angles;
        }
 
    function copysign(a: number, b: number): number {
    return b < 0 ? -Math.abs(a) : Math.abs(a);
  }

}
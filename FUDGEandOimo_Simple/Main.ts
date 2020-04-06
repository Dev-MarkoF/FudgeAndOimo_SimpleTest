///<reference types="./Libraries/FudgeCore.js"/>
///<reference types="./Libraries/oimo.min.js"/>

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

  let world = new OIMO.World({
    timestep: 1 / 60,
    iterations: 8,
    broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
    worldscale: 1, // scale full world 
    random: true,  // randomize sample
    info: false,   // calculate statistic or not
    gravity: [0, -9.8, 0]
  });


  function init(_event: Event): void {
    f.Debug.log(app);
    f.RenderManager.initialize();
    hierarchy = new f.Node("Scene");

    let ground: f.Node = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube());
    let cmpGroundMesh: f.ComponentTransform = ground.getComponent(f.ComponentTransform);

    cmpGroundMesh.local.scale(new f.Vector3(10, 0.3, 10));
    hierarchy.appendChild(ground);

    cubes[0] = createCompleteMeshNode("Cube_1", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
    let cmpCubeTransform: f.ComponentTransform = cubes[0].getComponent(f.ComponentTransform);
    cmpCubeTransform.local.translate(new f.Vector3(0, 2, 0));
    cubes[0].mtxWorld.rotateX(45);
    hierarchy.appendChild(cubes[0]);

    cubes[1] = createCompleteMeshNode("Cube_2", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
    let cmpCubeTransform2: f.ComponentTransform = cubes[1].getComponent(f.ComponentTransform);
    cmpCubeTransform2.local.translate(new f.Vector3(0, 3.5, 0.405));
    hierarchy.appendChild(cubes[1]);

    let cmpLight: f.ComponentLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
    cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
    hierarchy.addComponent(cmpLight);

    let cmpCamera: f.ComponentCamera = new f.ComponentCamera();
    cmpCamera.backgroundColor = f.Color.CSS("GREY");
    cmpCamera.pivot.translate(new f.Vector3(2, 2, 10));
    cmpCamera.pivot.lookAt(f.Vector3.ZERO());

    //Physics OIMO
    initializePhysicsBody(ground.getComponent(f.ComponentTransform), false, 0);
    initializePhysicsBody(cmpCubeTransform, true, 1);
    initializePhysicsBody(cmpCubeTransform2, true, 2);
    //EndPhysics

    viewPort = new f.Viewport();
    viewPort.initialize("Viewport", hierarchy, cmpCamera, app);

    viewPort.showSceneGraph();

    f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
    f.Loop.start();
  }

  function update(): void {

    //Physics OIMO
    world.step();
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

  function initializePhysicsBody(_cmpTransform: f.ComponentTransform, dynamic: boolean, no: number) {
    let node: f.Node = _cmpTransform.getContainer();

    bodies[no] = world.add({
      type: "box", // type of shape : sphere, box, cylinder 
      size: [_cmpTransform.local.scaling.x, _cmpTransform.local.scaling.y, _cmpTransform.local.scaling.z], // size of shape
      pos: [_cmpTransform.local.translation.x, _cmpTransform.local.translation.y, _cmpTransform.local.translation.z], // start position in degree
      rot: [node.mtxWorld.rotation.x, node.mtxWorld.rotation.y, node.mtxWorld.rotation.z], // start rotation in degree
      move: dynamic, // dynamic or statique
      density: 1,
      friction: 1,
      restitution: 0,
      belongsTo: 1, // The bits of the collision groups to which the shape belongs.
      collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
    });
  }

  function applyPhysicsBody(_cmpTransform: f.ComponentTransform, no: number): void {
    let node: f.Node = _cmpTransform.getContainer();
    let tmpPosition: f.Vector3 = new f.Vector3(bodies[no].getPosition().x, bodies[no].getPosition().y, bodies[no].getPosition().z);

    let rotMutator: f.Mutator = {};
    let tmpRotation: f.Vector3 = makeRotationFromQuaternion(bodies[no].getQuaternion(), node.mtxWorld.rotation);
    //f.Debug.log(tmpRotation);
    rotMutator["rotation"] = tmpRotation;
    //node.mtxLocal.rotateX(tmpRotation.x);
    node.mtxLocal.mutate(rotMutator);
    rotMutator["translation"] = tmpPosition;
    node.mtxLocal.mutate(rotMutator);
  }


  function makeRotationFromQuaternion(q: any, targetAxis: f.Vector3 = new f.Vector3(1, 1, 1)): f.Vector3 {
    let angles: f.Vector3 = new f.Vector3();

    // roll (x-axis rotation)
    let sinr_cosp: number = 2 * (q.w * q.x + q.y * q.z);
    let cosr_cosp: number = 1 - 2 * (q.x * q.x + q.y * q.y);
    angles.x = Math.atan2(sinr_cosp, cosr_cosp) * 60;

    // pitch (y-axis rotation)
    let sinp: number = 2 * (q.w * q.y - q.z * q.x);
    if (Math.abs(sinp) >= 1)
      angles.y = copysign(Math.PI / 2, sinp) * 60; // use 90 degrees if out of range
    else
      angles.y = Math.asin(sinp);

    // yaw (z-axis rotation)
    let siny_cosp: number = 2 * (q.w * q.z + q.x * q.y);
    let cosy_cosp: number = 1 - 2 * (q.y * q.y + q.z * q.z);
    angles.z = Math.atan2(siny_cosp, cosy_cosp) * 60;
    f.Debug.log(angles);
    return angles;
  }

  function copysign(a: number, b: number): number {
    return b < 0 ? -Math.abs(a) : Math.abs(a);
  }

}
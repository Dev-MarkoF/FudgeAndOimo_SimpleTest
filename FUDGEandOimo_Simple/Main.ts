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
     
      let ground: f.Node = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2 , 0.2, 1))), new f.MeshCube());
      let cmpGroundMesh: f.ComponentMesh = ground.getComponent(f.ComponentMesh);
  
      cmpGroundMesh.pivot.scale(new f.Vector3(10, 0.3, 10));
      hierarchy.appendChild(ground);

      cubes[0] = createCompleteMeshNode("Cube_1", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0 , 0, 1))), new f.MeshCube());
      let cmpCubeTransform: f.ComponentTransform = cubes[0].getComponent(f.ComponentTransform);
      cmpCubeTransform.local.translate(new f.Vector3(0, 2, 0));
      hierarchy.appendChild(cubes[0]);

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

    bodies[no] = world.add({ 
      type:"box", // type of shape : sphere, box, cylinder 
      size: [_cmpTransform.local.scaling.x, _cmpTransform.local.scaling.y, _cmpTransform.local.scaling.z], // size of shape
      pos: [_cmpTransform.local.translation.x, _cmpTransform.local.translation.y, _cmpTransform.local.translation.z], // start position in degree
      rot: [_cmpTransform.local.rotation.x, _cmpTransform.local.rotation.y, _cmpTransform.local.rotation.z], // start rotation in degree
      move: dynamic, // dynamic or statique
      density: 1,
      friction: 0.2,
      restitution: 0.2,
      belongsTo: 1, // The bits of the collision groups to which the shape belongs.
      collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
    });
  }

    function applyPhysicsBody(_cmpTransform: f.ComponentTransform, no: number): void{
      let tmpPosition: f.Vector3 = new f.Vector3(bodies[no].getPosition().x, bodies[no].getPosition().y, bodies[no].getPosition().z);
      let tmpMatrix: f.Matrix4x4 = f.Matrix4x4.TRANSLATION(tmpPosition);
      _cmpTransform.local.set(tmpMatrix);
    }

  

 

}
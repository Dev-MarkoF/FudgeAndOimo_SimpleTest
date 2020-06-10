///<reference types="./Libraries/ammo.js"/>

let fps: number;
let fpsDisplay: HTMLElement = document.querySelector("h2#FPS");
const times: number[] = [];
let physicsWorld;
let rigidBodies = [], tmpTrans;

Ammo().then(startAmmo);

function startAmmo(): void {
  setupPhysicsWorld();
  tmpTrans = new Ammo.btTransform();

  createGroundAndSphere();
}

function setupPhysicsWorld(): void {

  let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
    dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
    overlappingPairCache = new Ammo.btDbvtBroadphase(),
    solver = new Ammo.btSequentialImpulseConstraintSolver();

  physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
  physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
  //Loop();
  setInterval(Loop, 16.6); //ca. 60fps fixed
}

function Loop() {
  updatePhysics(16.6);
  // console.log("loop");
  //requestAnimationFrame(Loop);
}

function updatePhysics(deltaTime: number) {

  // Step world
  physicsWorld.stepSimulation(deltaTime, 10);

  // Update rigid bodies
  for (let i = 0; i < rigidBodies.length; i++) {
    let obj = rigidBodies[i];
    let ms = obj.getMotionState();
    ms.getWorldTransform(tmpTrans);
    let p = tmpTrans.getOrigin();
    let q = tmpTrans.getRotation();
    console.log(p.y());
  }

}

function createGroundAndSphere() {
  let pos = { x: 0, y: 0, z: 0 };
  let scale = { x: 50, y: 2, z: 50 };
  let quat = { x: 0, y: 0, z: 0, w: 1 };
  let mass = 0;

  let transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  let motionState = new Ammo.btDefaultMotionState(transform);

  let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
  colShape.setMargin(0.05);

  let localInertia = new Ammo.btVector3(0, 0, 0);
  colShape.calculateLocalInertia(mass, localInertia);

  let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
  let body = new Ammo.btRigidBody(rbInfo);


  physicsWorld.addRigidBody(body);

  pos = { x: 0, y: 20, z: 0 };
  let radius = 2;
  quat = { x: 0, y: 0, z: 0, w: 1 };
  mass = 1;
  transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  motionState = new Ammo.btDefaultMotionState(transform);

  colShape = new Ammo.btSphereShape(radius);
  colShape.setMargin(0.05);

  localInertia = new Ammo.btVector3(0, 0, 0);
  colShape.calculateLocalInertia(mass, localInertia);

  rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
  body = new Ammo.btRigidBody(rbInfo);

  rigidBodies.push(body);
  physicsWorld.addRigidBody(body);
}


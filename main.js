import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* =========================================================
   ANATOMICA — clinical interactive 3D body atlas (v2)
   Proper upright mannequin: head/torso/arms/legs as a real
   silhouette, organs nested inside, layer toggles for
   Skeletal / Organs / Surface (muscle shell)
   ========================================================= */

// ---------- Organ data ----------
const ORGANS = {
  brain: {
    name: 'Brain', code: '014', sys: 'NER', system: 'Nervous System', color: 0xffb3c6,
    desc: 'The brain is the soft, wrinkly control center of the body, housed safely inside the skull.',
    uses: ['Controls thinking, memory and emotions', 'Sends signals to move every muscle', 'Processes what you see, hear, smell and feel', 'Keeps your heartbeat and breathing going'],
    stats: { 'Avg. Mass': '1.4 kg', 'Avg. Power Draw': '23 W', 'Neuron Count': '~86 billion' },
    fact: 'Your brain can generate about 23 watts of power — enough to light a small bulb!'
  },
  heart: {
    name: 'Heart', code: '021', sys: 'CIR', system: 'Circulatory System', color: 0xff4d5e,
    desc: 'A muscular pump about the size of your fist, sitting slightly left of center in your chest.',
    uses: ['Pumps blood all around the body', 'Delivers oxygen and nutrients to cells', 'Carries away waste like carbon dioxide', 'Beats around 100,000 times every day'],
    stats: { 'Avg. Mass': '300 g', 'Beats / Day': '~100,000', 'Output / Day': '~7,500 L' },
    fact: 'In an average lifetime, the heart beats over 2.5 billion times without ever taking a rest.'
  },
  lungLeft: {
    name: 'Left Lung', code: '032', sys: 'RES', system: 'Respiratory System', color: 0xff9eb5,
    desc: 'A spongy, air-filled organ in the chest. The left lung is a little smaller to make room for the heart.',
    uses: ['Brings oxygen into the body when you breathe in', 'Removes carbon dioxide when you breathe out', 'Helps you talk, sing and shout', 'Filters small blood clots and air bubbles'],
    stats: { 'Lobes': '2', 'Surface Area': '~35 m² each', 'Breaths / Day': '~20,000 total' },
    fact: 'If you spread your lungs out flat, they would cover roughly the size of a tennis court!'
  },
  lungRight: {
    name: 'Right Lung', code: '033', sys: 'RES', system: 'Respiratory System', color: 0xff9eb5,
    desc: 'The right lung has three sections (lobes) while the left has two. Both work to exchange gases.',
    uses: ['Takes in fresh oxygen with every breath', 'Pushes out waste gas (carbon dioxide)', 'Works with the diaphragm muscle to breathe', 'Warms and moistens the air you inhale'],
    stats: { 'Lobes': '3', 'Surface Area': '~35 m² each', 'Breaths / Day': '~20,000 total' },
    fact: 'You breathe about 20,000 times a day — mostly without ever thinking about it.'
  },
  liver: {
    name: 'Liver', code: '041', sys: 'DIG', system: 'Digestive System', color: 0x8b4a2b,
    desc: 'The largest internal organ, a reddish-brown powerhouse sitting on the right side of the belly.',
    uses: ['Filters and cleans toxins from the blood', 'Stores energy as sugar and vitamins', 'Makes bile to help digest fatty foods', 'Helps blood clot when you get hurt'],
    stats: { 'Avg. Mass': '1.5 kg', 'Known Functions': '500+', 'Regrowth': 'Full, from a fragment' },
    fact: 'The liver is the only human organ that can fully regrow itself from just a small piece.'
  },
  stomach: {
    name: 'Stomach', code: '042', sys: 'DIG', system: 'Digestive System', color: 0xc46fa5,
    desc: 'A stretchy, J-shaped bag that churns and mixes the food you swallow.',
    uses: ['Breaks down food with strong acid', 'Mashes food into a soupy mixture', 'Kills harmful germs in your meals', 'Slowly releases food into the intestines'],
    stats: { 'Empty Volume': '~75 mL', 'Full Volume': '~1 L', 'Acid pH': '1.5 – 3.5' },
    fact: 'Stomach acid is so strong it could dissolve metal — but a fresh lining protects you daily.'
  },
  kidneyLeft: {
    name: 'Left Kidney', code: '051', sys: 'URI', system: 'Urinary System', color: 0x9c5b3b,
    desc: 'A bean-shaped filter sitting toward your back. The left one usually sits a bit higher.',
    uses: ['Filters waste and extra water from blood', 'Makes urine to remove that waste', 'Balances salts and minerals in the body', 'Helps control blood pressure'],
    stats: { 'Avg. Mass': '~150 g', 'Filtration Rate': '~120 mL/min', 'Blood Filtered / Day': 'Entire supply ×30' },
    fact: 'Your kidneys filter all the blood in your body about 30 times every single day.'
  },
  kidneyRight: {
    name: 'Right Kidney', code: '052', sys: 'URI', system: 'Urinary System', color: 0x9c5b3b,
    desc: 'The right kidney sits slightly lower because the large liver rests above it.',
    uses: ['Cleans the blood of toxins', 'Keeps water and salt in balance', 'Produces hormones for healthy bones', 'Helps make red blood cells'],
    stats: { 'Avg. Mass': '~150 g', 'Position': 'Slightly lower than left', 'Min. Function Needed': '1 kidney' },
    fact: 'You can live a healthy life with just one working kidney!'
  },
  intestine: {
    name: 'Intestines', code: '044', sys: 'DIG', system: 'Digestive System', color: 0xf2a07b,
    desc: 'Long, coiled tubes below the stomach where most digestion and absorption happen.',
    uses: ['Absorbs nutrients from digested food', 'Soaks up water to keep you hydrated', 'Hosts helpful bacteria for digestion', 'Forms and removes solid waste'],
    stats: { 'Small Intestine Length': '~6 m', 'Large Intestine Length': '~1.5 m', 'Transit Time': '24–72 hrs' },
    fact: 'The small intestine alone is about 6 metres long — longer than a giraffe is tall!'
  },
  skeleton: {
    name: 'Skeleton', code: '001', sys: 'SKE', system: 'Skeletal System', color: 0xeae6da,
    desc: 'The strong inner framework of 206 bones that gives the body its shape.',
    uses: ['Supports the body and gives it structure', 'Protects organs like the brain and heart', 'Works with muscles so you can move', 'Makes blood cells inside the bones'],
    stats: { 'Adult Bone Count': '206', 'Newborn Bone Count': '~300', 'Hardest Bone': 'Enamel (teeth)' },
    fact: 'Babies are born with about 300 bones — many fuse together as they grow up.'
  }
};

const LAYER_OF = {
  brain: 'organs', heart: 'organs', lungLeft: 'organs', lungRight: 'organs',
  liver: 'organs', stomach: 'organs', kidneyLeft: 'organs', kidneyRight: 'organs',
  intestine: 'organs', skeleton: 'skeletal'
};

// ---------- Scene setup ----------
const app = document.getElementById('app');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeef1f4);
scene.fog = new THREE.Fog(0xeef1f4, 18, 36);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
const HOME_CAM = new THREE.Vector3(0, 1.1, 10.5);
camera.position.copy(HOME_CAM);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 4;
controls.maxDistance = 22;
controls.target.set(0, 0.8, 0);
controls.maxPolarAngle = Math.PI * 0.92;

// ---------- Lights ----------
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.7);
keyLight.position.set(5, 10, 7); keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 1; keyLight.shadow.camera.far = 40;
scene.add(keyLight);
const rim = new THREE.DirectionalLight(0x0d7a6e, 0.45); rim.position.set(-6, 3, -6); scene.add(rim);
const fill = new THREE.PointLight(0xc0392b, 0.35, 30); fill.position.set(0, 2, 6); scene.add(fill);

// grid floor — clinical lab plinth
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(8, 64),
  new THREE.MeshStandardMaterial({ color: 0xdfe5ea, roughness: 0.95, metalness: 0.02 })
);
floor.rotation.x = -Math.PI / 2; floor.position.y = -3.6; floor.receiveShadow = true;
scene.add(floor);

const ringMat = new THREE.LineBasicMaterial({ color: 0xc7d0d8, transparent: true, opacity: 0.7 });
[3, 5, 7].forEach(r => {
  const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
    new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2).getPoints(96).map(p => new THREE.Vector3(p.x, 0, p.y))
  ), ringMat);
  ring.position.y = -3.59;
  scene.add(ring);
});

// ---------- Build the figure ----------
const bodyGroup = new THREE.Group();
scene.add(bodyGroup);

const organMeshes = [];    // clickable organs (Organs layer)
const surfaceMeshes = [];  // muscle/skin shell (Surface layer)
const skeletonMeshes = []; // skeleton pieces (Skeletal layer)

// Surface = warm "muscle body" shell, semi-opaque, Zygote-style reddish tone
const surfaceMat = new THREE.MeshStandardMaterial({
  color: 0xd98c7a, roughness: 0.55, metalness: 0.04,
  transparent: true, opacity: 0.92, depthWrite: true
});

function addSurface(mesh) {
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.userData.isSurface = true;
  surfaceMeshes.push(mesh);
  bodyGroup.add(mesh);
  return mesh;
}

// ----- Proportions (head at top, y increases upward) -----
// Head ~0.95 units tall centered at y=2.7
const headGeo = new THREE.SphereGeometry(0.5, 32, 32);
const head = addSurface(new THREE.Mesh(headGeo, surfaceMat.clone()));
head.position.set(0, 2.75, 0);
head.scale.set(0.92, 1.08, 0.95);

// Neck
const neck = addSurface(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.35, 20), surfaceMat.clone()));
neck.position.set(0, 2.18, 0);

// Shoulders / upper torso (wider capsule)
const torsoUpper = addSurface(new THREE.Mesh(new THREE.CapsuleGeometry(0.78, 0.9, 12, 20), surfaceMat.clone()));
torsoUpper.position.set(0, 1.35, 0);
torsoUpper.scale.set(1.0, 1.0, 0.78);

// Lower torso / abdomen (narrower)
const torsoLower = addSurface(new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 0.7, 12, 20), surfaceMat.clone()));
torsoLower.position.set(0, 0.35, 0);
torsoLower.scale.set(1.0, 1.0, 0.75);

// Hips / pelvis
const hips = addSurface(new THREE.Mesh(new THREE.SphereGeometry(0.66, 24, 24), surfaceMat.clone()));
hips.position.set(0, -0.45, 0);
hips.scale.set(1.05, 0.85, 0.85);

// Arms — upper arm + forearm, each side
[-1, 1].forEach(side => {
  const shoulderX = 0.95 * side;
  const upperArm = addSurface(new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.95, 8, 16), surfaceMat.clone()));
  upperArm.position.set(shoulderX, 1.25, 0);
  upperArm.rotation.z = side * 0.12;

  const forearm = addSurface(new THREE.Mesh(new THREE.CapsuleGeometry(0.135, 0.95, 8, 16), surfaceMat.clone()));
  forearm.position.set(shoulderX * 1.05, 0.25, 0.05);
  forearm.rotation.z = side * 0.06;

  const hand = addSurface(new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), surfaceMat.clone()));
  hand.position.set(shoulderX * 1.08, -0.45, 0.07);
  hand.scale.set(0.8, 1.3, 0.6);
});

// Legs — thigh + shin, each side
[-1, 1].forEach(side => {
  const hipX = 0.32 * side;
  const thigh = addSurface(new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 1.15, 8, 16), surfaceMat.clone()));
  thigh.position.set(hipX, -1.55, 0);

  const shin = addSurface(new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.1, 8, 16), surfaceMat.clone()));
  shin.position.set(hipX, -2.85, 0.05);

  const foot = addSurface(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.55), surfaceMat.clone()));
  foot.position.set(hipX, -3.55, 0.18);
});

// ---------- Helper to create an organ ----------
function makeOrgan(key, geo, pos, scale = 1) {
  const data = ORGANS[key];
  const mat = new THREE.MeshStandardMaterial({
    color: data.color, roughness: 0.45, metalness: 0.1,
    emissive: data.color, emissiveIntensity: 0.08
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (Array.isArray(scale)) mesh.scale.set(scale[0], scale[1], scale[2]);
  else mesh.scale.setScalar(scale);
  mesh.castShadow = true;
  mesh.userData.organKey = key;
  mesh.userData.homePos = mesh.position.clone();
  // explode target = outward radial direction from torso centerline, preserving height
  const radial = new THREE.Vector3(pos[0], 0, pos[2]);
  if (radial.lengthSq() < 0.0001) radial.set((Math.random() - 0.5), 0, 1);
  radial.normalize();
  const explodeDir = radial.clone().multiplyScalar(2.6 + Math.random() * 1.0);
  explodeDir.y += (Math.random() - 0.5) * 0.6;
  mesh.userData.explodePos = mesh.position.clone().add(explodeDir);
  mesh.userData.baseEmissive = 0.08;
  organMeshes.push(mesh);
  bodyGroup.add(mesh);
  if (LAYER_OF[key] === 'skeletal') skeletonMeshes.push(mesh);
  return mesh;
}

// Brain — inside the head
makeOrgan('brain', new THREE.IcosahedronGeometry(0.36, 2), [0, 2.82, -0.02]);
// Heart — upper-left chest
makeOrgan('heart', new THREE.SphereGeometry(0.24, 24, 24), [-0.18, 1.55, 0.1]);
// Lungs — either side of heart
makeOrgan('lungLeft', new THREE.CapsuleGeometry(0.2, 0.5, 8, 16), [0.38, 1.55, 0]);
makeOrgan('lungRight', new THREE.CapsuleGeometry(0.2, 0.5, 8, 16), [-0.46, 1.55, 0]);
// Liver — upper right abdomen
makeOrgan('liver', new THREE.BoxGeometry(0.55, 0.32, 0.35), [-0.26, 0.85, 0.08]);
// Stomach — upper left abdomen
makeOrgan('stomach', new THREE.SphereGeometry(0.24, 20, 20), [0.24, 0.8, 0.08], 1);
// Kidneys — back of abdomen
makeOrgan('kidneyLeft', new THREE.CapsuleGeometry(0.1, 0.2, 6, 12), [0.32, 0.5, -0.18]);
makeOrgan('kidneyRight', new THREE.CapsuleGeometry(0.1, 0.2, 6, 12), [-0.32, 0.45, -0.18]);
// Intestines — lower abdomen / pelvis
makeOrgan('intestine', new THREE.TorusKnotGeometry(0.26, 0.09, 80, 12), [0, 0.05, 0.08]);
// Skeleton — central spine column running through the torso
makeOrgan('skeleton', new THREE.CylinderGeometry(0.08, 0.08, 2.6, 12), [0, 1.0, -0.28], [1, 1, 1]);

{
  const sk = organMeshes.find(m => m.userData.organKey === 'skeleton');
  sk.material.color.set(0xeae6da);
  sk.material.emissive.set(0xeae6da);
}

// ---------- Layer state ----------
const layerState = { skeletal: true, organs: true, surface: true };

function applyLayerVisibility() {
  organMeshes.forEach(m => {
    const layer = LAYER_OF[m.userData.organKey];
    m.visible = layerState[layer];
  });
  surfaceMeshes.forEach(p => { p.visible = layerState.surface; });
  const activeCount = Object.values(layerState).filter(Boolean).length;
  document.getElementById('layerCount').textContent = activeCount;
}

document.querySelectorAll('.layer-row').forEach(row => {
  row.addEventListener('click', () => {
    const layer = row.dataset.layer;
    layerState[layer] = !layerState[layer];
    row.classList.toggle('off', !layerState[layer]);
    applyLayerVisibility();
  });
});

// ---------- Interaction ----------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let exploded = false;
let autoRotate = false;
let hovered = null;

const ui = {
  info: document.getElementById('info'),
  sysCode: document.getElementById('iSysCode'),
  code: document.getElementById('iCode'),
  name: document.getElementById('iName'),
  tag: document.getElementById('iTag'),
  desc: document.getElementById('iDesc'),
  uses: document.getElementById('iUses'),
  stats: document.getElementById('iStats'),
  fact: document.getElementById('iFact'),
  hint: document.getElementById('hint'),
  toggle: document.getElementById('toggleBtn'),
  rotate: document.getElementById('rotateBtn'),
  viewMode: document.getElementById('viewMode'),
};

function setExplode(state) {
  exploded = state;
  ui.toggle.classList.toggle('active', exploded);
  ui.toggle.querySelector('span').textContent = exploded ? 'Collapse' : 'Explode';
  ui.toggle.firstChild.textContent = exploded ? '⊟ ' : '⚙ ';
  ui.viewMode.textContent = exploded ? 'EXPLODED' : 'INTACT';
  ui.hint.innerHTML = exploded
    ? '<span>＋</span> Select any <b>structure</b> to inspect its data sheet'
    : '<span>＋</span> Click the <b>specimen</b> to explode, then select any <b>structure</b> to inspect';
}

function hexColor(c) { return '#' + c.toString(16).padStart(6, '0'); }

function showInfo(key) {
  const d = ORGANS[key];
  ui.sysCode.textContent = d.sys;
  ui.code.textContent = d.code;
  ui.name.textContent = d.name;
  ui.tag.textContent = d.system;
  ui.tag.style.background = hexColor(d.color) + '22';
  ui.tag.style.color = hexColor(d.color);
  ui.desc.textContent = d.desc;
  ui.uses.innerHTML = d.uses.map(u => `<li>${u}</li>`).join('');
  ui.stats.innerHTML = Object.entries(d.stats).map(([k, v]) => `<div class="stat-row"><span>${k}</span><b>${v}</b></div>`).join('');
  ui.fact.textContent = d.fact;
  ui.info.classList.add('open');
}

function updatePointer(e) {
  const t = e.touches ? e.touches[0] : e;
  pointer.x = (t.clientX / innerWidth) * 2 - 1;
  pointer.y = -(t.clientY / innerHeight) * 2 + 1;
}

function visibleOrgans() { return organMeshes.filter(m => m.visible); }
function visibleSurface() { return surfaceMeshes.filter(p => p.visible); }

function onClick(e) {
  updatePointer(e);
  raycaster.setFromCamera(pointer, camera);

  if (!exploded) {
    const hits = raycaster.intersectObjects([...visibleSurface(), ...visibleOrgans()], false);
    if (hits.length) setExplode(true);
    return;
  }
  const hits = raycaster.intersectObjects(visibleOrgans(), false);
  if (hits.length) {
    showInfo(hits[0].object.userData.organKey);
    hits[0].object.userData.bounce = 1;
  }
}

renderer.domElement.addEventListener('click', onClick);

// hover highlight
renderer.domElement.addEventListener('pointermove', (e) => {
  updatePointer(e);
  raycaster.setFromCamera(pointer, camera);
  const targets = exploded ? visibleOrgans() : [...visibleSurface(), ...visibleOrgans()];
  const hits = raycaster.intersectObjects(targets, false);
  const obj = hits.length ? hits[0].object : null;
  renderer.domElement.style.cursor = obj ? 'pointer' : 'grab';
  hovered = (obj && obj.userData.organKey) ? obj : null;
});

// ---------- Buttons ----------
ui.toggle.addEventListener('click', () => setExplode(!exploded));
ui.rotate.addEventListener('click', () => {
  autoRotate = !autoRotate;
  ui.rotate.classList.toggle('active', autoRotate);
});
document.getElementById('resetBtn').addEventListener('click', () => {
  camTween = { from: camera.position.clone(), to: HOME_CAM.clone(), t: 0 };
  controls.target.set(0, 0.8, 0);
  ui.info.classList.remove('open');
});
document.getElementById('closeInfo').addEventListener('click', () => ui.info.classList.remove('open'));

// ---------- Animation ----------
let camTween = null;
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t = clock.elapsedTime;

  organMeshes.forEach((m, i) => {
    const target = exploded ? m.userData.explodePos : m.userData.homePos;
    m.position.lerp(target, 0.08);
    if (exploded) {
      m.rotation.y += dt * 0.4;
      m.position.y += Math.sin(t * 1.5 + i) * 0.0025;
    } else {
      m.rotation.y *= 0.92;
    }
    const targetEmissive = (hovered === m) ? 0.5 : m.userData.baseEmissive;
    m.material.emissiveIntensity += (targetEmissive - m.material.emissiveIntensity) * 0.15;
    const targetScaleMul = (hovered === m ? 1.12 : 1) * (m.userData.bounce ? 1.2 : 1);
    const baseScale = m.userData.baseScale || (m.userData.baseScale = m.scale.clone());
    m.scale.lerp(baseScale.clone().multiplyScalar(targetScaleMul), 0.2);
    if (m.userData.bounce) m.userData.bounce = 0;
  });

  // surface shell fades when exploded so organs are visible
  surfaceMeshes.forEach(p => {
    const targetOp = exploded ? 0.06 : 0.92;
    p.material.opacity += (targetOp - p.material.opacity) * 0.08;
  });

  if (autoRotate && !camTween) bodyGroup.rotation.y += dt * 0.3;

  if (camTween) {
    camTween.t = Math.min(1, camTween.t + dt * 1.4);
    const e = 1 - Math.pow(1 - camTween.t, 3);
    camera.position.lerpVectors(camTween.from, camTween.to, e);
    if (camTween.t >= 1) camTween = null;
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();

// reveal
setTimeout(() => document.getElementById('loader').classList.add('hide'), 700);

// resize
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

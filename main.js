import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* =========================================================
   BODY EXPLORER — interactive 3D anatomy
   Click body -> explode -> click organ -> learn
   ========================================================= */

// ---------- Organ data ----------
const ORGANS = {
  brain: {
    name: 'Brain', emoji: '🧠', system: 'Nervous System', color: 0xffb3c6,
    desc: 'The brain is the soft, wrinkly control center of the body, housed safely inside the skull.',
    uses: ['Controls thinking, memory and emotions', 'Sends signals to move every muscle', 'Processes what you see, hear, smell and feel', 'Keeps your heartbeat and breathing going'],
    fact: 'Your brain can generate about 23 watts of power — enough to light a small bulb!'
  },
  heart: {
    name: 'Heart', emoji: '🫀', system: 'Circulatory System', color: 0xff4d5e,
    desc: 'A muscular pump about the size of your fist, sitting slightly left of center in your chest.',
    uses: ['Pumps blood all around the body', 'Delivers oxygen and nutrients to cells', 'Carries away waste like carbon dioxide', 'Beats around 100,000 times every day'],
    fact: 'In an average lifetime, the heart beats over 2.5 billion times without ever taking a rest.'
  },
  lungLeft: {
    name: 'Left Lung', emoji: '🫁', system: 'Respiratory System', color: 0xff9eb5,
    desc: 'A spongy, air-filled organ in the chest. The left lung is a little smaller to make room for the heart.',
    uses: ['Brings oxygen into the body when you breathe in', 'Removes carbon dioxide when you breathe out', 'Helps you talk, sing and shout', 'Filters small blood clots and air bubbles'],
    fact: 'If you spread your lungs out flat, they would cover roughly the size of a tennis court!'
  },
  lungRight: {
    name: 'Right Lung', emoji: '🫁', system: 'Respiratory System', color: 0xff9eb5,
    desc: 'The right lung has three sections (lobes) while the left has two. Both work to exchange gases.',
    uses: ['Takes in fresh oxygen with every breath', 'Pushes out waste gas (carbon dioxide)', 'Works with the diaphragm muscle to breathe', 'Warms and moistens the air you inhale'],
    fact: 'You breathe about 20,000 times a day — mostly without ever thinking about it.'
  },
  liver: {
    name: 'Liver', emoji: '🟤', system: 'Digestive System', color: 0x8b4a2b,
    desc: 'The largest internal organ, a reddish-brown powerhouse sitting on the right side of the belly.',
    uses: ['Filters and cleans toxins from the blood', 'Stores energy as sugar and vitamins', 'Makes bile to help digest fatty foods', 'Helps blood clot when you get hurt'],
    fact: 'The liver is the only human organ that can fully regrow itself from just a small piece.'
  },
  stomach: {
    name: 'Stomach', emoji: '🟣', system: 'Digestive System', color: 0xc46fa5,
    desc: 'A stretchy, J-shaped bag that churns and mixes the food you swallow.',
    uses: ['Breaks down food with strong acid', 'Mashes food into a soupy mixture', 'Kills harmful germs in your meals', 'Slowly releases food into the intestines'],
    fact: 'Stomach acid is so strong it could dissolve metal — but a fresh lining protects you daily.'
  },
  kidneyLeft: {
    name: 'Left Kidney', emoji: '🫘', system: 'Urinary System', color: 0x9c5b3b,
    desc: 'A bean-shaped filter sitting toward your back. The left one usually sits a bit higher.',
    uses: ['Filters waste and extra water from blood', 'Makes urine to remove that waste', 'Balances salts and minerals in the body', 'Helps control blood pressure'],
    fact: 'Your kidneys filter all the blood in your body about 30 times every single day.'
  },
  kidneyRight: {
    name: 'Right Kidney', emoji: '🫘', system: 'Urinary System', color: 0x9c5b3b,
    desc: 'The right kidney sits slightly lower because the large liver rests above it.',
    uses: ['Cleans the blood of toxins', 'Keeps water and salt in balance', 'Produces hormones for healthy bones', 'Helps make red blood cells'],
    fact: 'You can live a healthy life with just one working kidney!'
  },
  intestine: {
    name: 'Intestines', emoji: '🌀', system: 'Digestive System', color: 0xf2a07b,
    desc: 'Long, coiled tubes below the stomach where most digestion and absorption happen.',
    uses: ['Absorbs nutrients from digested food', 'Soaks up water to keep you hydrated', 'Hosts helpful bacteria for digestion', 'Forms and removes solid waste'],
    fact: 'The small intestine alone is about 6 metres long — longer than a giraffe is tall!'
  },
  skeleton: {
    name: 'Skeleton', emoji: '🦴', system: 'Skeletal System', color: 0xeae6da,
    desc: 'The strong inner framework of 206 bones that gives the body its shape.',
    uses: ['Supports the body and gives it structure', 'Protects organs like the brain and heart', 'Works with muscles so you can move', 'Makes blood cells inside the bones'],
    fact: 'Babies are born with about 300 bones — many fuse together as they grow up.'
  }
};

// ---------- Scene setup ----------
const app = document.getElementById('app');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070f);
scene.fog = new THREE.Fog(0x05070f, 14, 30);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
const HOME_CAM = new THREE.Vector3(0, 1.2, 9);
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
controls.maxDistance = 20;
controls.target.set(0, 0.6, 0);

// ---------- Lights ----------
scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const key = new THREE.DirectionalLight(0xffffff, 1.4);
key.position.set(5, 9, 7); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 1; key.shadow.camera.far = 40;
scene.add(key);
const rim = new THREE.DirectionalLight(0x4fc3f7, 0.8); rim.position.set(-6, 3, -6); scene.add(rim);
const fill = new THREE.PointLight(0xff5b6e, 0.6, 30); fill.position.set(0, 2, 6); scene.add(fill);

// star particles
(() => {
  const g = new THREE.BufferGeometry();
  const n = 400, pos = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) pos[i] = (Math.random() - 0.5) * 50;
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color: 0x4fc3f7, size: 0.05, transparent: true, opacity: 0.5 });
  scene.add(new THREE.Points(g, m));
})();

// floor
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(8, 64),
  new THREE.MeshStandardMaterial({ color: 0x0b1124, roughness: 0.9, metalness: 0.1 })
);
floor.rotation.x = -Math.PI / 2; floor.position.y = -3.4; floor.receiveShadow = true;
scene.add(floor);

// ---------- Build the body ----------
const bodyGroup = new THREE.Group();
scene.add(bodyGroup);

const organMeshes = [];   // clickable organs
const bodyParts = [];     // the outer "skin" silhouette pieces

const skin = new THREE.MeshStandardMaterial({
  color: 0x6fa8ff, transparent: true, opacity: 0.18, roughness: 0.3,
  metalness: 0.1, side: THREE.DoubleSide, depthWrite: false
});

// Outer translucent body silhouette (so it looks like a human)
function addSkin(mesh, x, y, z) { mesh.position.set(x, y, z); mesh.userData.isSkin = true; bodyParts.push(mesh); bodyGroup.add(mesh); }

// head
addSkin(new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 32), skin.clone()), 0, 2.55, 0);
// neck
addSkin(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.4, 24), skin.clone()), 0, 2.0, 0);
// torso
const torsoGeo = new THREE.CapsuleGeometry(0.85, 1.4, 12, 24);
addSkin(new THREE.Mesh(torsoGeo, skin.clone()), 0, 0.95, 0);
// hips
addSkin(new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 24), skin.clone()), 0, -0.15, 0);
// arms
[-1.05, 1.05].forEach(x => {
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.7, 8, 16), skin.clone());
  arm.position.set(x, 0.9, 0); arm.rotation.z = x > 0 ? 0.18 : -0.18; addSkin(arm, x, 0.9, 0);
});
// legs
[-0.42, 0.42].forEach(x => {
  const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 2.1, 8, 16), skin.clone());
  addSkin(leg, x, -1.9, 0);
});

// helper to create an organ
function makeOrgan(key, geo, pos, scale = 1) {
  const data = ORGANS[key];
  const mat = new THREE.MeshStandardMaterial({
    color: data.color, roughness: 0.45, metalness: 0.15,
    emissive: data.color, emissiveIntensity: 0.12
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.scale.setScalar(scale);
  mesh.castShadow = true;
  mesh.userData.organKey = key;
  mesh.userData.homePos = mesh.position.clone();
  // explode target = direction outward from body center
  const dir = new THREE.Vector3(pos[0], pos[1] - 0.6, pos[2]).normalize();
  mesh.userData.explodePos = mesh.position.clone().add(dir.multiplyScalar(3.2 + Math.random() * 1.2));
  mesh.userData.baseEmissive = 0.12;
  organMeshes.push(mesh);
  bodyGroup.add(mesh);
  return mesh;
}

// Brain
makeOrgan('brain', new THREE.IcosahedronGeometry(0.42, 2), [0, 2.62, 0]);
// Heart
makeOrgan('heart', new THREE.SphereGeometry(0.3, 24, 24), [-0.18, 1.35, 0.15], 1);
// Lungs
makeOrgan('lungLeft', new THREE.CapsuleGeometry(0.26, 0.5, 8, 16), [0.42, 1.4, 0]);
makeOrgan('lungRight', new THREE.CapsuleGeometry(0.26, 0.5, 8, 16), [-0.5, 1.4, 0]);
// Liver
makeOrgan('liver', new THREE.BoxGeometry(0.7, 0.4, 0.45), [-0.28, 0.75, 0.15]);
// Stomach
makeOrgan('stomach', new THREE.SphereGeometry(0.3, 20, 20), [0.28, 0.7, 0.15], 1);
// Kidneys
makeOrgan('kidneyLeft', new THREE.CapsuleGeometry(0.13, 0.22, 6, 12), [0.35, 0.35, -0.2]);
makeOrgan('kidneyRight', new THREE.CapsuleGeometry(0.13, 0.22, 6, 12), [-0.35, 0.3, -0.2]);
// Intestines
makeOrgan('intestine', new THREE.TorusKnotGeometry(0.32, 0.12, 80, 12), [0, 0.15, 0.1]);
// Skeleton (represented as a spine column)
makeOrgan('skeleton', new THREE.CylinderGeometry(0.1, 0.1, 2.2, 12), [0, 0.9, -0.35]);

// soften skeleton color (had a typo-safe fallback)
organMeshes.find(m => m.userData.organKey === 'skeleton').material.color.set(0xeae6da);
organMeshes.find(m => m.userData.organKey === 'skeleton').material.emissive.set(0xeae6da);

// ---------- Interaction ----------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let exploded = false;
let autoRotate = false;
let hovered = null;

const ui = {
  info: document.getElementById('info'),
  emoji: document.getElementById('iEmoji'),
  name: document.getElementById('iName'),
  tag: document.getElementById('iTag'),
  desc: document.getElementById('iDesc'),
  uses: document.getElementById('iUses'),
  fact: document.getElementById('iFact'),
  hint: document.getElementById('hint'),
  toggle: document.getElementById('toggleBtn'),
};

function setExplode(state) {
  exploded = state;
  ui.toggle.querySelector('span').textContent = exploded ? 'Collapse' : 'Explode';
  ui.toggle.firstChild.textContent = exploded ? '🧩 ' : '💥 ';
  ui.hint.innerHTML = exploded
    ? '<span>👆</span> Click any <b>organ</b> to learn its name and what it does!'
    : '<span>👆</span> Click the <b>body</b> to explode it, then click any <b>organ</b> to learn!';
}

function showInfo(key) {
  const d = ORGANS[key];
  ui.emoji.textContent = d.emoji;
  ui.name.textContent = d.name;
  ui.tag.textContent = d.system;
  ui.tag.style.background = '#' + d.color.toString(16).padStart(6, '0') + '33';
  ui.tag.style.color = '#' + d.color.toString(16).padStart(6, '0');
  ui.tag.style.border = '1px solid #' + d.color.toString(16).padStart(6, '0') + '66';
  ui.desc.textContent = d.desc;
  ui.uses.innerHTML = d.uses.map(u => `<li>${u}</li>`).join('');
  ui.fact.textContent = d.fact;
  ui.info.classList.add('open');
}

function updatePointer(e) {
  const t = e.touches ? e.touches[0] : e;
  pointer.x = (t.clientX / innerWidth) * 2 - 1;
  pointer.y = -(t.clientY / innerHeight) * 2 + 1;
}

function onClick(e) {
  updatePointer(e);
  raycaster.setFromCamera(pointer, camera);

  if (!exploded) {
    // clicking the body silhouette explodes it
    const hits = raycaster.intersectObjects([...bodyParts, ...organMeshes], false);
    if (hits.length) setExplode(true);
    return;
  }
  // when exploded, click organs to learn
  const hits = raycaster.intersectObjects(organMeshes, false);
  if (hits.length) {
    showInfo(hits[0].object.userData.organKey);
    // little click bounce
    hits[0].object.userData.bounce = 1;
  }
}

renderer.domElement.addEventListener('click', onClick);

// hover highlight
renderer.domElement.addEventListener('pointermove', (e) => {
  updatePointer(e);
  raycaster.setFromCamera(pointer, camera);
  const targets = exploded ? organMeshes : [...bodyParts, ...organMeshes];
  const hits = raycaster.intersectObjects(targets, false);
  const obj = hits.length ? hits[0].object : null;
  renderer.domElement.style.cursor = obj ? 'pointer' : 'grab';
  hovered = (obj && obj.userData.organKey) ? obj : null;
});

// ---------- Buttons ----------
ui.toggle.addEventListener('click', () => setExplode(!exploded));
document.getElementById('rotateBtn').addEventListener('click', () => {
  autoRotate = !autoRotate;
});
document.getElementById('resetBtn').addEventListener('click', () => {
  camTween = { from: camera.position.clone(), to: HOME_CAM.clone(), t: 0 };
  controls.target.set(0, 0.6, 0);
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

  // animate organs toward explode/home positions
  organMeshes.forEach((m, i) => {
    const target = exploded ? m.userData.explodePos : m.userData.homePos;
    m.position.lerp(target, 0.08);
    // float + spin when exploded
    if (exploded) {
      m.rotation.y += dt * 0.4;
      m.position.y += Math.sin(t * 1.5 + i) * 0.0025;
    } else {
      m.rotation.y *= 0.92;
    }
    // hover glow
    const targetEmissive = (hovered === m) ? 0.6 : m.userData.baseEmissive;
    m.material.emissiveIntensity += (targetEmissive - m.material.emissiveIntensity) * 0.15;
    const targetScale = (hovered === m ? 1.12 : 1) * (m.userData.bounce ? 1.2 : 1);
    m.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.2);
    if (m.userData.bounce) m.userData.bounce = 0;
  });

  // skin fades out when exploded
  bodyParts.forEach(p => {
    const targetOp = exploded ? 0.03 : 0.18;
    p.material.opacity += (targetOp - p.material.opacity) * 0.08;
  });

  if (autoRotate && !camTween) bodyGroup.rotation.y += dt * 0.3;

  // camera tween
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

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './WeaponStructure.css';

// Procedural, articulated THREE-DIMENSIONAL weapons. No PNG cards or fake frame animation.
const TYPES = ['gatling','fuse_bolts','disc_blades','tesla_arc','kinetic_drill','micro_missiles','singularity_blackhole','cross_laser','cryo_fracture','railgun','siege_cannon','reactor_bomb','meteor_strike','apocalypse_torpedo','flak_cannon','orbital_cannon','seismic_wave','blood_siphon','thunderstrike','xbow'];
const palette = [0xd19a47,0xf18d43,0x9eb1cb,0x53bdf6,0xe1b85e,0xb3b9c8,0x8d5be2,0x44e6ff,0x83d8ef,0x77adf5,0xc99956,0xf18d48,0xeb7651,0x6e8dd9,0xaeb5c0,0x8cbbec,0xc4a078,0xb14c72,0x5eafff,0xc69c5c];
function mesh(geo, mat, x=0,y=0,z=0, parent) { const m = new THREE.Mesh(geo,mat); m.position.set(x,y,z); parent.add(m); return m; }
function box(w,h,d,mat,x,y,z,p){return mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z,p)}
function cyl(rt,rb,h,mat,x,y,z,p,segments=12){return mesh(new THREE.CylinderGeometry(rt,rb,h,segments),mat,x,y,z,p)}
function barrel(radius,length,mat,x,y,z,p){const m=cyl(radius,radius*1.15,length,mat,x,y,z,p);m.rotation.x=Math.PI/2;return m;}
function createModel(id, enemy){
 const i=Math.max(0,TYPES.findIndex(t=>id===`wp_${t}`));
 const root=new THREE.Group(), turret=new THREE.Group(), recoil=new THREE.Group();
 const steel=new THREE.MeshStandardMaterial({color:0x303d4e,metalness:.75,roughness:.35});
 const dark=new THREE.MeshStandardMaterial({color:0x161e2a,metalness:.6,roughness:.4});
 const trim=new THREE.MeshStandardMaterial({color:palette[i],metalness:.7,roughness:.29});
 const glow=new THREE.MeshStandardMaterial({color:i%3===0?0x55eaff:i%3===1?0xffa444:0xc287ff,emissive:i%3===0?0x0087a8:i%3===1?0xb84700:0x5624a5,emissiveIntensity:1.2,metalness:.25,roughness:.25});
 cyl(.78,.91,.28,dark,0,.15,0,root,8);cyl(.7,.78,.2,steel,0,.34,0,root,8);
 for(let k=0;k<8;k++){const a=k*Math.PI/4;box(.18,.19,.27,trim,Math.sin(a)*.72,.24,Math.cos(a)*.72,root)}
 cyl(.57,.65,.24,trim,0,.48,0,root,10);
 turret.position.y=.66;root.add(turret);
 cyl(.51,.59,.38,steel,0,.12,0,turret,10);
 box(.9,.22,.82,trim,0,.33,0,turret);
 turret.add(recoil);
 // Forward is +Z in world space. The enemy aims toward the player (-Z).
 const multi=[0,5,14].includes(i), energy=[3,6,7,8,15,18].includes(i);
 if(i===19){ // crossbow: articulated bow arms and bolt
   box(1.6,.12,.16,trim,0,.31,.54,recoil);barrel(.065,1.55,steel,0,.31,.68,recoil);
   for(const side of [-1,1]){const arm=box(.12,.14,.62,steel,side*.72,.32,.7,recoil);arm.rotation.y=side*.48;}
 }else if(i===4){ // drill
   barrel(.26,.85,steel,0,.26,.69,recoil);
   const bit=mesh(new THREE.ConeGeometry(.28,.8,10),trim,0,.26,1.32,recoil);bit.rotation.x=Math.PI/2;
 }else if(i===2){ // rotating disc blade
   barrel(.2,.7,steel,0,.28,.64,recoil);
   const disc=cyl(.45,.45,.09,trim,0,.28,1.05,recoil,12);disc.rotation.x=Math.PI/2;
 }else if(energy){
   for(const side of [-1,1]){box(.18,.64,.28,trim,side*.32,.46,.35,recoil);mesh(new THREE.SphereGeometry(.14,12,8),glow,side*.32,.79,.38,recoil)}
   barrel(.17,1.02,dark,0,.32,.68,recoil);barrel(.12,.23,glow,0,.32,1.28,recoil);
 }else if(multi){
   for(let k=0;k<(i===5?4:6);k++){const a=k*Math.PI*2/(i===5?4:6);barrel(i===5?.16:.095,i===5?.92:1.18,steel,Math.cos(a)*.23,.32+Math.sin(a)*.23,.76,recoil);}
 }else{
   const radius=[10,12,13].includes(i)?.3:.2;
   barrel(radius,1.25,steel,0,.29,.83,recoil);
   barrel(radius*1.25,.22,trim,0,.29,1.48,recoil);
 }
 for(const side of [-1,1]){cyl(.23,.23,.17,trim,side*.53,.16,0,turret,10).rotation.z=Math.PI/2;}
 const muzzle=new THREE.Object3D();muzzle.position.set(0,.32,i===19?1.48:i===4?1.75:1.5);recoil.add(muzzle);
 if(enemy)turret.rotation.y=Math.PI;
 return {root,turret,recoil,muzzle,glow,baseAngle:enemy?Math.PI:0,energy};
}
export default function WeaponStructure({weapon,enemy=false,active=false}){
 const host=useRef(null), sceneRef=useRef(null);
 useEffect(()=>{
  const el=host.current;if(!el)return;
  let renderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.setSize(144,144,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
  el.appendChild(renderer.domElement);
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(34,1,.1,100);
  camera.position.set(3.3,3.0,5.9);camera.lookAt(0,.75,0);
  scene.add(new THREE.HemisphereLight(0xe8f5ff,0x293247,2.2));
  const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-3,7,5);scene.add(light);
  const model=createModel(weapon?.id||'',enemy);scene.add(model.root);
  const flashMat=new THREE.MeshBasicMaterial({color:0xffdf86,transparent:true,opacity:0,depthWrite:false});
  const flash=mesh(new THREE.SphereGeometry(.24,12,8),flashMat,0,0,0,scene);
  const anchor=el.parentElement?.querySelector('[data-weapon-muzzle]');
  const shot={at:-1000};const onFire=e=>{if(e.detail?.weaponId===weapon?.id&&Boolean(e.detail?.enemy)===enemy)shot.at=performance.now();};
  window.addEventListener('weapon-visual-fire',onFire);
  const clock=new THREE.Clock();let raf=0,last=0;
  const v=new THREE.Vector3();
  const animate=(now)=>{
   raf=requestAnimationFrame(animate);
   if(now-last<32)return;last=now;
   const t=clock.getElapsedTime(),age=(now-shot.at)/1000,fire=age>=0&&age<.48;
   model.turret.rotation.y=model.baseAngle+Math.sin(t*.65)*.09+(fire?Math.sin(age*22)*.055:0);
   model.recoil.position.z=fire?-.24*Math.exp(-age*8):0;
   model.recoil.rotation.x=fire?-.12*Math.exp(-age*8):0;
   model.glow.emissiveIntensity=model.energy?1.1+Math.sin(t*4)*.55:1.1;
   model.muzzle.getWorldPosition(v);v.project(camera);
   const x=(v.x*.5+.5)*100,y=(-v.y*.5+.5)*100;
   if(anchor){anchor.style.left=`${x}%`;anchor.style.top=`${y}%`;}
   flash.position.copy(model.muzzle.getWorldPosition(new THREE.Vector3()));
   flash.scale.setScalar(fire?1+age*5:.01);flashMat.opacity=fire?Math.max(0,1-age*5):0;
   renderer.render(scene,camera);
  };
  raf=requestAnimationFrame(animate);sceneRef.current=renderer;
  return()=>{cancelAnimationFrame(raf);window.removeEventListener('weapon-visual-fire',onFire);scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();}});[...new Set([model.glow,flashMat])].forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();sceneRef.current=null;};
 },[weapon?.id,enemy]);
 return <span data-weapon-structure="true" className={`weapon-structure weapon-structure-3d ${enemy?'weapon-structure-enemy':''} ${active?'weapon-structure-active':''}`} role="img" aria-label={`Struttura tridimensionale ${weapon?.name||''}`} title={weapon?.name}>
  <span className="weapon-3d-canvas" ref={host} aria-hidden="true"/>
  <span className="weapon-ground-shadow" aria-hidden="true"/>
  <span className="weapon-muzzle-anchor" data-weapon-muzzle="true" aria-hidden="true"/>
 </span>;
}

import bpy, math, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name,c,metal=0,rough=.35):
 m=bpy.data.materials.new(name); m.diffuse_color=(*c,1); m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*c,1); p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
 return m
white=mat('Porcelain',(0.82,.84,.86),.12); dark=mat('Graphite',(.025,.03,.035),.6); gray=mat('Brushed silver',(.32,.35,.38),.65); bright=mat('Soft white',(.96,.96,.96))
def finish(o,name,m,bevel=0):
 o.name=name; o.data.materials.append(m)
 if bevel:
  mod=o.modifiers.new('Soft machined edges','BEVEL'); mod.width=bevel; mod.segments=3
  bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=mod.name)
 for p in o.data.polygons:p.use_smooth=True
 mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL'); bpy.context.view_layer.objects.active=o
 try:bpy.ops.object.modifier_apply(modifier=mod.name)
 except:pass
 return o
# Blender Z up; exporter converts to Y up.
def box(name,loc,scale,m=white,b=.06):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.dimensions=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); return finish(o,name,m,b)
def cyl(name,loc,r,d,m=white):
 bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=r,depth=d,location=loc); return finish(bpy.context.object,name,m,.025)
def ring(name,loc,major,minor,m=dark,rot=(0,0,0)):
 bpy.ops.mesh.primitive_torus_add(major_segments=64,minor_segments=10,location=loc,major_radius=major,minor_radius=minor,rotation=rot); return finish(bpy.context.object,name,m)
def sphere(name,loc,r,m=dark):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,radius=r,location=loc); return finish(bpy.context.object,name,m)
def base():
 box('Foundation',(0,0,.12),(2.3,2.3,.24),bright,.16)
 box('Recess',(0,0,.255),(1.95,1.95,.07),dark,.09)
 box('Top plate',(0,0,.32),(1.83,1.83,.12),white,.10)
 for x in [-.82,.82]:
  for y in [-.82,.82]: cyl('Fastener',(x,y,.39),.045,.02,gray)
def export(name):
 bpy.ops.object.select_all(action='SELECT')
 bpy.ops.wm.save_as_mainfile(filepath=f'{ROOT}/models/{name}.blend')
 bpy.ops.export_scene.gltf(filepath=f'{ROOT}/public/models/{name}.glb',export_format='GLB',use_selection=True)
 bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
base()
cyl('Plinth',(0,0,.49),.68,.26,white); cyl('Bearing',(0,0,.65),.47,.10,dark)
cyl('Pedestal',(0,0,.82),.28,.3,gray)
ring('OuterRing',(0,0,1.72),.84,.055,dark,(math.pi/2,0,0))
ring('InnerRing',(0,0,1.72),.65,.04,gray,(math.pi/2,.65,0))
o=box('Rotor',(0,0,1.72),(.66,.66,.66),bright,.095); o.rotation_euler=(.3,.3,.3)
for x in [-.93,.93]:
 box('Support',(x,0,1.16),(.13,.2,1.55),white,.04); sphere('Bearing cap',(x,0,1.72),.13,dark)
ring('L2_Halo',(0,0,1.72),1.02,.025,gray,(math.pi/2,-.5,0))
for i in range(4):
 a=i*math.pi/2
 box('L3_Foot'+str(i),(.65*math.cos(a),.65*math.sin(a),.52),(.16,.16,.2),gray,.02)
ring('L3_Crown',(0,0,2.55),.38,.03,dark)
# Larger nested gimbal and crown change the silhouette at phone scale.
for x in [-.8,.8]:
 box('L2_Stabilizer'+str(x),(x,.3,1.15),(.18,.22,1.25),gray,.035)
ring('L2_Drive',(0,0,1.72),.96,.065,white,(math.pi/2,.6,0))
ring('L3_Gimbal',(0,0,1.72),1.03,.085,white,(.6,math.pi/2,0))
for x in [-.55,.55]:
 box('L3_CrownSupport'+str(x),(x,0,2.25),(.10,.15,.7),dark,.025)
ring('L3_UpperCage',(0,0,2.5),.58,.09,white)
cyl('L3_Cap',(0,0,2.62),.26,.18,gray)
export('core')
base()
for x in [-.65,.65]:
 cyl('Guide rail',(x,0,1.2),.07,1.6,gray)
 box('Pillar',(x,.3,1.15),(.22,.3,1.6),white,.04)
box('Crosshead',(0,0,2.03),(1.7,.75,.3),white)
cyl('Hydraulic housing',(0,0,2.27),.23,.26,dark)
cyl('Piston',(0,0,1.6),.12,.6,gray)
box('Hammer',(0,0,1.25),(1.05,.8,.22),dark,.04)
box('Anvil',(0,0,.53),(1.1,.9,.25),white,.04)
box('Material',(0,0,.75),(.43,.43,.2),gray,.035)
for x in [-.45,.45]:cyl('L2_Auxiliary',(x,0,2.24),.12,.22,gray)
box('L3_Feeder',(0,-.85,.6),(1.1,.65,.3),white)
for x in [-.45,.45]:
 cyl('L2_Actuator'+str(x),(x,0,1.67),.085,.58,dark)
box('L2_DriveBox',(0,.62,1.45),(.9,.35,.75),gray)
box('L3_FeedFrame',(0,-.68,.68),(1.5,.7,.2),dark)
for i in range(5):
 o=cyl('L3_Roller'+str(i),(0,-.4-i*.13,.82),.085,1.25,gray);o.rotation_euler.y=math.pi/2
for x in [-.72,.72]:
 box('L3_Housing'+str(x),(x,0,1.1),(.22,.9,1.35),white)
box('L3_CrossDrive',(0,.12,2.42),(1.55,.6,.2),gray)
export('press')
base(); cyl('Turntable',(0,0,.49),.64,.23,dark); cyl('Arm base',(0,0,.7),.36,.3,white)
box('ArmLower',(-.15,0,1.15),(.3,.32,.85),white)
sphere('Elbow',(-.15,0,1.6),.25,dark)
box('ArmUpper',(.27,0,1.68),(.85,.26,.24),white)
sphere('Wrist',(.7,0,1.68),.16,gray)
box('Gripper stem',(.75,0,1.43),(.12,.14,.38),dark,.02)
for y in [-.14,.14]:box('Claw',(.75,y,1.22),(.16,.06,.23),gray,.015)
box('Assembly block',(.75,0,.65),(.35,.35,.35),bright,.04)
ring('L2_Track',(0,0,.72),.66,.035,gray)
box('L3_Supply',(-.8,-.55,.65),(.4,.5,.5),white)
for x in [-.8,.8]:
 cyl('L2_Spool'+str(x),(x,.55,.6),.18,.35,gray)
box('L2_Worktable',(.55,0,.62),(.8,.9,.16),white)
# Second assembly arm: each level-three node can reveal independently.
cyl('L3_ArmBase',(-.6,.55,.7),.25,.3,gray)
box('L3_ArmLower',(-.6,.55,1.18),(.22,.25,.8),white)
sphere('L3_Elbow',(-.6,.55,1.6),.2,dark)
box('L3_ArmUpper',(-.2,.55,1.65),(.8,.2,.2),white)
sphere('L3_Wrist',(.25,.55,1.65),.15,gray)
box('L3_Tool',(.25,.55,1.35),(.12,.18,.5),dark)
ring('L3_Cradle',(.6,0,.72),.48,.07,gray)
export('assembler')
print('Models exported')

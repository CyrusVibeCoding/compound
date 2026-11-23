"""Blender 4.3+: colorful city assets, authored at 1 tile = 2.3 units."""
import bpy, math, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(f'{ROOT}/models/city',exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(name,value,metal=0,rough=.45):
 if isinstance(value,str):
  rgb=[int(value[i:i+2],16)/255 for i in (1,3,5)];color=tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb)+(1,)
 else:color=(value,value,value,1)
 m=bpy.data.materials.new(name);m.diffuse_color=color;m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=color;p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
white=material('Chalk',.86);bright=material('Porcelain',.96);dark=material('Ink',.035);gray=material('Stone',.48);silver=material('Metal',.24,.45);glass=material('Window',.085,.3,.22)
# Semantic colors keep source assets and runtime exports in sync.
cream=material('Warm plaster','#f3dfbb');blueHouse=material('Sage blue plaster','#9fc6c0');clay=material('Terracotta roof','#b95035');slate=material('Blue slate roof','#3e6879')
stone=material('Warm stone','#c6bda9');wood=material('Honey wood','#9a6036');green=material('Leaves','#42834a');lightGreen=material('Leaf tips','#6fa653');grass=material('Grass','#73a958');water=material('Fountain water','#45aac8',.1,.22);windowBlue=material('Blue windows','#447e9a',.15,.24);teal=material('Teal door','#296a68');metal=material('Dark metal','#394b50',.4);lamp=material('Warm lantern','#ffe2a0')
skin=material('Peach skin','#e7b28f');brownSkin=material('Warm brown skin','#bc8058');hair=material('Chestnut hair','#51362b');navy=material('Navy trousers','#354d6b');boyShirt=material('Blue shirt','#4c8ec1');girlShirt=material('Coral shirt','#d86b59')
asset='house'
def color_for(name,original):
 if asset in ['boy','girl']:
  if name in ['Head','Nose','Hand']:return brownSkin if asset=='girl' else skin
  if name in ['Hair','Hair fringe','Bob left','Bob right','Ponytail']:return hair
  if name=='Jacket' or 'Arm mesh' in name:return girlShirt if asset=='girl' else boyShirt
  if 'Leg mesh' in name or 'shoe' in name or name=='Skirt':return navy
  return original
 if name in ['Gabled roof','Tall roof','Wing roof']:return slate if asset=='big-house' else clay
 if name in ['House','Main house','Side wing']:return blueHouse if asset=='big-house' else cream
 if name in ['Front door','Door']:return teal
 if name=='Window glass':return windowBlue
 if name in ['Step','Porch','Planter','Chimney','Fountain basin']:return stone
 if name in ['Shrub','Tree canopy']:return green
 if name=='Tree crown':return lightGreen
 if name=='Garden bed':return grass
 if name in ['Tree trunk','Bench seat','Bench back','Door canopy']:return wood
 if name=='Still water':return water
 if name in ['Lamp post','Bench legs','Balcony rail','Railing top']:return metal
 if name=='Lamp':return lamp
 return original
def finish(o,name,mat,bevel=0):
 o.name=name;o.data.materials.append(color_for(name,mat))
 if bevel:
  mod=o.modifiers.new('Soft edges','BEVEL');mod.width=bevel;mod.segments=2;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 for p in o.data.polygons:p.use_smooth=True
 mod=o.modifiers.new('Normals','WEIGHTED_NORMAL');bpy.context.view_layer.objects.active=o
 try:bpy.ops.object.modifier_apply(modifier=mod.name)
 except:pass
 return o
def box(name,loc,size,mat=white,b=.035):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,mat,b)
def cyl(name,loc,r,depth,mat=white,vertices=24):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=loc);return finish(bpy.context.object,name,mat,.015)
def ball(name,loc,size,mat=white):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=1,location=loc);o=bpy.context.object;o.scale=size;return finish(o,name,mat)
def roof(name,x,y,z,w,d,h):
 verts=[(-w/2,-d/2,0),(w/2,-d/2,0),(0,-d/2,h),(-w/2,d/2,0),(w/2,d/2,0),(0,d/2,h)]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[(0,2,1),(3,4,5),(0,1,4,3),(1,2,5,4),(2,0,3,5)]);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.location=(x,y,z);return finish(o,name,dark,.025)
def base():box('Pavement',(0,0,.07),(2.3,2.3,.14),bright,.10)
def window(x,y,z,w=.32,h=.4):
 box('Window surround',(x,y,z),(w+.09,.065,h+.09),bright,.012);box('Window glass',(x,y-.038,z),(w,.028,h),glass,.008);box('Window mullion',(x,y-.06,z),(.025,.03,h),white,.004);box('Window sill',(x,y-.07,z-h/2), (w+.13,.15,.045),gray,.008)
def plant(x,y):
 box('Planter',(x,y,.23),(.28,.28,.26),gray);ball('Shrub',(x,y,.46),(.22,.22,.20),silver)
def export(name):
 if os.environ.get('CITY_ASSET') and os.environ['CITY_ASSET']!=name:
  bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);return
 bpy.ops.object.select_all(action='SELECT');bpy.ops.wm.save_as_mainfile(filepath=f'{ROOT}/models/city/{name}.blend')
 # Keep editable source objects; batch runtime meshes by parent/material to reduce draw calls.
 batches={}
 for o in list(bpy.context.scene.objects):
  if o.type=='MESH':batches.setdefault((o.parent.name if o.parent else '',o.data.materials[0].name),[]).append(o)
 for (parent,mat),objects in batches.items():
  if len(objects)<2:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name='Batch_'+mat+'_'+parent
 bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=f'{ROOT}/public/models/{name}.glb',export_format='GLB',use_selection=True);bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
# Basic cottage, with a front stoop and gabled terracotta roof.
base();box('House',(0,.1,.75),(1.5,1.35,1.2));roof('Gabled roof',0,.1,1.35,1.8,1.65,.65)
box('Door trim',(0,-.595,.58),(.46,.08,.85),bright);box('Front door',(0,-.65,.57),(.34,.06,.74),dark);ball('Door knob',(.105,-.69,.56),(.025,.025,.025),gray)
window(-.48,-.60,.88,.27,.39);window(.48,-.60,.88,.27,.39)
box('Step',(0,-.86,.18),(.65,.42,.14),gray);box('Door canopy',(0,-.76,1.10),(.65,.45,.08),silver)
box('Chimney',(.5,.4,1.85),(.22,.24,.6),gray);box('Chimney cap',(.5,.4,2.15),(.30,.30,.08),bright)
plant(-.83,-.83);plant(.83,-.83)
export('house')
# Two-storey home, side wing, balcony, and porch.
asset='big-house'
base();box('Main house',(-.22,.13,1.02),(1.28,1.45,1.8));roof('Tall roof',-.22,.13,1.92,1.5,1.7,.52)
box('Side wing',(.68,.25,.62),(.65,1.05,1.0));roof('Wing roof',.68,.25,1.12,.85,1.3,.4)
for x in [-.56,.13]:
 window(x,-.62,1.5,.32,.42)
window(.68,-.30,.75,.28,.34);window(-.55,-.62,.65,.33,.45)
box('Door',(.12,-.63,.60),(.32,.08,.82),dark);ball('Knob',(.22,-.69,.60),(.023,.023,.023),gray)
box('Porch',(.12,-.84,.20),(.8,.48,.16),gray);box('Balcony',(.12,-.78,1.16),(.8,.38,.08),bright)
for x in [-.24,.48]:cyl('Porch column',(x,-.94,.70),.035,.95,bright)
for x in [-.22,0,.22,.44]:box('Balcony rail',(x,-.98,1.29),(.025,.025,.22),silver,.004)
box('Railing top',(.1,-.98,1.41),(.78,.035,.04),silver,.004)
plant(-.86,-.84);plant(.87,-.84)
export('big-house')
# Pocket park, benches, sculpted trees and a fountain people can visit.
asset='park'
base();box('Garden bed',(0,0,.16),(2.06,2.06,.08),gray,.10)
cyl('Circular plaza',(0,0,.22),.75,.05,bright,48);cyl('Fountain basin',(0,.18,.32),.34,.16,silver,40);cyl('Still water',(0,.18,.405),.28,.015,glass,40);cyl('Fountain pillar',(0,.18,.57),.07,.34,white);ball('Fountain top',(0,.18,.78),(.13,.13,.10),bright)
for x,y in [(-.78,.68),(.78,.65),(-.78,-.6)]:
 cyl('Tree trunk',(x,y,.59),.065,.75,silver);ball('Tree canopy',(x,y,1.14),(.32,.32,.47),white);ball('Tree crown',(x,y,1.46),(.23,.23,.30),gray)
for y in [-.68,.68]:
 for x in [-.23,.23]:box('Bench legs',(x,y,.30),(.06,.12,.23),silver)
 box('Bench seat',(0,y,.43),(.65,.22,.07),white);box('Bench back',(0,y+.10,.56),(.65,.055,.23),white)
cyl('Lamp post',(.82,-.75,.77),.028,1.1,silver);box('Lamp',(.82,-.75,1.35),(.16,.16,.22),bright)
export('park')
# Café: warm plaster, striped awning, readable cup sign and a two-table patio.
asset='cafe'
base()
box('Cafe walls',(0,.46,.72),(1.8,1.05,1.2),cream)
box('Flat roof',(0,.46,1.36),(1.98,1.2,.12),teal)
box('Shop window',(-.48,-.085,.83),(.65,.06,.62),windowBlue)
box('Cafe door',(.43,-.09,.70),(.40,.06,.98),teal)
box('Door glass',(.43,-.13,.86),(.28,.03,.5),windowBlue)
box('Handle',(.56,-.16,.62),(.025,.03,.15),wood)
for i in range(8):
 x=-.875+i*.25
 box('Awning stripe',(x,-.30,1.19),(.25,.62,.065),clay if i%2==0 else bright,.008)
 box('Awning valance',(x,-.60,1.10),(.25,.06,.18),clay if i%2==0 else bright,.008)
box('Sign board',(0,-.10,1.56),(.68,.09,.38),wood)
# A cream cup silhouette and small handle stand out even at phone scale.
box('Cup symbol',(-.04,-.16,1.57),(.22,.025,.17),bright,.03)
box('Cup saucer',(-.03,-.17,1.46),(.31,.025,.035),bright,.01)
box('Cup handle',(.11,-.16,1.59),(.08,.025,.08),bright,.02)
for x in [-.70,.70]:
 cyl('Patio table post',(x,-.65,.38),.035,.45,metal,12)
 cyl('Patio table top',(x,-.65,.62),.28,.055,wood,20)
 for y in [-.97,-.31]:
  box('Chair seat',(x,y,.35),(.27,.23,.055),teal,.02)
  box('Chair back',(x,y+(-.09 if y<-.6 else .09),.48),(.27,.04,.23),teal,.015)
  for dx in [-.09,.09]:box('Chair legs',(x+dx,y,.24),(.03,.15,.22),metal,.004)
 cyl('Coffee cup',(x,-.65,.69),.045,.09,bright,12)
export('cafe')

# Café: warm plaster, striped awning, readable cup sign and a two-table patio.
asset='bakery'
base()
box('Cafe walls',(0,.46,.72),(1.8,1.05,1.2),cream)
box('Flat roof',(0,.46,1.36),(1.98,1.2,.12),clay)
box('Shop window',(-.48,-.085,.83),(.65,.06,.62),windowBlue)
box('Cafe door',(.43,-.09,.70),(.40,.06,.98),teal)
box('Door glass',(.43,-.13,.86),(.28,.03,.5),windowBlue)
box('Handle',(.56,-.16,.62),(.025,.03,.15),wood)
for i in range(8):
 x=-.875+i*.25
 box('Awning stripe',(x,-.30,1.19),(.25,.62,.065),wood if i%2==0 else cream,.008)
 box('Awning valance',(x,-.60,1.10),(.25,.06,.18),wood if i%2==0 else cream,.008)
box('Sign board',(0,-.10,1.56),(.68,.09,.38),wood)
# A golden loaf with three pale scoring marks.
ball('Bread sign',(-.03,-.17,1.56),(.24,.035,.10),wood)
for x in [-.14,0,.14]:box('Bread scoring',(x,-.21,1.59),(.025,.02,.07),cream,.006)
box('Bread display',(-.48,-.14,.61),(.65,.15,.06),wood)
for x in [-.66,-.46,-.26]:ball('Fresh loaf',(x,-.18,.70),(.08,.09,.045),wood)
for x in [-.70,.70]:
 cyl('Patio table post',(x,-.65,.38),.035,.45,metal,12)
 cyl('Patio table top',(x,-.65,.62),.28,.055,wood,20)
 for y in [-.97,-.31]:
  box('Chair seat',(x,y,.35),(.27,.23,.055),teal,.02)
  box('Chair back',(x,y+(-.09 if y<-.6 else .09),.48),(.27,.04,.23),teal,.015)
  for dx in [-.09,.09]:box('Chair legs',(x+dx,y,.24),(.03,.15,.22),metal,.004)
 cyl('Coffee cup',(x,-.65,.69),.045,.09,bright,12)
export('bakery')


# Joint pivots are named for lightweight runtime walking (no skeleton/physics).
def person(girl=False):
 global asset
 asset='girl' if girl else 'boy'
 ball('Head',(0,0,1.24),(.25,.22,.27),bright)
 ball('Hair',(0,.025,1.39),(.26,.23,.16),dark)
 if girl:
  ball('Bob left',(-.19,.07,1.22),(.10,.16,.23),dark);ball('Bob right',(.19,.07,1.22),(.10,.16,.23),dark);ball('Ponytail',(.22,.18,1.26),(.13,.15,.20),dark)
 else:
  box('Hair fringe',(-.06,-.15,1.4),(.30,.14,.12),dark,.05)
 for x in [-.08,.08]:ball('Eye',(x,-.211,1.25),(.022,.015,.025),dark)
 ball('Nose',(0,-.225,1.18),(.026,.035,.025),white)
 box('Jacket',(0,0,.80),(.37,.26,.42),gray if girl else silver,.08)
 if girl:
  bpy.ops.mesh.primitive_cone_add(vertices=20,radius1=.26,radius2=.18,depth=.30,location=(0,0,.57));finish(bpy.context.object,'Skirt',dark,.02)
 def limb(name,origin,size,offset,mat):
  pivot=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(pivot);pivot.location=origin
  obj=box(name+' mesh',tuple(origin[i]+offset[i] for i in range(3)),size,mat,.035);obj.parent=pivot
  # Parent in local coordinates, preserving the limb pivot at its shoulder/hip.
  obj.location=offset
  return pivot
 for x,label in [(-.11,'Left'),(.11,'Right')]:
  limb(label+'Leg',(x,0,.56),(.13,.16,.39),(0,0,-.20),dark)
  leg=bpy.data.objects[label+'Leg'];shoe=box(label+' shoe',(0,0,0),(.17,.25,.10),dark);shoe.parent=leg;shoe.location=(0,-.035,-.43)
 for x,label in [(-.25,'Left'),(.25,'Right')]:
  limb(label+'Arm',(x,0,.95),(.12,.14,.32),(0,0,-.15),gray if girl else silver)
  hand=ball('Hand',(0,0,0),(.07,.07,.075),bright);hand.parent=bpy.data.objects[label+'Arm'];hand.location=(0,0,-.34)
 export('girl' if girl else 'boy')
person();person(True)
print('City: house, big house, park, boy and girl exported.')

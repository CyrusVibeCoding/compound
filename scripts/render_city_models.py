"""Render the five editable city assets as a single white-background preview."""
import bpy,os,math
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for name,x,y,scale in [('house',-3.1,.5,1),('big-house',0,.5,1),('park',3.1,.5,1),('boy',-1,-2.5,1),('girl',1,-2.5,1)]:
 with bpy.data.libraries.load(f'{ROOT}/models/city/{name}.blend',link=False) as (src,dst):dst.objects=src.objects
 root=bpy.data.objects.new(name+' showcase',None);bpy.context.collection.objects.link(root);root.location=(x,y,0);root.scale=(scale,)*3
 for o in dst.objects:
  if o:
   bpy.context.collection.objects.link(o)
   if o.parent is None:o.parent=root
m=bpy.data.materials.new('Background');m.diffuse_color=(1,1,1,1);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(1,1,1,1)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.01));bpy.context.object.data.materials.append(m)
world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(1,1,1,1);world.node_tree.nodes['Background'].inputs[1].default_value=.8
for pos,power,size in [((1,-5,10),1400,8),((-7,0,6),800,7)]:
 bpy.ops.object.light_add(type='AREA',location=pos);bpy.context.object.data.energy=power;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=size
 bpy.context.object.rotation_euler=(Vector((0,0,0))-bpy.context.object.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(8,-12,9));cam=bpy.context.object;cam.rotation_euler=(Vector((0,-.4,.6))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=12;scene=bpy.context.scene;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=False;scene.render.resolution_x=1400;scene.render.resolution_y=1000;scene.render.resolution_percentage=100;scene.view_settings.view_transform='Standard';scene.render.image_settings.file_format='PNG';scene.render.filepath=f'{ROOT}/models/city/preview.png';bpy.ops.render.render(write_still=True)

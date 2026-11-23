import bpy, math, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for name,x in [('assembler',-3.3),('core',0),('press',3.3)]:
 before=set(bpy.data.objects)
 bpy.ops.import_scene.gltf(filepath=f'{ROOT}/public/models/{name}.glb')
 new=set(bpy.data.objects)-before
 for o in new:
  if o.parent is None:o.location.x+=x
  if o.name.startswith('L2') or o.name.startswith('L3'):o.hide_render=True
m=bpy.data.materials.new('White ground');m.diffuse_color=(1,1,1,1)
bpy.ops.mesh.primitive_plane_add(size=200);bpy.context.object.data.materials.append(m)
bpy.ops.object.camera_add(location=(9,-14,11));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=12.5;bpy.context.scene.camera=cam
for loc,power,size in [((1,-4,9),1800,7),((-6,2,6),1100,5)]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(Vector((0,0,0))-l.location).to_track_quat('-Z','Y').to_euler()
s=bpy.context.scene;s.world.color=(.8,.8,.8);s.render.engine='CYCLES';s.cycles.samples=48;s.cycles.use_denoising=False;s.render.resolution_x=1400;s.render.resolution_y=900;s.render.resolution_percentage=100;s.view_settings.view_transform='AgX';s.render.image_settings.file_format='PNG';s.render.filepath=f'{ROOT}/models/preview.png'
bpy.ops.wm.save_as_mainfile(filepath=f'{ROOT}/models/showroom.blend');bpy.ops.render.render(write_still=True)

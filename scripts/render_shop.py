"""Generate compact catalog thumbnails from the editable city models."""
import bpy, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for name in ([os.environ['CITY_ASSET']] if os.environ.get('CITY_ASSET') else ['house','big-house','park','plaza','cafe','bakery','playground','library','flower-shop','ice-cream','market','road','curved-road','sidewalk','parking-small','parking-big']):
 bpy.ops.wm.open_mainfile(filepath=f'{ROOT}/models/city/{name}.blend')
 bpy.ops.object.camera_add(location=(3,-5,3.1))
 cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.8))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=3.7
 scene=bpy.context.scene;scene.camera=cam;scene.render.engine='BLENDER_WORKBENCH';scene.display.shading.light='STUDIO';scene.display.shading.color_type='MATERIAL';scene.display.shading.show_shadows=True;scene.display.shading.show_cavity=True;scene.display.shading.cavity_type='BOTH'
 scene.render.resolution_x=280;scene.render.resolution_y=220;scene.render.resolution_percentage=100;scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.filepath=f'{ROOT}/public/models/{name}-shop.png';bpy.ops.render.render(write_still=True)

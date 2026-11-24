"""Editable street tiles, authored to meet on a two-unit world grid."""
from pathlib import Path
exec(Path(__file__).with_name('build_city_models.py').read_text().split('# Basic cottage,')[0])
asphalt=material('Asphalt','#687176');paving=material('Sidewalk stone','#d4cdbf');paint=material('Road paint','#eee6c9');carpaint=material('Car blue','#5a96ab')
def strip(name,points,width,mat,z,tangents=None):
 verts=[]
 for i,(x,y) in enumerate(points):
  a=points[max(0,i-1)];b=points[min(len(points)-1,i+1)];dx=b[0]-a[0];dy=b[1]-a[1]
  if tangents and i==0:dx,dy=tangents[0]
  if tangents and i==len(points)-1:dx,dy=tangents[1]
  l=math.hypot(dx,dy);nx=-dy/l*width/2;ny=dx/l*width/2
  verts.extend([((x+nx)/.7,-(y+ny)/.7,z),((x-nx)/.7,-(y-ny)/.7,z)])
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[(i*2,i*2+1,i*2+3,i*2+2) for i in range(len(points)-1)]);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,name,mat)
for asset in ['road','curved-road','sidewalk','parking-small','parking-big']:
 if asset=='sidewalk':strip('Footpath',[(0,-1),(0,1)],.32,paving,.025)
 elif asset in ['road','curved-road']:
  arc=lambda r:[(1+math.cos(math.pi-i*math.pi/32)*r,-1+math.sin(math.pi-i*math.pi/32)*r) for i in range(17)]
  center=[(0,-1),(0,1)] if asset=='road' else arc(1)
  strip('Carriageway',center,.72,asphalt,.012,[(0,1),(1,0)] if asset=='curved-road' else None)
  for side in [-1,1]:strip('Sidewalk',[(side*.5,-1),(side*.5,1)] if asset=='road' else arc(1+side*.5),.28,paving,.025,[(0,1),(1,0)] if asset=='curved-road' else None)
  for a,b in zip(center[::4],center[1::4]):strip('Lane mark',[a,b],.025,paint,.018)
  if asset=='road':
   for y in [-.65,0,.65]:strip('Lane mark',[(0,y-.12),(0,y+.12)],.025,paint,.018)
 else:
  half=.8 if asset=='parking-small' else 1
  # Separate pavement, markings and curbs vertically; nothing sits inside the slab.
  box('Lot surface',(0,0,.02),(half*2/.7,2/.7,.04),asphalt,.008)
  strip('Pedestrian edge',[(-half,.75),(half,.75)],.28,paving,.065)
  # Low perimeter curbs, with a real opening for the driveway.
  for x in [-half,half]:strip('Side curb',[(x,-.98),(x,.98)],.045,paving,.07)
  strip('Back curb',[(-half,.98),(half,.98)],.045,paving,.07)
  for side in [-1,1]:strip('Front curb',[(side*.38,-.98),(side*half,-.98)],.045,paving,.07)
  bays=[]
  if asset=='parking-small':
   for x in [-.4,.4]:bays.append((x-.29,x+.29,-.1,.57))
  else:
   for side in [-1,1]:
    for z in [-.60,-.10,.40]:bays.append((-.92 if side<0 else .32,-.32 if side<0 else .92,z-.20,z+.20))
  for left,right,front,back in bays:
   # Three sides leave each bay visibly open toward the driving aisle.
   if asset=='parking-small':lines=[[(left,front),(left,back)],[(left,back),(right,back)],[(right,back),(right,front)]]
   else:
    closed=left if right<0 else right
    lines=[[(left,front),(right,front)],[(closed,front),(closed,back)],[(left,back),(right,back)]]
   for line in lines:strip('Parking bay marking',line,.024,paint,.075)
  # The driveway stays the same height as the road: no buried overlay plane.
  strip('Driveway center',[(0,-.9),(0,-.55)],.025,paint,.075)
 export(asset)
asset='car'
box('Body',(0,0,.33),(.65,1.15,.28),carpaint,.09);box('Cabin',(0,.06,.58),(.53,.6,.28),windowBlue,.07)
box('Roof',(0,.06,.74),(.54,.61,.06),carpaint,.025)
for x in [-.33,.33]:
 for y in [-.35,.35]:
  o=cyl('Wheel',(x,y,.20),.15,.09,dark,12);o.rotation_euler.y=math.pi/2
for x in [-.2,.2]:box('Headlight',(x,-.58,.36),(.13,.025,.08),lamp,.01)
export('car')

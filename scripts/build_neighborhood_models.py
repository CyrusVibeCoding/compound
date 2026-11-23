"""Editable neighborhood expansion. Uses the same materials, scale and batching as city assets."""
from pathlib import Path
exec(Path(__file__).with_name('build_city_models.py').read_text().split('# Basic cottage,')[0])
pink=material('Petal pink','#db8c9b');yellow=material('Butter yellow','#efd58a');purple=material('Berry purple','#9c799f')
def bench(y):
 box('Bench seat',(0,y,.43),(.65,.23,.07),wood)
 box('Bench back',(0,y+.10,.57),(.65,.05,.24),wood)
 for x in [-.23,.23]:box('Bench legs',(x,y,.3),(.05,.12,.22),metal)
def door():
 box('Doorway',(.43,-.065,.70),(.40,.02,.98),dark)
 hinge=bpy.data.objects.new('ShopDoor',None);bpy.context.collection.objects.link(hinge);hinge.location=(.23,-.09,.70)
 for name,loc,size,mat in [('Door',(.43,-.09,.70),(.4,.06,.98),teal),('Door glass',(.43,-.13,.86),(.28,.03,.5),windowBlue),('Handle',(.56,-.16,.62),(.025,.03,.15),wood)]:
  o=box(name,loc,size,mat);o.parent=hinge;o.location=Vector(loc)-hinge.location
 box('ShopWindow',(-.48,-.11,.77),(.66,.04,.57),windowBlue)
for asset in ['flower-shop','ice-cream','market']:
 base();paint={'flower-shop':cream,'ice-cream':pink,'market':blueHouse}[asset]
 box('Shop walls',(0,.48,.75),(1.9,1.12,1.22),paint)
 box('Shop roof',(0,.48,1.42),(2.04,1.25,.15),teal if asset!='ice-cream' else cream)
 door()
 for i in range(8):box('Awning',(i*.25-.875,-.32,1.24),(.25,.62,.07),paint if i%2 else bright,.008)
 if asset=='flower-shop':
  for x in [-.75,-.40,-.05]:
   cyl('Flower bucket',(x,-.61,.32),.13,.30,teal,12)
   for dx in [-.06,.06]:
    cyl('Stem',(x+dx,-.61,.57),.012,.34,green,6);ball('Blossom',(x+dx,-.61,.75),(.09,.09,.075),pink if x<-.4 else yellow)
  box('Sign',(0,.32,1.62),(.65,.15,.25),cream)
  ball('Flower sign',(0,.22,1.68),(.15,.04,.14),pink)
 elif asset=='ice-cream':
  bpy.ops.mesh.primitive_cone_add(vertices=10,radius1=.03,radius2=.18,depth=.4,location=(0,.45,1.72));finish(bpy.context.object,'Giant cone',wood)
  ball('Strawberry scoop',(0,.45,1.98),(.24,.24,.23),pink)
  ball('Vanilla scoop',(.06,.45,2.19),(.18,.18,.17),cream)
  box('Serving ledge',(-.48,-.23,.49),(.78,.3,.08),bright)
 else:
  for x in [-.72,-.29]:
   box('Produce crate',(x,-.65,.31),(.38,.36,.25),wood)
   for dx in [-.09,.09]:
    for dy in [-.08,.08]:ball('Fresh produce',(x+dx,-.65+dy,.48),(.075,.075,.075),green if x<-.5 else clay)
  box('Market sign',(0,.39,1.67),(1.15,.16,.32),cream)
  for x in [-.3,0,.3]:box('Sign stripes',(x,.29,1.67),(.12,.03,.17),teal)
 export(asset)
asset='library'
base();box('Reading terrace',(0,0,.18),(2.1,2.1,.10),stone)
box('Library walls',(-.72,0,.8),(.69,1.35,1.25),cream)
roof('Gabled roof',-.72,0,1.43,.85,1.55,.35)
box('Library glass',(-.35,0,.9),(.025,.85,.6),windowBlue)
for y in [-.30,0,.30]:box('Books',(-.32,y,.75),(.045,.12,.34),teal if y==0 else clay)
for y in [-.7,.7]:bench(y)
box('Book table',(.5,0,.30),(.32,.4,.24),wood)
box('Open book',(.5,0,.445),(.27,.3,.035),cream)
export('library')
asset='playground'
base();box('Play surface',(0,0,.17),(2.1,2.1,.10),grass)
box('Play tower',(-.72,0,.66),(.5,.56,.85),yellow);roof('Gabled roof',-.72,0,1.1,.7,.76,.32)
slide=box('Slide',(-.75,-.60,.54),(.3,.7,.06),teal);slide.rotation_euler.x=math.radians(40)
for y,name in [(-.70,'SwingFront'),(.70,'SwingBack')]:
 for x in [-.39,.39]:box('Swing support',(x,y,.75),(.045,.05,1.15),metal)
 box('Swing beam',(0,y,1.34),(.88,.07,.07),wood)
 pivot=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(pivot);pivot.location=(0,y,1.3)
 for o in [box('Swing seat',(0,y,.43),(.52,.23,.06),wood),box('Rope',(-.22,y,.86),(.018,.018,.84),metal),box('Rope',(.22,y,.86),(.018,.018,.84),metal)]:
  loc=o.location.copy();o.parent=pivot;o.location=loc-pivot.location
export('playground')

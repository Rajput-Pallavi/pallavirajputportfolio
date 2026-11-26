import bpy, math, os
from mathutils import Vector

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
OUT=os.path.join(ROOT,'public','models')
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

def mat(name,color,rough=.55,metal=0.0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=rough; p.inputs['Metallic'].default_value=metal
    return m

skin=mat('Warm skin',(0.55,.29,.17),.58)
maroon=mat('Spiritual maroon robe',(.19,.008,.025),.65)
cream=mat('Cream wool scarf',(.88,.76,.56),.78)
gold=mat('Antique gold border',(.78,.39,.055),.3,.5)
hair=mat('Soft black curls',(.008,.005,.012),.68)
eye=mat('Deep brown eyes',(.045,.012,.006),.3)
white=mat('Eye highlights',(1,.96,.86),.25)
red=mat('Red bindi',(.62,.005,.012),.35)
boot=mat('Winter boot leather',(.09,.035,.018),.64)

def smooth(obj):
    if hasattr(obj.data,'polygons'):
        for p in obj.data.polygons: p.use_smooth=True

def sphere(name,loc,scale,material,segments=40):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=24,location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material); smooth(o); return o

def curve(name,points,bevel,material):
    data=bpy.data.curves.new(name,'CURVE'); data.dimensions='3D'; data.bevel_depth=bevel; data.bevel_resolution=4; data.resolution_u=16
    spline=data.splines.new('BEZIER'); spline.bezier_points.add(len(points)-1)
    for p,co in zip(spline.bezier_points,points): p.co=co; p.handle_left_type='AUTO'; p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(o); data.materials.append(material); return o

def capsule(name,a,b,r,material):
    a,b=Vector(a),Vector(b); direction=b-a
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=r,depth=direction.length,location=(a+b)/2)
    o=bpy.context.object; o.name=name; o.rotation_mode='QUATERNION'; o.rotation_quaternion=direction.to_track_quat('Z','Y')
    o.data.materials.append(material); smooth(o)
    for cap in (sphere(name+' cap A',a,(r,r,r),material,32),sphere(name+' cap B',b,(r,r,r),material,32)):
        world=cap.matrix_world.copy(); cap.parent=o; cap.matrix_world=world
    return o

# Compact humanoid rig supports walking, Namaste, sitting and desk poses.
arm=bpy.data.armatures.new('PallaviChibiRig'); rig=bpy.data.objects.new('PallaviChibiRig',arm); bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig; rig.select_set(True); bpy.ops.object.mode_set(mode='EDIT')
def bone(name,head,tail,parent=None):
    b=arm.edit_bones.new(name); b.head=head; b.tail=tail
    if parent: b.parent=arm.edit_bones.get(parent)
    return b
bone('root',(0,0,.03),(0,0,.14)); bone('pelvis',(0,0,.58),(0,0,.73),'root')
bone('spine',(0,0,.73),(0,0,1.02),'pelvis'); bone('neck',(0,0,1.02),(0,0,1.16),'spine'); bone('head',(0,0,1.16),(0,0,1.55),'neck')
for side,s in [('L',1),('R',-1)]:
    bone(f'upper_arm.{side}',(.18*s,0,.99),(.31*s,0,.82),'spine')
    bone(f'forearm.{side}',(.31*s,0,.82),(.38*s,-.02,.67),f'upper_arm.{side}')
    bone(f'hand.{side}',(.38*s,-.02,.67),(.4*s,-.055,.60),f'forearm.{side}')
    bone(f'index.{side}',(.4*s,-.055,.62),(.42*s,-.075,.57),f'hand.{side}')
    bone(f'thigh.{side}',(.09*s,0,.61),(.1*s,0,.36),'pelvis')
    bone(f'shin.{side}',(.1*s,0,.36),(.1*s,0,.14),f'thigh.{side}')
    bone(f'foot.{side}',(.1*s,0,.14),(.1*s,-.16,.08),f'shin.{side}')
bpy.ops.object.mode_set(mode='OBJECT'); rig.show_in_front=True

def attach(obj,bone_name):
    world=obj.matrix_world.copy(); obj.parent=rig; obj.parent_type='BONE'; obj.parent_bone=bone_name; obj.matrix_world=world

# Rounded chibi face.
attach(sphere('Rounded chibi head',(0,-.005,1.42),(.34,.29,.33),skin,64),'head')
attach(sphere('Cheek.L',(.18,-.268,1.35),(.09,.025,.065),skin),'head')
attach(sphere('Cheek.R',(-.18,-.268,1.35),(.09,.025,.065),skin),'head')
for side in (-1,1):
    x=.105*side
    attach(sphere(f'Eye.{side}',(x,-.292,1.45),(.052,.012,.07),eye),'head')
    attach(sphere(f'Eye sparkle.{side}',(x-.014*side,-.305,1.48),(.013,.006,.017),white,24),'head')
    attach(curve(f'Brow.{side}',[(x-.05,-.295,1.545),(x,-.31,1.56),(x+.05,-.295,1.545)],.006,hair),'head')
attach(curve('Gentle smile',[(-.07,-.304,1.31),(0,-.318,1.285),(.07,-.304,1.31)],.007,red),'head')
attach(sphere('Bindi',(0,-.306,1.56),(.017,.007,.022),red,28),'head')

# Short layered curls and soft fringe.
curl_positions=[]
for ring_z,radius,count in ((1.65,.28,12),(1.54,.31,14),(1.42,.31,14),(1.30,.27,12)):
    for i in range(count):
        angle=2*math.pi*i/count
        if math.sin(angle)<-.72 and ring_z<1.55: continue
        curl_positions.append((math.cos(angle)*radius,math.sin(angle)*.245+.015,ring_z))
for i,pos in enumerate(curl_positions): attach(sphere(f'Curl.{i:02d}',pos,(.085,.072,.085),hair,28),'head')
for side in (-1,1):
    attach(curve(f'Face curl.{side}',[(.12*side,-.245,1.67),(.22*side,-.27,1.53),(.2*side,-.28,1.37)],.025,hair),'head')

# Matching maroon winter cap with a cream brim and soft pom-pom.
attach(sphere('Maroon winter cap',(0,.015,1.74),(.27,.23,.16),maroon,56),'head')
bpy.ops.mesh.primitive_torus_add(major_radius=.245,minor_radius=.028,major_segments=64,minor_segments=16,location=(0,-.005,1.65))
cap_brim=bpy.context.object; cap_brim.name='Cream cap brim'; cap_brim.scale.y=.88; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
cap_brim.data.materials.append(cream); smooth(cap_brim); attach(cap_brim,'head')
attach(sphere('Cream cap pom-pom',(0,.02,1.89),(.075,.07,.075),cream,36),'head')

# Robe is a custom smooth loft rather than stacked primitives.
def robe_mesh():
    rings=[(.48,.34,.21),(.62,.31,.19),(.83,.25,.17),(1.02,.22,.16)]
    segments=64; verts=[]; faces=[]
    for z,rx,ry in rings:
        for i in range(segments):
            a=2*math.pi*i/segments; verts.append((math.cos(a)*rx,math.sin(a)*ry,z))
    for r in range(len(rings)-1):
        for i in range(segments):
            n=(i+1)%segments; a=r*segments+i; b=r*segments+n
            faces.append((a,b,b+segments,a+segments))
    mesh=bpy.data.meshes.new('Chibi robe mesh'); mesh.from_pydata(verts,[],faces); mesh.update()
    o=bpy.data.objects.new('Maroon spiritual robe',mesh); bpy.context.collection.objects.link(o); o.data.materials.append(maroon); smooth(o); return o
attach(robe_mesh(),'spine')

# Articulated sleeves, hands and legs.
for side,s in [('L',1),('R',-1)]:
    upper=capsule(f'Upper sleeve.{side}',(.18*s,0,.98),(.31*s,0,.82),.085,maroon); attach(upper,f'upper_arm.{side}')
    lower=capsule(f'Lower sleeve.{side}',(.31*s,0,.82),(.38*s,-.02,.69),.07,maroon); attach(lower,f'forearm.{side}')
    attach(sphere(f'Hand.{side}',(.395*s,-.035,.64),(.07,.055,.085),skin),f'hand.{side}')
    attach(capsule(f'Leg.{side}',(.1*s,0,.55),(.1*s,0,.17),.09,cream),f'thigh.{side}')
    attach(sphere(f'Winter boot.{side}',(.1*s,-.075,.11),(.12,.18,.12),boot),f'foot.{side}')

# Cream scarf with long ends.
attach(curve('Scarf collar',[(-.2,-.08,1.03),(0,-.19,1.08),(.2,-.08,1.03)],.045,cream),'spine')
attach(curve('Scarf end.L',[(-.18,-.12,1.04),(-.26,-.17,.83),(-.25,-.15,.57)],.055,cream),'spine')
attach(curve('Scarf end.R',[(.18,-.12,1.04),(.25,-.17,.84),(.23,-.15,.62)],.055,cream),'spine')

# Gold borders and simple sacred motifs.
attach(curve('Gold neckline',[(-.13,-.162,1.0),(0,-.177,.94),(.13,-.162,1.0)],.009,gold),'spine')
attach(curve('Gold hem',[(-.31,-.19,.51),(0,-.23,.48),(.31,-.19,.51)],.012,gold),'pelvis')
for z in (.88,.76,.64): attach(sphere(f'Gold motif {z}',(0,-.18,z),(.018,.007,.018),gold,24),'spine')

bpy.context.scene.world.color=(.025,.035,.055)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'pallavi-chibi.blend'))
print('PALLAVI_CHIBI_PREVIEW_SOURCE_OK')

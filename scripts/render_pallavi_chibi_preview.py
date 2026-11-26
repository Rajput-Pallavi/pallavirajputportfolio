import bpy, os
from mathutils import Vector

def aim(obj,target): obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()

bpy.ops.object.camera_add(location=(2.55,-5.0,2.15)); camera=bpy.context.object; camera.data.lens=68; aim(camera,(0,-.02,.9)); bpy.context.scene.camera=camera
for location,energy,color,size in [((-2.4,-3.2,4),1100,(1,.78,.62),4),((3,-1,2.8),850,(.55,.72,1),3),((0,2.5,3.5),950,(1,.38,.22),2.5)]:
    bpy.ops.object.light_add(type='AREA',location=location); light=bpy.context.object; light.data.energy=energy; light.data.color=color; light.data.shape='DISK'; light.data.size=size; aim(light,(0,0,1))
bpy.ops.mesh.primitive_plane_add(size=10,location=(0,0,-.01)); ground=bpy.context.object
gm=bpy.data.materials.new('Preview ground'); gm.diffuse_color=(.045,.065,.095,1); ground.data.materials.append(gm)
scene=bpy.context.scene; scene.render.engine='BLENDER_EEVEE'; scene.render.resolution_x=640; scene.render.resolution_y=800; scene.render.resolution_percentage=100
scene.view_settings.look='AgX - Medium High Contrast'; scene.render.image_settings.file_format='PNG'; scene.render.filepath=os.path.join(os.path.dirname(__file__),'pallavi-chibi-preview.png')
bpy.ops.render.render(write_still=True)

import bpy, os

root=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
output=os.path.join(root,'public','models','pallavi.glb')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=output,
    export_format='GLB',
    use_selection=True,
    export_skins=True,
    export_animations=True,
    export_apply=False,
)
print('PALLAVI_CHIBI_GLB_OK')

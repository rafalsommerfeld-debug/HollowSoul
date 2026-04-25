# Hollow Unity Room Importer

This folder contains a Unity Editor importer for `hollow-room-unity-layout` JSON files exported from Hollow Room Lab.

## Install

Put the `HollowRoomUnityImporter` folder anywhere under a Unity project's `Assets` folder. Unity will compile the importer because the script lives under `Editor/`.

## Import A Room

1. Put an exported `*-unity-room.json` file somewhere under the Unity project's `Assets` folder.
2. In Unity, open `Tools > Hollow > Import Room JSON`.
3. Assign the JSON file to `JSON File`.
4. Optional: create a prefab library via `Assets > Create > Hollow > Room Prefab Library`.
5. Add entries for prefab keys such as `GroundTile`, `SolidWall`, `SolidWallRun`, `Doorway`, `SecretWallEntrance`, `Rock`, `ItemSpawn`, `EnemyFlyingSpawn`, and `DecorTall`.
6. Press `Import Room Into Scene`.

If no prefab library is assigned, or a specific key is missing, the importer can create primitive cube/sphere fallback objects so you can validate layout scale and placement immediately.

## Door Gaps

By default the importer uses individual wall segments and skips wall segments where doors or secret entrances exist. If you enable wall runs, walls are more efficient and continuous, but doors will be placed on top of the wall run instead of cutting an actual opening.

## Merge Imported Meshes

After importing, you can optimize stable room geometry with `Tools > Hollow > Merge Selected Meshes`.

Typical floor workflow:

1. Select the imported `Terrain` group, or select only the specific ground tile objects you want to merge.
2. Open `Tools > Hollow > Merge Selected Meshes`.
3. Keep `Include children of selected objects` enabled if you selected a group.
4. Keep `Preserve material submeshes` enabled when selected meshes use multiple materials.
5. Press `Merge Selected Meshes`.

The tool creates a new merged mesh object under the common parent, can save the generated mesh into `Assets/HollowMergedMeshes`, and can deactivate the original tile objects so the scene stays reversible.

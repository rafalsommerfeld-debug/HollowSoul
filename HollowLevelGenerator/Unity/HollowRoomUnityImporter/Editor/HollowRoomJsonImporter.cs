#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;

[CreateAssetMenu(menuName = "Hollow/Room Prefab Library", fileName = "HollowRoomPrefabLibrary")]
public sealed class HollowRoomPrefabLibrary : ScriptableObject
{
    public List<Entry> entries = new List<Entry>();

    [Serializable]
    public sealed class Entry
    {
        public string prefabKey;
        public GameObject prefab;
    }

    public GameObject Find(string prefabKey)
    {
        if (string.IsNullOrWhiteSpace(prefabKey))
        {
            return null;
        }

        foreach (Entry entry in entries)
        {
            if (entry != null && entry.prefabKey == prefabKey)
            {
                return entry.prefab;
            }
        }

        return null;
    }
}

public sealed class HollowRoomJsonImporter : EditorWindow
{
    private TextAsset jsonFile;
    private HollowRoomPrefabLibrary prefabLibrary;
    private Transform parentOverride;
    private bool useWallRuns;
    private bool leaveDoorGaps = true;
    private bool createHoleMarkers = true;
    private bool createPrimitiveFallbacks = true;
    private bool scalePrefabsToExportedMeters = true;
    private bool addBoxColliders = true;
    private bool markStatic = true;

    private Material floorMaterial;
    private Material holeMaterial;
    private Material wallMaterial;
    private Material doorMaterial;
    private Material secretWallMaterial;
    private Material rockMaterial;
    private Material enemySpawnMaterial;
    private Material itemSpawnMaterial;
    private Material decorMaterial;

    [MenuItem("Tools/Hollow/Import Room JSON")]
    public static void ShowWindow()
    {
        HollowRoomJsonImporter window = GetWindow<HollowRoomJsonImporter>();
        window.titleContent = new GUIContent("Hollow Room Importer");
        window.minSize = new Vector2(420, 560);
    }

    private void OnGUI()
    {
        EditorGUILayout.LabelField("Hollow Room JSON", EditorStyles.boldLabel);
        jsonFile = (TextAsset)EditorGUILayout.ObjectField("JSON File", jsonFile, typeof(TextAsset), false);
        prefabLibrary = (HollowRoomPrefabLibrary)EditorGUILayout.ObjectField(
            "Prefab Library",
            prefabLibrary,
            typeof(HollowRoomPrefabLibrary),
            false
        );
        parentOverride = (Transform)EditorGUILayout.ObjectField(
            "Parent Override",
            parentOverride,
            typeof(Transform),
            true
        );

        EditorGUILayout.Space(10);
        EditorGUILayout.LabelField("Geometry", EditorStyles.boldLabel);
        useWallRuns = EditorGUILayout.ToggleLeft("Use wall runs instead of individual wall segments", useWallRuns);
        using (new EditorGUI.DisabledScope(useWallRuns))
        {
            leaveDoorGaps = EditorGUILayout.ToggleLeft("Leave wall gaps where doors / secret entrances exist", leaveDoorGaps);
        }
        createHoleMarkers = EditorGUILayout.ToggleLeft("Create visible hole markers", createHoleMarkers);
        createPrimitiveFallbacks = EditorGUILayout.ToggleLeft("Create primitive fallback objects when prefab is missing", createPrimitiveFallbacks);
        scalePrefabsToExportedMeters = EditorGUILayout.ToggleLeft("Scale prefabs to exported meter sizes", scalePrefabsToExportedMeters);
        addBoxColliders = EditorGUILayout.ToggleLeft("Add BoxCollider to primitive solid geometry", addBoxColliders);
        markStatic = EditorGUILayout.ToggleLeft("Mark generated room geometry static", markStatic);

        EditorGUILayout.Space(10);
        EditorGUILayout.LabelField("Fallback Materials", EditorStyles.boldLabel);
        floorMaterial = (Material)EditorGUILayout.ObjectField("Floor", floorMaterial, typeof(Material), false);
        holeMaterial = (Material)EditorGUILayout.ObjectField("Hole", holeMaterial, typeof(Material), false);
        wallMaterial = (Material)EditorGUILayout.ObjectField("Wall", wallMaterial, typeof(Material), false);
        doorMaterial = (Material)EditorGUILayout.ObjectField("Door", doorMaterial, typeof(Material), false);
        secretWallMaterial = (Material)EditorGUILayout.ObjectField("Secret Wall", secretWallMaterial, typeof(Material), false);
        rockMaterial = (Material)EditorGUILayout.ObjectField("Rock", rockMaterial, typeof(Material), false);
        enemySpawnMaterial = (Material)EditorGUILayout.ObjectField("Enemy Spawn", enemySpawnMaterial, typeof(Material), false);
        itemSpawnMaterial = (Material)EditorGUILayout.ObjectField("Item Spawn", itemSpawnMaterial, typeof(Material), false);
        decorMaterial = (Material)EditorGUILayout.ObjectField("Decor", decorMaterial, typeof(Material), false);

        EditorGUILayout.Space(16);
        using (new EditorGUI.DisabledScope(jsonFile == null))
        {
            if (GUILayout.Button("Import Room Into Scene", GUILayout.Height(36)))
            {
                ImportSelectedJson();
            }
        }

        EditorGUILayout.HelpBox(
            "Prefab keys come from the export, for example GroundTile, SolidWall, SolidWallRun, Doorway, SecretWallEntrance, Rock, ItemSpawn, EnemyFlyingSpawn, DecorTall.",
            MessageType.Info
        );
    }

    private void ImportSelectedJson()
    {
        if (jsonFile == null)
        {
            EditorUtility.DisplayDialog("Hollow Importer", "Choose a Hollow Unity JSON file first.", "OK");
            return;
        }

        HollowUnityRoomExport export;
        try
        {
            export = JsonUtility.FromJson<HollowUnityRoomExport>(jsonFile.text);
        }
        catch (Exception error)
        {
            EditorUtility.DisplayDialog("Hollow Importer", $"Could not parse JSON:\n{error.Message}", "OK");
            return;
        }

        if (export == null || export.schema != "hollow-room-unity-layout")
        {
            EditorUtility.DisplayDialog(
                "Hollow Importer",
                "This file is not a Hollow Unity room export.",
                "OK"
            );
            return;
        }

        Undo.IncrementCurrentGroup();
        Undo.SetCurrentGroupName($"Import Hollow Room {export.room?.name}");
        int undoGroup = Undo.GetCurrentGroup();

        GameObject root = new GameObject(SafeName(export.room?.name, "HollowRoom"));
        Undo.RegisterCreatedObjectUndo(root, "Create Hollow room root");
        if (parentOverride != null)
        {
            root.transform.SetParent(parentOverride, false);
        }

        Transform terrain = CreateGroup(root.transform, "Terrain");
        Transform holes = CreateGroup(root.transform, "Holes");
        Transform walls = CreateGroup(root.transform, "Walls");
        Transform entrances = CreateGroup(root.transform, "Entrances");
        Transform enemySpawns = CreateGroup(root.transform, "EnemySpawns");
        Transform itemSpawns = CreateGroup(root.transform, "ItemSpawns");
        Transform props = CreateGroup(root.transform, "Props");
        Transform decor = CreateGroup(root.transform, "Decor");

        HashSet<string> entranceWallKeys = BuildEntranceWallKeySet(export);

        foreach (HollowTile tile in SafeArray(export.geometry?.floorTiles))
        {
            CreateTile(tile, terrain);
        }

        if (createHoleMarkers)
        {
            foreach (HollowTile tile in SafeArray(export.geometry?.holeTiles))
            {
                CreateTile(tile, holes);
            }
        }

        if (useWallRuns)
        {
            foreach (HollowWall wall in SafeArray(export.geometry?.walls?.runs))
            {
                CreateWall(wall, walls);
            }
        }
        else
        {
            foreach (HollowWall wall in SafeArray(export.geometry?.walls?.segments))
            {
                if (leaveDoorGaps && entranceWallKeys.Contains(WallKey(wall.grid?.tileX ?? 0, wall.grid?.tileY ?? 0, wall.grid?.wall)))
                {
                    continue;
                }

                CreateWall(wall, walls);
            }
        }

        foreach (HollowWallAnchor door in SafeArray(export.geometry?.doors))
        {
            CreateWallAnchor(door, entrances);
        }

        foreach (HollowWallAnchor secret in SafeArray(export.geometry?.secretWallEntrances))
        {
            CreateWallAnchor(secret, entrances);
        }

        foreach (HollowOccupant enemy in SafeArray(export.spawnPoints?.enemies))
        {
            CreateOccupant(enemy, enemySpawns);
        }

        foreach (HollowOccupant item in SafeArray(export.spawnPoints?.items))
        {
            CreateOccupant(item, itemSpawns);
        }

        foreach (HollowOccupant rock in SafeArray(export.props?.rocks))
        {
            CreateOccupant(rock, props);
        }

        foreach (HollowOccupant entry in SafeArray(export.props?.decor))
        {
            CreateOccupant(entry, decor);
        }

        Selection.activeGameObject = root;
        Undo.CollapseUndoOperations(undoGroup);
        EditorUtility.DisplayDialog(
            "Hollow Importer",
            $"Imported {export.room?.name ?? "room"} into the scene.",
            "OK"
        );
    }

    private Transform CreateGroup(Transform parent, string name)
    {
        GameObject group = new GameObject(name);
        Undo.RegisterCreatedObjectUndo(group, "Create Hollow room group");
        group.transform.SetParent(parent, false);
        return group.transform;
    }

    private void CreateTile(HollowTile tile, Transform parent)
    {
        string prefabKey = tile.prefabKey;
        Vector3 position = ToVector3(tile.unity?.center);
        Vector3 size = ToVector3(tile.unity?.size, Vector3.one);
        if (tile.terrain == "ground")
        {
            position.y += size.y * 0.5f;
        }
        else
        {
            position.y -= 0.02f;
            size.y = Mathf.Max(0.02f, size.y * 0.35f);
        }

        GameObject instance = CreateMappedObject(
            prefabKey,
            SafeName(tile.id, prefabKey),
            parent,
            position,
            Quaternion.identity,
            size,
            tile.terrain == "hole" ? PrimitiveType.Cube : PrimitiveType.Cube,
            tile.terrain == "hole" ? holeMaterial : floorMaterial
        );

        SetSolidFlags(instance, tile.terrain == "ground");
    }

    private void CreateWall(HollowWall wall, Transform parent)
    {
        GameObject instance = CreateMappedObject(
            wall.prefabKey,
            SafeName(wall.id, wall.prefabKey),
            parent,
            ToVector3(wall.unity?.position),
            Quaternion.Euler(0f, wall.unity?.rotationYDegrees ?? 0f, 0f),
            ToVector3(wall.unity?.scaleMeters, Vector3.one),
            PrimitiveType.Cube,
            wallMaterial
        );

        SetSolidFlags(instance, true);
    }

    private void CreateWallAnchor(HollowWallAnchor anchor, Transform parent)
    {
        Material fallbackMaterial = anchor.type == "secret-wall-entrance"
            ? secretWallMaterial
            : doorMaterial;
        GameObject instance = CreateMappedObject(
            anchor.prefabKey,
            SafeName(anchor.id, anchor.prefabKey),
            parent,
            ToVector3(anchor.unity?.position),
            Quaternion.Euler(0f, anchor.unity?.rotationYDegrees ?? 0f, 0f),
            ToVector3(anchor.unity?.scaleMeters, Vector3.one),
            PrimitiveType.Cube,
            fallbackMaterial
        );

        SetSolidFlags(instance, anchor.blocksMovementUntilOpened);
    }

    private void CreateOccupant(HollowOccupant occupant, Transform parent)
    {
        Material fallbackMaterial = FallbackMaterialForOccupant(occupant);
        bool isSolid = occupant.family == "rock" || occupant.family == "decor";
        Vector3 position = ToVector3(occupant.unity?.position);
        Vector3 scale = EstimateOccupantScale(occupant);
        if (isSolid)
        {
            position.y += scale.y * 0.5f;
        }
        else
        {
            position.y += 0.08f;
        }

        GameObject instance = CreateMappedObject(
            occupant.prefabKey,
            SafeName(occupant.id, occupant.prefabKey),
            parent,
            position,
            Quaternion.Euler(0f, occupant.unity?.rotationYDegrees ?? 0f, 0f),
            scale,
            isSolid ? PrimitiveType.Cube : PrimitiveType.Sphere,
            fallbackMaterial
        );

        SetSolidFlags(instance, isSolid);
    }

    private GameObject CreateMappedObject(
        string prefabKey,
        string name,
        Transform parent,
        Vector3 position,
        Quaternion rotation,
        Vector3 fallbackScale,
        PrimitiveType fallbackPrimitive,
        Material fallbackMaterial
    )
    {
        GameObject prefab = prefabLibrary != null ? prefabLibrary.Find(prefabKey) : null;
        GameObject instance;

        if (prefab != null)
        {
            instance = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
            Undo.RegisterCreatedObjectUndo(instance, $"Create {name}");
            instance.name = name;
            instance.transform.SetParent(parent, false);
            instance.transform.SetPositionAndRotation(position, rotation);
            if (scalePrefabsToExportedMeters)
            {
                instance.transform.localScale = fallbackScale;
            }
        }
        else if (createPrimitiveFallbacks)
        {
            instance = GameObject.CreatePrimitive(fallbackPrimitive);
            Undo.RegisterCreatedObjectUndo(instance, $"Create {name}");
            instance.name = $"{name}__fallback";
            instance.transform.SetParent(parent, false);
            instance.transform.SetPositionAndRotation(position, rotation);
            instance.transform.localScale = fallbackScale;
            ApplyMaterial(instance, fallbackMaterial);
        }
        else
        {
            instance = new GameObject(name);
            Undo.RegisterCreatedObjectUndo(instance, $"Create {name}");
            instance.transform.SetParent(parent, false);
            instance.transform.SetPositionAndRotation(position, rotation);
        }

        return instance;
    }

    private void SetSolidFlags(GameObject instance, bool solid)
    {
        if (instance == null)
        {
            return;
        }

        if (!solid)
        {
            if (instance.name.EndsWith("__fallback", StringComparison.Ordinal))
            {
                foreach (Collider collider in instance.GetComponents<Collider>())
                {
                    Undo.DestroyObjectImmediate(collider);
                }
            }
            return;
        }

        if (addBoxColliders && solid && instance.GetComponent<Collider>() == null)
        {
            Undo.AddComponent<BoxCollider>(instance);
        }

        if (markStatic && solid)
        {
            GameObjectUtility.SetStaticEditorFlags(
                instance,
                StaticEditorFlags.BatchingStatic |
                StaticEditorFlags.NavigationStatic |
                StaticEditorFlags.OccluderStatic |
                StaticEditorFlags.OccludeeStatic
            );
        }
    }

    private void ApplyMaterial(GameObject instance, Material material)
    {
        if (material == null)
        {
            return;
        }

        Renderer renderer = instance.GetComponent<Renderer>();
        if (renderer != null)
        {
            renderer.sharedMaterial = material;
        }
    }

    private Material FallbackMaterialForOccupant(HollowOccupant occupant)
    {
        if (occupant.family == "enemy")
        {
            return enemySpawnMaterial;
        }

        if (occupant.family == "item")
        {
            return itemSpawnMaterial;
        }

        if (occupant.family == "decor")
        {
            return decorMaterial;
        }

        if (occupant.type == "rock")
        {
            return rockMaterial;
        }

        return null;
    }

    private Vector3 EstimateOccupantScale(HollowOccupant occupant)
    {
        if (occupant.family == "enemy")
        {
            return new Vector3(0.55f, 0.18f, 0.55f);
        }

        if (occupant.family == "item")
        {
            return new Vector3(0.38f, 0.14f, 0.38f);
        }

        if (occupant.family == "decor")
        {
            float height = Mathf.Max(1f, occupant.heightMeters > 0f ? occupant.heightMeters : 1f);
            return new Vector3(0.5f, height, 0.5f);
        }

        if (occupant.type == "rock")
        {
            return new Vector3(0.82f, 0.72f, 0.82f);
        }

        return new Vector3(0.5f, 0.5f, 0.5f);
    }

    private HashSet<string> BuildEntranceWallKeySet(HollowUnityRoomExport export)
    {
        HashSet<string> result = new HashSet<string>();
        foreach (HollowWallAnchor anchor in SafeArray(export.geometry?.doors))
        {
            result.Add(WallKey(anchor.grid?.tileX ?? 0, anchor.grid?.tileY ?? 0, anchor.grid?.wall));
        }

        foreach (HollowWallAnchor anchor in SafeArray(export.geometry?.secretWallEntrances))
        {
            result.Add(WallKey(anchor.grid?.tileX ?? 0, anchor.grid?.tileY ?? 0, anchor.grid?.wall));
        }

        return result;
    }

    private static string WallKey(int tileX, int tileY, string wall)
    {
        return $"{tileX},{tileY}:{wall}";
    }

    private static T[] SafeArray<T>(T[] values)
    {
        return values ?? Array.Empty<T>();
    }

    private static Vector3 ToVector3(HollowVector3 source)
    {
        return ToVector3(source, Vector3.zero);
    }

    private static Vector3 ToVector3(HollowVector3 source, Vector3 fallback)
    {
        if (source == null)
        {
            return fallback;
        }

        return new Vector3(source.x, source.y, source.z);
    }

    private static string SafeName(string value, string fallback)
    {
        string source = string.IsNullOrWhiteSpace(value) ? fallback : value;
        if (string.IsNullOrWhiteSpace(source))
        {
            source = "HollowObject";
        }

        foreach (char invalid in Path.GetInvalidFileNameChars())
        {
            source = source.Replace(invalid, '_');
        }

        return source.Replace('/', '_').Replace('\\', '_');
    }
}

[Serializable]
public sealed class HollowUnityRoomExport
{
    public string schema;
    public int version;
    public HollowRoom room;
    public HollowGeometry geometry;
    public HollowSpawnPoints spawnPoints;
    public HollowProps props;
}

[Serializable]
public sealed class HollowRoom
{
    public string id;
    public string name;
    public HollowRoomTemplate template;
    public HollowSize2 sizeTiles;
}

[Serializable]
public sealed class HollowRoomTemplate
{
    public string id;
    public string name;
    public string summary;
    public int widthTiles;
    public int heightTiles;
}

[Serializable]
public sealed class HollowSize2
{
    public int width;
    public int height;
}

[Serializable]
public sealed class HollowGeometry
{
    public HollowTile[] tiles;
    public HollowTile[] floorTiles;
    public HollowTile[] holeTiles;
    public HollowWalls walls;
    public HollowWallAnchor[] doors;
    public HollowWallAnchor[] secretWallEntrances;
}

[Serializable]
public sealed class HollowWalls
{
    public HollowWall[] segments;
    public HollowWall[] runs;
}

[Serializable]
public sealed class HollowTile
{
    public string id;
    public string key;
    public HollowGridPoint grid;
    public HollowTileUnity unity;
    public string terrain;
    public string prefabKey;
    public bool walkable;
    public string occupant;
}

[Serializable]
public sealed class HollowTileUnity
{
    public HollowVector3 center;
    public HollowVector3 size;
}

[Serializable]
public sealed class HollowWall
{
    public string id;
    public string type;
    public string prefabKey;
    public HollowWallGrid grid;
    public HollowTransform unity;
    public string spanAxis;
    public float lengthMeters;
}

[Serializable]
public sealed class HollowWallAnchor
{
    public string id;
    public string type;
    public string prefabKey;
    public bool blocksMovementUntilOpened;
    public HollowWallGrid grid;
    public HollowTransform unity;
    public HollowOpening opening;
    public HollowVector3 insideTileCenter;
    public HollowVector3 outsideTileCenter;
}

[Serializable]
public sealed class HollowOpening
{
    public float widthMeters;
    public float heightMeters;
    public string direction;
}

[Serializable]
public sealed class HollowSpawnPoints
{
    public HollowOccupant[] enemies;
    public HollowOccupant[] items;
}

[Serializable]
public sealed class HollowProps
{
    public HollowOccupant[] rocks;
    public HollowOccupant[] decor;
}

[Serializable]
public sealed class HollowOccupant
{
    public string id;
    public string type;
    public string family;
    public string label;
    public string prefabKey;
    public HollowGridPoint grid;
    public HollowOccupantUnity unity;
    public int heightBlocks;
    public float heightMeters;
}

[Serializable]
public sealed class HollowOccupantUnity
{
    public HollowVector3 position;
    public float rotationYDegrees;
    public HollowFootprint footprintMeters;
}

[Serializable]
public sealed class HollowFootprint
{
    public float x;
    public float z;
}

[Serializable]
public sealed class HollowWallGrid
{
    public int tileX;
    public int tileY;
    public int startTileX;
    public int startTileY;
    public string wall;
    public int lengthTiles;
    public HollowGridPointF edgeCenter;
    public HollowGridPoint insideTile;
    public HollowGridPoint outsideTile;
}

[Serializable]
public sealed class HollowTransform
{
    public HollowVector3 position;
    public float rotationYDegrees;
    public HollowVector3 scaleMeters;
}

[Serializable]
public sealed class HollowGridPoint
{
    public int x;
    public int y;
}

[Serializable]
public sealed class HollowGridPointF
{
    public float x;
    public float y;
}

[Serializable]
public sealed class HollowVector3
{
    public float x;
    public float y;
    public float z;
}
#endif

#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;

public sealed class HollowMeshMergeTool : EditorWindow
{
    private string mergedObjectName = "Merged_Hollow_Mesh";
    private bool includeChildren = true;
    private bool preserveMaterials = true;
    private bool deactivateSources = true;
    private bool addMeshCollider;
    private bool markStatic = true;
    private bool recalculateNormals;
    private bool saveMeshAsset = true;
    private string meshAssetFolder = "Assets/HollowMergedMeshes";

    [MenuItem("Tools/Hollow/Merge Selected Meshes")]
    public static void ShowWindow()
    {
        HollowMeshMergeTool window = GetWindow<HollowMeshMergeTool>();
        window.titleContent = new GUIContent("Hollow Mesh Merge");
        window.minSize = new Vector2(420, 430);
        window.RefreshDefaultName();
    }

    [MenuItem("Tools/Hollow/Merge Selected Meshes", true)]
    private static bool ValidateShowWindow()
    {
        return Selection.gameObjects != null && Selection.gameObjects.Length > 0;
    }

    private void OnSelectionChange()
    {
        RefreshDefaultName();
        Repaint();
    }

    private void OnGUI()
    {
        EditorGUILayout.LabelField("Selection", EditorStyles.boldLabel);
        MeshSourceSelection selection = CollectSelection(includeChildren);
        EditorGUILayout.LabelField("Selected GameObjects", Selection.gameObjects.Length.ToString());
        EditorGUILayout.LabelField("Mergeable Mesh Filters", selection.sources.Count.ToString());
        EditorGUILayout.LabelField("Estimated Source Vertices", selection.vertexCount.ToString());

        EditorGUILayout.Space(10);
        EditorGUILayout.LabelField("Merge Options", EditorStyles.boldLabel);
        mergedObjectName = EditorGUILayout.TextField("Merged Object Name", mergedObjectName);
        includeChildren = EditorGUILayout.ToggleLeft("Include children of selected objects", includeChildren);
        preserveMaterials = EditorGUILayout.ToggleLeft("Preserve material submeshes", preserveMaterials);
        deactivateSources = EditorGUILayout.ToggleLeft("Deactivate source mesh objects after merge", deactivateSources);
        addMeshCollider = EditorGUILayout.ToggleLeft("Add MeshCollider to merged object", addMeshCollider);
        markStatic = EditorGUILayout.ToggleLeft("Mark merged object static", markStatic);
        recalculateNormals = EditorGUILayout.ToggleLeft("Recalculate normals after merge", recalculateNormals);

        EditorGUILayout.Space(10);
        EditorGUILayout.LabelField("Asset Output", EditorStyles.boldLabel);
        saveMeshAsset = EditorGUILayout.ToggleLeft("Save generated mesh as an asset", saveMeshAsset);
        using (new EditorGUI.DisabledScope(!saveMeshAsset))
        {
            meshAssetFolder = EditorGUILayout.TextField("Mesh Asset Folder", meshAssetFolder);
        }

        EditorGUILayout.Space(16);
        using (new EditorGUI.DisabledScope(selection.sources.Count == 0))
        {
            if (GUILayout.Button("Merge Selected Meshes", GUILayout.Height(36)))
            {
                MergeSelectedMeshes();
            }
        }

        EditorGUILayout.HelpBox(
            "Typical room workflow: select the imported Terrain group or a hand-picked set of ground tiles, leave Include Children on, then merge. Use wall segments if you need door gaps before merging walls.",
            MessageType.Info
        );
    }

    private void RefreshDefaultName()
    {
        if (Selection.activeGameObject == null)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(mergedObjectName) || mergedObjectName == "Merged_Hollow_Mesh")
        {
            mergedObjectName = $"{Selection.activeGameObject.name}_Merged";
        }
    }

    private void MergeSelectedMeshes()
    {
        MeshSourceSelection selection = CollectSelection(includeChildren);
        if (selection.sources.Count == 0)
        {
            EditorUtility.DisplayDialog(
                "Hollow Mesh Merge",
                "Select one or more GameObjects with MeshFilter + MeshRenderer components.",
                "OK"
            );
            return;
        }

        Transform parent = FindCommonParent(selection.sources);
        GameObject mergedObject = new GameObject(SafeName(mergedObjectName, "Merged_Hollow_Mesh"));
        Undo.RegisterCreatedObjectUndo(mergedObject, "Create merged mesh");
        if (parent != null)
        {
            mergedObject.transform.SetParent(parent, false);
        }

        Matrix4x4 targetWorldToLocal = mergedObject.transform.worldToLocalMatrix;
        Mesh mergedMesh = preserveMaterials
            ? BuildMaterialPreservingMesh(selection.sources, targetWorldToLocal, out Material[] materials)
            : BuildSingleMaterialMesh(selection.sources, targetWorldToLocal, out materials);

        mergedMesh.name = $"{mergedObject.name}_Mesh";
        if (recalculateNormals)
        {
            mergedMesh.RecalculateNormals();
        }
        mergedMesh.RecalculateBounds();

        if (saveMeshAsset)
        {
            string assetPath = SaveMeshAsset(mergedMesh, mergedObject.name);
            mergedMesh = AssetDatabase.LoadAssetAtPath<Mesh>(assetPath);
        }

        MeshFilter filter = Undo.AddComponent<MeshFilter>(mergedObject);
        MeshRenderer renderer = Undo.AddComponent<MeshRenderer>(mergedObject);
        filter.sharedMesh = mergedMesh;
        renderer.sharedMaterials = materials;

        if (addMeshCollider)
        {
            MeshCollider collider = Undo.AddComponent<MeshCollider>(mergedObject);
            collider.sharedMesh = mergedMesh;
        }

        if (markStatic)
        {
            GameObjectUtility.SetStaticEditorFlags(
                mergedObject,
                StaticEditorFlags.BatchingStatic |
                StaticEditorFlags.NavigationStatic |
                StaticEditorFlags.OccluderStatic |
                StaticEditorFlags.OccludeeStatic
            );
        }

        if (deactivateSources)
        {
            foreach (MeshSource source in selection.sources)
            {
                Undo.RecordObject(source.filter.gameObject, "Deactivate merged source");
                source.filter.gameObject.SetActive(false);
            }
        }

        Selection.activeGameObject = mergedObject;
        EditorUtility.DisplayDialog(
            "Hollow Mesh Merge",
            $"Merged {selection.sources.Count} meshes into {mergedObject.name}.",
            "OK"
        );
    }

    private Mesh BuildMaterialPreservingMesh(
        List<MeshSource> sources,
        Matrix4x4 targetWorldToLocal,
        out Material[] materials
    )
    {
        List<Material> materialList = new List<Material>();
        List<List<CombineInstance>> combinesByMaterial = new List<List<CombineInstance>>();

        foreach (MeshSource source in sources)
        {
            Mesh mesh = source.filter.sharedMesh;
            Material[] sourceMaterials = source.renderer.sharedMaterials;
            int subMeshCount = mesh.subMeshCount;
            for (int subMesh = 0; subMesh < subMeshCount; subMesh += 1)
            {
                Material material = ResolveMaterial(sourceMaterials, subMesh);
                int materialIndex = materialList.IndexOf(material);
                if (materialIndex < 0)
                {
                    materialList.Add(material);
                    combinesByMaterial.Add(new List<CombineInstance>());
                    materialIndex = materialList.Count - 1;
                }

                combinesByMaterial[materialIndex].Add(new CombineInstance
                {
                    mesh = mesh,
                    subMeshIndex = subMesh,
                    transform = targetWorldToLocal * source.filter.transform.localToWorldMatrix,
                });
            }
        }

        List<Mesh> temporaryMeshes = new List<Mesh>();
        List<CombineInstance> finalCombines = new List<CombineInstance>();
        for (int index = 0; index < materialList.Count; index += 1)
        {
            Material material = materialList[index];
            Mesh materialMesh = new Mesh
            {
                indexFormat = IndexFormat.UInt32,
                name = $"{material?.name ?? "NoMaterial"}_Combined",
            };
            materialMesh.CombineMeshes(combinesByMaterial[index].ToArray(), true, true);
            temporaryMeshes.Add(materialMesh);
            finalCombines.Add(new CombineInstance
            {
                mesh = materialMesh,
                transform = Matrix4x4.identity,
            });
        }

        Mesh merged = new Mesh
        {
            indexFormat = IndexFormat.UInt32,
        };
        merged.CombineMeshes(finalCombines.ToArray(), false, false);

        foreach (Mesh temporaryMesh in temporaryMeshes)
        {
            DestroyImmediate(temporaryMesh);
        }

        materials = materialList.ToArray();
        return merged;
    }

    private Mesh BuildSingleMaterialMesh(
        List<MeshSource> sources,
        Matrix4x4 targetWorldToLocal,
        out Material[] materials
    )
    {
        List<CombineInstance> combines = new List<CombineInstance>();
        Material firstMaterial = null;

        foreach (MeshSource source in sources)
        {
            Mesh mesh = source.filter.sharedMesh;
            Material[] sourceMaterials = source.renderer.sharedMaterials;
            if (firstMaterial == null)
            {
                firstMaterial = ResolveMaterial(sourceMaterials, 0);
            }

            int subMeshCount = mesh.subMeshCount;
            for (int subMesh = 0; subMesh < subMeshCount; subMesh += 1)
            {
                combines.Add(new CombineInstance
                {
                    mesh = mesh,
                    subMeshIndex = subMesh,
                    transform = targetWorldToLocal * source.filter.transform.localToWorldMatrix,
                });
            }
        }

        Mesh merged = new Mesh
        {
            indexFormat = IndexFormat.UInt32,
        };
        merged.CombineMeshes(combines.ToArray(), true, true);
        materials = firstMaterial == null
            ? new Material[0]
            : new[] { firstMaterial };
        return merged;
    }

    private MeshSourceSelection CollectSelection(bool includeChildMeshes)
    {
        MeshSourceSelection result = new MeshSourceSelection();
        HashSet<MeshFilter> seen = new HashSet<MeshFilter>();
        foreach (GameObject selected in Selection.gameObjects)
        {
            if (selected == null)
            {
                continue;
            }

            MeshFilter[] filters = includeChildMeshes
                ? selected.GetComponentsInChildren<MeshFilter>(true)
                : selected.GetComponents<MeshFilter>();

            foreach (MeshFilter filter in filters)
            {
                if (
                    filter == null ||
                    filter.sharedMesh == null ||
                    filter.sharedMesh.subMeshCount == 0 ||
                    !seen.Add(filter)
                )
                {
                    continue;
                }

                MeshRenderer renderer = filter.GetComponent<MeshRenderer>();
                if (renderer == null)
                {
                    continue;
                }

                result.sources.Add(new MeshSource(filter, renderer));
                result.vertexCount += filter.sharedMesh.vertexCount;
            }
        }

        return result;
    }

    private Transform FindCommonParent(List<MeshSource> sources)
    {
        if (sources.Count == 0)
        {
            return null;
        }

        Transform common = sources[0].filter.transform.parent;
        while (common != null)
        {
            bool allMatch = true;
            foreach (MeshSource source in sources)
            {
                if (!source.filter.transform.IsChildOf(common))
                {
                    allMatch = false;
                    break;
                }
            }

            if (allMatch)
            {
                return common;
            }

            common = common.parent;
        }

        return null;
    }

    private Material ResolveMaterial(Material[] materials, int subMeshIndex)
    {
        if (materials == null || materials.Length == 0)
        {
            return null;
        }

        return materials[Mathf.Clamp(subMeshIndex, 0, materials.Length - 1)];
    }

    private string SaveMeshAsset(Mesh mesh, string objectName)
    {
        EnsureAssetFolder(meshAssetFolder);
        string path = AssetDatabase.GenerateUniqueAssetPath(
            $"{meshAssetFolder.TrimEnd('/')}/{SafeName(objectName, "MergedMesh")}.asset"
        );
        AssetDatabase.CreateAsset(mesh, path);
        AssetDatabase.SaveAssets();
        return path;
    }

    private void EnsureAssetFolder(string folderPath)
    {
        string normalized = string.IsNullOrWhiteSpace(folderPath)
            ? "Assets/HollowMergedMeshes"
            : folderPath.Replace('\\', '/').TrimEnd('/');
        if (AssetDatabase.IsValidFolder(normalized))
        {
            meshAssetFolder = normalized;
            return;
        }

        string[] parts = normalized.Split('/');
        string current = parts[0] == "Assets" ? "Assets" : "Assets";
        for (int index = parts[0] == "Assets" ? 1 : 0; index < parts.Length; index += 1)
        {
            string next = $"{current}/{parts[index]}";
            if (!AssetDatabase.IsValidFolder(next))
            {
                AssetDatabase.CreateFolder(current, parts[index]);
            }
            current = next;
        }
        meshAssetFolder = normalized == "Assets" || normalized.StartsWith("Assets/", StringComparison.Ordinal)
            ? normalized
            : $"Assets/{normalized}";
    }

    private static string SafeName(string value, string fallback)
    {
        string source = string.IsNullOrWhiteSpace(value) ? fallback : value;
        if (string.IsNullOrWhiteSpace(source))
        {
            source = "MergedMesh";
        }

        foreach (char invalid in Path.GetInvalidFileNameChars())
        {
            source = source.Replace(invalid, '_');
        }

        return source.Replace('/', '_').Replace('\\', '_');
    }

    private readonly struct MeshSource
    {
        public readonly MeshFilter filter;
        public readonly MeshRenderer renderer;

        public MeshSource(MeshFilter filter, MeshRenderer renderer)
        {
            this.filter = filter;
            this.renderer = renderer;
        }
    }

    private sealed class MeshSourceSelection
    {
        public readonly List<MeshSource> sources = new List<MeshSource>();
        public int vertexCount;
    }
}
#endif

(function () {
  "use strict";

  const STORAGE_KEY = "hollow-room-lab-state-v1";
  const EMPTY_PROJECT_NAME = "Untitled Room";
  const HISTORY_LIMIT = 80;
  const COLLECTION_ALL = "all";
  const COLLECTION_UNSORTED = "uncategorized";
  const ROOM_CHUNK_WIDTH = 13;
  const ROOM_CHUNK_HEIGHT = 7;
  const FLOOR_CHUNK_SIZE = 96;
  const UNITY_TILE_SIZE_METERS = 1;
  const UNITY_FLOOR_THICKNESS_METERS = 0.08;
  const UNITY_WALL_HEIGHT_METERS = 2.5;
  const UNITY_WALL_THICKNESS_METERS = 0.16;
  const UNITY_DOOR_HEIGHT_METERS = 2.2;
  const FLOOR_GRID_PADDING_CHUNKS = 2;
  const CUSTOM_TEMPLATE_MIN_WIDTH = ROOM_CHUNK_WIDTH;
  const CUSTOM_TEMPLATE_MIN_HEIGHT = ROOM_CHUNK_HEIGHT;
  const CUSTOM_TEMPLATE_MAX_WIDTH = ROOM_CHUNK_WIDTH * 4;
  const CUSTOM_TEMPLATE_MAX_HEIGHT = ROOM_CHUNK_HEIGHT * 4;
  const DEFAULT_CUSTOM_TEMPLATE_WIDTH = ROOM_CHUNK_WIDTH;
  const DEFAULT_CUSTOM_TEMPLATE_HEIGHT = ROOM_CHUNK_HEIGHT;
  const TEMPLATE_ID_ALIASES = {
    "medium-room-25x7": "medium-room-26x7",
    "medium-room-13x13": "medium-room-13x14",
    "large-room-25x25": "large-room-26x14",
  };
  const ROOM_TYPES = [
    { id: "combat", label: "Combat" },
    { id: "treasure", label: "Treasure" },
    { id: "challenge", label: "Challenge" },
    { id: "boss", label: "Boss" },
    { id: "mini-boss", label: "Mini-Boss" },
    { id: "secret", label: "Secret" },
    { id: "super-secret", label: "Super Secret" },
    { id: "open-relaxed", label: "Open (Relaxed)" },
    { id: "open-levers", label: "Open (Levers)" },
    { id: "open-traps", label: "Open (Traps)" },
    { id: "start", label: "Start" },
    { id: "shop", label: "Shop" },
    { id: "double-boss", label: "Double-Boss" },
  ];
  const REWARD_TYPES = [
    { id: "", label: "No Reward" },
    { id: "small", label: "Small" },
    { id: "medium", label: "Medium" },
    { id: "big", label: "Big" },
    { id: "special", label: "Special" },
  ];
  const DIFFICULTY_LEVELS = [
    { id: "", label: "Unrated" },
    { id: "1", label: "1 - Easy" },
    { id: "2", label: "2 - Normal" },
    { id: "3", label: "3 - Hard" },
    { id: "4", label: "4 - Brutal" },
    { id: "5", label: "5 - Nightmare" },
  ];
  const ENTRY_DIRECTIONS = [
    { id: "any", label: "Any" },
    { id: "north", label: "North" },
    { id: "south", label: "South" },
    { id: "east", label: "East" },
    { id: "west", label: "West" },
    { id: "multiple", label: "Multiple" },
  ];
  const PROTOTYPE_STATUSES = [
    { id: "draft", label: "Draft" },
    { id: "prototype", label: "Prototype" },
    { id: "playtest", label: "Playtest" },
    { id: "approved", label: "Approved" },
    { id: "archived", label: "Archived" },
  ];
  const DEFAULT_PROJECT_METADATA = {
    roomType: "combat",
    difficulty: "",
    tags: [],
    notes: "",
    intendedEntryDirection: "any",
    encounterPurpose: "",
    rewardType: "",
    chapterFloor: "",
    prototypeStatus: "draft",
  };

  const TOOLS = [
    {
      id: "brush",
      label: "Brush",
      hint: "Paint tile by tile while dragging.",
      shortcut: "B",
    },
    {
      id: "rectangle",
      label: "Rectangle",
      hint: "Drag X and Y to fill a larger area.",
      shortcut: "R",
    },
  ];

  const DOOR_DIRECTIONS = [
    { id: "north", label: "North", shortcut: "N" },
    { id: "south", label: "South", shortcut: "S" },
    { id: "east", label: "East", shortcut: "E" },
    { id: "west", label: "West", shortcut: "W" },
  ];

  const ENEMY_VARIANTS = [
    {
      id: "enemy-standard",
      family: "enemy",
      label: "Standard",
      hint: "Grounded basic foe",
      shortcut: "Q",
      cellLabel: "Enemy spawn · Standard",
      legendLabel: "Enemy · Standard",
      legendDescription: "Default grounded enemy spawn.",
    },
    {
      id: "enemy-flying",
      family: "enemy",
      label: "Floating / Flying",
      hint: "Aerial movement type",
      shortcut: "W",
      cellLabel: "Enemy spawn · Floating / Flying",
      legendLabel: "Enemy · Floating / Flying",
      legendDescription: "Flying spawn that reads as an aerial threat.",
    },
    {
      id: "enemy-spitting-pod",
      family: "enemy",
      label: "Spitting Pod",
      hint: "Organic ranged pod",
      shortcut: "E",
      cellLabel: "Enemy spawn · Spitting Pod",
      legendLabel: "Enemy · Spitting Pod",
      legendDescription: "Stationary organic pod that spits projectiles.",
    },
    {
      id: "enemy-static-shooter",
      family: "enemy",
      label: "Static Shooter",
      hint: "Turret-style ranged threat",
      shortcut: "T",
      cellLabel: "Enemy spawn · Static Shooter",
      legendLabel: "Enemy · Static Shooter",
      legendDescription: "Stationary ranged shooter or turret encounter.",
    },
    {
      id: "enemy-cocoon",
      family: "enemy",
      label: "Spider-Spawner Cocoon",
      hint: "Spawner / cocoon nest",
      shortcut: "Y",
      cellLabel: "Enemy spawn · Spider-Spawner Cocoon",
      legendLabel: "Enemy · Spider-Spawner Cocoon",
      legendDescription: "Breakable cocoon or nest that spawns spider enemies.",
    },
  ];

  const DECOR_VARIANTS = [
    {
      id: "decor-short",
      family: "decor",
      label: "Decor · Short",
      hint: "1 block high",
      shortcut: "Z",
      cellLabel: "Decor · Short (1 block high)",
      legendLabel: "Decor · Short",
      legendDescription: "Short decorative blocker silhouette, about 1 block high.",
    },
    {
      id: "decor-medium",
      family: "decor",
      label: "Decor · Medium",
      hint: "2 blocks high",
      shortcut: "X",
      cellLabel: "Decor · Medium (2 blocks high)",
      legendLabel: "Decor · Medium",
      legendDescription: "Medium decorative silhouette, about 2 blocks high.",
    },
    {
      id: "decor-tall",
      family: "decor",
      label: "Decor · Tall",
      hint: "3 blocks high",
      shortcut: "C",
      cellLabel: "Decor · Tall (3 blocks high)",
      legendLabel: "Decor · Tall",
      legendDescription: "Tall decorative silhouette, about 3 blocks high.",
    },
  ];

  const OCCUPANT_DEFINITIONS = {
    rock: {
      id: "rock",
      family: "rock",
      label: "Rock",
      hint: "Obstruction",
      cellLabel: "Rock obstruction",
      legendLabel: "Rock",
      legendDescription: "Placed on ground as an obstruction marker.",
    },
    item: {
      id: "item",
      family: "item",
      label: "Item Spawn",
      hint: "Reward point",
      cellLabel: "Item spawn point",
      legendLabel: "Item Spawn",
      legendDescription: "Marks a pickup or reward position.",
    },
  };

  ENEMY_VARIANTS.forEach((variant) => {
    OCCUPANT_DEFINITIONS[variant.id] = variant;
  });

  DECOR_VARIANTS.forEach((variant) => {
    OCCUPANT_DEFINITIONS[variant.id] = variant;
  });

  const OCCUPANT_IDS = Object.keys(OCCUPANT_DEFINITIONS);
  const VARIANT_FAMILIES = {
    enemy: {
      id: "enemy",
      label: "Enemy Type",
      helper: "Pick which enemy spawn marker to paint.",
      options: ENEMY_VARIANTS,
    },
    decor: {
      id: "decor",
      label: "Decor Height",
      helper: "Choose short, medium, or tall decor silhouettes.",
      options: DECOR_VARIANTS,
    },
  };

  const PAINTS = [
    {
      id: "ground",
      label: "Ground",
      hint: "Walkable floor",
      shortcut: "1",
      type: "terrain",
    },
    {
      id: "hole",
      label: "Hole",
      hint: "Traversal break",
      shortcut: "2",
      type: "terrain",
    },
    {
      id: "rock",
      label: "Rock",
      hint: "Obstruction",
      shortcut: "3",
      type: "entity",
      occupantId: "rock",
    },
    {
      id: "enemy",
      label: "Enemy Spawn",
      hint: "Typed combat start",
      shortcut: "4",
      type: "entity",
      variantFamily: "enemy",
    },
    {
      id: "item",
      label: "Item Spawn",
      hint: "Reward point",
      shortcut: "5",
      type: "entity",
      occupantId: "item",
    },
    {
      id: "decor",
      label: "Decor",
      hint: "1-3 block scenery",
      shortcut: "8",
      type: "entity",
      variantFamily: "decor",
    },
    {
      id: "door",
      label: "Door",
      hint: "Auto outer wall anchor",
      shortcut: "6",
      type: "door",
    },
    {
      id: "secret-wall",
      label: "Secret Wall",
      hint: "Auto breakable entrance",
      shortcut: "7",
      type: "wall",
    },
  ];

  const BUILT_IN_ROOM_TEMPLATES = buildTemplates();
  const BUILT_IN_TEMPLATE_IDS = new Set(
    BUILT_IN_ROOM_TEMPLATES.map((template) => template.id)
  );
  let ROOM_TEMPLATES = [];
  let TEMPLATE_MAP = {};
  rebuildTemplateRegistry([]);

  const root = document.getElementById("board-grid");
  const floorBuilder = document.getElementById("floor-builder");
  const roomEditorTab = document.getElementById("room-editor-tab");
  const floorBuilderTab = document.getElementById("floor-builder-tab");
  const toolbar = document.getElementById("toolbar");
  const toolbarPanel = toolbar?.closest(".panel--toolbar");
  const templatePicker = document.getElementById("template-picker");
  const projectList = document.getElementById("project-list");
  const boardTitle = document.getElementById("board-title");
  const boardSummary = document.getElementById("board-summary");
  const projectMeta = document.getElementById("project-meta");
  const hoverReadout = document.getElementById("hover-readout");
  const statsPanel = document.getElementById("stats-panel");
  const legendItems = document.getElementById("legend-items");
  const projectNameInput = document.getElementById("project-name-input");
  const projectCollectionSelect = document.getElementById("project-collection-select");
  const activeProjectNameInput = document.getElementById("active-project-name");
  const activeProjectCollectionSelect = document.getElementById(
    "active-project-collection"
  );
  const metadataRoomTypeSelect = document.getElementById("metadata-room-type");
  const metadataRewardTypeSelect = document.getElementById("metadata-reward-type");
  const metadataDifficultySelect = document.getElementById("metadata-difficulty");
  const metadataEntryDirectionSelect = document.getElementById(
    "metadata-entry-direction"
  );
  const metadataPrototypeStatusSelect = document.getElementById(
    "metadata-prototype-status"
  );
  const metadataChapterFloorInput = document.getElementById("metadata-chapter-floor");
  const metadataEncounterPurposeInput = document.getElementById(
    "metadata-encounter-purpose"
  );
  const metadataTagsInput = document.getElementById("metadata-tags");
  const metadataNotesInput = document.getElementById("metadata-notes");
  const createProjectButton = document.getElementById("create-project-button");
  const customTemplateNameInput = document.getElementById("custom-template-name");
  const customTemplateWidthInput = document.getElementById("custom-template-width");
  const customTemplateHeightInput = document.getElementById("custom-template-height");
  const customTemplateGrid = document.getElementById("custom-template-grid");
  const customTemplateSummary = document.getElementById("custom-template-summary");
  const templateEditorBlankButton = document.getElementById("template-editor-blank-button");
  const templateEditorFromSelectedButton = document.getElementById(
    "template-editor-from-selected-button"
  );
  const templateEditorFillButton = document.getElementById("template-editor-fill-button");
  const templateEditorClearButton = document.getElementById("template-editor-clear-button");
  const saveCustomTemplateButton = document.getElementById("save-custom-template-button");
  const collectionNameInput = document.getElementById("collection-name-input");
  const createCollectionButton = document.getElementById("create-collection-button");
  const collectionFilter = document.getElementById("collection-filter");
  const undoButton = document.getElementById("undo-button");
  const redoButton = document.getElementById("redo-button");
  const mirrorHorizontalButton = document.getElementById("mirror-horizontal-button");
  const mirrorVerticalButton = document.getElementById("mirror-vertical-button");
  const rotateClockwiseButton = document.getElementById("rotate-clockwise-button");
  const rotateCounterclockwiseButton = document.getElementById(
    "rotate-counterclockwise-button"
  );
  const toggleDoorAnchorHelperButton = document.getElementById(
    "toggle-door-anchor-helper-button"
  );
  const duplicateProjectButton = document.getElementById("duplicate-project-button");
  const resetProjectButton = document.getElementById("reset-project-button");
  const deleteProjectButton = document.getElementById("delete-project-button");
  const exportProjectButton = document.getElementById("export-project-button");
  const exportUnityJsonButton = document.getElementById("export-unity-json-button");
  const exportRcpJsonButton = document.getElementById("export-rcp-json-button");
  const exportRealityKitUsdaButton = document.getElementById(
    "export-realitykit-usda-button"
  );
  const exportPngButton = document.getElementById("export-png-button");
  const exportJpegButton = document.getElementById("export-jpeg-button");
  const exportFloorJsonButton = document.getElementById("export-floor-json-button");
  const exportFloorPngButton = document.getElementById("export-floor-png-button");
  const importProjectButton = document.getElementById("import-project-button");
  const importFileInput = document.getElementById("import-file-input");

  const state = loadState();
  const history = {
    undo: [],
    redo: [],
  };
  const ui = {
    workspaceMode: "room",
    selectedTemplateId: ROOM_TEMPLATES[0].id,
    selectedTool: "brush",
    selectedPaint: "ground",
    selectedVariants: {
      enemy: ENEMY_VARIANTS[0].id,
      decor: DECOR_VARIANTS[0].id,
    },
    hoverKey: null,
    previewKeys: new Set(),
    drag: null,
    floorDrag: null,
    floorPaletteProjectId: "",
    showDoorAnchorHelper: true,
    templateEditor: createDefaultTemplateEditorState(),
    templateEditorDragMode: null,
    boundBoardTemplateId: null,
    renameSnapshot: null,
    metadataSnapshot: null,
    storageAvailable: true,
    storageWarningShown: false,
  };

  initialize();

  function initialize() {
    ensureProjectExists();
    persist();
    projectNameInput.value = "";
    bindEvents();
    renderAll();
  }

  function bindEvents() {
    roomEditorTab.addEventListener("click", () => setWorkspaceMode("room"));
    floorBuilderTab.addEventListener("click", () => setWorkspaceMode("floor"));
    createProjectButton.addEventListener("click", handleCreateProject);
    undoButton.addEventListener("click", handleUndo);
    redoButton.addEventListener("click", handleRedo);
    mirrorHorizontalButton.addEventListener("click", () =>
      handleTransformProject("mirror-horizontal")
    );
    mirrorVerticalButton.addEventListener("click", () =>
      handleTransformProject("mirror-vertical")
    );
    rotateClockwiseButton.addEventListener("click", () =>
      handleTransformProject("rotate-clockwise")
    );
    rotateCounterclockwiseButton.addEventListener("click", () =>
      handleTransformProject("rotate-counterclockwise")
    );
    toggleDoorAnchorHelperButton.addEventListener("click", handleToggleDoorAnchorHelper);
    duplicateProjectButton.addEventListener("click", handleDuplicateProject);
    resetProjectButton.addEventListener("click", handleResetProject);
    deleteProjectButton.addEventListener("click", handleDeleteProject);
    exportProjectButton.addEventListener("click", handleExportProject);
    exportUnityJsonButton.addEventListener("click", handleExportUnityJson);
    exportRcpJsonButton.addEventListener("click", handleExportRealityComposerJson);
    exportRealityKitUsdaButton.addEventListener("click", handleExportRealityKitUsda);
    exportPngButton.addEventListener("click", () => handleExportImage("png"));
    exportJpegButton.addEventListener("click", () => handleExportImage("jpeg"));
    exportFloorJsonButton.addEventListener("click", handleExportFloorJson);
    exportFloorPngButton.addEventListener("click", handleExportFloorPng);
    importProjectButton.addEventListener("click", () => importFileInput.click());
    importFileInput.addEventListener("change", handleImportProject);
    projectCollectionSelect.addEventListener("change", () => {
      if (state.activeCollectionId !== COLLECTION_ALL) {
        state.activeCollectionId =
          projectCollectionSelect.value || COLLECTION_UNSORTED;
        persist();
        renderCollectionControls();
        renderProjectList();
      }
    });

    projectNameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        handleCreateProject();
      }
    });

    customTemplateNameInput.addEventListener("input", (event) => {
      ui.templateEditor.name = sanitizeProjectName(event.target.value);
    });
    customTemplateWidthInput.addEventListener("change", handleTemplateEditorSizeChange);
    customTemplateHeightInput.addEventListener("change", handleTemplateEditorSizeChange);
    customTemplateGrid.addEventListener("pointerdown", handleTemplateEditorPointerDown);
    customTemplateGrid.addEventListener("pointermove", handleTemplateEditorPointerMove);
    templateEditorBlankButton.addEventListener("click", handleTemplateEditorBlank);
    templateEditorFromSelectedButton.addEventListener(
      "click",
      handleTemplateEditorFromSelected
    );
    templateEditorFillButton.addEventListener("click", handleTemplateEditorFill);
    templateEditorClearButton.addEventListener("click", handleTemplateEditorClear);
    saveCustomTemplateButton.addEventListener("click", handleSaveCustomTemplate);
    collectionNameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        handleCreateCollection();
      }
    });
    createCollectionButton.addEventListener("click", handleCreateCollection);
    collectionFilter.addEventListener("click", handleCollectionFilterClick);

    activeProjectNameInput.addEventListener("input", (event) => {
      const project = getActiveProject();
      if (!project) {
        return;
      }

      if (!ui.renameSnapshot) {
        ui.renameSnapshot = captureHistorySnapshot();
      }
      project.name = sanitizeProjectName(event.target.value) || EMPTY_PROJECT_NAME;
      project.updatedAt = new Date().toISOString();
      persist();
      renderProjectList();
      renderBoardMeta();
      renderHistoryControls();
    });

    activeProjectNameInput.addEventListener("blur", () => {
      if (ui.renameSnapshot) {
        if (ui.renameSnapshot !== captureHistorySnapshot()) {
          pushUndoSnapshot(ui.renameSnapshot);
        }
        ui.renameSnapshot = null;
        renderHistoryControls();
      }
    });

    activeProjectCollectionSelect.addEventListener("change", (event) => {
      const project = getActiveProject();
      if (!project) {
        return;
      }

      const nextCollectionId = normalizeProjectCollectionValue(event.target.value);
      if ((project.collectionId || "") === nextCollectionId) {
        return;
      }

      pushUndoSnapshot(captureHistorySnapshot());
      project.collectionId = nextCollectionId;
      project.updatedAt = new Date().toISOString();
      pruneFloorGraphs();
      persist();
      renderAll();
    });

    bindMetadataEditorEvents();

    toolbar.addEventListener("click", handleToolbarClick);
    templatePicker.addEventListener("click", handleTemplateSelect);
    projectList.addEventListener("click", handleProjectListClick);
    floorBuilder.addEventListener("click", handleFloorBuilderClick);
    floorBuilder.addEventListener("change", handleFloorBuilderChange);
    floorBuilder.addEventListener("pointerdown", handleFloorBuilderPointerDown);

    root.addEventListener("pointerdown", handleBoardPointerDown);
    root.addEventListener("pointermove", handleBoardPointerMove);
    root.addEventListener("pointerleave", () => {
      if (!ui.drag) {
        setHoverKey(null);
      }
    });

    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointerup", () => {
      ui.templateEditorDragMode = null;
    });
    window.addEventListener("keydown", handleShortcutKey);
  }

  function bindMetadataEditorEvents() {
    [
      { node: metadataRoomTypeSelect, field: "roomType" },
      { node: metadataRewardTypeSelect, field: "rewardType" },
      { node: metadataDifficultySelect, field: "difficulty" },
      { node: metadataEntryDirectionSelect, field: "intendedEntryDirection" },
      { node: metadataPrototypeStatusSelect, field: "prototypeStatus" },
    ].forEach(({ node, field }) => {
      if (!node) {
        return;
      }

      node.addEventListener("change", (event) => {
        updateProjectMetadataField(field, event.target.value, {
          pushHistory: true,
        });
      });
    });

    [
      { node: metadataChapterFloorInput, field: "chapterFloor" },
      { node: metadataEncounterPurposeInput, field: "encounterPurpose" },
      { node: metadataTagsInput, field: "tags" },
      { node: metadataNotesInput, field: "notes" },
    ].forEach(({ node, field }) => {
      if (!node) {
        return;
      }

      node.addEventListener("focus", () => {
        if (!ui.metadataSnapshot) {
          ui.metadataSnapshot = captureHistorySnapshot();
        }
      });
      node.addEventListener("input", (event) => {
        updateProjectMetadataField(field, event.target.value, {
          pushHistory: false,
          rerenderEditor: false,
        });
      });
      node.addEventListener("blur", handleMetadataTextBlur);
    });
  }

  function renderAll() {
    renderWorkspaceMode();
    renderToolbar();
    renderTemplatePicker();
    renderTemplateEditor();
    renderCollectionControls();
    renderProjectList();
    if (ui.workspaceMode === "floor") {
      renderFloorBuilder();
    } else {
      renderBoard();
      renderBoardMeta();
    }
    renderMetadataEditor();
    renderStats();
    renderLegendPanel();
    renderHistoryControls();
  }

  function setWorkspaceMode(mode) {
    const nextMode = mode === "floor" ? "floor" : "room";
    if (ui.workspaceMode === nextMode) {
      return;
    }

    ui.workspaceMode = nextMode;
    ui.drag = null;
    ui.floorDrag = null;
    clearPreview();
    setHoverKey(null);
    renderAll();
  }

  function renderWorkspaceMode() {
    const isFloorMode = ui.workspaceMode === "floor";
    roomEditorTab.classList.toggle("is-selected", !isFloorMode);
    floorBuilderTab.classList.toggle("is-selected", isFloorMode);
    roomEditorTab.setAttribute("aria-pressed", String(!isFloorMode));
    floorBuilderTab.setAttribute("aria-pressed", String(isFloorMode));

    if (toolbarPanel) {
      toolbarPanel.hidden = isFloorMode;
    }

    root.hidden = isFloorMode;
    floorBuilder.hidden = !isFloorMode;
  }

  function renderHistoryControls() {
    const project = getActiveProject();
    const isFloorMode = ui.workspaceMode === "floor";
    const activeFloorCollection = getActiveFloorCollection();
    undoButton.disabled = history.undo.length === 0;
    redoButton.disabled = history.redo.length === 0;
    mirrorHorizontalButton.disabled =
      isFloorMode || !project || !isTransformSupported(project, "mirror-horizontal");
    mirrorVerticalButton.disabled =
      isFloorMode || !project || !isTransformSupported(project, "mirror-vertical");
    rotateClockwiseButton.disabled =
      isFloorMode || !project || !isTransformSupported(project, "rotate-clockwise");
    rotateCounterclockwiseButton.disabled =
      isFloorMode || !project || !isTransformSupported(project, "rotate-counterclockwise");
    toggleDoorAnchorHelperButton.disabled = isFloorMode || !project;
    toggleDoorAnchorHelperButton.classList.toggle("is-selected", ui.showDoorAnchorHelper);
    toggleDoorAnchorHelperButton.textContent = ui.showDoorAnchorHelper
      ? "Hide Door Anchors"
      : "Show Door Anchors";
    toggleDoorAnchorHelperButton.setAttribute(
      "aria-pressed",
      String(ui.showDoorAnchorHelper)
    );
    exportProjectButton.disabled = isFloorMode || !project;
    exportUnityJsonButton.disabled = isFloorMode || !project;
    exportRcpJsonButton.disabled = isFloorMode || !project;
    exportRealityKitUsdaButton.disabled = isFloorMode || !project;
    exportPngButton.disabled = isFloorMode || !project;
    exportJpegButton.disabled = isFloorMode || !project;
    exportFloorJsonButton.disabled = !isFloorMode || !activeFloorCollection;
    exportFloorPngButton.disabled = !isFloorMode || !activeFloorCollection;
    duplicateProjectButton.disabled = isFloorMode || !project;
    resetProjectButton.disabled = isFloorMode || !project;
    deleteProjectButton.disabled = isFloorMode || !project;
  }

  function renderToolbar() {
    const activeVariantFamily = getActiveVariantFamily();
    const variantGroup = activeVariantFamily ? VARIANT_FAMILIES[activeVariantFamily] : null;

    toolbar.innerHTML = `
      <div class="tool-group">
        <h3 class="tool-group__title">Paint Tool</h3>
        <div class="tool-chip-row">
          ${TOOLS.map(
            (tool) => `
              <button
                class="tool-chip ${ui.selectedTool === tool.id ? "is-selected" : ""}"
                data-tool-id="${tool.id}"
                type="button"
              >
                <span class="tool-chip__title">${escapeHtml(tool.label)}</span>
                <span class="tool-chip__hint">${escapeHtml(formatChipMeta(tool.hint, tool.shortcut))}</span>
              </button>
            `
          ).join("")}
        </div>
      </div>
      <div class="tool-group">
        <h3 class="tool-group__title">Content</h3>
        <div class="tool-chip-row">
          ${PAINTS.map(
            (paint) => `
              <button
                class="tool-chip ${ui.selectedPaint === paint.id ? "is-selected" : ""}"
                data-paint-id="${paint.id}"
                type="button"
              >
                <span class="tool-chip__title">${escapeHtml(paint.label)}</span>
                <span class="tool-chip__hint">${escapeHtml(formatPaintHint(paint))}</span>
              </button>
            `
          ).join("")}
        </div>
      </div>
      <div class="tool-group ${variantGroup ? "" : "tool-group--muted"}">
        <h3 class="tool-group__title">${escapeHtml(variantGroup ? variantGroup.label : "Modifiers")}</h3>
        ${
          variantGroup
            ? `<div class="tool-chip-row">
                ${variantGroup.options
                  .map(
                    (variant) => `
                      <button
                        class="tool-chip ${
                          ui.selectedVariants[variantGroup.id] === variant.id ? "is-selected" : ""
                        }"
                        data-variant-family="${variantGroup.id}"
                        data-variant-id="${variant.id}"
                        type="button"
                      >
                        <span class="tool-chip__title">${escapeHtml(variant.label)}</span>
                        <span class="tool-chip__hint">${escapeHtml(
                          formatChipMeta(variant.hint, variant.shortcut)
                        )}</span>
                      </button>
                    `
                  )
                  .join("")}
              </div>`
            : `<p class="panel__subcopy">Pick <strong>Enemy Spawn</strong> or <strong>Decor</strong> to choose a subtype.</p>`
        }
      </div>
    `;
  }

  function formatChipMeta(hint, shortcut) {
    return shortcut ? `${hint} · ${shortcut}` : hint;
  }

  function formatPaintHint(paint) {
    if (paint.variantFamily) {
      const selected = OCCUPANT_DEFINITIONS[ui.selectedVariants[paint.variantFamily]];
      return formatChipMeta(
        `${paint.hint}${selected ? ` · ${selected.label}` : ""}`,
        paint.shortcut
      );
    }

    return formatChipMeta(paint.hint, paint.shortcut);
  }

  function getActiveVariantFamily() {
    return PAINTS.find((paint) => paint.id === ui.selectedPaint)?.variantFamily || null;
  }

  function renderTemplatePicker() {
    templatePicker.innerHTML = ROOM_TEMPLATES.map(
      (template) => `
        <button
          class="template-card ${ui.selectedTemplateId === template.id ? "is-selected" : ""}"
          data-template-id="${template.id}"
          type="button"
        >
          <div class="template-card__top">
            <span class="template-card__label">${escapeHtml(template.name)}</span>
            <span class="template-card__shape">${template.summary}</span>
          </div>
          <p class="project-card__meta">${escapeHtml(template.description)}</p>
          ${
            template.isCustom
              ? `<div class="template-card__badges"><span class="badge badge--custom">Custom</span></div>`
              : ""
          }
        </button>
      `
    ).join("");
  }

  function renderTemplateEditor() {
    const editor = ui.templateEditor;
    if (document.activeElement !== customTemplateNameInput) {
      customTemplateNameInput.value = editor.name;
    }
    if (document.activeElement !== customTemplateWidthInput) {
      customTemplateWidthInput.value = String(editor.width);
    }
    if (document.activeElement !== customTemplateHeightInput) {
      customTemplateHeightInput.value = String(editor.height);
    }

    const bounds = getCenteredBounds(editor.width, editor.height);
    customTemplateGrid.style.gridTemplateColumns = `repeat(${editor.width}, 18px)`;
    customTemplateGrid.innerHTML = "";

    for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
      for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
        const key = makeKey(x, y);
        const cellButton = document.createElement("button");
        cellButton.type = "button";
        cellButton.className = [
          "template-editor__cell",
          editor.cells.has(key) ? "is-active" : "",
          x === 0 && y === 0 ? "is-origin" : "",
        ]
          .filter(Boolean)
          .join(" ");
        cellButton.dataset.templateEditorKey = key;
        cellButton.dataset.gridX = String(x);
        cellButton.dataset.gridY = String(y);
        cellButton.setAttribute(
          "aria-label",
          `${formatCoordLabel(x, y)} ${editor.cells.has(key) ? "active" : "inactive"}`
        );
        customTemplateGrid.appendChild(cellButton);
      }
    }

    customTemplateSummary.textContent = `${editor.cells.size} active tile${
      editor.cells.size === 1 ? "" : "s"
    } in a ${editor.width} x ${editor.height} chunk-multiple editor. Click any mini tile to toggle its whole 13 x 7 chunk; the chunk containing 0,0 stays active as the reference point.`;
  }

  function renderCollectionControls() {
    const activeProject = getActiveProject();
    const collectionOptions = buildCollectionOptions();
    const preferredCollectionId = getPreferredNewProjectCollectionId();

    projectCollectionSelect.innerHTML = collectionOptions
      .map(
        (option) => `
          <option value="${escapeHtml(option.id)}">${escapeHtml(option.label)}</option>
        `
      )
      .join("");
    projectCollectionSelect.value = preferredCollectionId;

    activeProjectCollectionSelect.innerHTML = collectionOptions
      .map(
        (option) => `
          <option value="${escapeHtml(option.id)}">${escapeHtml(option.label)}</option>
        `
      )
      .join("");
    activeProjectCollectionSelect.value = activeProject?.collectionId || "";
    activeProjectCollectionSelect.disabled = !activeProject;

    const filterOptions = buildCollectionFilterOptions();
    collectionFilter.innerHTML = filterOptions
      .map(
        (option) => `
          <button
            class="collection-chip ${
              state.activeCollectionId === option.id ? "is-selected" : ""
            }"
            data-collection-filter="${escapeHtml(option.id)}"
            type="button"
          >
            <span>${escapeHtml(option.label)}</span>
            <span class="collection-chip__count">${option.count}</span>
          </button>
        `
      )
      .join("");
  }

  function renderProjectList() {
    const projects = getFilteredProjects();
    if (projects.length === 0) {
      projectList.innerHTML = `
        <div class="empty-state">
          No rooms in this collection yet. Create a room here, or switch back to All.
        </div>
      `;
      return;
    }

    projectList.innerHTML = projects
      .map((project) => {
        const template = TEMPLATE_MAP[project.templateId];
        const stats = calculateStats(project);
        const collectionLabel = getCollectionLabel(project.collectionId);
        const metadata = getProjectMetadata(project);
        const rewardBadge = metadata.rewardType
          ? `<span class="badge">${escapeHtml(
              getOptionLabel(REWARD_TYPES, metadata.rewardType)
            )} Reward</span>`
          : "";
        return `
          <button
            class="project-card ${project.id === state.activeProjectId ? "is-selected" : ""}"
            data-project-id="${project.id}"
            type="button"
          >
            <div class="project-card__top">
              <span class="project-card__label">${escapeHtml(project.name)}</span>
              <span class="template-card__shape">${escapeHtml(template.name)}</span>
            </div>
            <div class="project-card__badges">
              <span class="badge">${escapeHtml(collectionLabel)}</span>
              <span class="badge">${escapeHtml(getOptionLabel(ROOM_TYPES, metadata.roomType))}</span>
              <span class="badge">${escapeHtml(
                getOptionLabel(PROTOTYPE_STATUSES, metadata.prototypeStatus)
              )}</span>
              ${rewardBadge}
              ${template.isCustom ? `<span class="badge badge--custom">Custom Template</span>` : ""}
            </div>
            <div class="project-card__meta">
              ${stats.activeCount} tiles · ${stats.rockCount} rock · ${stats.enemyCount} enemy ·
              ${stats.decorCount} decor · ${stats.itemCount} item · ${stats.doorCount} door ·
              ${stats.secretWallCount} secret
            </div>
          </button>
        `;
      })
      .join("");
  }

  function renderBoard() {
    const project = getActiveProject();
    if (!project) {
      return;
    }

    const template = TEMPLATE_MAP[project.templateId];

    if (ui.boundBoardTemplateId !== template.id) {
      buildBoardGrid(template);
      ui.boundBoardTemplateId = template.id;
    }

    refreshBoardCells();
  }

  function buildBoardGrid(template) {
    root.style.gridTemplateColumns = `var(--axis-size) repeat(${template.width}, var(--cell-size))`;
    root.innerHTML = "";

    root.appendChild(createAxisNode("", "axis axis--corner"));

    for (let x = template.bounds.minX; x <= template.bounds.maxX; x += 1) {
      root.appendChild(
        createAxisNode(String(x), `axis axis--x ${x === 0 ? "is-origin" : ""}`)
      );
    }

    for (let y = template.bounds.minY; y <= template.bounds.maxY; y += 1) {
      root.appendChild(
        createAxisNode(String(y), `axis axis--y ${y === 0 ? "is-origin" : ""}`)
      );

      for (let x = template.bounds.minX; x <= template.bounds.maxX; x += 1) {
        const key = makeKey(x, y);
        const isActive = template.mask.has(key);

        if (isActive) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "cell";
          button.dataset.cellKey = key;
          button.dataset.gridX = String(x);
          button.dataset.gridY = String(y);
          button.innerHTML = `
            <span class="cell__origin"></span>
            <span class="cell__terrain-corners"></span>
            <span class="cell__tile-grid"></span>
            <span class="cell__anchor-guides"></span>
            <span class="cell__walls"></span>
            <span class="cell__doors"></span>
            <span class="cell__marker"></span>
          `;
          root.appendChild(button);
        } else {
          const slot = document.createElement("div");
          slot.className = "slot slot--inactive";
          slot.dataset.gridX = String(x);
          slot.dataset.gridY = String(y);
          root.appendChild(slot);
        }
      }
    }
  }

  function refreshBoardCells() {
    const project = getActiveProject();
    if (!project) {
      return;
    }

    const template = TEMPLATE_MAP[project.templateId];
    const cellNodes = root.querySelectorAll("[data-cell-key]");
    cellNodes.forEach((cellNode) => {
      const key = cellNode.dataset.cellKey;
      const cell = project.cells[key];
      const x = Number(cellNode.dataset.gridX);
      const y = Number(cellNode.dataset.gridY);
      const terrain = cell.terrain;
      const occupant = cell.occupant;
      const sameNorth = hasMatchingTerrain(project, x, y - 1, terrain);
      const sameSouth = hasMatchingTerrain(project, x, y + 1, terrain);
      const sameWest = hasMatchingTerrain(project, x - 1, y, terrain);
      const sameEast = hasMatchingTerrain(project, x + 1, y, terrain);
      const terrainCornerState = getTerrainCornerState(project, x, y, terrain);
      const groundSpriteState =
        terrain === "ground" ? getGroundSpriteState(project, x, y) : null;

      const fillToken =
        terrain === "ground" ? "var(--ground-fill)" : "var(--hole-fill)";
      const edgeToken =
        terrain === "ground" ? "var(--ground-edge)" : "var(--hole-edge)";
      const radiusToken =
        terrain === "ground" ? "var(--cell-radius-ground)" : "var(--cell-radius-hole)";

      cellNode.style.setProperty(
        "--fill-top",
        sameNorth ? "var(--cell-bridge)" : "var(--cell-inset)"
      );
      cellNode.style.setProperty(
        "--fill-right",
        sameEast ? "var(--cell-bridge)" : "var(--cell-inset)"
      );
      cellNode.style.setProperty(
        "--fill-bottom",
        sameSouth ? "var(--cell-bridge)" : "var(--cell-inset)"
      );
      cellNode.style.setProperty(
        "--fill-left",
        sameWest ? "var(--cell-bridge)" : "var(--cell-inset)"
      );
      cellNode.style.setProperty(
        "--radius-tl",
        sameNorth || sameWest ? "var(--cell-radius-soft)" : radiusToken
      );
      cellNode.style.setProperty(
        "--radius-tr",
        sameNorth || sameEast ? "var(--cell-radius-soft)" : radiusToken
      );
      cellNode.style.setProperty(
        "--radius-br",
        sameSouth || sameEast ? "var(--cell-radius-soft)" : radiusToken
      );
      cellNode.style.setProperty(
        "--radius-bl",
        sameSouth || sameWest ? "var(--cell-radius-soft)" : radiusToken
      );
      cellNode.style.setProperty("--terrain-fill", fillToken);
      cellNode.style.setProperty("--terrain-edge", edgeToken);
      cellNode.style.setProperty("--terrain-corner-size", radiusToken);
      cellNode.classList.toggle("cell--ground", terrain === "ground");
      cellNode.dataset.groundSprite = groundSpriteState ? groundSpriteState.name : "";
      applyGroundSpriteVariables(cellNode, groundSpriteState);
      cellNode.classList.toggle("cell--origin", x === 0 && y === 0);
      cellNode.classList.toggle("cell--preview", ui.previewKeys.has(key));
      cellNode.classList.toggle("cell--hover", ui.hoverKey === key);
      cellNode.setAttribute(
        "aria-label",
        `${formatCoordLabel(x, y)}: ${describeCell(cell)}`
      );

      const terrainCornerLayer = cellNode.querySelector(".cell__terrain-corners");
      const anchorGuideLayer = cellNode.querySelector(".cell__anchor-guides");
      const wallLayer = cellNode.querySelector(".cell__walls");
      const doorLayer = cellNode.querySelector(".cell__doors");
      const marker = cellNode.querySelector(".cell__marker");
      terrainCornerLayer.innerHTML = renderTerrainCornerMarkup(terrainCornerState);
      anchorGuideLayer.innerHTML = ui.showDoorAnchorHelper
        ? renderDoorAnchorGuideMarkup(project, cell)
        : "";
      wallLayer.innerHTML = renderBoundaryWallMarkup(project, cell);
      doorLayer.innerHTML = renderWallAnchorMarkup(project, cell);
      marker.innerHTML = createMarkerMarkup(occupant);
    });

    boardTitle.textContent = `${project.name} · ${template.name}`;
    boardSummary.textContent =
      template.isCustom
        ? `${template.width} x ${template.height} custom footprint with ${template.mask.size} active tiles.`
        : template.id === "l-room"
        ? "Three exact 13 x 7 chunks merged into a 26 x 14 elbow."
        : `${template.width} x ${template.height} footprint built from exact 13 x 7 chunks.`;
  }

  function renderBoardMeta() {
    const project = getActiveProject();
    if (!project) {
      return;
    }

    const template = TEMPLATE_MAP[project.templateId];
    const updatedAt = new Date(project.updatedAt);
    const collectionLabel = getCollectionLabel(project.collectionId);
    const metadata = getProjectMetadata(project);
    const roomTypeLabel = getOptionLabel(ROOM_TYPES, metadata.roomType);
    const rewardLabel = metadata.rewardType
      ? `${getOptionLabel(REWARD_TYPES, metadata.rewardType)} Reward`
      : "No Reward";
    projectMeta.textContent = ui.storageAvailable
      ? `${template.name} · ${roomTypeLabel} · ${rewardLabel} · ${collectionLabel} · Updated ${updatedAt.toLocaleString()}`
      : `${template.name} · ${roomTypeLabel} · ${rewardLabel} · ${collectionLabel} · Updated ${updatedAt.toLocaleString()} · Session only`;
    hoverReadout.textContent = ui.hoverKey
      ? buildHoverText(ui.hoverKey)
      : "Hover a tile to inspect coordinates.";

    const safeName = project.name || EMPTY_PROJECT_NAME;
    if (activeProjectNameInput.value !== safeName) {
      activeProjectNameInput.value = safeName;
    }
  }

  function renderFloorBuilder() {
    const collection = getActiveFloorCollection();
    if (!collection) {
      boardTitle.textContent = "Floor Builder";
      boardSummary.textContent = "Choose a real collection to build a floor graph.";
      projectMeta.textContent =
        "Collections act as floors. All and Unsorted are project views, not floor graphs.";
      hoverReadout.textContent = "Create or select a collection to start placing rooms.";
      floorBuilder.innerHTML = `
        <div class="floor-builder__empty">
          <div class="floor-builder__empty-card">
            <p class="panel__eyebrow">Floor Graph</p>
            <h3>Pick a collection floor first</h3>
            <p>
              Floor Builder stores one minimap graph per user-created collection.
              Select a collection chip below, or create a new collection for this floor.
            </p>
          </div>
        </div>
      `;
      return;
    }

    const graph = getFloorGraph(collection.id);
    const projects = getProjectsForCollection(collection.id);
    if (!ui.floorPaletteProjectId || !projects.some((project) => project.id === ui.floorPaletteProjectId)) {
      ui.floorPaletteProjectId = projects[0]?.id || "";
    }

    const analysis = analyzeFloorGraph(collection.id);
    const selectedNode = analysis.nodeViews.find(
      (view) => view.node.id === graph.selectedNodeId
    );
    const normalEdges = analysis.edges.filter((edge) => edge.kind === "normal").length;
    const secretEdges = analysis.edges.filter((edge) => edge.kind === "secret").length;

    boardTitle.textContent = `${collection.name} · Floor Builder`;
    boardSummary.textContent = `${graph.nodes.length} room instance${
      graph.nodes.length === 1 ? "" : "s"
    } · ${analysis.edges.length} connection${analysis.edges.length === 1 ? "" : "s"} · ${
      analysis.warnings.length
    } warning${analysis.warnings.length === 1 ? "" : "s"}`;
    projectMeta.textContent = ui.storageAvailable
      ? `${collection.name} floor · ${normalEdges} normal · ${secretEdges} secret · Updated ${new Date(
          graph.updatedAt
        ).toLocaleString()}`
      : `${collection.name} floor · ${normalEdges} normal · ${secretEdges} secret · Session only`;
    hoverReadout.textContent = selectedNode
      ? `Selected ${selectedNode.project.name} at chunk ${formatCoordLabel(
          selectedNode.node.x,
          selectedNode.node.y
        )}. Drag it to snap-move.`
      : "Place a room from the palette, or select an existing minimap node.";

    floorBuilder.innerHTML = `
      <div class="floor-builder__layout">
        <aside class="floor-builder__sidebar">
          ${renderFloorPaletteMarkup(collection, projects, graph, selectedNode)}
          ${renderFloorWarningsMarkup(analysis)}
        </aside>
        <div class="floor-map-wrap">
          ${renderFloorMapMarkup(analysis)}
        </div>
      </div>
    `;
  }

  function renderFloorPaletteMarkup(collection, projects, graph, selectedNode) {
    const options = projects
      .map((project) => {
        const template = TEMPLATE_MAP[project.templateId];
        const metadata = getProjectMetadata(project);
        return `
          <option value="${escapeHtml(project.id)}" ${
            project.id === ui.floorPaletteProjectId ? "selected" : ""
          }>
            ${escapeHtml(project.name)} · ${escapeHtml(template.name)} · ${escapeHtml(
              getOptionLabel(ROOM_TYPES, metadata.roomType)
            )}
          </option>
        `;
      })
      .join("");

    return `
      <section class="floor-builder__palette">
        <p class="panel__eyebrow">Room Palette</p>
        <h3>${escapeHtml(collection.name)}</h3>
        <p>
          Rooms are reusable instances. Door and secret marks are available anchors; only matching neighbors connect.
        </p>
        <label class="field">
          <span>Room from this collection</span>
          <select data-floor-room-palette ${projects.length === 0 ? "disabled" : ""}>
            ${
              projects.length > 0
                ? options
                : '<option value="">Create a room in this collection first</option>'
            }
          </select>
        </label>
        <div class="floor-builder__actions">
          <button class="action action--primary" data-floor-action="place" type="button" ${
            projects.length === 0 ? "disabled" : ""
          }>
            Place Room
          </button>
          <button class="action" data-floor-action="duplicate" type="button" ${
            selectedNode ? "" : "disabled"
          }>
            Duplicate Node
          </button>
          <button class="action action--danger" data-floor-action="delete" type="button" ${
            selectedNode ? "" : "disabled"
          }>
            Delete Node
          </button>
        </div>
        <p class="project-card__meta">
          ${graph.nodes.length} placed · drag nodes on the chunk grid · overlaps are blocked.
        </p>
      </section>
    `;
  }

  function renderFloorWarningsMarkup(analysis) {
    if (analysis.warnings.length === 0) {
      return `
        <section class="floor-builder__warnings">
          <p class="panel__eyebrow">Validation</p>
          <h3>All connections look clean</h3>
          <div class="floor-warning-list">
            <div class="floor-warning floor-warning--good">
              Available door and secret anchors are optional. Matching facing anchors connect automatically.
            </div>
          </div>
        </section>
      `;
    }

    return `
      <section class="floor-builder__warnings">
        <p class="panel__eyebrow">Validation</p>
        <h3>${analysis.warnings.length} warning${analysis.warnings.length === 1 ? "" : "s"}</h3>
        <div class="floor-warning-list">
          ${analysis.warnings
            .slice(0, 24)
            .map(
              (warning) => `
                <div class="floor-warning">
                  ${escapeHtml(warning.message)}
                </div>
              `
            )
            .join("")}
          ${
            analysis.warnings.length > 24
              ? `<div class="floor-warning">${analysis.warnings.length - 24} more warning${
                  analysis.warnings.length - 24 === 1 ? "" : "s"
                } not shown.</div>`
              : ""
          }
        </div>
      </section>
    `;
  }

  function renderFloorMapMarkup(analysis) {
    const bounds = getFloorMapRenderBounds(analysis.nodeViews);
    const axisMarkup = renderFloorAxisMarkup(bounds);
    const edgeMarkup = analysis.edges
      .map((edge) => renderFloorEdgeMarkup(edge, bounds))
      .join("");
    const nodeMarkup = analysis.nodeViews
      .map((view) => renderFloorNodeMarkup(view, bounds, analysis))
      .join("");

    return `
      <div
        class="floor-map"
        style="--floor-chunk-size:${FLOOR_CHUNK_SIZE}px;width:${bounds.width}px;height:${bounds.height}px;"
      >
        ${axisMarkup}
        ${edgeMarkup}
        ${nodeMarkup}
      </div>
    `;
  }

  function renderFloorAxisMarkup(bounds) {
    const labels = [];
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      labels.push(
        `<span class="floor-axis floor-axis--x" style="left:${floorToPixelCenter(
          x,
          bounds.minX
        )}px;">${x}</span>`
      );
    }
    for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
      labels.push(
        `<span class="floor-axis floor-axis--y" style="top:${floorToPixelCenter(
          y,
          bounds.minY
        )}px;">${y}</span>`
      );
    }
    return labels.join("");
  }

  function renderFloorEdgeMarkup(edge, bounds) {
    const startX = floorToPixelCenter(edge.from.worldX, bounds.minX);
    const startY = floorToPixelCenter(edge.from.worldY, bounds.minY);
    const endX = floorToPixelCenter(edge.to.worldX, bounds.minX);
    const endY = floorToPixelCenter(edge.to.worldY, bounds.minY);
    const horizontal = startY === endY;
    const left = horizontal ? Math.min(startX, endX) : startX - 3;
    const top = horizontal ? startY - 3 : Math.min(startY, endY);
    const width = horizontal ? Math.abs(endX - startX) : 6;
    const height = horizontal ? 6 : Math.abs(endY - startY);

    return `
      <span
        class="floor-edge floor-edge--${edge.kind}"
        style="left:${left}px;top:${top}px;width:${width}px;height:${height}px;"
        aria-hidden="true"
      ></span>
    `;
  }

  function renderFloorNodeMarkup(view, bounds, analysis) {
    const template = view.template;
    const metadata = getProjectMetadata(view.project);
    const left = floorToPixel(view.node.x + view.footprint.minX, bounds.minX);
    const top = floorToPixel(view.node.y + view.footprint.minY, bounds.minY);
    const width = view.footprint.width * FLOOR_CHUNK_SIZE;
    const height = view.footprint.height * FLOOR_CHUNK_SIZE;
    const warningCount = analysis.warnings.filter(
      (warning) => warning.nodeId === view.node.id
    ).length;

    return `
      <button
        class="floor-node ${view.node.id === analysis.graph.selectedNodeId ? "is-selected" : ""} ${
          warningCount > 0 ? "has-warning" : ""
        }"
        data-floor-node-id="${escapeHtml(view.node.id)}"
        type="button"
        style="left:${left}px;top:${top}px;width:${width}px;height:${height}px;"
        aria-label="${escapeHtml(
          `${view.project.name} at ${formatCoordLabel(view.node.x, view.node.y)}`
        )}"
      >
        <span class="floor-node__plate"></span>
        <span
          class="floor-node__chunks"
          style="grid-template-columns:repeat(${view.footprint.width}, 1fr);grid-template-rows:repeat(${view.footprint.height}, 1fr);"
        >
          ${renderFloorNodeChunksMarkup(view)}
        </span>
        ${view.ports.map((port) => renderFloorPortMarkup(port)).join("")}
        <span class="floor-node__label">
          <span class="floor-node__name">${escapeHtml(view.project.name)}</span>
          <span class="floor-node__meta">${escapeHtml(
            `${getOptionLabel(ROOM_TYPES, metadata.roomType)} · ${template.summary}`
          )}</span>
        </span>
        ${warningCount > 0 ? `<span class="floor-node__warning">!</span>` : ""}
      </button>
    `;
  }

  function renderFloorNodeChunksMarkup(view) {
    const activeOffsets = new Set(
      view.footprint.offsets.map((offset) => makeKey(offset.x, offset.y))
    );
    const chunks = [];
    for (let y = view.footprint.minY; y <= view.footprint.maxY; y += 1) {
      for (let x = view.footprint.minX; x <= view.footprint.maxX; x += 1) {
        chunks.push(
          `<span class="floor-node__chunk ${
            activeOffsets.has(makeKey(x, y)) ? "" : "floor-node__chunk--missing"
          }"></span>`
        );
      }
    }
    return chunks.join("");
  }

  function renderFloorPortMarkup(port) {
    const geometry = getFloorPortPixelGeometry(port);
    return `
      <span
        class="floor-port floor-port--${port.direction} ${
          port.type === "secret" ? "floor-port--secret" : ""
        }"
        style="${geometry}"
        aria-hidden="true"
      ></span>
    `;
  }

  function renderMetadataEditor() {
    const project = getActiveProject();
    const metadata = project ? getProjectMetadata(project) : createDefaultProjectMetadata();
    const disabled = !project;

    renderSelectOptions(metadataRoomTypeSelect, ROOM_TYPES, metadata.roomType, disabled);
    renderSelectOptions(metadataRewardTypeSelect, REWARD_TYPES, metadata.rewardType, disabled);
    renderSelectOptions(metadataDifficultySelect, DIFFICULTY_LEVELS, metadata.difficulty, disabled);
    renderSelectOptions(
      metadataEntryDirectionSelect,
      ENTRY_DIRECTIONS,
      metadata.intendedEntryDirection,
      disabled
    );
    renderSelectOptions(
      metadataPrototypeStatusSelect,
      PROTOTYPE_STATUSES,
      metadata.prototypeStatus,
      disabled
    );

    setInputValueIfUnfocused(metadataChapterFloorInput, metadata.chapterFloor);
    setInputValueIfUnfocused(metadataEncounterPurposeInput, metadata.encounterPurpose);
    setInputValueIfUnfocused(metadataTagsInput, metadata.tags.join(", "));
    setInputValueIfUnfocused(metadataNotesInput, metadata.notes);
  }

  function renderSelectOptions(select, options, selectedValue, disabled = false) {
    if (!select) {
      return;
    }

    const markup = options
      .map(
        (option) => `
          <option value="${escapeHtml(option.id)}">${escapeHtml(option.label)}</option>
        `
      )
      .join("");
    if (select.dataset.optionsMarkup !== markup) {
      select.innerHTML = markup;
      select.dataset.optionsMarkup = markup;
    }
    select.value = selectedValue;
    select.disabled = disabled;
  }

  function setInputValueIfUnfocused(input, value) {
    if (!input || document.activeElement === input) {
      return;
    }

    const nextValue = String(value || "");
    if (input.value !== nextValue) {
      input.value = nextValue;
    }
  }

  function renderStats() {
    const project = getActiveProject();
    if (!project) {
      return;
    }

    const template = TEMPLATE_MAP[project.templateId];
    const stats = calculateStats(project);
    const metadata = getProjectMetadata(project);

    statsPanel.innerHTML = `
      <div class="stats-card">
        <strong>${escapeHtml(getOptionLabel(ROOM_TYPES, metadata.roomType))}</strong>
        <p>${escapeHtml(formatMetadataSummary(metadata))}</p>
      </div>
      <div class="stats-card">
        <strong>${stats.activeCount}</strong>
        <p>Active tiles in the footprint.</p>
      </div>
      <div class="stats-card">
        <strong>${stats.groundCount}</strong>
        <p>Ground tiles remaining after hole carving.</p>
      </div>
      <div class="stats-card">
        <strong>${stats.groundRegions}</strong>
        <p>
          Ground region${stats.groundRegions === 1 ? "" : "s"} by orthogonal adjacency.
          ${stats.groundRegions <= 1 ? "This layout is connected." : "This layout is split into islands."}
        </p>
      </div>
      <div class="stats-card">
        <strong>${stats.holeCount}</strong>
        <p>Hole tiles carving out the walkable floor.</p>
      </div>
      <div class="stats-card">
        <strong>${stats.rockCount}</strong>
        <p>Rock obstruction markers.</p>
      </div>
      <div class="stats-card">
        <strong>${stats.enemyCount}</strong>
        <p>${formatStatsBreakdown(stats, ENEMY_VARIANTS, "Enemy spawn points on ground.", "No enemy spawns placed yet.")}</p>
      </div>
      <div class="stats-card">
        <strong>${stats.decorCount}</strong>
        <p>${formatStatsBreakdown(stats, DECOR_VARIANTS, "Decor silhouettes on ground.", "No decor markers placed yet.")}</p>
      </div>
      <div class="stats-card">
        <strong>${stats.itemCount}</strong>
        <p>Item spawn points on ground.</p>
      </div>
      <div class="stats-card">
        <strong>${stats.doorCount}</strong>
        <p>Boundary doors anchored outside room walls.</p>
      </div>
      <div class="stats-card">
        <strong>${stats.secretWallCount}</strong>
        <p>Breakable secret wall entrances on room boundaries.</p>
      </div>
      <div class="stats-card">
        <strong>Entity Summary</strong>
        <p>${escapeHtml(formatEntitySummaryText(stats))}</p>
      </div>
      <div class="stats-card">
        <strong>${template.summary}</strong>
        <p>${escapeHtml(template.description)}</p>
      </div>
    `;
  }

  function renderLegendPanel() {
    const project = getActiveProject();
    if (!project || !legendItems) {
      return;
    }

    const stats = calculateStats(project);
    const items = getLegendItemsForProject(project, stats);

    legendItems.innerHTML = items
      .map((kind) => {
        const definition = getLegendDefinition(kind);
        return `
          <div class="legend__item">
            ${renderLegendSwatchMarkup(kind)}
            <div>
              <strong>${escapeHtml(definition.label)}</strong>
              <p>${escapeHtml(definition.description)}</p>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function renderLegendSwatchMarkup(kind) {
    if (kind === "ground" || kind === "hole" || kind === "door" || kind === "secret-wall") {
      return `<span class="legend__swatch legend__swatch--${kind}"></span>`;
    }

    return `
      <span class="legend__swatch legend__swatch--marker">
        ${createMarkerMarkup(kind)}
      </span>
    `;
  }

  function createMarkerMarkup(occupant) {
    return occupant && occupant !== "none"
      ? `<span class="marker marker--${occupant}"></span>`
      : "";
  }

  function formatStatsBreakdown(stats, variants, fallback, emptyText) {
    const active = variants
      .filter((variant) => stats.occupantCounts[variant.id] > 0)
      .map((variant) => `${variant.label} ${stats.occupantCounts[variant.id]}`);

    return active.length > 0 ? active.join(" · ") : emptyText || fallback;
  }

  function formatMetadataSummary(metadata) {
    const parts = [
      metadata.chapterFloor || "No floor set",
      getOptionLabel(PROTOTYPE_STATUSES, metadata.prototypeStatus),
      metadata.difficulty ? getOptionLabel(DIFFICULTY_LEVELS, metadata.difficulty) : "Unrated",
      `${getOptionLabel(ENTRY_DIRECTIONS, metadata.intendedEntryDirection)} entry`,
      metadata.rewardType
        ? `${getOptionLabel(REWARD_TYPES, metadata.rewardType)} reward`
        : "No reward",
    ];

    if (metadata.encounterPurpose) {
      parts.push(metadata.encounterPurpose);
    }

    if (metadata.tags.length > 0) {
      parts.push(`Tags: ${metadata.tags.join(", ")}`);
    }

    return parts.join(" · ");
  }

  function formatEntitySummaryText(stats) {
    return [
      `Ground ${stats.groundCount}`,
      `Hole ${stats.holeCount}`,
      `Rock ${stats.rockCount}`,
      `Enemies ${stats.enemyCount}`,
      `Decor ${stats.decorCount}`,
      `Items ${stats.itemCount}`,
      `Doors ${stats.doorCount}`,
      `Secret walls ${stats.secretWallCount}`,
    ].join(" · ");
  }

  function getLegendDefinition(kind) {
    if (kind === "ground") {
      return {
        label: "Ground",
        description: "Walkable floor that auto-connects orthogonally.",
      };
    }

    if (kind === "hole") {
      return {
        label: "Hole",
        description: "Breaks traversal and ground-region connectivity.",
      };
    }

    if (kind === "door") {
      return {
        label: "Door",
        description: "Auto-attaches to the nearest valid outer wall edge you paint near.",
      };
    }

    if (kind === "secret-wall") {
      return {
        label: "Secret Wall Entrance",
        description: "Auto-attaches as a breakable entrance on the nearest valid wall edge.",
      };
    }

    const occupant = OCCUPANT_DEFINITIONS[kind];
    return {
      label: occupant ? occupant.legendLabel : kind,
      description: occupant ? occupant.legendDescription : "",
    };
  }

  function getLegendItemsForProject(project, stats) {
    const items = [];

    if (stats.activeCount > 0) {
      items.push("ground");
    }

    if (stats.holeCount > 0) {
      items.push("hole");
    }

    const orderedKinds = [
      "rock",
      ...DECOR_VARIANTS.map((variant) => variant.id),
      ...ENEMY_VARIANTS.map((variant) => variant.id),
      "item",
    ];

    orderedKinds.forEach((kind) => {
      if (stats.occupantCounts[kind] > 0) {
        items.push(kind);
      }
    });

    if (stats.doorCount > 0) {
      items.push("door");
    }

    if (stats.secretWallCount > 0) {
      items.push("secret-wall");
    }

    return items;
  }

  function handleToolbarClick(event) {
    const toolButton = findClosestFromTarget(event.target, "[data-tool-id]");
    if (toolButton) {
      ui.selectedTool = toolButton.dataset.toolId;
      renderToolbar();
      return;
    }

    const paintButton = findClosestFromTarget(event.target, "[data-paint-id]");
    if (paintButton) {
      ui.selectedPaint = paintButton.dataset.paintId;
      renderToolbar();
      return;
    }

    const variantButton = findClosestFromTarget(event.target, "[data-variant-id]");
    if (variantButton) {
      ui.selectedVariants[variantButton.dataset.variantFamily] = variantButton.dataset.variantId;
      renderToolbar();
    }
  }

  function handleTemplateSelect(event) {
    const button = findClosestFromTarget(event.target, "[data-template-id]");
    if (!button) {
      return;
    }

    ui.selectedTemplateId = button.dataset.templateId;
    renderTemplatePicker();
  }

  function handleToggleDoorAnchorHelper() {
    ui.showDoorAnchorHelper = !ui.showDoorAnchorHelper;
    refreshBoardCells();
    renderHistoryControls();
  }

  function handleMetadataTextBlur() {
    if (!ui.metadataSnapshot) {
      return;
    }

    if (ui.metadataSnapshot !== captureHistorySnapshot()) {
      pushUndoSnapshot(ui.metadataSnapshot);
    }
    ui.metadataSnapshot = null;
    renderMetadataEditor();
    renderHistoryControls();
  }

  function updateProjectMetadataField(field, rawValue, options = {}) {
    const project = getActiveProject();
    if (!project) {
      return;
    }

    const metadata = getProjectMetadata(project);
    const nextValue = normalizeMetadataFieldValue(field, rawValue);
    if (metadataValueEquals(metadata[field], nextValue)) {
      return;
    }

    if (options.pushHistory) {
      pushUndoSnapshot(captureHistorySnapshot());
    }

    project.metadata = {
      ...metadata,
      [field]: nextValue,
    };
    project.updatedAt = new Date().toISOString();
    persist();
    renderProjectList();
    renderBoardMeta();
    renderStats();
    if (options.rerenderEditor !== false) {
      renderMetadataEditor();
    }
    renderHistoryControls();
  }

  function handleTemplateEditorSizeChange() {
    const width = normalizeEditorWidth(customTemplateWidthInput.value);
    const height = normalizeEditorHeight(customTemplateHeightInput.value);
    resizeTemplateEditor(width, height);
    renderTemplateEditor();
  }

  function handleTemplateEditorPointerDown(event) {
    const cellButton = findClosestFromTarget(event.target, "[data-template-editor-key]");
    if (!cellButton) {
      return;
    }

    event.preventDefault();
    const key = cellButton.dataset.templateEditorKey;
    const shouldAdd = !isTemplateEditorChunkActive(key);
    ui.templateEditorDragMode = shouldAdd ? "add" : "remove";
    setTemplateEditorChunk(key, shouldAdd);
    renderTemplateEditor();
  }

  function handleTemplateEditorPointerMove(event) {
    if (!ui.templateEditorDragMode) {
      return;
    }

    const cellButton = findClosestFromTarget(event.target, "[data-template-editor-key]");
    if (!cellButton) {
      return;
    }

    const key = cellButton.dataset.templateEditorKey;
    setTemplateEditorChunk(key, ui.templateEditorDragMode === "add");
    renderTemplateEditor();
  }

  function handleTemplateEditorBlank() {
    ui.templateEditor = createDefaultTemplateEditorState({
      name: "Custom Template",
      fill: false,
    });
    renderTemplateEditor();
  }

  function handleTemplateEditorFromSelected() {
    const template = TEMPLATE_MAP[ui.selectedTemplateId] || ROOM_TEMPLATES[0];
    ui.templateEditor = createTemplateEditorStateFromTemplate(template);
    renderTemplateEditor();
  }

  function handleTemplateEditorFill() {
    ui.templateEditor.cells = buildCenteredRectKeys(
      ui.templateEditor.width,
      ui.templateEditor.height
    );
    renderTemplateEditor();
  }

  function handleTemplateEditorClear() {
    ui.templateEditor.cells = buildOriginChunkKeys(
      ui.templateEditor.width,
      ui.templateEditor.height
    );
    renderTemplateEditor();
  }

  function handleSaveCustomTemplate() {
    const descriptor = createCustomTemplateDescriptorFromEditor();
    if (!descriptor) {
      return;
    }

    pushUndoSnapshot(captureHistorySnapshot());
    state.customTemplates.push(descriptor);
    rebuildTemplateRegistry(state.customTemplates);
    ui.selectedTemplateId = descriptor.id;
    persist();
    renderAll();
  }

  function handleCreateCollection() {
    const name = sanitizeCollectionName(collectionNameInput.value);
    if (!name) {
      return;
    }

    const existing = state.collections.find(
      (collection) => collection.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      state.activeCollectionId = existing.id;
      projectCollectionSelect.value = existing.id;
      collectionNameInput.value = "";
      persist();
      renderCollectionControls();
      renderProjectList();
      return;
    }

    const timestamp = new Date().toISOString();
    const collection = {
      id: createCollectionId(),
      name,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    pushUndoSnapshot(captureHistorySnapshot());
    state.collections.push(collection);
    state.floorGraphs[collection.id] = createDefaultFloorGraph(collection.id);
    state.activeCollectionId = collection.id;
    collectionNameInput.value = "";
    persist();
    renderCollectionControls();
    renderProjectList();
    renderHistoryControls();
  }

  function handleCollectionFilterClick(event) {
    const button = findClosestFromTarget(event.target, "[data-collection-filter]");
    if (!button) {
      return;
    }

    state.activeCollectionId = button.dataset.collectionFilter || COLLECTION_ALL;
    const visibleProjects = getFilteredProjects();
    if (
      visibleProjects.length > 0 &&
      !visibleProjects.some((project) => project.id === state.activeProjectId)
    ) {
      state.activeProjectId = visibleProjects[0].id;
      ui.boundBoardTemplateId = null;
      clearPreview();
      setHoverKey(null);
    }

    persist();
    renderAll();
  }

  function handleProjectListClick(event) {
    const button = findClosestFromTarget(event.target, "[data-project-id]");
    if (!button) {
      return;
    }

    state.activeProjectId = button.dataset.projectId;
    ui.boundBoardTemplateId = null;
    clearPreview();
    setHoverKey(null);
    persist();
    renderAll();
  }

  function handleFloorBuilderChange(event) {
    const select = findClosestFromTarget(event.target, "[data-floor-room-palette]");
    if (!select) {
      return;
    }

    ui.floorPaletteProjectId = select.value || "";
  }

  function handleFloorBuilderClick(event) {
    const nodeButton = findClosestFromTarget(event.target, "[data-floor-node-id]");
    if (nodeButton && !ui.floorDrag?.moved) {
      selectFloorNode(nodeButton.dataset.floorNodeId);
      return;
    }

    const actionButton = findClosestFromTarget(event.target, "[data-floor-action]");
    if (!actionButton) {
      return;
    }

    switch (actionButton.dataset.floorAction) {
      case "place":
        handlePlaceFloorRoom();
        break;
      case "duplicate":
        handleDuplicateFloorNode();
        break;
      case "delete":
        handleDeleteFloorNode();
        break;
      default:
        break;
    }
  }

  function handleFloorBuilderPointerDown(event) {
    const nodeButton = findClosestFromTarget(event.target, "[data-floor-node-id]");
    if (!nodeButton) {
      return;
    }

    const collection = getActiveFloorCollection();
    if (!collection) {
      return;
    }

    const graph = getFloorGraph(collection.id);
    const node = graph.nodes.find((candidate) => candidate.id === nodeButton.dataset.floorNodeId);
    if (!node) {
      return;
    }

    event.preventDefault();
    graph.selectedNodeId = node.id;
    ui.floorDrag = {
      pointerId: event.pointerId,
      collectionId: collection.id,
      nodeId: node.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: node.x,
      startY: node.y,
      lastX: node.x,
      lastY: node.y,
      moved: false,
      blocked: false,
      historySnapshot: captureHistorySnapshot(),
    };
    renderFloorBuilder();
    renderHistoryControls();
  }

  function selectFloorNode(nodeId) {
    const collection = getActiveFloorCollection();
    if (!collection) {
      return;
    }

    const graph = getFloorGraph(collection.id);
    if (!graph.nodes.some((node) => node.id === nodeId)) {
      return;
    }

    graph.selectedNodeId = nodeId;
    graph.updatedAt = new Date().toISOString();
    persist();
    renderFloorBuilder();
    renderHistoryControls();
  }

  function handlePlaceFloorRoom() {
    const collection = getActiveFloorCollection();
    const project = ui.floorPaletteProjectId
      ? state.projects.find((candidate) => candidate.id === ui.floorPaletteProjectId)
      : null;
    if (!collection || !project || project.collectionId !== collection.id) {
      return;
    }

    const graph = getFloorGraph(collection.id);
    const position = findAvailableFloorPosition(graph, project, { x: 0, y: 0 });
    if (!position) {
      window.alert("No free minimap space was found near the current graph.");
      return;
    }

    pushUndoSnapshot(captureHistorySnapshot());
    const node = createFloorNode(project.id, position.x, position.y);
    graph.nodes.push(node);
    graph.selectedNodeId = node.id;
    touchFloorGraph(graph);
    persist();
    renderAll();
  }

  function handleDuplicateFloorNode() {
    const collection = getActiveFloorCollection();
    if (!collection) {
      return;
    }

    const graph = getFloorGraph(collection.id);
    const selectedNode = graph.nodes.find((node) => node.id === graph.selectedNodeId);
    const project = selectedNode
      ? state.projects.find((candidate) => candidate.id === selectedNode.projectId)
      : null;
    if (!selectedNode || !project) {
      return;
    }

    const position = findAvailableFloorPosition(graph, project, {
      x: selectedNode.x + 1,
      y: selectedNode.y,
    });
    if (!position) {
      window.alert("No free minimap space was found for the duplicate.");
      return;
    }

    pushUndoSnapshot(captureHistorySnapshot());
    const clone = createFloorNode(project.id, position.x, position.y);
    graph.nodes.push(clone);
    graph.selectedNodeId = clone.id;
    touchFloorGraph(graph);
    persist();
    renderAll();
  }

  function handleDeleteFloorNode() {
    const collection = getActiveFloorCollection();
    if (!collection) {
      return;
    }

    const graph = getFloorGraph(collection.id);
    const selectedNodeId = graph.selectedNodeId;
    if (!selectedNodeId || !graph.nodes.some((node) => node.id === selectedNodeId)) {
      return;
    }

    pushUndoSnapshot(captureHistorySnapshot());
    graph.nodes = graph.nodes.filter((node) => node.id !== selectedNodeId);
    graph.selectedNodeId = graph.nodes[0]?.id || null;
    touchFloorGraph(graph);
    persist();
    renderAll();
  }

  function handleFloorDragMove(event) {
    const drag = ui.floorDrag;
    const collection = getCollectionById(drag.collectionId);
    if (!collection) {
      ui.floorDrag = null;
      return;
    }

    const graph = getFloorGraph(collection.id);
    const node = graph.nodes.find((candidate) => candidate.id === drag.nodeId);
    const project = node
      ? state.projects.find((candidate) => candidate.id === node.projectId)
      : null;
    if (!node || !project) {
      ui.floorDrag = null;
      return;
    }

    const deltaX = Math.round((event.clientX - drag.startClientX) / FLOOR_CHUNK_SIZE);
    const deltaY = Math.round((event.clientY - drag.startClientY) / FLOOR_CHUNK_SIZE);
    const nextX = drag.startX + deltaX;
    const nextY = drag.startY + deltaY;
    if (nextX === drag.lastX && nextY === drag.lastY) {
      return;
    }

    if (wouldFloorNodeOverlap(graph, project, nextX, nextY, node.id)) {
      drag.blocked = true;
      hoverReadout.textContent = `Overlap blocked at chunk ${formatCoordLabel(
        nextX,
        nextY
      )}. Move to a free snapped position.`;
      return;
    }

    node.x = nextX;
    node.y = nextY;
    drag.lastX = nextX;
    drag.lastY = nextY;
    drag.moved = true;
    drag.blocked = false;
    touchFloorGraph(graph);
    renderFloorBuilder();
  }

  function handleFloorDragEnd() {
    const drag = ui.floorDrag;
    ui.floorDrag = null;
    if (!drag || !drag.moved) {
      renderFloorBuilder();
      return;
    }

    pushUndoSnapshot(drag.historySnapshot);
    persist();
    renderAll();
  }

  function handleUndo() {
    if (history.undo.length === 0) {
      return;
    }

    const currentSnapshot = captureHistorySnapshot();
    const previousSnapshot = history.undo.pop();
    history.redo.push(currentSnapshot);
    restoreHistorySnapshot(previousSnapshot);
  }

  function handleRedo() {
    if (history.redo.length === 0) {
      return;
    }

    const currentSnapshot = captureHistorySnapshot();
    const nextSnapshot = history.redo.pop();
    history.undo.push(currentSnapshot);
    restoreHistorySnapshot(nextSnapshot);
  }

  function handleTransformProject(transformType) {
    const project = getActiveProject();
    if (!project) {
      return;
    }

    if (!isTransformSupported(project, transformType)) {
      return;
    }

    const transformedCells = transformProjectCells(project, transformType);
    if (!transformedCells || JSON.stringify(transformedCells) === JSON.stringify(project.cells)) {
      return;
    }

    pushUndoSnapshot(captureHistorySnapshot());
    project.cells = transformedCells;
    project.updatedAt = new Date().toISOString();
    clearPreview();
    setHoverKey(null);
    persist();
    renderAll();
  }

  function transformProjectCells(project, transformType) {
    const template = TEMPLATE_MAP[project.templateId];
    const nextCells = {};

    template.mask.forEach((targetKey) => {
      const [xText, yText] = targetKey.split(",");
      const targetX = Number(xText);
      const targetY = Number(yText);
      const sourceCoord = getInverseTransformCoord(
        targetX,
        targetY,
        transformType,
        template
      );
      const source = project.cells[makeKey(sourceCoord.x, sourceCoord.y)];

      nextCells[targetKey] = source
        ? transformCellForTarget(source, targetX, targetY, transformType, template)
        : createDefaultCell(targetX, targetY);
    });

    return nextCells;
  }

  function isTransformSupported(project, transformType) {
    const template = TEMPLATE_MAP[project.templateId];
    return Array.from(template.mask).every((key) => {
      const [xText, yText] = key.split(",");
      const sourceCoord = getInverseTransformCoord(
        Number(xText),
        Number(yText),
        transformType,
        template
      );
      return template.mask.has(makeKey(sourceCoord.x, sourceCoord.y));
    });
  }

  function getInverseTransformCoord(x, y, transformType, template) {
    const bounds = template.bounds;
    const col = x - bounds.minX;
    const row = y - bounds.minY;
    switch (transformType) {
      case "mirror-horizontal":
        return { x: bounds.minX + bounds.maxX - x, y };
      case "mirror-vertical":
        return { x, y: bounds.minY + bounds.maxY - y };
      case "rotate-clockwise":
        return {
          x: bounds.minX + row,
          y: bounds.minY + template.height - 1 - col,
        };
      case "rotate-counterclockwise":
        return {
          x: bounds.minX + template.width - 1 - row,
          y: bounds.minY + col,
        };
      default:
        return { x, y };
    }
  }

  function transformCellForTarget(source, x, y, transformType, template) {
    const terrain = source.terrain === "hole" ? "hole" : "ground";
    const cell = {
      x,
      y,
      terrain,
      occupant: terrain === "hole" ? "none" : normalizeOccupantId(source.occupant),
      doors:
        terrain === "hole"
          ? emptyDoors()
          : transformWallFlags(source.doors, transformType, template, x, y),
      secretWalls:
        terrain === "hole"
          ? emptySecretWalls()
          : transformWallFlags(source.secretWalls, transformType, template, x, y),
    };

    return cell;
  }

  function transformWallFlags(flags, transformType, template, x, y) {
    const transformed = emptyDoors();
    DOOR_DIRECTIONS.forEach((direction) => {
      if (!flags || !flags[direction.id]) {
        return;
      }

      const transformedDirection = transformDirection(direction.id, transformType);
      if (isWallAnchorDirection(template, x, y, transformedDirection)) {
        transformed[transformedDirection] = true;
      }
    });

    return transformed;
  }

  function transformDirection(direction, transformType) {
    const maps = {
      "mirror-horizontal": {
        north: "north",
        south: "south",
        east: "west",
        west: "east",
      },
      "mirror-vertical": {
        north: "south",
        south: "north",
        east: "east",
        west: "west",
      },
      "rotate-clockwise": {
        north: "east",
        east: "south",
        south: "west",
        west: "north",
      },
      "rotate-counterclockwise": {
        north: "west",
        west: "south",
        south: "east",
        east: "north",
      },
    };

    return maps[transformType]?.[direction] || direction;
  }

  function handleCreateProject() {
    const template = TEMPLATE_MAP[ui.selectedTemplateId];
    const projectName =
      sanitizeProjectName(projectNameInput.value) || `${template.name} ${state.projects.length + 1}`;
    const project = createProject(template.id, projectName);
    project.collectionId = normalizeProjectCollectionValue(projectCollectionSelect.value);
    pushUndoSnapshot(captureHistorySnapshot());
    state.projects.unshift(project);
    state.activeProjectId = project.id;
    if (project.collectionId) {
      state.activeCollectionId = project.collectionId;
    } else if (state.activeCollectionId !== COLLECTION_ALL) {
      state.activeCollectionId = COLLECTION_UNSORTED;
    }
    projectNameInput.value = "";
    ui.boundBoardTemplateId = null;
    persist();
    renderAll();
  }

  function handleDuplicateProject() {
    const project = getActiveProject();
    if (!project) {
      return;
    }

    const clone = deepClone(project);
    clone.id = createId();
    clone.name = `${project.name} Copy`;
    clone.createdAt = new Date().toISOString();
    clone.updatedAt = clone.createdAt;
    pushUndoSnapshot(captureHistorySnapshot());
    state.projects.unshift(clone);
    state.activeProjectId = clone.id;
    ui.boundBoardTemplateId = null;
    persist();
    renderAll();
  }

  function handleResetProject() {
    const project = getActiveProject();
    if (!project) {
      return;
    }

    if (!window.confirm(`Reset "${project.name}" back to a fresh template layout?`)) {
      return;
    }

    const resetProject = createProject(project.templateId, project.name);
    resetProject.id = project.id;
    resetProject.createdAt = project.createdAt;
    resetProject.collectionId = project.collectionId || "";
    resetProject.metadata = normalizeProjectMetadata(project.metadata);
    resetProject.updatedAt = new Date().toISOString();

    pushUndoSnapshot(captureHistorySnapshot());
    replaceProject(resetProject);
    ui.boundBoardTemplateId = null;
    persist();
    renderAll();
  }

  function handleDeleteProject() {
    const project = getActiveProject();
    if (!project) {
      return;
    }

    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      return;
    }

    pushUndoSnapshot(captureHistorySnapshot());
    state.projects = state.projects.filter((candidate) => candidate.id !== project.id);
    pruneFloorGraphs();
    ensureProjectExists();
    ui.boundBoardTemplateId = null;
    persist();
    renderAll();
  }

  function handleExportProject() {
    const project = getActiveProject();
    if (!project) {
      return;
    }

    downloadTextFile(
      `${slugify(project.name || EMPTY_PROJECT_NAME)}.json`,
      JSON.stringify(buildProjectExportPayload(project), null, 2)
    );
  }

  function handleExportUnityJson() {
    const project = getActiveProject();
    if (!project) {
      return;
    }

    downloadTextFile(
      `${slugify(project.name || EMPTY_PROJECT_NAME)}-unity-room.json`,
      JSON.stringify(buildUnityRoomExportPayload(project), null, 2)
    );
  }

  function handleExportRealityComposerJson() {
    const project = getActiveProject();
    if (!project) {
      return;
    }

    downloadTextFile(
      `${slugify(project.name || EMPTY_PROJECT_NAME)}-reality-composer-pro.json`,
      JSON.stringify(buildRealityComposerProExportPayload(project), null, 2)
    );
  }

  function handleExportRealityKitUsda() {
    const project = getActiveProject();
    if (!project) {
      return;
    }

    downloadTextFile(
      `${slugify(project.name || EMPTY_PROJECT_NAME)}-realitykit-scene.usda`,
      buildRealityKitUsdaExport(project),
      "model/vnd.usda"
    );
  }

  function buildProjectExportPayload(project) {
    const metadata = getProjectMetadata(project);
    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      metadata,
      entitySummary: buildEntitySummary(project),
      entityGroups: buildEntityGroups(project),
      project: {
        ...project,
        metadata,
      },
      template: isCustomTemplate(project.templateId)
        ? getSerializableCustomTemplate(project.templateId)
        : null,
      collection: project.collectionId ? getCollectionById(project.collectionId) : null,
    };
  }

  function buildUnityRoomExportPayload(project) {
    const template = TEMPLATE_MAP[project.templateId];
    const metadata = getProjectMetadata(project);
    const collection = project.collectionId
      ? getCollectionById(project.collectionId)
      : null;
    const entitySummary = buildEntitySummary(project);
    const entityGroups = buildEntityGroups(project);
    const tiles = buildUnityTiles(project);
    const groundTiles = tiles.filter((tile) => tile.terrain === "ground");
    const holeTiles = tiles.filter((tile) => tile.terrain === "hole");

    return {
      schema: "hollow-room-unity-layout",
      version: 1,
      exportedAt: new Date().toISOString(),
      source: {
        app: "Hollow Room Lab",
        projectExportVersion: 2,
      },
      unity: {
        unit: "meter",
        unitsPerTile: UNITY_TILE_SIZE_METERS,
        tileSizeMeters: {
          x: UNITY_TILE_SIZE_METERS,
          y: UNITY_FLOOR_THICKNESS_METERS,
          z: UNITY_TILE_SIZE_METERS,
        },
        coordinateSystem: {
          origin: "Room grid 0,0 maps to Unity world 0,0,0.",
          gridToUnity: "unity.x = grid.x, unity.y = elevationMeters, unity.z = -grid.y",
          axes: {
            east: "+X",
            west: "-X",
            north: "+Z",
            south: "-Z",
            up: "+Y",
          },
          tilePivot: "center",
        },
        prefabConventions: {
          wallPrefabForward: "Outward from the room through the wall face.",
          wallPrefabLocalSize: "Local X spans the wall length, local Y is height, local Z is thickness.",
          spawnPrefabPivot: "center of the 1m tile at floor height.",
        },
        defaults: {
          floorThicknessMeters: UNITY_FLOOR_THICKNESS_METERS,
          wallHeightMeters: UNITY_WALL_HEIGHT_METERS,
          wallThicknessMeters: UNITY_WALL_THICKNESS_METERS,
          doorHeightMeters: UNITY_DOOR_HEIGHT_METERS,
        },
      },
      room: {
        id: project.id,
        name: project.name,
        collection: collection ? deepClone(collection) : null,
        metadata,
        template: createUnityTemplateSummary(template),
        boundsGrid: deepClone(template.bounds),
        sizeTiles: {
          width: template.width,
          height: template.height,
        },
        sizeMeters: {
          x: template.width * UNITY_TILE_SIZE_METERS,
          z: template.height * UNITY_TILE_SIZE_METERS,
        },
        entitySummary,
      },
      geometry: {
        tiles,
        floorTiles: groundTiles,
        holeTiles,
        walls: buildUnityWallGeometry(project),
        doors: buildUnityWallAnchors(project, "door"),
        secretWallEntrances: buildUnityWallAnchors(project, "secret-wall"),
      },
      spawnPoints: {
        enemies: buildUnityOccupants(project, (cell) =>
          getOccupantFamily(cell.occupant) === "enemy"
        ),
        items: buildUnityOccupants(project, (cell) => cell.occupant === "item"),
      },
      props: {
        rocks: buildUnityOccupants(project, (cell) => cell.occupant === "rock"),
        decor: buildUnityOccupants(project, (cell) =>
          getOccupantFamily(cell.occupant) === "decor"
        ),
      },
      entityGroups,
    };
  }

  function buildRealityComposerProExportPayload(project) {
    const template = TEMPLATE_MAP[project.templateId];
    const metadata = getProjectMetadata(project);
    const collection = project.collectionId
      ? getCollectionById(project.collectionId)
      : null;
    const entitySummary = buildEntitySummary(project);
    const entityGroups = buildEntityGroups(project);
    const sceneGraph = buildRealityComposerProSceneGraph(project);
    const hollowRuntime = buildHollowRuntimeExport(project);

    return {
      schema: "hollow-room-reality-composer-pro-scene",
      version: 1,
      exportedAt: new Date().toISOString(),
      source: {
        app: "Hollow Room Lab",
        projectExportVersion: 2,
      },
      target: {
        app: "Reality Composer Pro",
        runtime: "RealityKit",
        unit: "meter",
        unitsPerTile: UNITY_TILE_SIZE_METERS,
        coordinateSystem: {
          origin: "Room grid 0,0 maps to RealityKit world 0,0,0.",
          gridToRealityKit:
            "realityKit.x = grid.x, realityKit.y = elevationMeters, realityKit.z = grid.y",
          axes: {
            east: "+X",
            west: "-X",
            north: "-Z",
            south: "+Z",
            up: "+Y",
          },
          tilePivot: "center",
        },
        importNotes: [
          "This is a Reality Composer Pro / RealityKit scene manifest, not a native .realitycomposerpro bundle.",
          "Use the sceneGraph.flatEntities list to generate ModelEntity instances or convert the manifest into USD/USDZ.",
          "Primitive box sizes are expressed in meters and are ready for RealityKit MeshResource generation.",
        ],
      },
      room: {
        id: project.id,
        name: project.name,
        safeEntityName: sanitizeRealityComposerName(project.name || EMPTY_PROJECT_NAME),
        collection: collection ? deepClone(collection) : null,
        metadata,
        template: createRealityComposerTemplateSummary(template),
        boundsGrid: deepClone(template.bounds),
        sizeTiles: {
          width: template.width,
          height: template.height,
        },
        sizeMeters: {
          x: template.width * UNITY_TILE_SIZE_METERS,
          z: template.height * UNITY_TILE_SIZE_METERS,
        },
        entitySummary,
      },
      materials: buildRealityComposerMaterials(),
      sceneGraph,
      hollowRuntime,
      entityGroups,
    };
  }

  function buildRealityKitUsdaExport(project) {
    const payload = buildRealityComposerProExportPayload(project);
    const rootName = createUsdPrimName(payload.room.safeEntityName || project.name, "Room");
    const runtime = payload.hollowRuntime;
    const lines = [];

    lines.push("#usda 1.0");
    lines.push("");
    lines.push("(");
    lines.push(`    defaultPrim = ${formatUsdaString(rootName)}`);
    lines.push("    metersPerUnit = 1");
    lines.push('    upAxis = "Y"');
    lines.push("    customLayerData = {");
    lines.push('        string creator = "Hollow Room Lab"');
    lines.push(`        string exportedAt = ${formatUsdaString(payload.exportedAt)}`);
    lines.push('        string targetRuntime = "RealityKit"');
    lines.push("    }");
    lines.push(")");
    lines.push("");
    lines.push(`def Xform ${formatUsdaString(rootName)} (`);
    appendUsdaCustomData(lines, {
      hollowSchema: "hollow-room-realitykit-usda-scene",
      hollowProjectId: project.id,
      hollowRuntimeSchemaVersion: runtime?.schemaVersion || 2,
      roomName: payload.room.name,
      roomType: payload.room.metadata.roomType,
      rewardType: payload.room.metadata.rewardType,
      templateId: payload.room.template.id,
      widthTiles: payload.room.sizeTiles.width,
      heightTiles: payload.room.sizeTiles.height,
      tileSizeMeters: UNITY_TILE_SIZE_METERS,
    }, "    ");
    lines.push(")");
    lines.push("{");
    appendUsdaMaterials(lines, payload.materials, rootName, "    ");
    appendUsdaSceneGroups(lines, payload.sceneGraph.entities, rootName, "    ");
    lines.push("}");
    lines.push("");

    return lines.join("\n");
  }

  function appendUsdaMaterials(lines, materials, rootName, indent) {
    lines.push(`${indent}def Scope "Materials"`);
    lines.push(`${indent}{`);
    materials.forEach((material) => {
      const materialName = createUsdPrimName(material.id, "Material");
      const color = hexToUsdColor(material.baseColor);
      lines.push(`${indent}    def Material ${formatUsdaString(materialName)}`);
      lines.push(`${indent}    {`);
      lines.push(
        `${indent}        token outputs:surface.connect = </${rootName}/Materials/${materialName}/PreviewSurface.outputs:surface>`
      );
      lines.push(`${indent}        def Shader "PreviewSurface"`);
      lines.push(`${indent}        {`);
      lines.push(`${indent}            uniform token info:id = "UsdPreviewSurface"`);
      lines.push(
        `${indent}            color3f inputs:diffuseColor = (${formatUsdaNumber(
          color.r
        )}, ${formatUsdaNumber(color.g)}, ${formatUsdaNumber(color.b)})`
      );
      lines.push(`${indent}            float inputs:metallic = 0`);
      lines.push(
        `${indent}            float inputs:roughness = ${formatUsdaNumber(material.roughness)}`
      );
      lines.push(`${indent}            token outputs:surface`);
      lines.push(`${indent}        }`);
      lines.push(`${indent}    }`);
    });
    lines.push(`${indent}}`);
    lines.push("");
  }

  function appendUsdaSceneGroups(lines, sceneEntities, rootName, indent) {
    const wallEntities =
      sceneEntities.walls.runs.length > 0
        ? sceneEntities.walls.runs
        : sceneEntities.walls.segments;
    const groupDescriptors = [
      {
        name: "Terrain",
        entities: [...sceneEntities.floorTiles, ...sceneEntities.holeMarkers],
      },
      {
        name: "Walls",
        entities: wallEntities,
      },
      {
        name: "Entrances",
        entities: [...sceneEntities.doors, ...sceneEntities.secretWallEntrances],
      },
      {
        name: "SpawnPoints",
        entities: [...sceneEntities.enemySpawnPoints, ...sceneEntities.itemSpawnPoints],
      },
      {
        name: "Props",
        entities: [...sceneEntities.rocks, ...sceneEntities.decor],
      },
    ];

    groupDescriptors.forEach((group) => {
      const groupName = createUsdPrimName(group.name, "Group");
      const usedNames = new Set();
      lines.push(`${indent}def Xform ${formatUsdaString(groupName)} (`);
      appendUsdaCustomData(lines, {
        hollowGroup: group.name,
        entityCount: group.entities.length,
      }, `${indent}    `);
      lines.push(`${indent})`);
      lines.push(`${indent}{`);
      group.entities.forEach((entity) => {
        appendUsdaCubeEntity(lines, entity, rootName, usedNames, `${indent}    `);
      });
      lines.push(`${indent}}`);
      lines.push("");
    });
  }

  function appendUsdaCubeEntity(lines, entity, rootName, usedNames, indent) {
    const primName = createUniqueUsdPrimName(entity.name || entity.id, usedNames);
    const transform = entity.realityKit?.transform || createRealityKitTransform(
      createRealityKitPosition(0, 0)
    );
    const mesh = entity.realityKit?.mesh || {};
    const size = mesh.sizeMeters || { x: 1, y: 1, z: 1 };
    const translation = transform.translation || { x: 0, y: 0, z: 0 };
    const yaw = transform.rotationEulerDegrees?.y || 0;
    const materialName = createUsdPrimName(
      entity.realityKit?.material || "GroundSand",
      "Material"
    );
    const customData = createUsdEntityCustomData(entity);

    lines.push(`${indent}def Cube ${formatUsdaString(primName)} (`);
    lines.push(`${indent}    prepend apiSchemas = ["MaterialBindingAPI"]`);
    appendUsdaCustomData(lines, customData, `${indent}    `);
    lines.push(`${indent})`);
    lines.push(`${indent}{`);
    lines.push(`${indent}    double size = 1`);
    lines.push(
      `${indent}    double3 xformOp:translate = ${formatUsdaVector3(translation)}`
    );
    if (yaw !== 0) {
      lines.push(`${indent}    float xformOp:rotateY = ${formatUsdaNumber(yaw)}`);
    }
    lines.push(`${indent}    float3 xformOp:scale = ${formatUsdaVector3(size)}`);
    lines.push(
      `${indent}    uniform token[] xformOpOrder = ${formatUsdaTokenArray(
        yaw === 0
          ? ["xformOp:translate", "xformOp:scale"]
          : ["xformOp:translate", "xformOp:rotateY", "xformOp:scale"]
      )}`
    );
    lines.push(
      `${indent}    rel material:binding = </${rootName}/Materials/${materialName}>`
    );
    lines.push(`${indent}}`);
  }

  function createUsdEntityCustomData(entity) {
    const collisionEnabled = Boolean(entity.realityKit?.components?.collision?.enabled);
    const physicsEnabled = Boolean(entity.realityKit?.components?.physicsBody?.enabled);
    const gameplay = entity.realityKit?.components?.gameplay || {};
    return {
      hollowEntityId: entity.id,
      hollowKind: entity.kind,
      hollowSemantic: entity.semantic,
      hollowPrefabKey: entity.prefabKey,
      hollowTags: (entity.tags || []).join(","),
      collisionEnabled,
      physicsEnabled,
      grid: JSON.stringify(entity.grid || {}),
      gameplay: JSON.stringify(gameplay),
    };
  }

  function appendUsdaCustomData(lines, data, indent) {
    lines.push(`${indent}customData = {`);
    Object.entries(data).forEach(([key, value]) => {
      const safeKey = sanitizeUsdCustomDataKey(key);
      if (typeof value === "number") {
        lines.push(`${indent}    double ${safeKey} = ${formatUsdaNumber(value)}`);
        return;
      }
      if (typeof value === "boolean") {
        lines.push(`${indent}    bool ${safeKey} = ${value ? "true" : "false"}`);
        return;
      }
      lines.push(`${indent}    string ${safeKey} = ${formatUsdaString(value ?? "")}`);
    });
    lines.push(`${indent}}`);
  }

  function createUniqueUsdPrimName(value, usedNames) {
    const baseName = createUsdPrimName(value, "Entity");
    if (!usedNames.has(baseName)) {
      usedNames.add(baseName);
      return baseName;
    }

    const hashed = `${baseName}_${hashString(value).slice(0, 6)}`;
    if (!usedNames.has(hashed)) {
      usedNames.add(hashed);
      return hashed;
    }

    let index = 2;
    while (usedNames.has(`${hashed}_${index}`)) {
      index += 1;
    }
    const uniqueName = `${hashed}_${index}`;
    usedNames.add(uniqueName);
    return uniqueName;
  }

  function createUsdPrimName(value, fallback) {
    const source = String(value || fallback || "Prim")
      .replace(/-/g, "_minus_")
      .replace(/[^a-zA-Z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const safe = source || fallback || "Prim";
    return /^[0-9]/.test(safe) ? `Prim_${safe}` : safe;
  }

  function sanitizeUsdCustomDataKey(value) {
    return createUsdPrimName(value, "key").replace(/_minus_/g, "_");
  }

  function formatUsdaString(value) {
    return `"${String(value ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "")}"`;
  }

  function formatUsdaNumber(value) {
    const number = Number.isFinite(Number(value)) ? Number(value) : 0;
    return Number.parseFloat(number.toFixed(6)).toString();
  }

  function formatUsdaVector3(value) {
    return `(${formatUsdaNumber(value.x)}, ${formatUsdaNumber(value.y)}, ${formatUsdaNumber(
      value.z
    )})`;
  }

  function formatUsdaTokenArray(tokens) {
    return `[${tokens.map(formatUsdaString).join(", ")}]`;
  }

  function hexToUsdColor(hex) {
    const normalized = String(hex || "#ffffff").replace("#", "");
    const value = /^[0-9a-fA-F]{6}$/.test(normalized) ? normalized : "ffffff";
    return {
      r: parseInt(value.slice(0, 2), 16) / 255,
      g: parseInt(value.slice(2, 4), 16) / 255,
      b: parseInt(value.slice(4, 6), 16) / 255,
    };
  }

  function hashString(value) {
    let hash = 2166136261;
    const text = String(value || "");
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function buildFloorExportPayload(collectionId) {
    const collection = getCollectionById(collectionId);
    const graph = getFloorGraph(collectionId);
    const analysis = analyzeFloorGraph(collectionId);
    const projectIds = Array.from(new Set(graph.nodes.map((node) => node.projectId)));
    const referencedProjects = projectIds
      .map((projectId) => state.projects.find((project) => project.id === projectId))
      .filter(Boolean);

    return {
      version: 1,
      kind: "floor-graph",
      exportedAt: new Date().toISOString(),
      collection: collection ? deepClone(collection) : null,
      floorGraph: deepClone(graph),
      nodes: deepClone(graph.nodes),
      edges: analysis.edges,
      warnings: analysis.warnings,
      referencedRooms: referencedProjects.map((project) => {
        const template = TEMPLATE_MAP[project.templateId];
        return {
          id: project.id,
          name: project.name,
          metadata: getProjectMetadata(project),
          template: {
            id: template.id,
            name: template.name,
            summary: template.summary,
            width: template.width,
            height: template.height,
            chunks: getTemplateChunkFootprint(template).offsets,
          },
          entitySummary: buildEntitySummary(project),
        };
      }),
      templates: referencedProjects.map((project) => {
        const template = TEMPLATE_MAP[project.templateId];
        return {
          id: template.id,
          name: template.name,
          summary: template.summary,
          width: template.width,
          height: template.height,
          isCustom: Boolean(template.isCustom),
          descriptor: isCustomTemplate(template.id)
            ? getSerializableCustomTemplate(template.id)
            : null,
        };
      }),
      projects: referencedProjects.map((project) => buildProjectExportPayload(project)),
    };
  }

  function isFloorExportPayload(parsed) {
    return Boolean(
      parsed &&
        typeof parsed === "object" &&
        (parsed.kind === "floor-graph" ||
          (parsed.floorGraph &&
            parsed.collection &&
            (Array.isArray(parsed.projects) || Array.isArray(parsed.nodes))))
    );
  }

  function importFloorPayload(parsed) {
    const rawCollection = parsed.collection && typeof parsed.collection === "object"
      ? parsed.collection
      : {};
    const collectionName =
      sanitizeCollectionName(rawCollection.name) ||
      `Imported Floor ${state.collections.length + 1}`;
    const collection = findOrCreateCollectionByName(collectionName);
    const projectIdMap = new Map();
    const importedProjects = [];

    (Array.isArray(parsed.projects) ? parsed.projects : []).forEach((projectPayload) => {
      if (!projectPayload || typeof projectPayload !== "object") {
        return;
      }

      const originalProject = projectPayload && projectPayload.project
        ? projectPayload.project
        : projectPayload;
      const originalId = originalProject && originalProject.id;
      const importedProject = normalizeImportedProject({
        ...projectPayload,
        collection,
      });
      importedProject.collectionId = collection.id;
      state.projects.unshift(importedProject);
      importedProjects.push(importedProject);
      if (originalId) {
        projectIdMap.set(String(originalId), importedProject.id);
      }
    });

    const rawGraph = parsed.floorGraph || { nodes: parsed.nodes || [] };
    const seenNodeIds = new Set();
    const nodes = (Array.isArray(rawGraph.nodes) ? rawGraph.nodes : [])
      .map((rawNode) => {
        const mappedProjectId =
          projectIdMap.get(String(rawNode.projectId || "")) || rawNode.projectId;
        const project = state.projects.find(
          (candidate) =>
            candidate.id === mappedProjectId && candidate.collectionId === collection.id
        );
        if (!project) {
          return null;
        }

        const rawId = String(rawNode.id || "");
        const id = rawId && !seenNodeIds.has(rawId) ? rawId : createFloorNodeId();
        seenNodeIds.add(id);

        return {
          id,
          projectId: project.id,
          x: Number.isFinite(Number(rawNode.x)) ? Math.round(Number(rawNode.x)) : 0,
          y: Number.isFinite(Number(rawNode.y)) ? Math.round(Number(rawNode.y)) : 0,
        };
      })
      .filter(Boolean);

    state.floorGraphs[collection.id] = {
      collectionId: collection.id,
      nodes,
      selectedNodeId:
        nodes.find((node) => node.id === rawGraph.selectedNodeId)?.id ||
        nodes[0]?.id ||
        null,
      updatedAt: new Date().toISOString(),
    };
    state.activeCollectionId = collection.id;
    state.activeProjectId = importedProjects[0]?.id || nodes[0]?.projectId || state.activeProjectId;
    ui.floorPaletteProjectId = state.activeProjectId;
    pruneFloorGraphs();
  }

  function findOrCreateCollectionByName(name) {
    const existing = state.collections.find(
      (collection) => collection.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      return existing;
    }

    const timestamp = new Date().toISOString();
    const collection = {
      id: createCollectionId(),
      name,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    state.collections.push(collection);
    return collection;
  }

  function handleExportImage(format) {
    const project = getActiveProject();
    if (!project) {
      return;
    }

    const template = TEMPLATE_MAP[project.templateId];
    const canvas = renderProjectToCanvas(project, template);
    const extension = format === "jpeg" ? "jpg" : "png";
    const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
    const quality = format === "jpeg" ? 0.92 : undefined;

    downloadCanvasFile(
      `${slugify(project.name || EMPTY_PROJECT_NAME)}.${extension}`,
      canvas,
      mimeType,
      quality
    );
  }

  function handleExportFloorJson() {
    const collection = getActiveFloorCollection();
    if (!collection) {
      return;
    }

    downloadTextFile(
      `${slugify(collection.name)}-floor.json`,
      JSON.stringify(buildFloorExportPayload(collection.id), null, 2)
    );
  }

  function handleExportFloorPng() {
    const collection = getActiveFloorCollection();
    if (!collection) {
      return;
    }

    const canvas = renderFloorToCanvas(collection.id);
    downloadCanvasFile(`${slugify(collection.name)}-floor.png`, canvas, "image/png");
  }

  function handleImportProject(event) {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const snapshot = captureHistorySnapshot();
        if (isFloorExportPayload(parsed)) {
          importFloorPayload(parsed);
          pushUndoSnapshot(snapshot);
          ui.workspaceMode = "floor";
          ui.boundBoardTemplateId = null;
          persist();
          renderAll();
        } else {
          const imported = normalizeImportedProject(parsed);
          pushUndoSnapshot(snapshot);
          state.projects.unshift(imported);
          state.activeProjectId = imported.id;
          ui.boundBoardTemplateId = null;
          persist();
          renderAll();
        }
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Could not import that file.");
      } finally {
        importFileInput.value = "";
      }
    };
    reader.readAsText(file);
  }

  function handleBoardPointerDown(event) {
    const coordTarget = findClosestFromTarget(event.target, "[data-grid-x][data-grid-y]");
    if (!coordTarget) {
      return;
    }

    event.preventDefault();

    const coord = readCoordFromNode(coordTarget);
    const cellButton = coordTarget.matches("[data-cell-key]") ? coordTarget : null;
    const key = makeKey(coord.x, coord.y);

    ui.drag = {
      pointerId: event.pointerId,
      start: coord,
      end: coord,
      startPointerPosition: getPointerPositionWithinNode(coordTarget, event),
      lastPaintedKey: null,
      tool: ui.selectedTool,
      historySnapshot: captureHistorySnapshot(),
      historyCaptured: false,
    };

    if (cellButton && ui.selectedTool === "brush") {
      applyPaintToSingleCell(key, {
        pointerPosition: getPointerPositionWithinNode(coordTarget, event),
        useDragHistory: true,
      });
      ui.drag.lastPaintedKey = key;
    }

    if (ui.selectedTool === "rectangle") {
      setPreviewRange(coord, coord);
    }

    setHoverKey(cellButton ? key : null);
  }

  function handleBoardPointerMove(event) {
    const coordTarget = findClosestFromTarget(event.target, "[data-grid-x][data-grid-y]");
    if (ui.drag) {
      return;
    }

    if (!coordTarget) {
      setHoverKey(null);
      return;
    }

    const key = coordTarget.matches("[data-cell-key]")
      ? makeKey(Number(coordTarget.dataset.gridX), Number(coordTarget.dataset.gridY))
      : null;
    setHoverKey(key);
  }

  function handleGlobalPointerMove(event) {
    if (ui.floorDrag) {
      handleFloorDragMove(event);
      return;
    }

    if (!ui.drag) {
      return;
    }

    const coordTarget = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest("[data-grid-x][data-grid-y]");

    if (!coordTarget) {
      if (ui.drag.tool === "rectangle") {
        clearPreview();
      }
      return;
    }

    const coord = readCoordFromNode(coordTarget);
    const key = coordTarget.matches("[data-cell-key]") ? makeKey(coord.x, coord.y) : null;

    if (ui.drag.tool === "brush" && key && key !== ui.drag.lastPaintedKey) {
      applyPaintToSingleCell(key, {
        pointerPosition: getPointerPositionWithinNode(coordTarget, event),
        useDragHistory: true,
      });
      ui.drag.lastPaintedKey = key;
    }

    if (ui.drag.tool === "rectangle") {
      ui.drag.end = coord;
      setPreviewRange(ui.drag.start, coord);
    }

    setHoverKey(key);
  }

  function handleGlobalPointerUp(event) {
    if (ui.floorDrag) {
      handleFloorDragEnd();
      return;
    }

    if (!ui.drag) {
      return;
    }

    if (ui.drag.tool === "rectangle") {
      const coordTarget = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-grid-x][data-grid-y]");

      if (coordTarget) {
        ui.drag.end = readCoordFromNode(coordTarget);
      }

      applyPaintToRectangle(ui.drag.start, ui.drag.end, {
        startPointerPosition: ui.drag.startPointerPosition,
        historySnapshot: ui.drag.historySnapshot,
      });
      clearPreview();
    }

    ui.drag = null;
  }

  function handleShortcutKey(event) {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return;
    }

    const lower = event.key.toLowerCase();
    if ((event.metaKey || event.ctrlKey) && lower === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
      return;
    }

    if ((event.metaKey || event.ctrlKey) && lower === "y") {
      event.preventDefault();
      handleRedo();
      return;
    }

    if (lower === "b") {
      ui.selectedTool = "brush";
      renderToolbar();
      return;
    }

    if (lower === "r") {
      ui.selectedTool = "rectangle";
      renderToolbar();
      return;
    }

    const paint = PAINTS.find((item) => item.shortcut === event.key);
    if (paint) {
      ui.selectedPaint = paint.id;
      renderToolbar();
      return;
    }

    const variant = [...ENEMY_VARIANTS, ...DECOR_VARIANTS].find(
      (item) => item.shortcut && item.shortcut.toLowerCase() === lower
    );
    if (variant) {
      ui.selectedVariants[variant.family] = variant.id;
      renderToolbar();
    }
  }

  function applyPaintToSingleCell(key, options = {}) {
    const project = getActiveProject();
    if (!project || !project.cells[key]) {
      return;
    }

    const snapshot = captureHistorySnapshot();
    const changed = applyPaint(project, key, ui.selectedPaint, {
      doorMode: "toggle",
      pointerPosition: options.pointerPosition || null,
    });
    if (!changed) {
      return;
    }

    if (options.useDragHistory && ui.drag) {
      if (!ui.drag.historyCaptured) {
        pushUndoSnapshot(ui.drag.historySnapshot || snapshot);
        ui.drag.historyCaptured = true;
      }
    } else {
      pushUndoSnapshot(snapshot);
    }

    project.updatedAt = new Date().toISOString();
    persist();
    refreshBoardCells();
    renderBoardMeta();
    renderProjectList();
    renderStats();
    renderLegendPanel();
    renderHistoryControls();
  }

  function applyPaintToRectangle(start, end, options = {}) {
    const project = getActiveProject();
    if (!project) {
      return;
    }

    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    const snapshot = options.historySnapshot || captureHistorySnapshot();

    let changed = false;
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const key = makeKey(x, y);
        if (!project.cells[key]) {
          continue;
        }

        changed =
          applyPaint(project, key, ui.selectedPaint, {
            doorMode: "set",
            selectionBounds: { minX, maxX, minY, maxY },
            pointerPosition:
              minX === maxX && minY === maxY ? options.startPointerPosition || null : null,
          }) || changed;
      }
    }

    if (!changed) {
      return;
    }

    pushUndoSnapshot(snapshot);
    project.updatedAt = new Date().toISOString();
    persist();
    refreshBoardCells();
    renderBoardMeta();
    renderProjectList();
    renderStats();
    renderLegendPanel();
    renderHistoryControls();
  }

  function applyPaint(project, key, paintId, options = {}) {
    const cell = project.cells[key];
    if (!cell) {
      return false;
    }

    if (paintId === "door" || paintId === "secret-wall") {
      return applyWallPaint(project, key, paintId, options);
    }

    const next = projectCellForPaint(cell, paintId);
    if (
      next.terrain === cell.terrain &&
      next.occupant === cell.occupant &&
      JSON.stringify(next.doors) === JSON.stringify(cell.doors) &&
      JSON.stringify(next.secretWalls) === JSON.stringify(cell.secretWalls)
    ) {
      return false;
    }

    project.cells[key] = next;
    return true;
  }

  function projectCellForPaint(cell, paintId) {
    const occupantId = resolveOccupantForPaint(paintId);

    switch (paintId) {
      case "ground":
        return { ...cell, terrain: "ground", occupant: "none" };
      case "hole":
        return {
          ...cell,
          terrain: "hole",
          occupant: "none",
          doors: emptyDoors(),
          secretWalls: emptySecretWalls(),
        };
      default:
        return occupantId ? { ...cell, terrain: "ground", occupant: occupantId } : cell;
    }
  }

  function resolveOccupantForPaint(paintId) {
    const paint = PAINTS.find((candidate) => candidate.id === paintId);
    if (!paint) {
      return null;
    }

    if (paint.occupantId) {
      return paint.occupantId;
    }

    if (paint.variantFamily) {
      return ui.selectedVariants[paint.variantFamily] || null;
    }

    return null;
  }

  function applyWallPaint(project, key, kind, options = {}) {
    const cell = project.cells[key];
    if (!cell) {
      return false;
    }

    const direction = resolveWallPaintDirection(project, cell, kind, options);
    if (!direction) {
      return false;
    }

    const mode = options.doorMode || "toggle";
    const nextDoors = { ...cell.doors };
    const nextSecretWalls = { ...cell.secretWalls };
    const currentValue =
      kind === "door" ? Boolean(nextDoors[direction]) : Boolean(nextSecretWalls[direction]);
    const nextValue = mode === "set" ? true : !currentValue;
    if (currentValue === nextValue && cell.terrain === "ground") {
      return false;
    }

    if (kind === "door") {
      nextDoors[direction] = nextValue;
      if (nextValue) {
        nextSecretWalls[direction] = false;
      }
    } else {
      nextSecretWalls[direction] = nextValue;
      if (nextValue) {
        nextDoors[direction] = false;
      }
    }

    project.cells[key] = {
      ...cell,
      terrain: "ground",
      doors: nextDoors,
      secretWalls: nextSecretWalls,
    };
    return true;
  }

  function resolveWallPaintDirection(project, cell, kind, options = {}) {
    const validDirections = getValidWallDirections(project, cell);
    if (validDirections.length === 0) {
      return null;
    }

    const existingDirection = getSingleExistingWallDirection(cell, kind, validDirections);
    if (options.pointerPosition) {
      return chooseBestWallDirection(
        validDirections,
        validDirections.map((direction) => ({
          direction,
          distance: getPointerDistanceToDirection(direction, options.pointerPosition),
          preference: 0,
        })),
        existingDirection
      );
    }

    if (options.selectionBounds) {
      const selectionWidth = options.selectionBounds.maxX - options.selectionBounds.minX + 1;
      const selectionHeight = options.selectionBounds.maxY - options.selectionBounds.minY + 1;
      const preferNorthSouth = selectionWidth >= selectionHeight;

      return chooseBestWallDirection(
        validDirections,
        validDirections.map((direction) => ({
          direction,
          distance: getSelectionDistanceToDirection(direction, cell, options.selectionBounds),
          preference:
            preferNorthSouth === isNorthSouthDirection(direction) ? 0 : 1,
        })),
        existingDirection
      );
    }

    return existingDirection || validDirections[0];
  }

  function getValidWallDirections(project, cell) {
    return DOOR_DIRECTIONS.map((direction) => direction.id).filter((directionId) =>
      canPlaceWallAnchor(project, cell, directionId)
    );
  }

  function getSingleExistingWallDirection(cell, kind, validDirections) {
    const flags = kind === "door" ? cell.doors : cell.secretWalls;
    const activeDirections = validDirections.filter((direction) => flags && flags[direction]);
    return activeDirections.length === 1 ? activeDirections[0] : null;
  }

  function chooseBestWallDirection(validDirections, scores, existingDirection) {
    return scores
      .filter((score) => validDirections.includes(score.direction))
      .sort((left, right) => {
        if (left.distance !== right.distance) {
          return left.distance - right.distance;
        }

        if (left.preference !== right.preference) {
          return left.preference - right.preference;
        }

        if (existingDirection) {
          if (left.direction === existingDirection && right.direction !== existingDirection) {
            return -1;
          }

          if (right.direction === existingDirection && left.direction !== existingDirection) {
            return 1;
          }
        }

        return getDirectionOrder(left.direction) - getDirectionOrder(right.direction);
      })[0]?.direction || null;
  }

  function getPointerDistanceToDirection(direction, pointerPosition) {
    switch (direction) {
      case "north":
        return pointerPosition.y;
      case "south":
        return 1 - pointerPosition.y;
      case "east":
        return 1 - pointerPosition.x;
      case "west":
        return pointerPosition.x;
      default:
        return Number.POSITIVE_INFINITY;
    }
  }

  function getSelectionDistanceToDirection(direction, cell, selectionBounds) {
    switch (direction) {
      case "north":
        return Math.abs(cell.y - selectionBounds.minY);
      case "south":
        return Math.abs(selectionBounds.maxY - cell.y);
      case "east":
        return Math.abs(selectionBounds.maxX - cell.x);
      case "west":
        return Math.abs(cell.x - selectionBounds.minX);
      default:
        return Number.POSITIVE_INFINITY;
    }
  }

  function isNorthSouthDirection(direction) {
    return direction === "north" || direction === "south";
  }

  function getDirectionOrder(direction) {
    return ["north", "east", "south", "west"].indexOf(direction);
  }

  function setPreviewRange(start, end) {
    const project = getActiveProject();
    if (!project) {
      return;
    }

    const nextPreview = new Set();
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const key = makeKey(x, y);
        if (project.cells[key]) {
          nextPreview.add(key);
        }
      }
    }

    updatePreviewSet(nextPreview);
  }

  function clearPreview() {
    updatePreviewSet(new Set());
  }

  function updatePreviewSet(nextSet) {
    const union = new Set([...ui.previewKeys, ...nextSet]);
    union.forEach((key) => {
      const node = root.querySelector(
        `[data-cell-key="${escapeSelectorValue(key)}"]`
      );
      if (!node) {
        return;
      }

      node.classList.toggle("cell--preview", nextSet.has(key));
    });
    ui.previewKeys = nextSet;
  }

  function setHoverKey(nextKey) {
    if (ui.hoverKey === nextKey) {
      return;
    }

    if (ui.hoverKey) {
      const previousNode = root.querySelector(
        `[data-cell-key="${escapeSelectorValue(ui.hoverKey)}"]`
      );
      if (previousNode) {
        previousNode.classList.remove("cell--hover");
      }
    }

    ui.hoverKey = nextKey;
    if (ui.hoverKey) {
      const nextNode = root.querySelector(
        `[data-cell-key="${escapeSelectorValue(ui.hoverKey)}"]`
      );
      if (nextNode) {
        nextNode.classList.add("cell--hover");
      }
    }

    renderBoardMeta();
  }

  function buildHoverText(key) {
    const project = getActiveProject();
    if (!project) {
      return "";
    }

    const cell = project.cells[key];
    if (!cell) {
      return "";
    }

    return `${formatCoordLabel(cell.x, cell.y)} · ${describeCell(cell)}`;
  }

  function calculateStats(project) {
    const cells = Object.values(project.cells);
    const activeCount = cells.length;
    let groundCount = 0;
    let holeCount = 0;
    let rockCount = 0;
    let enemyCount = 0;
    let decorCount = 0;
    let itemCount = 0;
    let doorCount = 0;
    let secretWallCount = 0;
    const occupantCounts = Object.fromEntries(OCCUPANT_IDS.map((id) => [id, 0]));
    const groundKeys = [];

    cells.forEach((cell) => {
      if (cell.terrain === "ground") {
        groundCount += 1;
        groundKeys.push(makeKey(cell.x, cell.y));
      }

      if (cell.terrain === "hole") {
        holeCount += 1;
      }

      if (occupantCounts[cell.occupant] !== undefined) {
        occupantCounts[cell.occupant] += 1;
      }

      if (cell.occupant === "rock") {
        rockCount += 1;
      } else if (cell.occupant && cell.occupant.startsWith("enemy-")) {
        enemyCount += 1;
      } else if (cell.occupant && cell.occupant.startsWith("decor-")) {
        decorCount += 1;
      } else if (cell.occupant === "item") {
        itemCount += 1;
      }

      doorCount += countActiveWallFlags(cell.doors);
      secretWallCount += countActiveWallFlags(cell.secretWalls);
    });

    const unvisited = new Set(groundKeys);
    let groundRegions = 0;
    while (unvisited.size > 0) {
      const [seed] = unvisited;
      groundRegions += 1;
      const queue = [seed];
      unvisited.delete(seed);

      while (queue.length > 0) {
        const key = queue.shift();
        const [xText, yText] = key.split(",");
        const x = Number(xText);
        const y = Number(yText);

        orthogonalNeighborKeys(x, y).forEach((neighborKey) => {
          if (!unvisited.has(neighborKey)) {
            return;
          }

          unvisited.delete(neighborKey);
          queue.push(neighborKey);
        });
      }
    }

    return {
      activeCount,
      groundCount,
      holeCount,
      rockCount,
      enemyCount,
      decorCount,
      itemCount,
      doorCount,
      secretWallCount,
      groundRegions,
      occupantCounts,
    };
  }

  function buildEntitySummary(project) {
    const stats = calculateStats(project);
    const byType = {
      ground: { label: "Ground", count: stats.groundCount },
      hole: { label: "Hole", count: stats.holeCount },
      rock: { label: OCCUPANT_DEFINITIONS.rock.legendLabel, count: stats.rockCount },
      item: { label: OCCUPANT_DEFINITIONS.item.legendLabel, count: stats.itemCount },
      door: { label: "Door", count: stats.doorCount },
      "secret-wall": {
        label: "Secret Wall Entrance",
        count: stats.secretWallCount,
      },
    };

    ENEMY_VARIANTS.forEach((variant) => {
      byType[variant.id] = {
        label: variant.legendLabel,
        count: stats.occupantCounts[variant.id] || 0,
      };
    });

    DECOR_VARIANTS.forEach((variant) => {
      byType[variant.id] = {
        label: variant.legendLabel,
        count: stats.occupantCounts[variant.id] || 0,
      };
    });

    return {
      activeTiles: stats.activeCount,
      groundRegions: stats.groundRegions,
      byType,
      families: {
        terrain: stats.groundCount + stats.holeCount,
        obstructions: stats.rockCount,
        enemies: stats.enemyCount,
        decor: stats.decorCount,
        items: stats.itemCount,
        wallAnchors: stats.doorCount + stats.secretWallCount,
      },
    };
  }

  function buildEntityGroups(project) {
    const byType = {
      ground: [],
      hole: [],
      rock: [],
      item: [],
      door: [],
      "secret-wall": [],
    };

    ENEMY_VARIANTS.forEach((variant) => {
      byType[variant.id] = [];
    });
    DECOR_VARIANTS.forEach((variant) => {
      byType[variant.id] = [];
    });

    getProjectCellsInReadingOrder(project).forEach((cell) => {
      if (cell.terrain === "hole") {
        byType.hole.push(createCellExportPoint(cell));
      } else {
        byType.ground.push(createCellExportPoint(cell));
      }

      if (byType[cell.occupant]) {
        byType[cell.occupant].push(createCellExportPoint(cell));
      }

      DOOR_DIRECTIONS.forEach((direction) => {
        if (cell.doors && cell.doors[direction.id]) {
          byType.door.push(createWallAnchorExportPoint(cell, direction.id));
        }

        if (cell.secretWalls && cell.secretWalls[direction.id]) {
          byType["secret-wall"].push(createWallAnchorExportPoint(cell, direction.id));
        }
      });
    });

    return {
      byType,
      terrain: {
        ground: byType.ground,
        hole: byType.hole,
      },
      occupants: Object.fromEntries(
        OCCUPANT_IDS.map((id) => [id, byType[id] || []])
      ),
      wallAnchors: {
        doors: byType.door,
        secretWallEntrances: byType["secret-wall"],
      },
      families: {
        enemies: Object.fromEntries(
          ENEMY_VARIANTS.map((variant) => [variant.id, byType[variant.id]])
        ),
        decor: Object.fromEntries(
          DECOR_VARIANTS.map((variant) => [variant.id, byType[variant.id]])
        ),
        obstructions: {
          rock: byType.rock,
        },
        items: {
          item: byType.item,
        },
      },
    };
  }

  function createUnityTemplateSummary(template) {
    return {
      id: template.id,
      name: template.name,
      summary: template.summary,
      widthTiles: template.width,
      heightTiles: template.height,
      boundsGrid: deepClone(template.bounds),
      chunkSizeTiles: {
        width: ROOM_CHUNK_WIDTH,
        height: ROOM_CHUNK_HEIGHT,
      },
      chunks: getTemplateChunkFootprint(template).offsets,
      activeTiles: Array.from(template.mask)
        .sort(compareCoordKeys)
        .map((key) => {
          const coord = parseCoordKey(key);
          return {
            key,
            grid: coord,
            unity: {
              center: createUnityPosition(coord.x, coord.y),
            },
          };
        }),
    };
  }

  function createRealityComposerTemplateSummary(template) {
    return {
      id: template.id,
      name: template.name,
      summary: template.summary,
      widthTiles: template.width,
      heightTiles: template.height,
      boundsGrid: deepClone(template.bounds),
      chunkSizeTiles: {
        width: ROOM_CHUNK_WIDTH,
        height: ROOM_CHUNK_HEIGHT,
      },
      chunks: getTemplateChunkFootprint(template).offsets,
      activeTiles: Array.from(template.mask)
        .sort(compareCoordKeys)
        .map((key) => {
          const coord = parseCoordKey(key);
          return {
            key,
            grid: coord,
            realityKit: {
              translation: createRealityKitPosition(coord.x, coord.y),
            },
          };
        }),
    };
  }

  function buildRealityComposerMaterials() {
    return [
      createRealityComposerMaterial("GroundSand", "Ground Sand", "#d6b989", 0.92),
      createRealityComposerMaterial("HoleVoid", "Hole Void", "#101a27", 0.78),
      createRealityComposerMaterial("SolidWall", "Solid Wall", "#6f553d", 0.88),
      createRealityComposerMaterial("DoorAmber", "Door Amber", "#f0aa4d", 0.62),
      createRealityComposerMaterial("SecretWall", "Secret Wall", "#8a5b4f", 0.7),
      createRealityComposerMaterial("Rock", "Rock", "#766a61", 0.95),
      createRealityComposerMaterial("ItemSpawn", "Item Spawn", "#f0c34e", 0.45),
      createRealityComposerMaterial("EnemyStandard", "Enemy Standard", "#d97979", 0.5),
      createRealityComposerMaterial("EnemyFlying", "Enemy Flying", "#89dfff", 0.4),
      createRealityComposerMaterial("EnemySpittingPod", "Enemy Spitting Pod", "#91b85f", 0.65),
      createRealityComposerMaterial("EnemyStaticShooter", "Enemy Static Shooter", "#8f72d8", 0.48),
      createRealityComposerMaterial("EnemyCocoon", "Enemy Cocoon", "#bd8db9", 0.66),
      createRealityComposerMaterial("DecorShort", "Decor Short", "#79b56f", 0.78),
      createRealityComposerMaterial("DecorMedium", "Decor Medium", "#55b6a8", 0.76),
      createRealityComposerMaterial("DecorTall", "Decor Tall", "#5e91d6", 0.74),
    ];
  }

  function createRealityComposerMaterial(id, displayName, baseColorHex, roughness) {
    return {
      id,
      displayName,
      shader: "PhysicallyBasedMaterial",
      baseColor: baseColorHex,
      roughness,
      metallic: 0,
    };
  }

  function buildHollowRuntimeExport(project) {
    const template = TEMPLATE_MAP[project.templateId];
    const metadata = getProjectMetadata(project);
    const walkableTiles = buildHollowWalkableTiles(project);
    const holeTiles = buildHollowHoleTiles(project);
    const obstacles = buildHollowObstacles(project);
    const decor = buildHollowDecor(project);
    return {
      schemaVersion: 2,
      canonicalRoomId: createHollowCanonicalRoomId(project, template),
      displayName: project.name || EMPTY_PROJECT_NAME,
      sourceProjectId: project.id,
      roomType: metadata.roomType,
      rewardType: metadata.rewardType,
      prototypeStatus: metadata.prototypeStatus,
      tags: [...metadata.tags],
      notes: metadata.notes,
      tileSizeMeters: UNITY_TILE_SIZE_METERS,
      coordinateSystem: {
        grid: "x/z",
        world: "RealityKit meters",
        gridToWorld: "world.x = tile.x, world.y = elevation, world.z = tile.z",
        north: "-Z",
        south: "+Z",
        east: "+X",
        west: "-X",
      },
      dimensions: {
        widthTiles: template.width,
        heightTiles: template.height,
        bounds: {
          minX: template.bounds.minX,
          maxX: template.bounds.maxX,
          minZ: template.bounds.minY,
          maxZ: template.bounds.maxY,
        },
      },
      footprint: buildHollowRuntimeFootprint(template),
      walkableTiles,
      holeTiles,
      floorRegions: buildHollowFloorRegions(walkableTiles),
      doorPorts: buildHollowDoorPorts(project),
      playerSafeStart: buildHollowPlayerSafeStart(walkableTiles, obstacles),
      enemySpawns: buildHollowEnemySpawns(project),
      itemSpawns: buildHollowItemSpawns(project),
      obstacles,
      decor,
    };
  }

  function createHollowCanonicalRoomId(project, template) {
    return `${slugify(project.name || EMPTY_PROJECT_NAME)}-${template.width}x${template.height}`;
  }

  function buildHollowRuntimeFootprint(template) {
    const footprint = getTemplateChunkFootprint(template);
    return {
      primaryCell: { x: 0, z: 0 },
      occupiedBranchCells: footprint.offsets.map((chunk) => ({
        x: chunk.x,
        z: chunk.y,
      })),
      chunkBasisTiles: {
        width: ROOM_CHUNK_WIDTH,
        height: ROOM_CHUNK_HEIGHT,
      },
    };
  }

  function buildHollowWalkableTiles(project) {
    return getProjectCellsInReadingOrder(project)
      .filter((cell) => cell.terrain === "ground")
      .map((cell) => ({
        x: cell.x,
        z: cell.y,
      }));
  }

  function buildHollowHoleTiles(project) {
    return getProjectCellsInReadingOrder(project)
      .filter((cell) => cell.terrain === "hole")
      .map((cell) => ({
        x: cell.x,
        z: cell.y,
      }));
  }

  function buildHollowFloorRegions(walkableTiles) {
    const rows = new Map();
    walkableTiles.forEach((tile) => {
      if (!rows.has(tile.z)) {
        rows.set(tile.z, []);
      }
      rows.get(tile.z).push(tile.x);
    });

    const regions = [];
    [...rows.entries()]
      .sort((left, right) => left[0] - right[0])
      .forEach(([z, rowXs]) => {
        const sortedXs = rowXs.sort((left, right) => left - right);
        let runStart = null;
        let previous = null;
        sortedXs.forEach((x) => {
          if (runStart === null) {
            runStart = x;
            previous = x;
            return;
          }

          if (x === previous + 1) {
            previous = x;
            return;
          }

          regions.push(createHollowFloorRegion(regions.length, runStart, previous, z));
          runStart = x;
          previous = x;
        });

        if (runStart !== null) {
          regions.push(createHollowFloorRegion(regions.length, runStart, previous, z));
        }
      });

    return regions;
  }

  function createHollowFloorRegion(index, startX, endX, z) {
    return {
      id: `region_${index}`,
      center: {
        x: (startX + endX) / 2,
        y: 0,
        z,
      },
      halfSize: {
        x: (endX - startX + 1) / 2,
        z: 0.5,
      },
    };
  }

  function buildHollowDoorPorts(project) {
    const template = TEMPLATE_MAP[project.templateId];
    const footprint = getTemplateChunkFootprint(template);
    const occupied = new Set(footprint.offsets.map((chunk) => makeKey(chunk.x, chunk.y)));
    const ports = [];

    footprint.offsets.forEach((hostChunk) => {
      DOOR_DIRECTIONS.forEach((direction) => {
        const offset = getDirectionOffset(direction.id);
        if (occupied.has(makeKey(hostChunk.x + offset.x, hostChunk.y + offset.y))) {
          return;
        }

        ports.push(createHollowDoorPortCandidate(project, template, hostChunk, direction.id));
      });
    });

    const grouped = new Map();
    ports.forEach((port) => {
      if (!grouped.has(port.direction)) {
        grouped.set(port.direction, []);
      }
      grouped.get(port.direction).push(port);
    });

    return ["north", "east", "south", "west"].flatMap((direction) => {
      const sorted = (grouped.get(direction) || []).sort((left, right) =>
        compareHollowPortLane(left, right)
      );
      return sorted.map((port, index) => ({
        ...port,
        id: `${direction}_${index}`,
        laneIndex: index,
      }));
    });
  }

  function createHollowDoorPortCandidate(project, template, hostChunk, direction) {
    const chunkBounds = getTemplateChunkBoundsForOffset(template, hostChunk.x, hostChunk.y);
    const anchorCell = getChunkFaceAnchorCell(chunkBounds, direction);
    const cell = getCell(project, anchorCell.x, anchorCell.y);
    const authoredType = cell ? getWallAnchorType(cell, direction) : "none";
    const kind =
      authoredType === "door" ? "door" : authoredType === "secret" ? "secret" : "available";
    const gridEdgeCenter = getChunkFaceEdgeCenter(chunkBounds, direction);
    return {
      id: "",
      direction,
      laneIndex: 0,
      hostCell: {
        x: hostChunk.x,
        z: hostChunk.y,
      },
      gridEdgeCenter,
      positionMeters: {
        x: gridEdgeCenter.x,
        y: 0,
        z: gridEdgeCenter.z,
      },
      kind,
    };
  }

  function compareHollowPortLane(left, right) {
    if (left.direction === "north" || left.direction === "south") {
      if (left.gridEdgeCenter.x !== right.gridEdgeCenter.x) {
        return left.gridEdgeCenter.x - right.gridEdgeCenter.x;
      }
      return left.gridEdgeCenter.z - right.gridEdgeCenter.z;
    }

    if (left.gridEdgeCenter.z !== right.gridEdgeCenter.z) {
      return left.gridEdgeCenter.z - right.gridEdgeCenter.z;
    }
    return left.gridEdgeCenter.x - right.gridEdgeCenter.x;
  }

  function getTemplateChunkBoundsForOffset(template, chunkX, chunkY) {
    const minX = template.bounds.minX + chunkX * ROOM_CHUNK_WIDTH;
    const minY = template.bounds.minY + chunkY * ROOM_CHUNK_HEIGHT;
    return {
      minX,
      maxX: minX + ROOM_CHUNK_WIDTH - 1,
      minY,
      maxY: minY + ROOM_CHUNK_HEIGHT - 1,
    };
  }

  function getChunkFaceAnchorCell(chunkBounds, direction) {
    const centerX = chunkBounds.minX + Math.floor(ROOM_CHUNK_WIDTH / 2);
    const centerY = chunkBounds.minY + Math.floor(ROOM_CHUNK_HEIGHT / 2);
    switch (direction) {
      case "north":
        return { x: centerX, y: chunkBounds.minY };
      case "south":
        return { x: centerX, y: chunkBounds.maxY };
      case "east":
        return { x: chunkBounds.maxX, y: centerY };
      case "west":
        return { x: chunkBounds.minX, y: centerY };
      default:
        return { x: centerX, y: centerY };
    }
  }

  function getChunkFaceEdgeCenter(chunkBounds, direction) {
    const anchorCell = getChunkFaceAnchorCell(chunkBounds, direction);
    switch (direction) {
      case "north":
        return { x: anchorCell.x, z: chunkBounds.minY - 0.5 };
      case "south":
        return { x: anchorCell.x, z: chunkBounds.maxY + 0.5 };
      case "east":
        return { x: chunkBounds.maxX + 0.5, z: anchorCell.y };
      case "west":
        return { x: chunkBounds.minX - 0.5, z: anchorCell.y };
      default:
        return { x: anchorCell.x, z: anchorCell.y };
    }
  }

  function buildHollowPlayerSafeStart(walkableTiles, obstacles) {
    const blocked = new Set(
      obstacles.map((obstacle) => makeKey(obstacle.grid.x, obstacle.grid.z))
    );
    const candidates = walkableTiles
      .filter((tile) => !blocked.has(makeKey(tile.x, tile.z)))
      .sort(compareHollowTileDistanceToOrigin);
    const fallback = [...walkableTiles].sort(compareHollowTileDistanceToOrigin)[0] || {
      x: 0,
      z: 0,
    };
    const tile = candidates[0] || fallback;
    return {
      x: tile.x,
      y: 0,
      z: tile.z,
    };
  }

  function compareHollowTileDistanceToOrigin(left, right) {
    const leftDistance = left.x * left.x + left.z * left.z;
    const rightDistance = right.x * right.x + right.z * right.z;
    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }
    if (left.z !== right.z) {
      return left.z - right.z;
    }
    return left.x - right.x;
  }

  function buildHollowEnemySpawns(project) {
    return buildHollowOccupants(project, (cell) => getOccupantFamily(cell.occupant) === "enemy")
      .map((entry, index) => ({
        id: `enemy_${index}`,
        kind: entry.kind,
        grid: entry.grid,
        position: entry.position,
      }));
  }

  function buildHollowItemSpawns(project) {
    return buildHollowOccupants(project, (cell) => cell.occupant === "item")
      .map((entry, index) => ({
        id: `item_${index}`,
        kind: entry.kind,
        grid: entry.grid,
        position: entry.position,
      }));
  }

  function buildHollowObstacles(project) {
    return buildHollowOccupants(
      project,
      (cell) => cell.occupant === "rock" || getOccupantFamily(cell.occupant) === "decor"
    ).map((entry, index) => {
      const family = getOccupantFamily(entry.kind);
      const heightBlocks = family === "decor" ? getDecorHeightBlocks(entry.kind) : undefined;
      return {
        id: `obstacle_${index}`,
        kind: entry.kind,
        grid: entry.grid,
        center: {
          x: entry.position.x,
          y: entry.size.y / 2,
          z: entry.position.z,
        },
        size: entry.size,
        blocking: true,
        blocksProjectiles: true,
        ...(heightBlocks ? { heightBlocks } : {}),
      };
    });
  }

  function buildHollowDecor(project) {
    return buildHollowOccupants(project, (cell) => getOccupantFamily(cell.occupant) === "decor")
      .map((entry, index) => ({
        id: `decor_${index}`,
        kind: entry.kind,
        grid: entry.grid,
        center: {
          x: entry.position.x,
          y: entry.size.y / 2,
          z: entry.position.z,
        },
        size: entry.size,
        heightBlocks: getDecorHeightBlocks(entry.kind),
        blocking: true,
        blocksProjectiles: true,
      }));
  }

  function buildHollowOccupants(project, predicate) {
    return getProjectCellsInReadingOrder(project)
      .filter((cell) => cell.terrain !== "hole" && cell.occupant !== "none")
      .filter(predicate)
      .map((cell) => ({
        kind: cell.occupant,
        grid: {
          x: cell.x,
          z: cell.y,
        },
        position: {
          x: cell.x,
          y: 0,
          z: cell.y,
        },
        size: getRealityComposerOccupantSize(cell.occupant),
      }));
  }

  function buildRealityComposerProSceneGraph(project) {
    const floorTiles = getProjectCellsInReadingOrder(project)
      .filter((cell) => cell.terrain === "ground")
      .map((cell) => createRealityComposerTileEntity(cell, "ground"));
    const holeMarkers = getProjectCellsInReadingOrder(project)
      .filter((cell) => cell.terrain === "hole")
      .map((cell) => createRealityComposerTileEntity(cell, "hole"));
    const walls = buildRealityComposerWallEntities(project);
    const doors = buildRealityComposerPortalEntities(project, "door");
    const secretWallEntrances = buildRealityComposerPortalEntities(
      project,
      "secret-wall"
    );
    const enemySpawnPoints = buildRealityComposerOccupantEntities(project, (cell) =>
      getOccupantFamily(cell.occupant) === "enemy"
    );
    const itemSpawnPoints = buildRealityComposerOccupantEntities(
      project,
      (cell) => cell.occupant === "item"
    );
    const rocks = buildRealityComposerOccupantEntities(
      project,
      (cell) => cell.occupant === "rock"
    );
    const decor = buildRealityComposerOccupantEntities(project, (cell) =>
      getOccupantFamily(cell.occupant) === "decor"
    );
    const groupedEntities = {
      terrain: [...floorTiles, ...holeMarkers],
      walls: [...walls.segments, ...walls.runs],
      entrances: [...doors, ...secretWallEntrances],
      spawnPoints: [...enemySpawnPoints, ...itemSpawnPoints],
      props: [...rocks, ...decor],
    };
    const groups = [
      createRealityComposerGroupEntity("Terrain", "terrain", groupedEntities.terrain),
      createRealityComposerGroupEntity("Walls", "walls", groupedEntities.walls),
      createRealityComposerGroupEntity("Entrances", "entrances", groupedEntities.entrances),
      createRealityComposerGroupEntity(
        "SpawnPoints",
        "spawn-points",
        groupedEntities.spawnPoints
      ),
      createRealityComposerGroupEntity("Props", "props", groupedEntities.props),
    ];
    const flatEntities = [
      ...groups,
      ...groupedEntities.terrain,
      ...groupedEntities.walls,
      ...groupedEntities.entrances,
      ...groupedEntities.spawnPoints,
      ...groupedEntities.props,
    ];

    return {
      rootEntity: {
        id: "room-root",
        name: sanitizeRealityComposerName(project.name || EMPTY_PROJECT_NAME),
        entityType: "Entity",
        children: groups.map((group) => group.id),
        realityKit: {
          transform: createRealityKitTransform(createRealityKitPosition(0, 0)),
        },
      },
      groups,
      entities: {
        floorTiles,
        holeMarkers,
        walls,
        doors,
        secretWallEntrances,
        enemySpawnPoints,
        itemSpawnPoints,
        rocks,
        decor,
      },
      flatEntities,
    };
  }

  function createRealityComposerGroupEntity(label, semantic, children) {
    return {
      id: `group-${semantic}`,
      name: sanitizeRealityComposerName(label),
      entityType: "Entity",
      semantic,
      children: children.map((entity) => entity.id),
      realityKit: {
        transform: createRealityKitTransform(createRealityKitPosition(0, 0)),
      },
    };
  }

  function createRealityComposerTileEntity(cell, terrain) {
    const isHole = terrain === "hole";
    const material = isHole ? "HoleVoid" : "GroundSand";
    const ySize = isHole ? 0.02 : UNITY_FLOOR_THICKNESS_METERS;
    const elevation = isHole ? -0.06 : -UNITY_FLOOR_THICKNESS_METERS / 2;
    return {
      id: `${terrain}-tile-${cell.x}-${cell.y}`,
      name: sanitizeRealityComposerName(`${terrain}_tile_${cell.x}_${cell.y}`),
      entityType: "ModelEntity",
      kind: "terrain-tile",
      semantic: terrain,
      prefabKey: isHole ? "HoleTile" : "GroundTile",
      tags: isHole ? ["terrain", "hole", "non-walkable"] : ["terrain", "floor", "walkable"],
      grid: {
        x: cell.x,
        y: cell.y,
      },
      realityKit: {
        transform: createRealityKitTransform(
          createRealityKitPosition(cell.x, cell.y, elevation)
        ),
        mesh: {
          primitive: "box",
          sizeMeters: {
            x: UNITY_TILE_SIZE_METERS,
            y: ySize,
            z: UNITY_TILE_SIZE_METERS,
          },
        },
        material,
        components: {
          collision: {
            enabled: !isHole,
            shape: "box",
          },
          physicsBody: {
            enabled: !isHole,
            mode: "static",
          },
          gameplay: {
            walkable: !isHole,
          },
        },
      },
    };
  }

  function buildRealityComposerWallEntities(project) {
    const segments = [];
    const runs = [];

    getProjectCellsInReadingOrder(project).forEach((cell) => {
      DOOR_DIRECTIONS.forEach((direction) => {
        if (!hasRenderableBoundaryWall(project, cell, direction.id)) {
          return;
        }

        segments.push(createRealityComposerWallSegmentEntity(cell, direction.id));
        if (isBoundaryWallRunStart(project, cell, direction.id)) {
          runs.push(
            createRealityComposerWallRunEntity(
              cell,
              direction.id,
              getBoundaryWallRunLength(project, cell, direction.id)
            )
          );
        }
      });
    });

    return {
      segments,
      runs,
    };
  }

  function createRealityComposerWallSegmentEntity(cell, direction) {
    const gridCenter = getRealityComposerWallEdgeGridCenter(cell.x, cell.y, direction);
    return {
      id: `wall-${cell.x}-${cell.y}-${direction}`,
      name: sanitizeRealityComposerName(`wall_${cell.x}_${cell.y}_${direction}`),
      entityType: "ModelEntity",
      kind: "solid-wall",
      semantic: "wall",
      prefabKey: "SolidWall",
      tags: ["wall", "collision", direction],
      grid: {
        tileX: cell.x,
        tileY: cell.y,
        wall: direction,
        edgeCenter: gridCenter,
      },
      realityKit: {
        transform: createRealityKitWallTransform(gridCenter, direction, 1),
        mesh: createRealityKitWallMesh(1, UNITY_WALL_HEIGHT_METERS),
        material: "SolidWall",
        components: createRealityKitStaticCollisionComponents(true),
      },
    };
  }

  function createRealityComposerWallRunEntity(cell, direction, lengthTiles) {
    const gridCenter = getRealityComposerWallRunGridCenter(
      cell.x,
      cell.y,
      direction,
      lengthTiles
    );
    return {
      id: `wall-run-${cell.x}-${cell.y}-${direction}`,
      name: sanitizeRealityComposerName(`wall_run_${cell.x}_${cell.y}_${direction}`),
      entityType: "ModelEntity",
      kind: "solid-wall-run",
      semantic: "wall",
      prefabKey: "SolidWallRun",
      tags: ["wall", "collision", "run", direction],
      grid: {
        startTileX: cell.x,
        startTileY: cell.y,
        wall: direction,
        lengthTiles,
        edgeCenter: gridCenter,
      },
      realityKit: {
        transform: createRealityKitWallTransform(gridCenter, direction, lengthTiles),
        mesh: createRealityKitWallMesh(lengthTiles, UNITY_WALL_HEIGHT_METERS),
        material: "SolidWall",
        components: createRealityKitStaticCollisionComponents(true),
      },
    };
  }

  function buildRealityComposerPortalEntities(project, kind) {
    const entities = [];
    getProjectCellsInReadingOrder(project).forEach((cell) => {
      DOOR_DIRECTIONS.forEach((direction) => {
        const isDoor = kind === "door" && cell.doors && cell.doors[direction.id];
        const isSecret =
          kind === "secret-wall" &&
          cell.secretWalls &&
          cell.secretWalls[direction.id];
        if (!isDoor && !isSecret) {
          return;
        }

        entities.push(createRealityComposerPortalEntity(cell, direction.id, kind));
      });
    });
    return entities;
  }

  function createRealityComposerPortalEntity(cell, direction, kind) {
    const offset = getDirectionOffset(direction);
    const gridCenter = getRealityComposerWallEdgeGridCenter(cell.x, cell.y, direction);
    const isSecret = kind === "secret-wall";
    const type = isSecret ? "secret-wall-entrance" : "door";
    return {
      id: `${type}-${cell.x}-${cell.y}-${direction}`,
      name: sanitizeRealityComposerName(`${type}_${cell.x}_${cell.y}_${direction}`),
      entityType: "ModelEntity",
      kind: type,
      semantic: "entrance",
      prefabKey: isSecret ? "SecretWallEntrance" : "Doorway",
      tags: isSecret
        ? ["entrance", "secret", "breakable", direction]
        : ["entrance", "door", direction],
      blocksMovementUntilOpened: isSecret,
      grid: {
        tileX: cell.x,
        tileY: cell.y,
        wall: direction,
        edgeCenter: gridCenter,
        insideTile: {
          x: cell.x,
          y: cell.y,
        },
        outsideTile: {
          x: cell.x + offset.x,
          y: cell.y + offset.y,
        },
      },
      realityKit: {
        transform: createRealityKitWallTransform(gridCenter, direction, 1, {
          heightMeters: UNITY_DOOR_HEIGHT_METERS,
          thicknessMeters: UNITY_WALL_THICKNESS_METERS * 1.4,
        }),
        mesh: createRealityKitWallMesh(1, UNITY_DOOR_HEIGHT_METERS, {
          thicknessMeters: UNITY_WALL_THICKNESS_METERS * 1.4,
        }),
        material: isSecret ? "SecretWall" : "DoorAmber",
        components: {
          collision: {
            enabled: isSecret,
            shape: "box",
          },
          physicsBody: {
            enabled: isSecret,
            mode: "static",
          },
          gameplay: {
            entranceKind: type,
            direction,
            availableAnchor: true,
            blocksMovementUntilOpened: isSecret,
          },
        },
      },
    };
  }

  function buildRealityComposerOccupantEntities(project, predicate) {
    return getProjectCellsInReadingOrder(project)
      .filter((cell) => cell.terrain !== "hole" && cell.occupant !== "none")
      .filter(predicate)
      .map(createRealityComposerOccupantEntity);
  }

  function createRealityComposerOccupantEntity(cell) {
    const definition = OCCUPANT_DEFINITIONS[cell.occupant];
    const family = getOccupantFamily(cell.occupant);
    const size = getRealityComposerOccupantSize(cell.occupant);
    const material = getRealityComposerMaterialForOccupant(cell.occupant);
    const isCollisionProp = cell.occupant === "rock" || family === "decor";
    const entity = {
      id: `${cell.occupant}-${cell.x}-${cell.y}`,
      name: sanitizeRealityComposerName(`${cell.occupant}_${cell.x}_${cell.y}`),
      entityType: "ModelEntity",
      kind: family === "enemy" || cell.occupant === "item" ? "spawn-point" : "prop",
      semantic: getRealityComposerOccupantSemantic(cell.occupant),
      prefabKey: getRealityComposerPrefabKeyForOccupant(cell.occupant),
      tags: getRealityComposerOccupantTags(cell.occupant),
      grid: {
        x: cell.x,
        y: cell.y,
      },
      realityKit: {
        transform: createRealityKitTransform(
          createRealityKitPosition(cell.x, cell.y, size.y / 2)
        ),
        mesh: {
          primitive: "box",
          sizeMeters: size,
        },
        material,
        components: {
          collision: {
            enabled: isCollisionProp,
            shape: "box",
          },
          physicsBody: {
            enabled: isCollisionProp,
            mode: "static",
          },
          gameplay: {
            occupantType: cell.occupant,
            family,
            label: definition?.legendLabel || definition?.label || cell.occupant,
          },
        },
      },
    };

    if (family === "decor") {
      entity.heightBlocks = getDecorHeightBlocks(cell.occupant);
      entity.heightMeters = getDecorHeightBlocks(cell.occupant) * UNITY_TILE_SIZE_METERS;
    }

    return entity;
  }

  function createRealityKitTransform(
    translation,
    yawYDegrees = 0,
    scale = { x: 1, y: 1, z: 1 }
  ) {
    return {
      translation,
      rotationEulerDegrees: {
        x: 0,
        y: yawYDegrees,
        z: 0,
      },
      scale,
    };
  }

  function createRealityKitPosition(gridX, gridY, elevationMeters = 0) {
    return {
      x: gridX * UNITY_TILE_SIZE_METERS,
      y: elevationMeters,
      z: gridY * UNITY_TILE_SIZE_METERS,
    };
  }

  function getRealityComposerWallEdgeGridCenter(tileX, tileY, direction) {
    switch (direction) {
      case "north":
        return { x: tileX, y: tileY - 0.5 };
      case "south":
        return { x: tileX, y: tileY + 0.5 };
      case "east":
        return { x: tileX + 0.5, y: tileY };
      case "west":
        return { x: tileX - 0.5, y: tileY };
      default:
        return { x: tileX, y: tileY };
    }
  }

  function getRealityComposerWallRunGridCenter(tileX, tileY, direction, lengthTiles) {
    const offset = (lengthTiles - 1) / 2;
    switch (direction) {
      case "north":
        return { x: tileX + offset, y: tileY - 0.5 };
      case "south":
        return { x: tileX + offset, y: tileY + 0.5 };
      case "east":
        return { x: tileX + 0.5, y: tileY + offset };
      case "west":
        return { x: tileX - 0.5, y: tileY + offset };
      default:
        return { x: tileX, y: tileY };
    }
  }

  function createRealityKitWallTransform(
    gridCenter,
    direction,
    lengthTiles,
    options = {}
  ) {
    const heightMeters = options.heightMeters || UNITY_WALL_HEIGHT_METERS;
    return createRealityKitTransform(
      createRealityKitPosition(gridCenter.x, gridCenter.y, heightMeters / 2),
      getRealityComposerWallYaw(direction),
      {
        x: 1,
        y: 1,
        z: 1,
      }
    );
  }

  function createRealityKitWallMesh(lengthTiles, heightMeters, options = {}) {
    return {
      primitive: "box",
      sizeMeters: {
        x: lengthTiles * UNITY_TILE_SIZE_METERS,
        y: heightMeters,
        z: options.thicknessMeters || UNITY_WALL_THICKNESS_METERS,
      },
    };
  }

  function createRealityKitStaticCollisionComponents(enabled) {
    return {
      collision: {
        enabled,
        shape: "box",
      },
      physicsBody: {
        enabled,
        mode: "static",
      },
      gameplay: {
        blocksMovement: enabled,
      },
    };
  }

  function getRealityComposerWallYaw(direction) {
    switch (direction) {
      case "north":
        return 0;
      case "east":
        return 90;
      case "south":
        return 180;
      case "west":
        return -90;
      default:
        return 0;
    }
  }

  function getRealityComposerOccupantSize(occupantId) {
    switch (occupantId) {
      case "rock":
        return { x: 0.82, y: 0.72, z: 0.82 };
      case "item":
        return { x: 0.44, y: 0.08, z: 0.44 };
      case "enemy-standard":
      case "enemy-flying":
      case "enemy-spitting-pod":
      case "enemy-static-shooter":
      case "enemy-cocoon":
        return { x: 0.68, y: 0.08, z: 0.68 };
      case "decor-short":
        return { x: 0.42, y: 1, z: 0.42 };
      case "decor-medium":
        return { x: 0.5, y: 2, z: 0.5 };
      case "decor-tall":
        return { x: 0.56, y: 3, z: 0.56 };
      default:
        return { x: 0.5, y: 0.1, z: 0.5 };
    }
  }

  function getRealityComposerMaterialForOccupant(occupantId) {
    switch (occupantId) {
      case "rock":
        return "Rock";
      case "item":
        return "ItemSpawn";
      case "enemy-standard":
        return "EnemyStandard";
      case "enemy-flying":
        return "EnemyFlying";
      case "enemy-spitting-pod":
        return "EnemySpittingPod";
      case "enemy-static-shooter":
        return "EnemyStaticShooter";
      case "enemy-cocoon":
        return "EnemyCocoon";
      case "decor-short":
        return "DecorShort";
      case "decor-medium":
        return "DecorMedium";
      case "decor-tall":
        return "DecorTall";
      default:
        return "GroundSand";
    }
  }

  function getRealityComposerOccupantSemantic(occupantId) {
    if (occupantId === "item") {
      return "item-spawn-point";
    }

    const family = getOccupantFamily(occupantId);
    if (family === "enemy") {
      return "enemy-spawn-point";
    }

    if (family === "decor") {
      return "decor";
    }

    return occupantId;
  }

  function getRealityComposerOccupantTags(occupantId) {
    const family = getOccupantFamily(occupantId);
    if (family === "enemy") {
      return ["spawn-point", "enemy", occupantId];
    }

    if (occupantId === "item") {
      return ["spawn-point", "item"];
    }

    if (family === "decor") {
      return ["prop", "decor", occupantId];
    }

    return ["prop", occupantId];
  }

  function getRealityComposerPrefabKeyForOccupant(occupantId) {
    return getUnityPrefabKeyForOccupant(occupantId);
  }

  function sanitizeRealityComposerName(value) {
    const normalized = String(value || "Entity")
      .trim()
      .replace(/[^a-zA-Z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const safe = normalized || "Entity";
    return /^[0-9]/.test(safe) ? `Entity_${safe}` : safe;
  }

  function buildUnityTiles(project) {
    return getProjectCellsInReadingOrder(project).map((cell) =>
      createUnityTileExport(cell)
    );
  }

  function createUnityTileExport(cell) {
    const center = createUnityPosition(cell.x, cell.y);
    return {
      id: `tile-${cell.x}-${cell.y}`,
      key: makeKey(cell.x, cell.y),
      grid: {
        x: cell.x,
        y: cell.y,
      },
      unity: {
        center,
        size: {
          x: UNITY_TILE_SIZE_METERS,
          y: UNITY_FLOOR_THICKNESS_METERS,
          z: UNITY_TILE_SIZE_METERS,
        },
        bounds: createUnityTileBounds(cell.x, cell.y),
      },
      terrain: cell.terrain,
      prefabKey: cell.terrain === "hole" ? "HoleTile" : "GroundTile",
      walkable: cell.terrain !== "hole",
      occupant: cell.occupant,
      doors: deepClone(cell.doors || emptyDoors()),
      secretWalls: deepClone(cell.secretWalls || emptySecretWalls()),
    };
  }

  function buildUnityWallGeometry(project) {
    const segments = [];
    const runs = [];

    getProjectCellsInReadingOrder(project).forEach((cell) => {
      DOOR_DIRECTIONS.forEach((direction) => {
        if (!hasRenderableBoundaryWall(project, cell, direction.id)) {
          return;
        }

        segments.push(createUnityWallSegment(cell, direction.id));
        if (isBoundaryWallRunStart(project, cell, direction.id)) {
          runs.push(
            createUnityWallRun(
              cell,
              direction.id,
              getBoundaryWallRunLength(project, cell, direction.id)
            )
          );
        }
      });
    });

    return {
      segments,
      runs,
    };
  }

  function createUnityWallSegment(cell, direction) {
    const gridCenter = getUnityWallEdgeGridCenter(cell.x, cell.y, direction);
    return {
      id: `wall-${cell.x}-${cell.y}-${direction}`,
      type: "solid-wall",
      prefabKey: "SolidWall",
      grid: {
        tileX: cell.x,
        tileY: cell.y,
        wall: direction,
        edgeCenter: gridCenter,
      },
      unity: createUnityWallTransform(gridCenter, direction, 1),
      spanAxis: getUnityWallSpanAxis(direction),
      lengthMeters: UNITY_TILE_SIZE_METERS,
    };
  }

  function createUnityWallRun(cell, direction, lengthTiles) {
    const gridCenter = getUnityWallRunGridCenter(
      cell.x,
      cell.y,
      direction,
      lengthTiles
    );
    return {
      id: `wall-run-${cell.x}-${cell.y}-${direction}`,
      type: "solid-wall-run",
      prefabKey: "SolidWallRun",
      grid: {
        startTileX: cell.x,
        startTileY: cell.y,
        wall: direction,
        lengthTiles,
        edgeCenter: gridCenter,
      },
      unity: createUnityWallTransform(gridCenter, direction, lengthTiles),
      spanAxis: getUnityWallSpanAxis(direction),
      lengthMeters: lengthTiles * UNITY_TILE_SIZE_METERS,
    };
  }

  function buildUnityWallAnchors(project, kind) {
    const anchors = [];
    getProjectCellsInReadingOrder(project).forEach((cell) => {
      DOOR_DIRECTIONS.forEach((direction) => {
        const isDoor = kind === "door" && cell.doors && cell.doors[direction.id];
        const isSecret =
          kind === "secret-wall" &&
          cell.secretWalls &&
          cell.secretWalls[direction.id];
        if (!isDoor && !isSecret) {
          return;
        }

        anchors.push(createUnityWallAnchor(cell, direction.id, kind));
      });
    });
    return anchors;
  }

  function createUnityWallAnchor(cell, direction, kind) {
    const offset = getDirectionOffset(direction);
    const gridCenter = getUnityWallEdgeGridCenter(cell.x, cell.y, direction);
    const type = kind === "secret-wall" ? "secret-wall-entrance" : "door";
    const isSecret = kind === "secret-wall";
    return {
      id: `${type}-${cell.x}-${cell.y}-${direction}`,
      type,
      prefabKey: isSecret ? "SecretWallEntrance" : "Doorway",
      blocksMovementUntilOpened: isSecret,
      grid: {
        tileX: cell.x,
        tileY: cell.y,
        wall: direction,
        edgeCenter: gridCenter,
        insideTile: {
          x: cell.x,
          y: cell.y,
        },
        outsideTile: {
          x: cell.x + offset.x,
          y: cell.y + offset.y,
        },
      },
      unity: createUnityWallTransform(gridCenter, direction, 1, {
        heightMeters: UNITY_DOOR_HEIGHT_METERS,
        thicknessMeters: UNITY_WALL_THICKNESS_METERS * 1.4,
      }),
      opening: {
        widthMeters: UNITY_TILE_SIZE_METERS,
        heightMeters: UNITY_DOOR_HEIGHT_METERS,
        direction,
      },
      insideTileCenter: createUnityPosition(cell.x, cell.y),
      outsideTileCenter: createUnityPosition(cell.x + offset.x, cell.y + offset.y),
    };
  }

  function buildUnityOccupants(project, predicate) {
    return getProjectCellsInReadingOrder(project)
      .filter((cell) => cell.terrain !== "hole" && cell.occupant !== "none")
      .filter(predicate)
      .map(createUnityOccupantExport);
  }

  function createUnityOccupantExport(cell) {
    const definition = OCCUPANT_DEFINITIONS[cell.occupant];
    const family = getOccupantFamily(cell.occupant);
    const exportPoint = {
      id: `${cell.occupant}-${cell.x}-${cell.y}`,
      type: cell.occupant,
      family,
      label: definition?.legendLabel || definition?.label || cell.occupant,
      prefabKey: getUnityPrefabKeyForOccupant(cell.occupant),
      grid: {
        x: cell.x,
        y: cell.y,
      },
      unity: {
        position: createUnityPosition(cell.x, cell.y),
        rotationYDegrees: 0,
        footprintMeters: {
          x: UNITY_TILE_SIZE_METERS,
          z: UNITY_TILE_SIZE_METERS,
        },
      },
    };

    if (family === "decor") {
      exportPoint.heightBlocks = getDecorHeightBlocks(cell.occupant);
      exportPoint.heightMeters = getDecorHeightBlocks(cell.occupant) * UNITY_TILE_SIZE_METERS;
    }

    return exportPoint;
  }

  function getOccupantFamily(occupantId) {
    const definition = OCCUPANT_DEFINITIONS[occupantId];
    return definition ? definition.family : "none";
  }

  function getDecorHeightBlocks(occupantId) {
    switch (occupantId) {
      case "decor-medium":
        return 2;
      case "decor-tall":
        return 3;
      case "decor-short":
      default:
        return 1;
    }
  }

  function getUnityPrefabKeyForOccupant(occupantId) {
    switch (occupantId) {
      case "rock":
        return "Rock";
      case "item":
        return "ItemSpawn";
      case "enemy-standard":
        return "EnemyStandardSpawn";
      case "enemy-flying":
        return "EnemyFlyingSpawn";
      case "enemy-spitting-pod":
        return "EnemySpittingPodSpawn";
      case "enemy-static-shooter":
        return "EnemyStaticShooterSpawn";
      case "enemy-cocoon":
        return "EnemySpiderSpawnerCocoonSpawn";
      case "decor-short":
        return "DecorShort";
      case "decor-medium":
        return "DecorMedium";
      case "decor-tall":
        return "DecorTall";
      default:
        return "Unknown";
    }
  }

  function createUnityPosition(gridX, gridY, elevationMeters = 0) {
    return {
      x: gridX * UNITY_TILE_SIZE_METERS,
      y: elevationMeters,
      z: -gridY * UNITY_TILE_SIZE_METERS,
    };
  }

  function createUnityTileBounds(gridX, gridY) {
    const center = createUnityPosition(gridX, gridY);
    const half = UNITY_TILE_SIZE_METERS / 2;
    return {
      min: {
        x: center.x - half,
        y: 0,
        z: center.z - half,
      },
      max: {
        x: center.x + half,
        y: UNITY_FLOOR_THICKNESS_METERS,
        z: center.z + half,
      },
    };
  }

  function getUnityWallEdgeGridCenter(tileX, tileY, direction) {
    switch (direction) {
      case "north":
        return { x: tileX, y: tileY - 0.5 };
      case "south":
        return { x: tileX, y: tileY + 0.5 };
      case "east":
        return { x: tileX + 0.5, y: tileY };
      case "west":
        return { x: tileX - 0.5, y: tileY };
      default:
        return { x: tileX, y: tileY };
    }
  }

  function getUnityWallRunGridCenter(tileX, tileY, direction, lengthTiles) {
    const offset = (lengthTiles - 1) / 2;
    switch (direction) {
      case "north":
        return { x: tileX + offset, y: tileY - 0.5 };
      case "south":
        return { x: tileX + offset, y: tileY + 0.5 };
      case "east":
        return { x: tileX + 0.5, y: tileY + offset };
      case "west":
        return { x: tileX - 0.5, y: tileY + offset };
      default:
        return { x: tileX, y: tileY };
    }
  }

  function createUnityWallTransform(
    gridCenter,
    direction,
    lengthTiles,
    options = {}
  ) {
    const heightMeters = options.heightMeters || UNITY_WALL_HEIGHT_METERS;
    const thicknessMeters = options.thicknessMeters || UNITY_WALL_THICKNESS_METERS;
    return {
      position: createUnityPosition(gridCenter.x, gridCenter.y, heightMeters / 2),
      rotationYDegrees: getUnityWallRotationY(direction),
      scaleMeters: {
        x: lengthTiles * UNITY_TILE_SIZE_METERS,
        y: heightMeters,
        z: thicknessMeters,
      },
    };
  }

  function getUnityWallRotationY(direction) {
    switch (direction) {
      case "north":
        return 0;
      case "east":
        return 90;
      case "south":
        return 180;
      case "west":
        return -90;
      default:
        return 0;
    }
  }

  function getUnityWallSpanAxis(direction) {
    return direction === "north" || direction === "south" ? "x" : "z";
  }

  function getProjectCellsInReadingOrder(project) {
    return Object.values(project.cells).sort((left, right) =>
      left.y === right.y ? left.x - right.x : left.y - right.y
    );
  }

  function createCellExportPoint(cell) {
    return {
      key: makeKey(cell.x, cell.y),
      x: cell.x,
      y: cell.y,
    };
  }

  function createWallAnchorExportPoint(cell, direction) {
    const offset = getDirectionOffset(direction);
    return {
      key: makeKey(cell.x, cell.y),
      x: cell.x,
      y: cell.y,
      wall: direction,
      outsideX: cell.x + offset.x,
      outsideY: cell.y + offset.y,
    };
  }

  function orthogonalNeighborKeys(x, y) {
    return [
      makeKey(x, y - 1),
      makeKey(x + 1, y),
      makeKey(x, y + 1),
      makeKey(x - 1, y),
    ];
  }

  function analyzeFloorGraph(collectionId) {
    const graph = getFloorGraph(collectionId);
    const nodeViews = [];
    const occupied = new Map();
    const warnings = [];
    const edges = [];
    const projectMap = new Map(state.projects.map((project) => [project.id, project]));

    graph.nodes.forEach((node) => {
      const project = projectMap.get(node.projectId);
      if (!project || project.collectionId !== collectionId) {
        warnings.push({
          id: `missing-project-${node.id}`,
          type: "missing-project",
          nodeId: node.id,
          severity: "warning",
          message: "A floor node references a room that is no longer in this collection.",
        });
        return;
      }

      const template = TEMPLATE_MAP[project.templateId];
      const footprint = getTemplateChunkFootprint(template);
      const ports = getProjectFloorPorts(project, footprint);
      const view = {
        node,
        project,
        template,
        footprint,
        ports,
      };
      nodeViews.push(view);

      footprint.offsets.forEach((offset) => {
        const worldX = node.x + offset.x;
        const worldY = node.y + offset.y;
        const key = makeKey(worldX, worldY);
        if (occupied.has(key)) {
          const otherNodeId = occupied.get(key);
          warnings.push({
            id: `overlap-${node.id}-${otherNodeId}-${key}`,
            type: "overlap",
            nodeId: node.id,
            otherNodeId,
            severity: "error",
            message: `${project.name} overlaps another room at chunk ${formatCoordLabel(
              worldX,
              worldY
            )}. Move it to a free snapped position.`,
          });
        } else {
          occupied.set(key, node.id);
        }
      });
    });

    const viewMap = new Map(nodeViews.map((view) => [view.node.id, view]));
    const portMap = new Map();
    nodeViews.forEach((view) => {
      view.ports.forEach((port) => {
        const worldX = view.node.x + port.chunkX;
        const worldY = view.node.y + port.chunkY;
        const key = createFloorPortLookupKey(worldX, worldY, port.direction);
        portMap.set(key, {
          view,
          port,
          worldX,
          worldY,
        });
      });
    });

    const seenEdges = new Set();
    occupied.forEach((nodeId, chunkKey) => {
      const coord = parseCoordKey(chunkKey);
      const view = viewMap.get(nodeId);
      if (!coord || !view) {
        return;
      }

      ["east", "south"].forEach((direction) => {
        const offset = getDirectionOffset(direction);
        const neighborWorldX = coord.x + offset.x;
        const neighborWorldY = coord.y + offset.y;
        const neighborNodeId = occupied.get(makeKey(neighborWorldX, neighborWorldY));
        if (!neighborNodeId || neighborNodeId === nodeId) {
          return;
        }

        const neighborView = viewMap.get(neighborNodeId);
        if (!neighborView) {
          return;
        }

        const oppositeDirection = getOppositeDirection(direction);
        const portEntry = portMap.get(
          createFloorPortLookupKey(coord.x, coord.y, direction)
        );
        const neighborPortEntry = portMap.get(
          createFloorPortLookupKey(neighborWorldX, neighborWorldY, oppositeDirection)
        );
        const compatibility = getFloorBoundaryCompatibility(
          portEntry?.port || null,
          neighborPortEntry?.port || null
        );
        if (!compatibility) {
          return;
        }

        const edgeId = [
          makeKey(coord.x, coord.y),
          direction,
          makeKey(neighborWorldX, neighborWorldY),
          oppositeDirection,
        ].join("|");
        if (seenEdges.has(edgeId)) {
          return;
        }

        seenEdges.add(edgeId);
        edges.push({
          id: edgeId,
          kind: compatibility,
          inferred: !portEntry || !neighborPortEntry,
          from: createFloorEdgeEndpoint(
            view,
            portEntry?.port || null,
            direction,
            coord.x,
            coord.y
          ),
          to: createFloorEdgeEndpoint(
            neighborView,
            neighborPortEntry?.port || null,
            oppositeDirection,
            neighborWorldX,
            neighborWorldY
          ),
        });
      });
    });

    return {
      graph,
      collectionId,
      nodeViews,
      occupied,
      edges,
      warnings,
    };
  }

  function getTemplateChunkFootprint(template) {
    const chunks = [];
    const chunkColumns = Math.ceil(template.width / ROOM_CHUNK_WIDTH);
    const chunkRows = Math.ceil(template.height / ROOM_CHUNK_HEIGHT);

    for (let chunkY = 0; chunkY < chunkRows; chunkY += 1) {
      for (let chunkX = 0; chunkX < chunkColumns; chunkX += 1) {
        const chunkMinX = template.bounds.minX + chunkX * ROOM_CHUNK_WIDTH;
        const chunkMinY = template.bounds.minY + chunkY * ROOM_CHUNK_HEIGHT;
        let active = false;
        for (let y = chunkMinY; y < chunkMinY + ROOM_CHUNK_HEIGHT && !active; y += 1) {
          for (let x = chunkMinX; x < chunkMinX + ROOM_CHUNK_WIDTH; x += 1) {
            if (template.mask.has(makeKey(x, y))) {
              active = true;
              break;
            }
          }
        }

        if (active) {
          chunks.push({ x: chunkX, y: chunkY });
        }
      }
    }

    const minX = Math.min(...chunks.map((chunk) => chunk.x));
    const maxX = Math.max(...chunks.map((chunk) => chunk.x));
    const minY = Math.min(...chunks.map((chunk) => chunk.y));
    const maxY = Math.max(...chunks.map((chunk) => chunk.y));
    return {
      offsets: chunks,
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  }

  function getProjectFloorPorts(project) {
    const template = TEMPLATE_MAP[project.templateId];
    const ports = [];
    getProjectCellsInReadingOrder(project).forEach((cell) => {
      DOOR_DIRECTIONS.forEach((direction) => {
        const type = getWallAnchorType(cell, direction.id);
        if (type === "none") {
          return;
        }

        const chunk = getTemplateChunkOffsetForCell(template, cell.x, cell.y);
        if (!chunk) {
          return;
        }

        ports.push({
          key: `${makeKey(cell.x, cell.y)}:${direction.id}:${type}`,
          cellKey: makeKey(cell.x, cell.y),
          chunkX: chunk.x,
          chunkY: chunk.y,
          direction: direction.id,
          type,
          x: cell.x,
          y: cell.y,
        });
      });
    });
    return ports;
  }

  function getTemplateChunkOffsetForCell(template, x, y) {
    if (!template || !template.mask.has(makeKey(x, y))) {
      return null;
    }

    return {
      x: Math.floor((x - template.bounds.minX) / ROOM_CHUNK_WIDTH),
      y: Math.floor((y - template.bounds.minY) / ROOM_CHUNK_HEIGHT),
    };
  }

  function createFloorPortLookupKey(worldX, worldY, direction) {
    return `${makeKey(worldX, worldY)}:${direction}`;
  }

  function getFloorBoundaryCompatibility(leftPort, rightPort) {
    if (!leftPort && !rightPort) {
      return null;
    }

    if (leftPort?.type === "secret" || rightPort?.type === "secret") {
      return "secret";
    }

    return "normal";
  }

  function createFloorEdgeEndpoint(view, port, direction, worldX, worldY) {
    return {
      nodeId: view.node.id,
      projectId: view.project.id,
      portKey: port?.key || null,
      direction,
      type: port?.type || "door",
      availableAnchor: Boolean(port),
      worldX,
      worldY,
    };
  }

  function getOppositeDirection(direction) {
    switch (direction) {
      case "north":
        return "south";
      case "south":
        return "north";
      case "east":
        return "west";
      case "west":
        return "east";
      default:
        return direction;
    }
  }

  function getFloorMapRenderBounds(nodeViews) {
    if (nodeViews.length === 0) {
      return {
        minX: -3,
        maxX: 3,
        minY: -2,
        maxY: 2,
        width: 7 * FLOOR_CHUNK_SIZE,
        height: 5 * FLOOR_CHUNK_SIZE,
      };
    }

    const minX =
      Math.min(
        ...nodeViews.map((view) => view.node.x + view.footprint.minX)
      ) - FLOOR_GRID_PADDING_CHUNKS;
    const maxX =
      Math.max(
        ...nodeViews.map((view) => view.node.x + view.footprint.maxX)
      ) + FLOOR_GRID_PADDING_CHUNKS;
    const minY =
      Math.min(
        ...nodeViews.map((view) => view.node.y + view.footprint.minY)
      ) - FLOOR_GRID_PADDING_CHUNKS;
    const maxY =
      Math.max(
        ...nodeViews.map((view) => view.node.y + view.footprint.maxY)
      ) + FLOOR_GRID_PADDING_CHUNKS;

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: (maxX - minX + 1) * FLOOR_CHUNK_SIZE,
      height: (maxY - minY + 1) * FLOOR_CHUNK_SIZE,
    };
  }

  function floorToPixel(chunk, minChunk) {
    return (chunk - minChunk) * FLOOR_CHUNK_SIZE;
  }

  function floorToPixelCenter(chunk, minChunk) {
    return floorToPixel(chunk, minChunk) + FLOOR_CHUNK_SIZE / 2;
  }

  function getFloorPortPixelGeometry(port) {
    const centerX = (port.chunkX + 0.5) * FLOOR_CHUNK_SIZE;
    const centerY = (port.chunkY + 0.5) * FLOOR_CHUNK_SIZE;
    switch (port.direction) {
      case "north":
        return `left:${centerX}px;top:${port.chunkY * FLOOR_CHUNK_SIZE - 1}px;bottom:auto;`;
      case "south":
        return `left:${centerX}px;top:${(port.chunkY + 1) * FLOOR_CHUNK_SIZE - 9}px;bottom:auto;`;
      case "east":
        return `left:${(port.chunkX + 1) * FLOOR_CHUNK_SIZE - 9}px;top:${centerY}px;right:auto;`;
      case "west":
        return `left:${port.chunkX * FLOOR_CHUNK_SIZE - 1}px;top:${centerY}px;right:auto;`;
      default:
        return "";
    }
  }

  function findAvailableFloorPosition(graph, project, preferred) {
    const candidates = [];
    const maxRadius = 14;
    for (let radius = 0; radius <= maxRadius; radius += 1) {
      for (let y = preferred.y - radius; y <= preferred.y + radius; y += 1) {
        for (let x = preferred.x - radius; x <= preferred.x + radius; x += 1) {
          if (
            Math.abs(x - preferred.x) !== radius &&
            Math.abs(y - preferred.y) !== radius
          ) {
            continue;
          }
          candidates.push({ x, y });
        }
      }
    }

    return candidates.find(
      (candidate) => !wouldFloorNodeOverlap(graph, project, candidate.x, candidate.y)
    ) || null;
  }

  function wouldFloorNodeOverlap(graph, project, x, y, ignoredNodeId = null) {
    const occupied = new Set();
    graph.nodes.forEach((node) => {
      if (node.id === ignoredNodeId) {
        return;
      }

      const existingProject = state.projects.find(
        (candidate) => candidate.id === node.projectId
      );
      if (!existingProject) {
        return;
      }

      getTemplateChunkFootprint(TEMPLATE_MAP[existingProject.templateId]).offsets.forEach(
        (offset) => {
          occupied.add(makeKey(node.x + offset.x, node.y + offset.y));
        }
      );
    });

    return getTemplateChunkFootprint(TEMPLATE_MAP[project.templateId]).offsets.some((offset) =>
      occupied.has(makeKey(x + offset.x, y + offset.y))
    );
  }

  function normalizeImportedProject(parsed) {
    const rawProject = parsed && parsed.project ? parsed.project : parsed;
    if (!rawProject || typeof rawProject !== "object") {
      throw new Error("The selected file does not contain a project.");
    }

    let templateId = resolveTemplateId(rawProject.templateId);
    if (!templateId) {
      const importedTemplate = normalizeCustomTemplateDescriptor(parsed && parsed.template);
      if (!importedTemplate || importedTemplate.id !== rawProject.templateId) {
        throw new Error("That project uses an unknown room template.");
      }

      state.customTemplates.push(importedTemplate);
      rebuildTemplateRegistry(state.customTemplates);
      templateId = importedTemplate.id;
    }

    const template = TEMPLATE_MAP[templateId];
    const importedCells = rawProject.cells || {};
    const normalizedProject = createProject(
      templateId,
      sanitizeProjectName(rawProject.name) || EMPTY_PROJECT_NAME
    );
    normalizedProject.id = createId();
    normalizedProject.createdAt = new Date().toISOString();
    normalizedProject.updatedAt = normalizedProject.createdAt;
    normalizedProject.collectionId = normalizeImportedCollection(parsed, rawProject);
    normalizedProject.metadata = normalizeProjectMetadata(
      rawProject.metadata || (parsed && parsed.metadata)
    );

    template.mask.forEach((key) => {
      const source = importedCells[key];
      if (!source) {
        return;
      }

      const baseCell = normalizedProject.cells[key];
      const terrain = source.terrain === "hole" ? "hole" : "ground";
      const occupant = normalizeOccupantId(source.occupant);

      normalizedProject.cells[key] = {
        x: baseCell.x,
        y: baseCell.y,
        terrain,
        occupant: terrain === "hole" ? "none" : occupant,
        doors:
          terrain === "hole"
            ? emptyDoors()
            : normalizeDoorState(source.doors, template, baseCell.x, baseCell.y),
        secretWalls:
          terrain === "hole"
            ? emptySecretWalls()
            : normalizeSecretWallState(
                source.secretWalls,
                template,
                baseCell.x,
                baseCell.y
              ),
      };
    });

    return normalizedProject;
  }

  function normalizeImportedCollection(parsed, rawProject) {
    const rawCollection = parsed && parsed.collection;
    if (rawCollection && typeof rawCollection === "object") {
      const name = sanitizeCollectionName(rawCollection.name);
      if (name) {
        const existing = state.collections.find(
          (collection) => collection.name.toLowerCase() === name.toLowerCase()
        );
        if (existing) {
          return existing.id;
        }

        const timestamp = new Date().toISOString();
        const collection = {
          id: createCollectionId(),
          name,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        state.collections.push(collection);
        return collection.id;
      }
    }

    return normalizeProjectCollectionValue(rawProject.collectionId);
  }

  function createProject(templateId, name) {
    const resolvedTemplateId = resolveTemplateId(templateId) || "small-room-13x7";
    const template = TEMPLATE_MAP[resolvedTemplateId];
    const cells = {};
    template.mask.forEach((key) => {
      const [xText, yText] = key.split(",");
      cells[key] = createDefaultCell(Number(xText), Number(yText));
    });

    const timestamp = new Date().toISOString();
    return {
      id: createId(),
      name: sanitizeProjectName(name) || EMPTY_PROJECT_NAME,
      templateId: resolvedTemplateId,
      collectionId: "",
      metadata: createDefaultProjectMetadata(),
      createdAt: timestamp,
      updatedAt: timestamp,
      cells,
    };
  }

  function replaceProject(project) {
    state.projects = state.projects.map((candidate) =>
      candidate.id === project.id ? project : candidate
    );
    state.activeProjectId = project.id;
  }

  function ensureProjectExists() {
    if (state.projects.length === 0) {
      const starter = createProject("small-room-13x7", "Starter Room");
      state.projects.push(starter);
      state.activeProjectId = starter.id;
    }

    if (!state.projects.some((project) => project.id === state.activeProjectId)) {
      state.activeProjectId = state.projects[0].id;
    }
  }

  function getActiveProject() {
    return state.projects.find((project) => project.id === state.activeProjectId) || null;
  }

  function getCell(project, x, y) {
    return project.cells[makeKey(x, y)] || null;
  }

  function getFilteredProjects() {
    if (state.activeCollectionId === COLLECTION_ALL) {
      return state.projects;
    }

    if (state.activeCollectionId === COLLECTION_UNSORTED) {
      return state.projects.filter((project) => !project.collectionId);
    }

    return state.projects.filter(
      (project) => project.collectionId === state.activeCollectionId
    );
  }

  function getActiveFloorCollection() {
    if (
      state.activeCollectionId === COLLECTION_ALL ||
      state.activeCollectionId === COLLECTION_UNSORTED
    ) {
      return null;
    }

    return getCollectionById(state.activeCollectionId);
  }

  function getProjectsForCollection(collectionId) {
    return state.projects.filter((project) => project.collectionId === collectionId);
  }

  function getFloorGraph(collectionId) {
    const collection = getCollectionById(collectionId);
    if (!collection) {
      return null;
    }

    if (!state.floorGraphs[collection.id]) {
      state.floorGraphs[collection.id] = createDefaultFloorGraph(collection.id);
    }

    return state.floorGraphs[collection.id];
  }

  function createDefaultFloorGraph(collectionId) {
    const timestamp = new Date().toISOString();
    return {
      collectionId,
      nodes: [],
      selectedNodeId: null,
      updatedAt: timestamp,
    };
  }

  function createFloorNode(projectId, x, y) {
    return {
      id: createFloorNodeId(),
      projectId,
      x,
      y,
    };
  }

  function touchFloorGraph(graph) {
    graph.updatedAt = new Date().toISOString();
  }

  function buildCollectionOptions() {
    return [
      { id: "", label: "Unsorted" },
      ...state.collections.map((collection) => ({
        id: collection.id,
        label: collection.name,
      })),
    ];
  }

  function buildCollectionFilterOptions() {
    return [
      { id: COLLECTION_ALL, label: "All", count: state.projects.length },
      {
        id: COLLECTION_UNSORTED,
        label: "Unsorted",
        count: state.projects.filter((project) => !project.collectionId).length,
      },
      ...state.collections.map((collection) => ({
        id: collection.id,
        label: collection.name,
        count: state.projects.filter((project) => project.collectionId === collection.id)
          .length,
      })),
    ];
  }

  function getPreferredNewProjectCollectionId() {
    if (state.activeCollectionId === COLLECTION_ALL) {
      return projectCollectionSelect.value || "";
    }

    if (state.activeCollectionId === COLLECTION_UNSORTED) {
      return "";
    }

    return getCollectionById(state.activeCollectionId) ? state.activeCollectionId : "";
  }

  function getCollectionById(collectionId) {
    return state.collections.find((collection) => collection.id === collectionId) || null;
  }

  function getCollectionLabel(collectionId) {
    return getCollectionById(collectionId)?.name || "Unsorted";
  }

  function isCustomTemplate(templateId) {
    return state.customTemplates.some((template) => template.id === templateId);
  }

  function getSerializableCustomTemplate(templateId) {
    return state.customTemplates.find((template) => template.id === templateId) || null;
  }

  function readCoordFromNode(node) {
    return {
      x: Number(node.dataset.gridX),
      y: Number(node.dataset.gridY),
    };
  }

  function getPointerPositionWithinNode(node, event) {
    if (!(node instanceof Element)) {
      return null;
    }

    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }

    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
  }

  function describeCell(cell) {
    const parts = [cell.terrain === "ground" ? "Ground" : "Hole"];
    const occupantLabel = OCCUPANT_DEFINITIONS[cell.occupant]?.cellLabel || "";

    if (occupantLabel) {
      parts.push(occupantLabel);
    }

    const doorLabels = DOOR_DIRECTIONS.filter(
      (direction) => cell.doors && cell.doors[direction.id]
    ).map((direction) => direction.label);
    if (doorLabels.length > 0) {
      parts.push(`${doorLabels.length === 1 ? "Door" : "Doors"} on ${doorLabels.join(", ")}`);
    }

    const secretWallLabels = DOOR_DIRECTIONS.filter(
      (direction) => cell.secretWalls && cell.secretWalls[direction.id]
    ).map((direction) => direction.label);
    if (secretWallLabels.length > 0) {
      parts.push(
        `${
          secretWallLabels.length === 1
            ? "Secret wall entrance"
            : "Secret wall entrances"
        } on ${secretWallLabels.join(", ")}`
      );
    }

    return parts.join(" · ");
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        rebuildTemplateRegistry([]);
        return {
          projects: [],
          customTemplates: [],
          collections: [],
          floorGraphs: {},
          activeProjectId: null,
          activeCollectionId: COLLECTION_ALL,
        };
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.projects)) {
        rebuildTemplateRegistry([]);
        return {
          projects: [],
          customTemplates: [],
          collections: [],
          floorGraphs: {},
          activeProjectId: null,
          activeCollectionId: COLLECTION_ALL,
        };
      }

      const customTemplates = normalizeCustomTemplateDescriptors(parsed.customTemplates);
      rebuildTemplateRegistry(customTemplates);
      const collections = normalizeCollections(parsed.collections);
      const projects = parsed.projects
        .map((project) => normalizeStoredProject(project))
        .filter(Boolean);
      normalizeProjectCollectionIds(projects, collections);
      const floorGraphs = normalizeFloorGraphs(
        parsed.floorGraphs,
        collections,
        projects
      );
      return {
        projects,
        customTemplates,
        collections,
        floorGraphs,
        activeProjectId: parsed.activeProjectId || (projects[0] && projects[0].id) || null,
        activeCollectionId: normalizeCollectionFilterValue(
          parsed.activeCollectionId,
          collections
        ),
      };
    } catch (error) {
      rebuildTemplateRegistry([]);
      return {
        projects: [],
        customTemplates: [],
        collections: [],
        floorGraphs: {},
        activeProjectId: null,
        activeCollectionId: COLLECTION_ALL,
      };
    }
  }

  function normalizeStoredProject(project) {
    const resolvedTemplateId = resolveTemplateId(project && project.templateId);
    if (!project || !resolvedTemplateId || !project.cells) {
      return null;
    }

    const normalized = createProject(
      resolvedTemplateId,
      sanitizeProjectName(project.name) || EMPTY_PROJECT_NAME
    );
    normalized.id = project.id || createId();
    normalized.createdAt = project.createdAt || normalized.createdAt;
    normalized.updatedAt = project.updatedAt || normalized.updatedAt;
    normalized.collectionId = typeof project.collectionId === "string" ? project.collectionId : "";
    normalized.metadata = normalizeProjectMetadata(project.metadata);

    Object.keys(normalized.cells).forEach((key) => {
      const candidate = project.cells[key];
      if (!candidate) {
        return;
      }

      const terrain = candidate.terrain === "hole" ? "hole" : "ground";
      const occupant = normalizeOccupantId(candidate.occupant);
      const baseCell = normalized.cells[key];

      normalized.cells[key] = {
        x: baseCell.x,
        y: baseCell.y,
        terrain,
        occupant: terrain === "hole" ? "none" : occupant,
        doors:
          terrain === "hole"
            ? emptyDoors()
            : normalizeDoorState(
                candidate.doors,
                TEMPLATE_MAP[resolvedTemplateId],
                baseCell.x,
                baseCell.y
              ),
        secretWalls:
          terrain === "hole"
            ? emptySecretWalls()
            : normalizeSecretWallState(
                candidate.secretWalls,
                TEMPLATE_MAP[resolvedTemplateId],
                baseCell.x,
                baseCell.y
              ),
      };
    });

    return normalized;
  }

  function normalizeCustomTemplateDescriptors(candidates) {
    if (!Array.isArray(candidates)) {
      return [];
    }

    const seenIds = new Set(BUILT_IN_TEMPLATE_IDS);
    return candidates
      .map((candidate) => normalizeCustomTemplateDescriptor(candidate, seenIds))
      .filter(Boolean);
  }

  function normalizeCustomTemplateDescriptor(candidate, seenIds = new Set()) {
    if (!candidate || typeof candidate !== "object") {
      return null;
    }

    const rawCells = Array.isArray(candidate.cells) ? candidate.cells : [];
    const cells = Array.from(
      new Set(
        rawCells
          .map((key) => normalizeCoordKey(key))
          .filter(Boolean)
      )
    );
    cells.push(makeKey(0, 0));
    const normalizedCells = Array.from(new Set(cells)).sort(compareCoordKeys);
    if (normalizedCells.length === 0) {
      return null;
    }

    const inferredSize = inferChunkMultipleSize(normalizedCells);
    const width =
      candidate.width === undefined
        ? inferredSize.width
        : normalizeEditorWidth(candidate.width);
    const height =
      candidate.height === undefined
        ? inferredSize.height
        : normalizeEditorHeight(candidate.height);
    const bounds = getChunkMultipleBounds(width, height);
    const boundedSeedCells = normalizedCells.filter((key) => {
      const coord = parseCoordKey(key);
      return (
        coord &&
        coord.x >= bounds.minX &&
        coord.x <= bounds.maxX &&
        coord.y >= bounds.minY &&
        coord.y <= bounds.maxY
      );
    });
    const chunkCells = normalizeTemplateEditorCellsToChunks(
      new Set(boundedSeedCells),
      width,
      height
    );

    const rawId = String(candidate.id || "");
    const id =
      rawId && !seenIds.has(rawId) && !BUILT_IN_TEMPLATE_IDS.has(rawId)
        ? rawId
        : createTemplateId();
    seenIds.add(id);

    return {
      id,
      name:
        sanitizeProjectName(candidate.name) ||
        `Custom Template ${seenIds.size - BUILT_IN_TEMPLATE_IDS.size}`,
      description: sanitizeProjectName(candidate.description) || "",
      width,
      height,
      cells: Array.from(chunkCells).sort(compareCoordKeys),
      createdAt: candidate.createdAt || new Date().toISOString(),
    };
  }

  function inferChunkMultipleSize(cells) {
    const mask = new Set(cells);
    const bounds = findBounds(mask);
    return {
      width: normalizeExtentToChunkMultiple(
        bounds.maxX - bounds.minX + 1,
        ROOM_CHUNK_WIDTH,
        CUSTOM_TEMPLATE_MIN_WIDTH,
        CUSTOM_TEMPLATE_MAX_WIDTH
      ),
      height: normalizeExtentToChunkMultiple(
        bounds.maxY - bounds.minY + 1,
        ROOM_CHUNK_HEIGHT,
        CUSTOM_TEMPLATE_MIN_HEIGHT,
        CUSTOM_TEMPLATE_MAX_HEIGHT
      ),
    };
  }

  function normalizeCollections(candidates) {
    if (!Array.isArray(candidates)) {
      return [];
    }

    const seenIds = new Set();
    const seenNames = new Set();
    return candidates
      .map((candidate) => {
        if (!candidate || typeof candidate !== "object") {
          return null;
        }

        const name = sanitizeCollectionName(candidate.name);
        if (!name || seenNames.has(name.toLowerCase())) {
          return null;
        }

        const rawId = String(candidate.id || "");
        const id = rawId && !seenIds.has(rawId) ? rawId : createCollectionId();
        seenIds.add(id);
        seenNames.add(name.toLowerCase());

        return {
          id,
          name,
          createdAt: candidate.createdAt || new Date().toISOString(),
          updatedAt: candidate.updatedAt || candidate.createdAt || new Date().toISOString(),
        };
      })
      .filter(Boolean);
  }

  function normalizeProjectCollectionIds(projects, collections) {
    const validCollectionIds = new Set(collections.map((collection) => collection.id));
    projects.forEach((project) => {
      if (!validCollectionIds.has(project.collectionId)) {
        project.collectionId = "";
      }
    });
  }

  function normalizeFloorGraphs(candidateGraphs, collections, projects) {
    const validCollectionIds = new Set(collections.map((collection) => collection.id));
    const projectCollectionMap = new Map(
      projects.map((project) => [project.id, project.collectionId || ""])
    );
    const rawGraphs =
      candidateGraphs && typeof candidateGraphs === "object" ? candidateGraphs : {};

    return Object.fromEntries(
      Object.entries(rawGraphs)
        .map(([collectionId, rawGraph]) => {
          if (!validCollectionIds.has(collectionId)) {
            return null;
          }

          const graph = normalizeFloorGraph(rawGraph, collectionId, projectCollectionMap);
          return [collectionId, graph];
        })
        .filter(Boolean)
    );
  }

  function normalizeFloorGraph(rawGraph, collectionId, projectCollectionMap) {
    const source = rawGraph && typeof rawGraph === "object" ? rawGraph : {};
    const seenNodeIds = new Set();
    const nodes = Array.isArray(source.nodes)
      ? source.nodes
          .map((node) => normalizeFloorNode(node, collectionId, projectCollectionMap, seenNodeIds))
          .filter(Boolean)
      : [];
    const selectedNodeId = nodes.some((node) => node.id === source.selectedNodeId)
      ? source.selectedNodeId
      : nodes[0]?.id || null;

    return {
      collectionId,
      nodes,
      selectedNodeId,
      updatedAt: source.updatedAt || new Date().toISOString(),
    };
  }

  function normalizeFloorNode(node, collectionId, projectCollectionMap, seenNodeIds) {
    if (!node || typeof node !== "object") {
      return null;
    }

    const projectId = String(node.projectId || "");
    if (projectCollectionMap.get(projectId) !== collectionId) {
      return null;
    }

    const rawId = String(node.id || "");
    const id = rawId && !seenNodeIds.has(rawId) ? rawId : createFloorNodeId();
    seenNodeIds.add(id);

    return {
      id,
      projectId,
      x: Number.isFinite(Number(node.x)) ? Math.round(Number(node.x)) : 0,
      y: Number.isFinite(Number(node.y)) ? Math.round(Number(node.y)) : 0,
    };
  }

  function pruneFloorGraphs() {
    const validCollectionIds = new Set(state.collections.map((collection) => collection.id));
    const projectCollectionMap = new Map(
      state.projects.map((project) => [project.id, project.collectionId || ""])
    );

    state.floorGraphs = Object.fromEntries(
      Object.entries(state.floorGraphs || {})
        .map(([collectionId, graph]) => {
          if (!validCollectionIds.has(collectionId)) {
            return null;
          }

          return [
            collectionId,
            normalizeFloorGraph(graph, collectionId, projectCollectionMap),
          ];
        })
        .filter(Boolean)
    );
  }

  function captureHistorySnapshot() {
    return JSON.stringify({
      projects: state.projects,
      customTemplates: state.customTemplates,
      collections: state.collections,
      floorGraphs: state.floorGraphs,
      activeProjectId: state.activeProjectId,
      activeCollectionId: state.activeCollectionId,
    });
  }

  function pushUndoSnapshot(snapshot) {
    if (!snapshot || history.undo[history.undo.length - 1] === snapshot) {
      return;
    }

    history.undo.push(snapshot);
    if (history.undo.length > HISTORY_LIMIT) {
      history.undo.shift();
    }

    history.redo = [];
  }

  function restoreHistorySnapshot(snapshot) {
    try {
      const parsed = JSON.parse(snapshot);
      const customTemplates = normalizeCustomTemplateDescriptors(parsed.customTemplates);
      rebuildTemplateRegistry(customTemplates);
      const collections = normalizeCollections(parsed.collections);
      const projects = Array.isArray(parsed.projects)
        ? parsed.projects.map((project) => normalizeStoredProject(project)).filter(Boolean)
        : [];
      normalizeProjectCollectionIds(projects, collections);
      const floorGraphs = normalizeFloorGraphs(
        parsed.floorGraphs,
        collections,
        projects
      );

      state.customTemplates = customTemplates;
      state.collections = collections;
      state.projects = projects;
      state.floorGraphs = floorGraphs;
      state.activeProjectId =
        parsed.activeProjectId || (projects[0] && projects[0].id) || null;
      state.activeCollectionId = normalizeCollectionFilterValue(
        parsed.activeCollectionId,
        collections
      );
      if (!TEMPLATE_MAP[ui.selectedTemplateId]) {
        ui.selectedTemplateId = ROOM_TEMPLATES[0].id;
      }
      ensureProjectExists();
      ui.boundBoardTemplateId = null;
      ui.drag = null;
      ui.floorDrag = null;
      ui.renameSnapshot = null;
      ui.metadataSnapshot = null;
      clearPreview();
      setHoverKey(null);
      persist();
      renderAll();
    } catch (error) {
      console.warn("Could not restore editor history snapshot.", error);
      renderHistoryControls();
    }
  }

  function persist() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          projects: state.projects,
          customTemplates: state.customTemplates,
          collections: state.collections,
          floorGraphs: state.floorGraphs,
          activeProjectId: state.activeProjectId,
          activeCollectionId: state.activeCollectionId,
        })
      );
      ui.storageAvailable = true;
      return true;
    } catch (error) {
      ui.storageAvailable = false;
      if (!ui.storageWarningShown) {
        ui.storageWarningShown = true;
        console.warn("Could not save this session to localStorage.", error);
      }
      return false;
    }
  }

  function rebuildTemplateRegistry(customTemplates) {
    const hydratedCustomTemplates = normalizeCustomTemplateDescriptors(customTemplates).map(
      hydrateCustomTemplate
    );
    ROOM_TEMPLATES = [...BUILT_IN_ROOM_TEMPLATES, ...hydratedCustomTemplates];
    TEMPLATE_MAP = Object.fromEntries(
      ROOM_TEMPLATES.map((template) => [template.id, template])
    );
  }

  function resolveTemplateId(templateId) {
    const candidate = String(templateId || "");
    const canonicalId = TEMPLATE_ID_ALIASES[candidate] || candidate;
    return TEMPLATE_MAP[canonicalId] ? canonicalId : null;
  }

  function buildTemplates() {
    const templates = [
      {
        id: "small-room-13x7",
        name: "Small Room 13 x 7",
        description: "One exact 13 x 7 chunk for a standard compact room.",
        rectangles: [createChunkRectangle(0, 0, 1, 1)],
      },
      {
        id: "medium-room-26x7",
        name: "Medium Room 26 x 7",
        description: "Two 13 x 7 chunks side by side for longer combat lanes.",
        rectangles: [createChunkRectangle(0, 0, 2, 1), createChunkRectangle(1, 0, 2, 1)],
      },
      {
        id: "medium-room-13x14",
        name: "Medium Room 13 x 14",
        description: "Two 13 x 7 chunks stacked vertically.",
        rectangles: [createChunkRectangle(0, 0, 1, 2), createChunkRectangle(0, 1, 1, 2)],
      },
      {
        id: "large-room-26x14",
        name: "Large Room 26 x 14",
        description: "Four 13 x 7 chunks in a 2 x 2 room block.",
        rectangles: [
          createChunkRectangle(0, 0, 2, 2),
          createChunkRectangle(1, 0, 2, 2),
          createChunkRectangle(0, 1, 2, 2),
          createChunkRectangle(1, 1, 2, 2),
        ],
      },
      {
        id: "l-room",
        name: "L Room",
        description:
          "An L-shaped room made from three exact 13 x 7 chunks in a 26 x 14 footprint.",
        rectangles: [
          createChunkRectangle(0, 0, 2, 2),
          createChunkRectangle(0, 1, 2, 2),
          createChunkRectangle(1, 1, 2, 2),
        ],
      },
    ];

    return templates.map((template) => {
      const mask = buildMask(template.rectangles);
      const bounds = findBounds(mask);
      return {
        ...template,
        mask,
        bounds,
        width: bounds.maxX - bounds.minX + 1,
        height: bounds.maxY - bounds.minY + 1,
        summary: `${bounds.maxX - bounds.minX + 1} x ${bounds.maxY - bounds.minY + 1}`,
      };
    });
  }

  function createChunkRectangle(chunkX, chunkY, chunkColumns, chunkRows) {
    const bounds = getChunkMultipleBounds(
      chunkColumns * ROOM_CHUNK_WIDTH,
      chunkRows * ROOM_CHUNK_HEIGHT
    );
    const minX = bounds.minX + chunkX * ROOM_CHUNK_WIDTH;
    const minY = bounds.minY + chunkY * ROOM_CHUNK_HEIGHT;
    return {
      minX,
      maxX: minX + ROOM_CHUNK_WIDTH - 1,
      minY,
      maxY: minY + ROOM_CHUNK_HEIGHT - 1,
    };
  }

  function hydrateCustomTemplate(descriptor) {
    const width = normalizeEditorWidth(descriptor.width);
    const height = normalizeEditorHeight(descriptor.height);
    const bounds = getChunkMultipleBounds(width, height);
    const mask = new Set(
      descriptor.cells.filter((key) => {
        const coord = parseCoordKey(key);
        return (
          coord &&
          coord.x >= bounds.minX &&
          coord.x <= bounds.maxX &&
          coord.y >= bounds.minY &&
          coord.y <= bounds.maxY
        );
      })
    );
    mask.add(makeKey(0, 0));
    return {
      id: descriptor.id,
      name: descriptor.name,
      description:
        descriptor.description ||
        `Custom room footprint with ${mask.size} active tile${mask.size === 1 ? "" : "s"}.`,
      cells: descriptor.cells,
      isCustom: true,
      mask,
      bounds,
      width: bounds.maxX - bounds.minX + 1,
      height: bounds.maxY - bounds.minY + 1,
      summary: `${bounds.maxX - bounds.minX + 1} x ${bounds.maxY - bounds.minY + 1}`,
    };
  }

  function buildMask(rectangles) {
    const mask = new Set();
    rectangles.forEach((rect) => {
      for (let y = rect.minY; y <= rect.maxY; y += 1) {
        for (let x = rect.minX; x <= rect.maxX; x += 1) {
          mask.add(makeKey(x, y));
        }
      }
    });
    return mask;
  }

  function findBounds(mask) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    mask.forEach((key) => {
      const [xText, yText] = key.split(",");
      const x = Number(xText);
      const y = Number(yText);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    return { minX, maxX, minY, maxY };
  }

  function getCenteredBounds(width, height) {
    return getChunkMultipleBounds(
      normalizeEditorWidth(width),
      normalizeEditorHeight(height)
    );
  }

  function getChunkMultipleBounds(width, height) {
    const minX = -Math.floor(width / 2);
    const minY = -Math.floor(height / 2);
    return {
      minX,
      maxX: minX + width - 1,
      minY,
      maxY: minY + height - 1,
    };
  }

  function buildCenteredRectKeys(width, height) {
    const bounds = getCenteredBounds(width, height);
    const keys = new Set();
    for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
      for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
        keys.add(makeKey(x, y));
      }
    }
    return keys;
  }

  function createDefaultTemplateEditorState(options = {}) {
    const width = options.width || DEFAULT_CUSTOM_TEMPLATE_WIDTH;
    const height = options.height || DEFAULT_CUSTOM_TEMPLATE_HEIGHT;
    return {
      name: options.name || "Custom Template",
      width,
      height,
      cells:
        options.fill === false
          ? buildOriginChunkKeys(width, height)
          : buildCenteredRectKeys(width, height),
    };
  }

  function createTemplateEditorStateFromTemplate(template) {
    const width = Math.min(
      CUSTOM_TEMPLATE_MAX_WIDTH,
      normalizeEditorWidth(template.width)
    );
    const height = Math.min(
      CUSTOM_TEMPLATE_MAX_HEIGHT,
      normalizeEditorHeight(template.height)
    );
    const bounds = getCenteredBounds(width, height);
    let cells = new Set();

    template.mask.forEach((key) => {
      const coord = parseCoordKey(key);
      if (!coord) {
        return;
      }

      if (
        coord.x >= bounds.minX &&
        coord.x <= bounds.maxX &&
        coord.y >= bounds.minY &&
        coord.y <= bounds.maxY
      ) {
        cells.add(key);
      }
    });
    cells = normalizeTemplateEditorCellsToChunks(cells, width, height);

    return {
      name: `${template.name} Custom`,
      width,
      height,
      cells,
    };
  }

  function resizeTemplateEditor(width, height) {
    const nextWidth = normalizeEditorWidth(width);
    const nextHeight = normalizeEditorHeight(height);
    const bounds = getCenteredBounds(nextWidth, nextHeight);
    const nextCells = new Set();

    ui.templateEditor.cells.forEach((key) => {
      const coord = parseCoordKey(key);
      if (!coord) {
        return;
      }

      if (
        coord.x >= bounds.minX &&
        coord.x <= bounds.maxX &&
        coord.y >= bounds.minY &&
        coord.y <= bounds.maxY
      ) {
        nextCells.add(key);
      }
    });

    ui.templateEditor.width = nextWidth;
    ui.templateEditor.height = nextHeight;
    ui.templateEditor.cells = normalizeTemplateEditorCellsToChunks(
      nextCells,
      nextWidth,
      nextHeight
    );
  }

  function isTemplateEditorChunkActive(key) {
    const chunkKeys = getTemplateEditorChunkKeys(key);
    return (
      chunkKeys.length > 0 &&
      chunkKeys.every((chunkKey) => ui.templateEditor.cells.has(chunkKey))
    );
  }

  function setTemplateEditorChunk(key, shouldAdd) {
    const chunkKeys = getTemplateEditorChunkKeys(key);
    if (chunkKeys.length === 0) {
      return;
    }

    const isOriginChunk = chunkKeys.includes(makeKey(0, 0));
    if (!shouldAdd && isOriginChunk) {
      return;
    }

    if (shouldAdd) {
      chunkKeys.forEach((chunkKey) => ui.templateEditor.cells.add(chunkKey));
      return;
    }

    chunkKeys.forEach((chunkKey) => ui.templateEditor.cells.delete(chunkKey));
    buildOriginChunkKeys(ui.templateEditor.width, ui.templateEditor.height).forEach((chunkKey) =>
      ui.templateEditor.cells.add(chunkKey)
    );
  }

  function normalizeTemplateEditorCellsToChunks(seedCells, width, height) {
    const cells = new Set();
    seedCells.forEach((key) => {
      getTemplateEditorChunkKeys(key, width, height).forEach((chunkKey) =>
        cells.add(chunkKey)
      );
    });
    buildOriginChunkKeys(width, height).forEach((chunkKey) => cells.add(chunkKey));
    return cells;
  }

  function buildOriginChunkKeys(width, height) {
    return new Set(getTemplateEditorChunkKeys(makeKey(0, 0), width, height));
  }

  function getTemplateEditorChunkKeys(
    key,
    width = ui.templateEditor.width,
    height = ui.templateEditor.height
  ) {
    const coord = parseCoordKey(key);
    if (!coord) {
      return [];
    }

    const chunkBounds = getTemplateEditorChunkBounds(coord.x, coord.y, width, height);
    if (!chunkBounds) {
      return [];
    }

    const keys = [];
    for (let y = chunkBounds.minY; y <= chunkBounds.maxY; y += 1) {
      for (let x = chunkBounds.minX; x <= chunkBounds.maxX; x += 1) {
        keys.push(makeKey(x, y));
      }
    }
    return keys;
  }

  function getTemplateEditorChunkBounds(x, y, width, height) {
    const bounds = getCenteredBounds(width, height);
    if (x < bounds.minX || x > bounds.maxX || y < bounds.minY || y > bounds.maxY) {
      return null;
    }

    const chunkX = Math.floor((x - bounds.minX) / ROOM_CHUNK_WIDTH);
    const chunkY = Math.floor((y - bounds.minY) / ROOM_CHUNK_HEIGHT);
    const minX = bounds.minX + chunkX * ROOM_CHUNK_WIDTH;
    const minY = bounds.minY + chunkY * ROOM_CHUNK_HEIGHT;
    return {
      minX,
      maxX: minX + ROOM_CHUNK_WIDTH - 1,
      minY,
      maxY: minY + ROOM_CHUNK_HEIGHT - 1,
    };
  }

  function createCustomTemplateDescriptorFromEditor() {
    const cells = new Set(ui.templateEditor.cells);
    cells.add(makeKey(0, 0));
    const normalizedCells = Array.from(cells)
      .map((key) => normalizeCoordKey(key))
      .filter(Boolean)
      .sort(compareCoordKeys);
    const name =
      sanitizeProjectName(customTemplateNameInput.value) ||
      `Custom Template ${state.customTemplates.length + 1}`;

    return {
      id: createTemplateId(),
      name,
      description: `Custom chunk-multiple room footprint with ${normalizedCells.length} active tile${
        normalizedCells.length === 1 ? "" : "s"
      }.`,
      width: ui.templateEditor.width,
      height: ui.templateEditor.height,
      cells: normalizedCells,
      createdAt: new Date().toISOString(),
    };
  }

  function normalizeEditorWidth(value) {
    return normalizeChunkMultiple(
      value,
      ROOM_CHUNK_WIDTH,
      CUSTOM_TEMPLATE_MIN_WIDTH,
      CUSTOM_TEMPLATE_MAX_WIDTH
    );
  }

  function normalizeEditorHeight(value) {
    return normalizeChunkMultiple(
      value,
      ROOM_CHUNK_HEIGHT,
      CUSTOM_TEMPLATE_MIN_HEIGHT,
      CUSTOM_TEMPLATE_MAX_HEIGHT
    );
  }

  function normalizeChunkMultiple(value, chunkSize, min, max) {
    const numeric = Number.parseInt(String(value), 10);
    const fallback = min;
    const rounded = Number.isFinite(numeric)
      ? Math.round(numeric / chunkSize) * chunkSize
      : fallback;
    return Math.max(min, Math.min(max, rounded));
  }

  function normalizeExtentToChunkMultiple(value, chunkSize, min, max) {
    const numeric = Number.parseInt(String(value), 10);
    const rounded = Number.isFinite(numeric)
      ? Math.ceil(numeric / chunkSize) * chunkSize
      : min;
    return Math.max(min, Math.min(max, rounded));
  }

  function makeKey(x, y) {
    return `${x},${y}`;
  }

  function parseCoordKey(key) {
    const [xText, yText] = String(key || "").split(",");
    const x = Number(xText);
    const y = Number(yText);
    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      return null;
    }
    return { x, y };
  }

  function normalizeCoordKey(key) {
    const coord = parseCoordKey(key);
    return coord ? makeKey(coord.x, coord.y) : null;
  }

  function compareCoordKeys(leftKey, rightKey) {
    const left = parseCoordKey(leftKey);
    const right = parseCoordKey(rightKey);
    if (!left || !right) {
      return String(leftKey).localeCompare(String(rightKey));
    }
    return left.y === right.y ? left.x - right.x : left.y - right.y;
  }

  function emptyDoors() {
    return {
      north: false,
      south: false,
      east: false,
      west: false,
    };
  }

  function emptySecretWalls() {
    return {
      north: false,
      south: false,
      east: false,
      west: false,
    };
  }

  function createDefaultCell(x, y) {
    return {
      x,
      y,
      terrain: "ground",
      occupant: "none",
      doors: emptyDoors(),
      secretWalls: emptySecretWalls(),
    };
  }

  function normalizeDoorState(candidate, template, x, y) {
    const normalized = emptyDoors();
    if (!candidate || typeof candidate !== "object") {
      return normalized;
    }

    DOOR_DIRECTIONS.forEach((direction) => {
      if (!candidate[direction.id]) {
        return;
      }

      if (isWallAnchorDirection(template, x, y, direction.id)) {
        normalized[direction.id] = true;
      }
    });

    return normalized;
  }

  function normalizeSecretWallState(candidate, template, x, y) {
    const normalized = emptySecretWalls();
    if (!candidate || typeof candidate !== "object") {
      return normalized;
    }

    DOOR_DIRECTIONS.forEach((direction) => {
      if (!candidate[direction.id]) {
        return;
      }

      if (isWallAnchorDirection(template, x, y, direction.id)) {
        normalized[direction.id] = true;
      }
    });

    return normalized;
  }

  function countActiveWallFlags(flags) {
    return DOOR_DIRECTIONS.reduce(
      (total, direction) => total + (flags && flags[direction.id] ? 1 : 0),
      0
    );
  }

  function hasMatchingTerrain(project, x, y, terrain) {
    const cell = getCell(project, x, y);
    return Boolean(cell && cell.terrain === terrain);
  }

  function getGroundSpriteState(project, x, y) {
    const exposed = {
      top: !hasMatchingTerrain(project, x, y - 1, "ground"),
      right: !hasMatchingTerrain(project, x + 1, y, "ground"),
      bottom: !hasMatchingTerrain(project, x, y + 1, "ground"),
      left: !hasMatchingTerrain(project, x - 1, y, "ground"),
    };

    return {
      ...exposed,
      name: getGroundSpriteName(exposed),
      topLeft: exposed.top && exposed.left,
      topRight: exposed.top && exposed.right,
      bottomRight: exposed.bottom && exposed.right,
      bottomLeft: exposed.bottom && exposed.left,
    };
  }

  function getGroundSpriteName(exposed) {
    const exposedCount = ["top", "right", "bottom", "left"].filter(
      (side) => exposed[side]
    ).length;

    if (exposedCount === 0) {
      return "middle";
    }

    if (exposedCount === 4) {
      return "isolatedSingleTile";
    }

    if (exposedCount === 1) {
      if (exposed.top) return "top";
      if (exposed.right) return "right";
      if (exposed.bottom) return "bottom";
      return "left";
    }

    if (exposedCount === 2) {
      if (exposed.top && exposed.left) return "topLeftCorner";
      if (exposed.top && exposed.right) return "topRightCorner";
      if (exposed.bottom && exposed.right) return "bottomRightCorner";
      if (exposed.bottom && exposed.left) return "bottomLeftCorner";
      if (exposed.top && exposed.bottom) return "verticalPassage";
      return "horizontalPassage";
    }

    if (!exposed.top) return "topConnectedEnd";
    if (!exposed.right) return "rightConnectedEnd";
    if (!exposed.bottom) return "bottomConnectedEnd";
    return "leftConnectedEnd";
  }

  function applyGroundSpriteVariables(node, spriteState) {
    const emptyState = {
      top: false,
      right: false,
      bottom: false,
      left: false,
      topLeft: false,
      topRight: false,
      bottomRight: false,
      bottomLeft: false,
    };
    const state = spriteState || emptyState;

    node.style.setProperty("--ground-sprite-top", state.top ? "0.38" : "0");
    node.style.setProperty("--ground-sprite-right", state.right ? "0.34" : "0");
    node.style.setProperty("--ground-sprite-bottom", state.bottom ? "0.42" : "0");
    node.style.setProperty("--ground-sprite-left", state.left ? "0.34" : "0");
    node.style.setProperty("--ground-sprite-corner-tl", state.topLeft ? "0.28" : "0");
    node.style.setProperty("--ground-sprite-corner-tr", state.topRight ? "0.28" : "0");
    node.style.setProperty("--ground-sprite-corner-br", state.bottomRight ? "0.3" : "0");
    node.style.setProperty("--ground-sprite-corner-bl", state.bottomLeft ? "0.3" : "0");
  }

  function getTerrainCornerState(project, x, y, terrain) {
    const north = hasMatchingTerrain(project, x, y - 1, terrain);
    const south = hasMatchingTerrain(project, x, y + 1, terrain);
    const west = hasMatchingTerrain(project, x - 1, y, terrain);
    const east = hasMatchingTerrain(project, x + 1, y, terrain);

    return {
      topLeft: north && west && !hasMatchingTerrain(project, x - 1, y - 1, terrain),
      topRight: north && east && !hasMatchingTerrain(project, x + 1, y - 1, terrain),
      bottomRight: south && east && !hasMatchingTerrain(project, x + 1, y + 1, terrain),
      bottomLeft: south && west && !hasMatchingTerrain(project, x - 1, y + 1, terrain),
    };
  }

  function renderTerrainCornerMarkup(cornerState) {
    return [
      cornerState.topLeft ? '<span class="terrain-corner terrain-corner--top-left"></span>' : "",
      cornerState.topRight ? '<span class="terrain-corner terrain-corner--top-right"></span>' : "",
      cornerState.bottomRight
        ? '<span class="terrain-corner terrain-corner--bottom-right"></span>'
        : "",
      cornerState.bottomLeft ? '<span class="terrain-corner terrain-corner--bottom-left"></span>' : "",
    ]
      .filter(Boolean)
      .join("");
  }

  function normalizeOccupantId(candidate) {
    if (candidate === "enemy") {
      return ENEMY_VARIANTS[0].id;
    }

    return OCCUPANT_DEFINITIONS[candidate] ? candidate : "none";
  }

  function renderBoundaryWallMarkup(project, cell) {
    return DOOR_DIRECTIONS.map((direction) => {
      if (!hasRenderableBoundaryWall(project, cell, direction.id)) {
        return "";
      }

      if (!isBoundaryWallRunStart(project, cell, direction.id)) {
        return "";
      }

      return `<span class="wall-segment boundary-wall boundary-wall--${direction.id}" style="--wall-run-length:${getBoundaryWallRunLength(
        project,
        cell,
        direction.id
      )};"></span>`;
    })
      .filter(Boolean)
      .join("");
  }

  function renderDoorAnchorGuideMarkup(project, cell) {
    return DOOR_DIRECTIONS.map((direction) => {
      if (!canPlaceWallAnchor(project, cell, direction.id)) {
        return "";
      }

      const occupiedType = getWallAnchorType(cell, direction.id);
      return `<span class="door-anchor-guide door-anchor-guide--${direction.id} ${
        occupiedType !== "none" ? "door-anchor-guide--occupied" : ""
      }" aria-hidden="true"></span>`;
    })
      .filter(Boolean)
      .join("");
  }

  function renderWallAnchorMarkup(project, cell) {
    return DOOR_DIRECTIONS.map((direction) => {
      if (getWallAnchorType(cell, direction.id) === "door") {
        return renderWallSegmentMarkup(
          "door",
          direction.id,
          getWallSegmentJoinState(project, cell, direction.id)
        );
      }

      if (getWallAnchorType(cell, direction.id) === "secret") {
        return renderWallSegmentMarkup(
          "secret-wall",
          direction.id,
          getWallSegmentJoinState(project, cell, direction.id)
        );
      }

      return "";
    })
      .filter(Boolean)
      .join("");
  }

  function renderWallSegmentMarkup(kind, direction, joinState) {
    const links = [
      joinState.before ? '<span class="wall-link wall-link--before"></span>' : "",
      joinState.after ? '<span class="wall-link wall-link--after"></span>' : "",
    ]
      .filter(Boolean)
      .join("");

    return `<span class="wall-segment ${kind} ${kind}--${direction} wall-segment--${direction}">${links}</span>`;
  }

  function getWallAnchorType(cell, directionId) {
    if (cell.doors && cell.doors[directionId]) {
      return "door";
    }

    if (cell.secretWalls && cell.secretWalls[directionId]) {
      return "secret";
    }

    return "none";
  }

  function getWallSegmentJoinState(project, cell, direction) {
    if (direction === "north" || direction === "south") {
      return {
        before: hasWallEdgeSegment(project, cell.x - 1, cell.y, direction),
        after: hasWallEdgeSegment(project, cell.x + 1, cell.y, direction),
      };
    }

    return {
      before: hasWallEdgeSegment(project, cell.x, cell.y - 1, direction),
      after: hasWallEdgeSegment(project, cell.x, cell.y + 1, direction),
    };
  }

  function hasWallEdgeSegment(project, x, y, direction) {
    const neighbor = getCell(project, x, y);
    return hasRenderableBoundaryWall(project, neighbor, direction);
  }

  function hasRenderableBoundaryWall(project, cell, direction) {
    return Boolean(
      cell &&
        isBoundaryDirection(TEMPLATE_MAP[project.templateId], cell.x, cell.y, direction) &&
        getWallAnchorType(cell, direction) === "none"
    );
  }

  function isBoundaryWallRunStart(project, cell, direction) {
    if (direction === "north" || direction === "south") {
      return !hasRenderableBoundaryWall(project, getCell(project, cell.x - 1, cell.y), direction);
    }

    return !hasRenderableBoundaryWall(project, getCell(project, cell.x, cell.y - 1), direction);
  }

  function getBoundaryWallRunLength(project, cell, direction) {
    let length = 1;

    if (direction === "north" || direction === "south") {
      while (
        hasRenderableBoundaryWall(project, getCell(project, cell.x + length, cell.y), direction)
      ) {
        length += 1;
      }
      return length;
    }

    while (
      hasRenderableBoundaryWall(project, getCell(project, cell.x, cell.y + length), direction)
    ) {
      length += 1;
    }

    return length;
  }

  function canPlaceWallAnchor(project, cell, direction) {
    return isWallAnchorDirection(TEMPLATE_MAP[project.templateId], cell.x, cell.y, direction);
  }

  function isWallAnchorDirection(template, x, y, direction) {
    if (!isBoundaryDirection(template, x, y, direction)) {
      return false;
    }

    const chunkBounds = getTemplateChunkBoundsForCell(template, x, y);
    if (!chunkBounds) {
      return false;
    }

    const centerX = chunkBounds.minX + Math.floor(ROOM_CHUNK_WIDTH / 2);
    const centerY = chunkBounds.minY + Math.floor(ROOM_CHUNK_HEIGHT / 2);
    switch (direction) {
      case "north":
        return y === chunkBounds.minY && x === centerX;
      case "south":
        return y === chunkBounds.maxY && x === centerX;
      case "east":
        return x === chunkBounds.maxX && y === centerY;
      case "west":
        return x === chunkBounds.minX && y === centerY;
      default:
        return false;
    }
  }

  function getTemplateChunkBoundsForCell(template, x, y) {
    if (!template || !template.mask.has(makeKey(x, y))) {
      return null;
    }

    const chunkColumn = Math.floor((x - template.bounds.minX) / ROOM_CHUNK_WIDTH);
    const chunkRow = Math.floor((y - template.bounds.minY) / ROOM_CHUNK_HEIGHT);
    const minX = template.bounds.minX + chunkColumn * ROOM_CHUNK_WIDTH;
    const minY = template.bounds.minY + chunkRow * ROOM_CHUNK_HEIGHT;
    return {
      minX,
      maxX: minX + ROOM_CHUNK_WIDTH - 1,
      minY,
      maxY: minY + ROOM_CHUNK_HEIGHT - 1,
    };
  }

  function isBoundaryDirection(template, x, y, direction) {
    const offset = getDirectionOffset(direction);
    return !template.mask.has(makeKey(x + offset.x, y + offset.y));
  }

  function getDirectionOffset(direction) {
    switch (direction) {
      case "north":
        return { x: 0, y: -1 };
      case "south":
        return { x: 0, y: 1 };
      case "east":
        return { x: 1, y: 0 };
      case "west":
        return { x: -1, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  }

  function createDefaultProjectMetadata() {
    return {
      ...DEFAULT_PROJECT_METADATA,
      tags: [...DEFAULT_PROJECT_METADATA.tags],
    };
  }

  function getProjectMetadata(project) {
    if (!project) {
      return createDefaultProjectMetadata();
    }

    project.metadata = normalizeProjectMetadata(project.metadata);
    return project.metadata;
  }

  function normalizeProjectMetadata(candidate) {
    const source = candidate && typeof candidate === "object" ? candidate : {};
    return {
      roomType: normalizeMetadataOptionId(
        source.roomType,
        ROOM_TYPES,
        DEFAULT_PROJECT_METADATA.roomType
      ),
      difficulty: normalizeMetadataOptionId(
        source.difficulty,
        DIFFICULTY_LEVELS,
        DEFAULT_PROJECT_METADATA.difficulty
      ),
      tags: normalizeMetadataTags(source.tags),
      notes: normalizeMetadataText(source.notes, 1200, true),
      intendedEntryDirection: normalizeMetadataOptionId(
        source.intendedEntryDirection || source.intendedEntry,
        ENTRY_DIRECTIONS,
        DEFAULT_PROJECT_METADATA.intendedEntryDirection
      ),
      encounterPurpose: normalizeMetadataText(source.encounterPurpose, 140),
      rewardType: normalizeMetadataOptionId(
        source.rewardType,
        REWARD_TYPES,
        DEFAULT_PROJECT_METADATA.rewardType
      ),
      chapterFloor: normalizeMetadataText(
        source.chapterFloor || source.floor || source.chapter,
        80
      ),
      prototypeStatus: normalizeMetadataOptionId(
        source.prototypeStatus,
        PROTOTYPE_STATUSES,
        DEFAULT_PROJECT_METADATA.prototypeStatus
      ),
    };
  }

  function normalizeMetadataFieldValue(field, rawValue) {
    switch (field) {
      case "roomType":
        return normalizeMetadataOptionId(
          rawValue,
          ROOM_TYPES,
          DEFAULT_PROJECT_METADATA.roomType
        );
      case "difficulty":
        return normalizeMetadataOptionId(
          rawValue,
          DIFFICULTY_LEVELS,
          DEFAULT_PROJECT_METADATA.difficulty
        );
      case "intendedEntryDirection":
        return normalizeMetadataOptionId(
          rawValue,
          ENTRY_DIRECTIONS,
          DEFAULT_PROJECT_METADATA.intendedEntryDirection
        );
      case "rewardType":
        return normalizeMetadataOptionId(
          rawValue,
          REWARD_TYPES,
          DEFAULT_PROJECT_METADATA.rewardType
        );
      case "prototypeStatus":
        return normalizeMetadataOptionId(
          rawValue,
          PROTOTYPE_STATUSES,
          DEFAULT_PROJECT_METADATA.prototypeStatus
        );
      case "tags":
        return normalizeMetadataTags(rawValue);
      case "notes":
        return normalizeMetadataText(rawValue, 1200, true);
      case "encounterPurpose":
        return normalizeMetadataText(rawValue, 140);
      case "chapterFloor":
        return normalizeMetadataText(rawValue, 80);
      default:
        return rawValue;
    }
  }

  function normalizeMetadataOptionId(value, options, fallback) {
    const candidate = String(value || "");
    return options.some((option) => option.id === candidate) ? candidate : fallback;
  }

  function normalizeMetadataTags(value) {
    const rawTags = Array.isArray(value) ? value : String(value || "").split(",");
    const seen = new Set();
    const tags = [];

    rawTags.forEach((tag) => {
      const normalized = normalizeMetadataText(tag, 28);
      const key = normalized.toLowerCase();
      if (!normalized || seen.has(key)) {
        return;
      }

      seen.add(key);
      tags.push(normalized);
    });

    return tags.slice(0, 12);
  }

  function normalizeMetadataText(value, maxLength, multiline = false) {
    const text = String(value || "").replace(/\r\n?/g, "\n");
    const normalized = multiline ? text.trim() : text.replace(/\s+/g, " ").trim();
    return normalized.slice(0, maxLength);
  }

  function metadataValueEquals(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function getOptionLabel(options, value) {
    return options.find((option) => option.id === value)?.label || "";
  }

  function sanitizeProjectName(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function sanitizeCollectionName(value) {
    return sanitizeProjectName(value).slice(0, 48);
  }

  function normalizeProjectCollectionValue(value) {
    const collectionId = String(value || "");
    return getCollectionById(collectionId) ? collectionId : "";
  }

  function normalizeCollectionFilterValue(value, collections) {
    const collectionId = String(value || COLLECTION_ALL);
    if (collectionId === COLLECTION_ALL || collectionId === COLLECTION_UNSORTED) {
      return collectionId;
    }

    return collections.some((collection) => collection.id === collectionId)
      ? collectionId
      : COLLECTION_ALL;
  }

  function findClosestFromTarget(target, selector) {
    if (target instanceof Element) {
      return target.closest(selector);
    }

    if (target && target.parentElement instanceof Element) {
      return target.parentElement.closest(selector);
    }

    return null;
  }

  function createAxisNode(text, className) {
    const node = document.createElement("div");
    node.className = className;
    node.textContent = text;
    return node;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `project-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  function createTemplateId() {
    return `custom-template-${createId()}`;
  }

  function createCollectionId() {
    return `collection-${createId()}`;
  }

  function createFloorNodeId() {
    return `floor-node-${createId()}`;
  }

  function formatCoordLabel(x, y) {
    return `(${x}, ${y})`;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function renderFloorToCanvas(collectionId) {
    const collection = getCollectionById(collectionId);
    const analysis = analyzeFloorGraph(collectionId);
    const bounds = getFloorMapRenderBounds(analysis.nodeViews);
    const outerPadding = 34;
    const headerHeight = 84;
    const mapPadding = 26;
    const legendGap = 18;
    const mapWidth = bounds.width;
    const mapHeight = bounds.height;
    const boardX = outerPadding;
    const boardY = outerPadding + headerHeight;
    const boardWidth = mapWidth + mapPadding * 2;
    const boardHeight = mapHeight + mapPadding * 2;
    const legendItems = getFloorExportLegendItems(analysis);
    const legendHeight = getFloorExportLegendHeight(legendItems.length);
    const legendY = boardY + boardHeight + legendGap;
    const canvas = document.createElement("canvas");

    canvas.width = boardX + boardWidth + outerPadding;
    canvas.height = legendY + legendHeight + outerPadding;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return canvas;
    }

    drawExportBackdrop(ctx, canvas.width, canvas.height);

    ctx.fillStyle = "#f6edd9";
    ctx.font = '700 30px "Trebuchet MS", "Avenir Next", sans-serif';
    ctx.textBaseline = "top";
    ctx.fillText(collection?.name || "Floor Builder", outerPadding, outerPadding);

    const normalEdges = analysis.edges.filter((edge) => edge.kind === "normal").length;
    const secretEdges = analysis.edges.filter((edge) => edge.kind === "secret").length;
    ctx.fillStyle = "rgba(246, 237, 217, 0.68)";
    ctx.font = '15px "Trebuchet MS", "Avenir Next", sans-serif';
    ctx.fillText(
      `${analysis.nodeViews.length} room instance${
        analysis.nodeViews.length === 1 ? "" : "s"
      } · ${normalEdges} normal · ${secretEdges} secret · ${analysis.warnings.length} warning${
        analysis.warnings.length === 1 ? "" : "s"
      }`,
      outerPadding,
      outerPadding + 40
    );

    drawRoundedRectPath(ctx, boardX, boardY, boardWidth, boardHeight, 28);
    ctx.fillStyle = "rgba(8, 17, 24, 0.9)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 240, 202, 0.14)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const mapX = boardX + mapPadding;
    const mapY = boardY + mapPadding;
    drawFloorExportGrid(ctx, mapX, mapY, bounds);
    analysis.edges.forEach((edge) => drawFloorExportEdge(ctx, mapX, mapY, bounds, edge));
    analysis.nodeViews.forEach((view) =>
      drawFloorExportNode(ctx, mapX, mapY, bounds, view, analysis)
    );

    drawFloorExportLegend(
      ctx,
      boardX,
      legendY,
      boardWidth,
      legendHeight,
      legendItems
    );

    return canvas;
  }

  function drawFloorExportGrid(ctx, x, y, bounds) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    for (let column = 0; column <= bounds.maxX - bounds.minX + 1; column += 1) {
      const drawX = x + column * FLOOR_CHUNK_SIZE + 0.5;
      ctx.beginPath();
      ctx.moveTo(drawX, y);
      ctx.lineTo(drawX, y + bounds.height);
      ctx.stroke();
    }
    for (let row = 0; row <= bounds.maxY - bounds.minY + 1; row += 1) {
      const drawY = y + row * FLOOR_CHUNK_SIZE + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, drawY);
      ctx.lineTo(x + bounds.width, drawY);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255, 240, 202, 0.42)";
    ctx.font = '11px "SFMono-Regular", Consolas, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let chunkX = bounds.minX; chunkX <= bounds.maxX; chunkX += 1) {
      ctx.fillText(
        String(chunkX),
        x + floorToPixelCenter(chunkX, bounds.minX),
        y + 12
      );
    }
    for (let chunkY = bounds.minY; chunkY <= bounds.maxY; chunkY += 1) {
      ctx.fillText(
        String(chunkY),
        x + 14,
        y + floorToPixelCenter(chunkY, bounds.minY)
      );
    }
    ctx.restore();
  }

  function drawFloorExportEdge(ctx, mapX, mapY, bounds, edge) {
    const startX = mapX + floorToPixelCenter(edge.from.worldX, bounds.minX);
    const startY = mapY + floorToPixelCenter(edge.from.worldY, bounds.minY);
    const endX = mapX + floorToPixelCenter(edge.to.worldX, bounds.minX);
    const endY = mapY + floorToPixelCenter(edge.to.worldY, bounds.minY);

    ctx.save();
    ctx.lineWidth = edge.kind === "secret" ? 5 : 7;
    ctx.lineCap = "round";
    ctx.strokeStyle =
      edge.kind === "secret" ? "rgba(249, 201, 160, 0.9)" : "rgba(245, 194, 108, 0.94)";
    if (edge.kind === "secret") {
      ctx.setLineDash([10, 8]);
    }
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();
  }

  function drawFloorExportNode(ctx, mapX, mapY, bounds, view, analysis) {
    const left = mapX + floorToPixel(view.node.x + view.footprint.minX, bounds.minX);
    const top = mapY + floorToPixel(view.node.y + view.footprint.minY, bounds.minY);
    const width = view.footprint.width * FLOOR_CHUNK_SIZE;
    const height = view.footprint.height * FLOOR_CHUNK_SIZE;
    const warningCount = analysis.warnings.filter(
      (warning) => warning.nodeId === view.node.id
    ).length;
    const activeOffsets = new Set(
      view.footprint.offsets.map((offset) => makeKey(offset.x, offset.y))
    );

    drawRoundedRectPath(ctx, left + 4, top + 4, width - 8, height - 8, 20);
    ctx.fillStyle = "rgba(12, 28, 34, 0.9)";
    ctx.fill();
    ctx.strokeStyle =
      warningCount > 0 ? "rgba(255, 111, 99, 0.7)" : "rgba(255, 240, 202, 0.18)";
    ctx.lineWidth = warningCount > 0 ? 3 : 1;
    ctx.stroke();

    for (let chunkY = view.footprint.minY; chunkY <= view.footprint.maxY; chunkY += 1) {
      for (let chunkX = view.footprint.minX; chunkX <= view.footprint.maxX; chunkX += 1) {
        if (!activeOffsets.has(makeKey(chunkX, chunkY))) {
          continue;
        }

        const chunkLeft = left + chunkX * FLOOR_CHUNK_SIZE + 8;
        const chunkTop = top + chunkY * FLOOR_CHUNK_SIZE + 8;
        drawRoundedRectPath(
          ctx,
          chunkLeft,
          chunkTop,
          FLOOR_CHUNK_SIZE - 16,
          FLOOR_CHUNK_SIZE - 16,
          16
        );
        const tile = ctx.createLinearGradient(
          chunkLeft,
          chunkTop,
          chunkLeft + FLOOR_CHUNK_SIZE,
          chunkTop + FLOOR_CHUNK_SIZE
        );
        tile.addColorStop(0, "rgba(225, 198, 151, 0.98)");
        tile.addColorStop(1, "rgba(175, 135, 82, 0.96)");
        ctx.fillStyle = tile;
        ctx.fill();
      }
    }

    view.ports.forEach((port) => drawFloorExportPort(ctx, left, top, port));

    const metadata = getProjectMetadata(view.project);
    ctx.fillStyle = "#f6edd9";
    ctx.font = '800 15px "Trebuchet MS", "Avenir Next", sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(view.project.name, left + 14, top + height - 24, width - 28);
    ctx.fillStyle = "rgba(4, 10, 15, 0.88)";
    const badgeText = `${getOptionLabel(ROOM_TYPES, metadata.roomType)} · ${view.template.summary}`;
    const badgeWidth = Math.min(width - 28, ctx.measureText(badgeText).width + 16);
    drawRoundedRectPath(ctx, left + 14, top + height - 20, badgeWidth, 18, 9);
    ctx.fillStyle = "rgba(246, 237, 217, 0.88)";
    ctx.fill();
    ctx.fillStyle = "rgba(4, 10, 15, 0.88)";
    ctx.font = '800 10px "Trebuchet MS", "Avenir Next", sans-serif';
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, left + 22, top + height - 11, badgeWidth - 16);

    if (warningCount > 0) {
      ctx.beginPath();
      ctx.arc(left + width - 18, top + 18, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#ff6f63";
      ctx.fill();
      ctx.fillStyle = "#220908";
      ctx.font = '900 15px "Trebuchet MS", "Avenir Next", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("!", left + width - 18, top + 18);
    }
  }

  function drawFloorExportPort(ctx, nodeLeft, nodeTop, port) {
    const horizontal = port.direction === "north" || port.direction === "south";
    const width = horizontal ? 36 : 10;
    const height = horizontal ? 10 : 36;
    const centerX = nodeLeft + (port.chunkX + 0.5) * FLOOR_CHUNK_SIZE;
    const centerY = nodeTop + (port.chunkY + 0.5) * FLOOR_CHUNK_SIZE;
    const x =
      port.direction === "west"
        ? nodeLeft + port.chunkX * FLOOR_CHUNK_SIZE - 1
        : port.direction === "east"
        ? nodeLeft + (port.chunkX + 1) * FLOOR_CHUNK_SIZE - 9
        : centerX - width / 2;
    const y =
      port.direction === "north"
        ? nodeTop + port.chunkY * FLOOR_CHUNK_SIZE - 1
        : port.direction === "south"
        ? nodeTop + (port.chunkY + 1) * FLOOR_CHUNK_SIZE - 9
        : centerY - height / 2;

    drawRoundedRectPath(ctx, x, y, width, height, 6);
    ctx.fillStyle =
      port.type === "secret"
        ? createSecretWallGradient(ctx, x, y, width, height)
        : createDoorGradient(ctx, x, y, width, height);
    ctx.fill();
    ctx.strokeStyle =
      port.type === "secret"
        ? "rgba(249, 201, 160, 0.36)"
        : "rgba(255, 232, 197, 0.36)";
    ctx.stroke();
    if (port.type === "secret") {
      drawExportSecretWallBadge(ctx, x, y, width, height);
    }
  }

  function getFloorExportLegendItems(analysis) {
    const items = ["room"];
    if (analysis.edges.some((edge) => edge.kind === "normal")) {
      items.push("normal-edge");
    }
    if (analysis.edges.some((edge) => edge.kind === "secret")) {
      items.push("secret-edge");
    }
    if (analysis.warnings.length > 0) {
      items.push("warning");
    }
    return items;
  }

  function getFloorExportLegendHeight(itemCount) {
    return 58 + Math.max(1, Math.ceil(itemCount / 4)) * 34;
  }

  function drawFloorExportLegend(ctx, x, y, width, height, items) {
    const padding = 24;
    const columns = 4;
    const itemWidth = (width - padding * 2) / columns;

    drawRoundedRectPath(ctx, x, y, width, height, 24);
    ctx.fillStyle = "rgba(8, 17, 24, 0.82)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 240, 202, 0.14)";
    ctx.stroke();

    ctx.fillStyle = "rgba(246, 237, 217, 0.82)";
    ctx.font = '700 13px "Trebuchet MS", "Avenir Next", sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Legend", x + padding, y + 18);

    items.forEach((item, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const itemX = x + padding + column * itemWidth;
      const itemY = y + 50 + row * 34;
      drawFloorExportLegendSwatch(ctx, item, itemX, itemY);
      ctx.fillStyle = "#f6edd9";
      ctx.font = '600 13px "Trebuchet MS", "Avenir Next", sans-serif';
      ctx.textBaseline = "middle";
      ctx.fillText(getFloorLegendLabel(item), itemX + 32, itemY + 10);
    });
  }

  function drawFloorExportLegendSwatch(ctx, item, x, y) {
    if (item === "room") {
      drawRoundedRectPath(ctx, x, y, 20, 20, 6);
      ctx.fillStyle = "rgba(214, 185, 137, 0.96)";
      ctx.fill();
      return;
    }

    if (item === "warning") {
      ctx.beginPath();
      ctx.arc(x + 10, y + 10, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#ff6f63";
      ctx.fill();
      ctx.fillStyle = "#220908";
      ctx.font = '900 13px "Trebuchet MS", "Avenir Next", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("!", x + 10, y + 10);
      return;
    }

    ctx.save();
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle =
      item === "secret-edge" ? "rgba(249, 201, 160, 0.9)" : "rgba(245, 194, 108, 0.94)";
    if (item === "secret-edge") {
      ctx.setLineDash([6, 5]);
    }
    ctx.beginPath();
    ctx.moveTo(x, y + 10);
    ctx.lineTo(x + 22, y + 10);
    ctx.stroke();
    ctx.restore();
  }

  function getFloorLegendLabel(item) {
    switch (item) {
      case "room":
        return "Room Instance";
      case "normal-edge":
        return "Door Connection";
      case "secret-edge":
        return "Secret Connection";
      case "warning":
        return "Warning";
      default:
        return item;
    }
  }

  function renderProjectToCanvas(project, template) {
    const outerPadding = 34;
    const headerHeight = 84;
    const axisSize = 30;
    const boardPadding = 24;
    const tileSize = 58;
    const gap = 0;
    const legendGap = 18;
    const step = tileSize + gap;
    const gridWidth = template.width * step - gap;
    const gridHeight = template.height * step - gap;
    const boardX = outerPadding;
    const boardY = outerPadding + headerHeight;
    const boardWidth = axisSize + boardPadding * 2 + gridWidth;
    const boardHeight = axisSize + boardPadding * 2 + gridHeight;
    const legendX = boardX;
    const gridLeft = boardX + boardPadding + axisSize;
    const gridTop = boardY + boardPadding + axisSize;
    const stats = calculateStats(project);
    const metadata = getProjectMetadata(project);
    const legendItems = getLegendItemsForProject(project, stats);
    const legendHeight = getExportLegendHeight(legendItems.length);
    const legendY = boardY + boardHeight + legendGap;
    const canvas = document.createElement("canvas");

    canvas.width = boardX + boardWidth + outerPadding;
    canvas.height = legendY + legendHeight + outerPadding;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return canvas;
    }

    drawExportBackdrop(ctx, canvas.width, canvas.height);

    ctx.fillStyle = "#f6edd9";
    ctx.font = '700 30px "Trebuchet MS", "Avenir Next", sans-serif';
    ctx.textBaseline = "top";
    ctx.fillText(project.name || EMPTY_PROJECT_NAME, outerPadding, outerPadding);

    ctx.fillStyle = "rgba(246, 237, 217, 0.68)";
    ctx.font = '15px "Trebuchet MS", "Avenir Next", sans-serif';
    ctx.fillText(
      `${template.name} · ${getOptionLabel(ROOM_TYPES, metadata.roomType)} · ${
        metadata.rewardType ? `${getOptionLabel(REWARD_TYPES, metadata.rewardType)} reward` : "No reward"
      } · ${getCollectionLabel(project.collectionId)} · ${stats.groundRegions} ground region${stats.groundRegions === 1 ? "" : "s"} · ${stats.enemyCount} enemy · ${stats.decorCount} decor · ${stats.doorCount} door${stats.doorCount === 1 ? "" : "s"} · ${stats.secretWallCount} secret wall${stats.secretWallCount === 1 ? "" : "s"}`,
      outerPadding,
      outerPadding + 40
    );

    drawRoundedRectPath(ctx, boardX, boardY, boardWidth, boardHeight, 28);
    ctx.fillStyle = "rgba(8, 17, 24, 0.9)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 240, 202, 0.14)";
    ctx.lineWidth = 1;
    ctx.stroke();

    drawRoundedRectPath(
      ctx,
      boardX + boardPadding,
      boardY + boardPadding,
      axisSize - 4,
      axisSize - 4,
      10
    );
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.stroke();

    ctx.font = '12px "SFMono-Regular", Consolas, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let x = template.bounds.minX; x <= template.bounds.maxX; x += 1) {
      const drawX = gridLeft + (x - template.bounds.minX) * step + tileSize / 2;
      ctx.fillStyle = x === 0 ? "#ff9f4a" : "rgba(255, 240, 202, 0.65)";
      ctx.fillText(String(x), drawX, boardY + boardPadding + axisSize / 2);
    }

    for (let y = template.bounds.minY; y <= template.bounds.maxY; y += 1) {
      const drawY = gridTop + (y - template.bounds.minY) * step + tileSize / 2;
      ctx.fillStyle = y === 0 ? "#ff9f4a" : "rgba(255, 240, 202, 0.65)";
      ctx.fillText(String(y), boardX + boardPadding + axisSize / 2, drawY);
    }

    for (let y = template.bounds.minY; y <= template.bounds.maxY; y += 1) {
      for (let x = template.bounds.minX; x <= template.bounds.maxX; x += 1) {
        const key = makeKey(x, y);
        const cellX = gridLeft + (x - template.bounds.minX) * step;
        const cellY = gridTop + (y - template.bounds.minY) * step;

        if (!template.mask.has(key)) {
          drawInactiveExportSlot(ctx, cellX, cellY, tileSize);
          continue;
        }

        const cell = project.cells[key];
        drawExportTile(ctx, project, cell, cellX, cellY, tileSize);
        drawExportTerrainCorners(ctx, project, cell, cellX, cellY, tileSize);
        drawExportTileGrid(ctx, cellX, cellY, tileSize);

        DOOR_DIRECTIONS.forEach((direction) => {
          if (hasRenderableBoundaryWall(project, cell, direction.id)) {
            if (isBoundaryWallRunStart(project, cell, direction.id)) {
              drawExportBoundaryWall(
                ctx,
                cellX,
                cellY,
                tileSize,
                direction.id,
                getBoundaryWallRunLength(project, cell, direction.id)
              );
            }
          }
        });

        DOOR_DIRECTIONS.forEach((direction) => {
          const joinState = getWallSegmentJoinState(project, cell, direction.id);
          const wallAnchorType = getWallAnchorType(cell, direction.id);
          if (wallAnchorType !== "none") {
            drawExportWallAnchor(
              ctx,
              cellX,
              cellY,
              tileSize,
              direction.id,
              wallAnchorType,
              joinState
            );
          }
        });

        drawExportMarker(ctx, cellX, cellY, tileSize, cell.occupant);

        if (x === 0 && y === 0) {
          drawExportOrigin(ctx, cellX, cellY, tileSize);
        }
      }
    }

    drawExportLegend(ctx, legendX, legendY, boardWidth, legendHeight, legendItems);

    return canvas;
  }

  function getExportLegendHeight(itemCount) {
    const columns = 4;
    const rows = Math.max(1, Math.ceil(itemCount / columns));
    return 58 + rows * 34;
  }

  function drawExportBackdrop(ctx, width, height) {
    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "#09141b");
    background.addColorStop(0.58, "#112531");
    background.addColorStop(1, "#173849");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const glowA = ctx.createRadialGradient(
      width * 0.14,
      height * 0.08,
      0,
      width * 0.14,
      height * 0.08,
      width * 0.24
    );
    glowA.addColorStop(0, "rgba(255, 159, 74, 0.22)");
    glowA.addColorStop(1, "rgba(255, 159, 74, 0)");
    ctx.fillStyle = glowA;
    ctx.fillRect(0, 0, width, height);

    const glowB = ctx.createRadialGradient(
      width * 0.88,
      height * 0.84,
      0,
      width * 0.88,
      height * 0.84,
      width * 0.28
    );
    glowB.addColorStop(0, "rgba(115, 211, 164, 0.18)");
    glowB.addColorStop(1, "rgba(115, 211, 164, 0)");
    ctx.fillStyle = glowB;
    ctx.fillRect(0, 0, width, height);
  }

  function drawInactiveExportSlot(ctx, x, y, size) {
    ctx.save();
    ctx.setLineDash([6, 6]);
    drawRoundedRectPath(ctx, x + 3, y + 3, size - 6, size - 6, 12);
    ctx.fillStyle = "rgba(255, 255, 255, 0.018)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawExportTile(ctx, project, cell, x, y, size) {
    const radii = getExportTileRadii(
      project,
      cell.x,
      cell.y,
      cell.terrain,
      getExportTerrainCornerRadius(cell.terrain, size)
    );

    drawRoundedRectPathWithRadii(
      ctx,
      x,
      y,
      size,
      size,
      radii
    );
    ctx.fillStyle = getExportTerrainFill(cell.terrain);
    ctx.fill();

    if (cell.terrain === "ground") {
      drawExportGroundSprite(ctx, project, cell, x, y, size, radii);
    }
  }

  function drawExportGroundSprite(ctx, project, cell, x, y, size, radii) {
    const sprite = getGroundSpriteState(project, cell.x, cell.y);

    ctx.save();
    drawRoundedRectPathWithRadii(ctx, x, y, size, size, radii);
    ctx.clip();

    if (sprite.top) {
      drawExportGroundEdge(ctx, x, y, size, "top", 0.38);
    }

    if (sprite.right) {
      drawExportGroundEdge(ctx, x, y, size, "right", 0.34);
    }

    if (sprite.bottom) {
      drawExportGroundEdge(ctx, x, y, size, "bottom", 0.42);
    }

    if (sprite.left) {
      drawExportGroundEdge(ctx, x, y, size, "left", 0.34);
    }

    if (sprite.topLeft) {
      drawExportGroundCornerShade(ctx, x, y, size, "topLeft", 0.28);
    }

    if (sprite.topRight) {
      drawExportGroundCornerShade(ctx, x, y, size, "topRight", 0.28);
    }

    if (sprite.bottomRight) {
      drawExportGroundCornerShade(ctx, x, y, size, "bottomRight", 0.3);
    }

    if (sprite.bottomLeft) {
      drawExportGroundCornerShade(ctx, x, y, size, "bottomLeft", 0.3);
    }

    drawExportGroundSurfaceDetail(ctx, x, y, size, cell.x, cell.y);
    ctx.restore();
  }

  function drawExportGroundEdge(ctx, x, y, size, side, alpha) {
    let gradient;
    if (side === "top") {
      gradient = ctx.createLinearGradient(x, y, x, y + size * 0.44);
      gradient.addColorStop(0, `rgba(93, 62, 31, ${alpha})`);
      gradient.addColorStop(1, "rgba(93, 62, 31, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, size, size * 0.44);
      return;
    }

    if (side === "right") {
      gradient = ctx.createLinearGradient(x + size * 0.56, y, x + size, y);
      gradient.addColorStop(0, "rgba(93, 62, 31, 0)");
      gradient.addColorStop(1, `rgba(93, 62, 31, ${alpha})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(x + size * 0.56, y, size * 0.44, size);
      return;
    }

    if (side === "bottom") {
      gradient = ctx.createLinearGradient(x, y + size, x, y + size * 0.52);
      gradient.addColorStop(0, `rgba(75, 47, 25, ${alpha})`);
      gradient.addColorStop(1, "rgba(75, 47, 25, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y + size * 0.52, size, size * 0.48);
      return;
    }

    gradient = ctx.createLinearGradient(x + size * 0.44, y, x, y);
    gradient.addColorStop(0, "rgba(93, 62, 31, 0)");
    gradient.addColorStop(1, `rgba(93, 62, 31, ${alpha})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, size * 0.44, size);
  }

  function drawExportGroundCornerShade(ctx, x, y, size, corner, alpha) {
    const points = {
      topLeft: [x, y, "rgba(94, 65, 34,"],
      topRight: [x + size, y, "rgba(94, 65, 34,"],
      bottomRight: [x + size, y + size, "rgba(80, 51, 27,"],
      bottomLeft: [x, y + size, "rgba(80, 51, 27,"],
    };
    const [centerX, centerY, colorPrefix] = points[corner];
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 0.6);
    gradient.addColorStop(0, `${colorPrefix} ${alpha})`);
    gradient.addColorStop(0.5, `${colorPrefix} ${alpha * 0.5})`);
    gradient.addColorStop(1, "rgba(94, 65, 34, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, size, size);
  }

  function drawExportGroundSurfaceDetail(ctx, x, y, size, gridX, gridY) {
    const seed = Math.abs(gridX * 37 + gridY * 53);
    const highlightX = x + size * (0.28 + (seed % 17) / 90);
    const highlightY = y + size * (0.26 + (seed % 11) / 110);
    const shadowX = x + size * (0.62 + (seed % 13) / 100);
    const shadowY = y + size * (0.62 + (seed % 7) / 120);

    ctx.beginPath();
    ctx.arc(highlightX, highlightY, Math.max(1.6, size * 0.035), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 238, 190, 0.12)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(shadowX, shadowY, Math.max(1.4, size * 0.03), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(105, 72, 36, 0.1)";
    ctx.fill();
  }

  function drawExportTileGrid(ctx, x, y, size) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.075)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + size - 0.5, y);
    ctx.lineTo(x + size - 0.5, y + size);
    ctx.moveTo(x, y + size - 0.5);
    ctx.lineTo(x + size, y + size - 0.5);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.beginPath();
    ctx.moveTo(x + 0.5, y);
    ctx.lineTo(x + 0.5, y + size);
    ctx.moveTo(x, y + 0.5);
    ctx.lineTo(x + size, y + 0.5);
    ctx.stroke();
    ctx.restore();
  }

  function drawExportBoundaryWall(ctx, x, y, size, direction, runLength) {
    const segment = getExportBoundaryWallGeometry(x, y, size, direction, runLength);
    drawRoundedRectPath(ctx, segment.x, segment.y, segment.width, segment.height, 7);
    ctx.fillStyle = createBoundaryWallGradient(
      ctx,
      segment.x,
      segment.y,
      segment.width,
      segment.height
    );
    ctx.fill();
    ctx.strokeStyle = "rgba(233, 214, 185, 0.14)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function getExportBoundaryWallGeometry(x, y, size, direction, runLength) {
    if (direction === "north" || direction === "south") {
      return {
        x: x - 3,
        y: direction === "north" ? y - 8 : y + size - 4,
        width: size * runLength + 6,
        height: 12,
      };
    }

    return {
      x: direction === "west" ? x - 8 : x + size - 4,
      y: y - 3,
      width: 12,
      height: size * runLength + 6,
    };
  }

  function drawExportWallAnchor(ctx, x, y, size, direction, kind, joinState) {
    const segment = getExportWallSegmentGeometry(x, y, size, direction, joinState);
    drawRoundedRectPathWithRadii(
      ctx,
      segment.x,
      segment.y,
      segment.width,
      segment.height,
      segment.radii
    );
    ctx.fillStyle =
      kind === "secret"
        ? createSecretWallGradient(ctx, segment.x, segment.y, segment.width, segment.height)
        : createDoorGradient(ctx, segment.x, segment.y, segment.width, segment.height);
    ctx.fill();
    ctx.strokeStyle =
      kind === "secret"
        ? "rgba(249, 201, 160, 0.28)"
        : "rgba(255, 232, 197, 0.26)";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (kind === "secret") {
      drawExportSecretWallBadge(ctx, segment.x, segment.y, segment.width, segment.height);
    }
  }

  function getExportWallSegmentGeometry(x, y, size, direction, joinState) {
    const horizontal = direction === "north" || direction === "south";
    const beforeExtend = joinState.before ? 4 : 0;
    const afterExtend = joinState.after ? 4 : 0;
    const exposedRadius = 6;
    const joinedRadius = 2;

    if (horizontal) {
      const width = size + 6 + beforeExtend + afterExtend;
      const height = 12;
      const wallX = x - 3 - beforeExtend;
      const wallY = direction === "north" ? y - 8 : y + size - 4;
      const beforeRadius = joinState.before ? joinedRadius : exposedRadius;
      const afterRadius = joinState.after ? joinedRadius : exposedRadius;

      return {
        x: wallX,
        y: wallY,
        width,
        height,
        radii: {
          topLeft: beforeRadius,
          topRight: afterRadius,
          bottomRight: afterRadius,
          bottomLeft: beforeRadius,
        },
      };
    }

    const width = 12;
    const height = size + 6 + beforeExtend + afterExtend;
    const wallX = direction === "west" ? x - 8 : x + size - 4;
    const wallY = y - 3 - beforeExtend;
    const beforeRadius = joinState.before ? joinedRadius : exposedRadius;
    const afterRadius = joinState.after ? joinedRadius : exposedRadius;

    return {
      x: wallX,
      y: wallY,
      width,
      height,
      radii: {
        topLeft: beforeRadius,
        topRight: beforeRadius,
        bottomRight: afterRadius,
        bottomLeft: afterRadius,
      },
    };
  }

  function drawExportLegend(ctx, x, y, width, height, items) {
    const padding = 24;
    const columns = 4;
    const rowHeight = 34;
    const itemWidth = (width - padding * 2) / columns;

    drawRoundedRectPath(ctx, x, y, width, height, 24);
    ctx.fillStyle = "rgba(8, 17, 24, 0.82)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 240, 202, 0.14)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "rgba(246, 237, 217, 0.82)";
    ctx.font = '700 13px "Trebuchet MS", "Avenir Next", sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Legend", x + padding, y + 18);

    items.forEach((kind, index) => {
      const definition = getLegendDefinition(kind);
      const column = index % columns;
      const row = Math.floor(index / columns);
      const itemX = x + padding + column * itemWidth;
      const itemY = y + 50 + row * rowHeight;

      drawExportLegendSwatch(ctx, kind, itemX, itemY + 1);
      ctx.fillStyle = "#f6edd9";
      ctx.font = '600 13px "Trebuchet MS", "Avenir Next", sans-serif';
      ctx.textBaseline = "middle";
      ctx.fillText(definition.label, itemX + 32, itemY + 11);
    });
  }

  function drawExportLegendSwatch(ctx, kind, x, y) {
    const size = 20;

    if (kind === "ground" || kind === "hole") {
      drawRoundedRectPath(
        ctx,
        x,
        y,
        size,
        size,
        kind === "hole" ? 8 : 6
      );
      ctx.fillStyle = getExportTerrainFill(kind);
      ctx.fill();
      return;
    }

    if (OCCUPANT_DEFINITIONS[kind]) {
      drawExportMarker(ctx, x, y, size, kind);
      return;
    }

    drawRoundedRectPath(ctx, x - 1, y + 5, size + 4, 10, 6);
    ctx.fillStyle =
      kind === "secret-wall"
        ? createSecretWallGradient(ctx, x - 1, y + 5, size + 4, 10)
        : createDoorGradient(ctx, x - 1, y + 5, size + 4, 10);
    ctx.fill();
    ctx.strokeStyle =
      kind === "secret-wall"
        ? "rgba(249, 201, 160, 0.28)"
        : "rgba(255, 232, 197, 0.26)";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (kind === "secret-wall") {
      drawExportSecretWallBadge(ctx, x - 1, y + 5, size + 4, 10);
    }
  }

  function drawExportMarker(ctx, x, y, size, occupant) {
    switch (occupant) {
      case "rock":
        drawExportRock(ctx, x, y, size);
        return;
      case "item":
        drawExportItem(ctx, x, y, size);
        return;
      case "enemy-standard":
        drawExportEnemyStandard(ctx, x, y, size);
        return;
      case "enemy-flying":
        drawExportEnemyFlying(ctx, x, y, size);
        return;
      case "enemy-spitting-pod":
        drawExportEnemySpittingPod(ctx, x, y, size);
        return;
      case "enemy-static-shooter":
        drawExportEnemyStaticShooter(ctx, x, y, size);
        return;
      case "enemy-cocoon":
        drawExportEnemyCocoon(ctx, x, y, size);
        return;
      case "decor-short":
        drawExportDecor(ctx, x, y, size, 0.38, "#8fcb80", "#4e7a49");
        return;
      case "decor-medium":
        drawExportDecor(ctx, x, y, size, 0.58, "#72d0be", "#2d6a63");
        return;
      case "decor-tall":
        drawExportDecor(ctx, x, y, size, 0.8, "#79aef4", "#355d9f");
        return;
      default:
        return;
    }
  }

  function drawExportRock(ctx, x, y, size) {
    const markerSize = size * 0.78;
    const offset = (size - markerSize) / 2;
    const points = [
      [0.16, 0.08],
      [0.82, 0.18],
      [0.93, 0.56],
      [0.72, 0.9],
      [0.28, 0.95],
      [0.08, 0.54],
    ];

    ctx.save();
    ctx.translate(x + offset, y + offset);
    ctx.beginPath();
    points.forEach(([px, py], index) => {
      const drawX = px * markerSize;
      const drawY = py * markerSize;
      if (index === 0) {
        ctx.moveTo(drawX, drawY);
      } else {
        ctx.lineTo(drawX, drawY);
      }
    });
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, markerSize, markerSize);
    gradient.addColorStop(0, "#a9ada8");
    gradient.addColorStop(1, "#5d635f");
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  function drawExportEnemyStandard(ctx, x, y, size) {
    const markerSize = size * 0.76;
    const radius = markerSize / 2;
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const crossInset = markerSize * 0.24;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(141, 37, 37, 0.26)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 128, 128, 0.92)";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX - radius + crossInset, centerY);
    ctx.lineTo(centerX + radius - crossInset, centerY);
    ctx.moveTo(centerX, centerY - radius + crossInset);
    ctx.lineTo(centerX, centerY + radius - crossInset);
    ctx.strokeStyle = "rgba(255, 128, 128, 0.95)";
    ctx.lineCap = "round";
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  function drawExportEnemyFlying(ctx, x, y, size) {
    const width = size * 0.72;
    const height = size * 0.42;
    const centerX = x + size / 2;
    const centerY = y + size / 2 + 1;

    ctx.save();
    ctx.fillStyle = "#89dfff";
    ctx.beginPath();
    ctx.moveTo(centerX - width * 0.56, centerY - height * 0.08);
    ctx.lineTo(centerX - width * 0.18, centerY - height * 0.42);
    ctx.lineTo(centerX - width * 0.06, centerY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX + width * 0.56, centerY - height * 0.08);
    ctx.lineTo(centerX + width * 0.18, centerY - height * 0.42);
    ctx.lineTo(centerX + width * 0.06, centerY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, width * 0.24, height * 0.46, 0, 0, Math.PI * 2);
    const body = ctx.createLinearGradient(centerX, centerY - height, centerX, centerY + height);
    body.addColorStop(0, "#d9fbff");
    body.addColorStop(1, "#4eb6d7");
    ctx.fillStyle = body;
    ctx.fill();
    ctx.restore();
  }

  function drawExportEnemySpittingPod(ctx, x, y, size) {
    const markerSize = size * 0.78;
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(0.18);
    ctx.beginPath();
    ctx.ellipse(0, 0, markerSize * 0.36, markerSize * 0.34, 0, 0, Math.PI * 2);
    const pod = ctx.createRadialGradient(-markerSize * 0.12, -markerSize * 0.16, 0, 0, 0, markerSize * 0.42);
    pod.addColorStop(0, "#e8ffb9");
    pod.addColorStop(0.35, "#8db94e");
    pod.addColorStop(1, "#344a1c");
    ctx.fillStyle = pod;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(markerSize * 0.04, markerSize * 0.04, markerSize * 0.11, markerSize * 0.15, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#1a290f";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(markerSize * 0.22, -markerSize * 0.18, markerSize * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = "#f7ffd7";
    ctx.fill();
    ctx.restore();
  }

  function drawExportEnemyStaticShooter(ctx, x, y, size) {
    const markerSize = size * 0.7;
    const drawX = x + (size - markerSize) / 2;
    const drawY = y + (size - markerSize) / 2;
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    drawRoundedRectPath(ctx, drawX, drawY, markerSize, markerSize, 7);
    const turret = ctx.createLinearGradient(drawX, drawY, drawX + markerSize, drawY + markerSize);
    turret.addColorStop(0, "#d3bcff");
    turret.addColorStop(1, "#6b49a6");
    ctx.fillStyle = turret;
    ctx.fill();

    ctx.fillStyle = "#f7efff";
    ctx.fillRect(centerX - 2, drawY - 3, 4, 10);
    ctx.fillRect(centerX - 2, drawY + markerSize - 7, 4, 10);
    ctx.fillRect(drawX - 3, centerY - 2, 10, 4);
    ctx.fillRect(drawX + markerSize - 7, centerY - 2, 10, 4);

    ctx.beginPath();
    ctx.arc(centerX, centerY, markerSize * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = "#2e1950";
    ctx.fill();
  }

  function drawExportEnemyCocoon(ctx, x, y, size) {
    const width = size * 0.58;
    const height = size * 0.8;
    const drawX = x + (size - width) / 2;
    const drawY = y + (size - height) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(drawX + width / 2, drawY + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    const cocoon = ctx.createLinearGradient(drawX, drawY, drawX + width, drawY + height);
    cocoon.addColorStop(0, "#f2d9f1");
    cocoon.addColorStop(1, "#8a5b87");
    ctx.fillStyle = cocoon;
    ctx.fill();

    ctx.strokeStyle = "rgba(88, 41, 82, 0.9)";
    ctx.lineWidth = 2;
    for (let band = 0.2; band <= 0.8; band += 0.2) {
      ctx.beginPath();
      ctx.moveTo(drawX + width * 0.22, drawY + height * band);
      ctx.lineTo(drawX + width * 0.78, drawY + height * band);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawExportDecor(ctx, x, y, size, heightRatio, lightColor, darkColor) {
    const width = size * 0.36;
    const height = size * heightRatio;
    const drawX = x + (size - width) / 2;
    const drawY = y + size - height - size * 0.08;

    drawRoundedRectPath(ctx, drawX, drawY, width, height, Math.max(4, width * 0.18));
    const gradient = ctx.createLinearGradient(drawX, drawY, drawX + width, drawY + height);
    gradient.addColorStop(0, lightColor);
    gradient.addColorStop(1, darkColor);
    ctx.fillStyle = gradient;
    ctx.fill();

    drawRoundedRectPath(ctx, drawX - size * 0.08, drawY + height - size * 0.08, width + size * 0.16, size * 0.1, size * 0.04);
    ctx.fillStyle = "rgba(15, 31, 29, 0.45)";
    ctx.fill();
  }

  function drawExportItem(ctx, x, y, size) {
    const markerSize = size * 0.74;
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(Math.PI / 4);
    drawRoundedRectPath(ctx, -markerSize / 2, -markerSize / 2, markerSize, markerSize, 5);
    const gradient = ctx.createLinearGradient(
      -markerSize / 2,
      -markerSize / 2,
      markerSize / 2,
      markerSize / 2
    );
    gradient.addColorStop(0, "#f6d774");
    gradient.addColorStop(1, "#c78b2a");
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 248, 229, 0.28)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  function drawExportOrigin(ctx, x, y, size) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, 7, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 159, 74, 0.2)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 159, 74, 0.9)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function drawExportSecretWallBadge(ctx, x, y, width, height) {
    const badgeSize = Math.min(width, height) * 0.56;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const half = badgeSize / 2;

    ctx.beginPath();
    ctx.moveTo(centerX - half, centerY - half);
    ctx.lineTo(centerX + half, centerY + half);
    ctx.moveTo(centerX + half, centerY - half);
    ctx.lineTo(centerX - half, centerY + half);
    ctx.strokeStyle = "rgba(56, 22, 20, 0.82)";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function getExportTileRadii(project, x, y, terrain, radius) {
    const sameNorth = hasMatchingTerrain(project, x, y - 1, terrain);
    const sameSouth = hasMatchingTerrain(project, x, y + 1, terrain);
    const sameWest = hasMatchingTerrain(project, x - 1, y, terrain);
    const sameEast = hasMatchingTerrain(project, x + 1, y, terrain);

    return {
      topLeft: sameNorth || sameWest ? 0 : radius,
      topRight: sameNorth || sameEast ? 0 : radius,
      bottomRight: sameSouth || sameEast ? 0 : radius,
      bottomLeft: sameSouth || sameWest ? 0 : radius,
    };
  }

  function drawExportTerrainCorners(ctx, project, cell, x, y, size) {
    const cornerState = getTerrainCornerState(project, cell.x, cell.y, cell.terrain);
    const radius = getExportTerrainCornerRadius(cell.terrain, size);
    if (!cornerState.topLeft && !cornerState.topRight && !cornerState.bottomRight && !cornerState.bottomLeft) {
      return;
    }

    ctx.save();
    ctx.fillStyle = getExportTerrainFill(cell.terrain);

    if (cornerState.topLeft) {
      drawExportTerrainCornerCircle(ctx, x, y, radius);
    }

    if (cornerState.topRight) {
      drawExportTerrainCornerCircle(ctx, x + size, y, radius);
    }

    if (cornerState.bottomRight) {
      drawExportTerrainCornerCircle(ctx, x + size, y + size, radius);
    }

    if (cornerState.bottomLeft) {
      drawExportTerrainCornerCircle(ctx, x, y + size, radius);
    }

    ctx.restore();
  }

  function drawExportTerrainCornerCircle(ctx, centerX, centerY, radius) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function getExportTerrainCornerRadius(terrain, size) {
    return terrain === "hole" ? size * 0.2 : size * 0.14;
  }

  function getExportTerrainFill(terrain) {
    return terrain === "ground" ? "rgba(214, 185, 137, 0.96)" : "rgba(14, 26, 39, 0.96)";
  }

  function createDoorGradient(ctx, x, y, width, height) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, "#f5c26c");
    gradient.addColorStop(1, "#d17a29");
    return gradient;
  }

  function createBoundaryWallGradient(ctx, x, y, width, height) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, "rgba(115, 84, 58, 0.98)");
    gradient.addColorStop(1, "rgba(70, 46, 33, 0.98)");
    return gradient;
  }

  function createSecretWallGradient(ctx, x, y, width, height) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, "#b17760");
    gradient.addColorStop(0.52, "#8a5b4f");
    gradient.addColorStop(1, "#6f4542");
    return gradient;
  }

  function drawRoundedRectPath(ctx, x, y, width, height, radius) {
    drawRoundedRectPathWithRadii(ctx, x, y, width, height, {
      topLeft: radius,
      topRight: radius,
      bottomRight: radius,
      bottomLeft: radius,
    });
  }

  function drawRoundedRectPathWithRadii(ctx, x, y, width, height, radii) {
    const topLeft = Math.max(0, Math.min(radii.topLeft || 0, width / 2, height / 2));
    const topRight = Math.max(0, Math.min(radii.topRight || 0, width / 2, height / 2));
    const bottomRight = Math.max(
      0,
      Math.min(radii.bottomRight || 0, width / 2, height / 2)
    );
    const bottomLeft = Math.max(
      0,
      Math.min(radii.bottomLeft || 0, width / 2, height / 2)
    );

    ctx.beginPath();
    ctx.moveTo(x + topLeft, y);
    ctx.lineTo(x + width - topRight, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + topRight);
    ctx.lineTo(x + width, y + height - bottomRight);
    ctx.quadraticCurveTo(x + width, y + height, x + width - bottomRight, y + height);
    ctx.lineTo(x + bottomLeft, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - bottomLeft);
    ctx.lineTo(x, y + topLeft);
    ctx.quadraticCurveTo(x, y, x + topLeft, y);
    ctx.closePath();
  }

  function downloadTextFile(filename, contents, mimeType = "application/json") {
    const blob = new Blob([contents], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function downloadCanvasFile(filename, canvas, mimeType, quality) {
    if (canvas.toBlob) {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            downloadDataUrl(filename, canvas.toDataURL(mimeType, quality));
            return;
          }

          const url = URL.createObjectURL(blob);
          triggerDownload(filename, url, true);
        },
        mimeType,
        quality
      );
      return;
    }

    downloadDataUrl(filename, canvas.toDataURL(mimeType, quality));
  }

  function downloadDataUrl(filename, dataUrl) {
    triggerDownload(filename, dataUrl, false);
  }

  function triggerDownload(filename, url, shouldRevoke) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    if (shouldRevoke) {
      URL.revokeObjectURL(url);
    }
  }

  function slugify(value) {
    return String(value || EMPTY_PROJECT_NAME)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "room-project";
  }

  function escapeSelectorValue(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }
    return String(value).replace(/["\\]/g, "\\$&");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();

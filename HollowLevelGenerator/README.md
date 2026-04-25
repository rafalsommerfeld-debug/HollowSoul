# Hollow Room Lab

A lightweight browser editor for roughing out grid-based dungeon rooms inspired by *The Binding of Isaac*.

## What it does

- Create multiple room projects in the browser and keep them in local storage.
- Start from preset footprints:
  - Small Room `13 x 7`
  - Medium Room `25 x 7`
  - Medium Room `13 x 13`
  - Large Room `25 x 25`
  - L Room built from three `13 x 7` chunks
- Paint by tile with a brush or drag out a rectangle selection.
- Place `Ground`, `Hole`, `Rock`, `Enemy Spawn`, `Item Spawn`, and wall-anchored `Door` and `Secret Wall Entrance` markers that auto-attach to the nearest valid room edge.
- Track how many orthogonally connected ground regions your room has.
- Export and import projects as JSON.
- Export the current room as `PNG` or `JPEG`, including the room legend.

## Usage

Open [index.html](/Users/martinjedrzejewski/Library/Mobile%20Documents/com~apple~CloudDocs/Business%202026/HollowLevelGenerator/index.html) directly in a browser, or serve the folder locally:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173`.

## Notes

- Coordinates are centered around `0,0`.
- Rectangular rooms use odd dimensions so the footprint and edge centers line up cleanly.
- The L-room preset assumes an elbow layout made from three small-room chunks with the elbow centered at `0,0`.
- For doors and secret walls, brush near the intended outer wall edge and the editor will choose the correct wall side automatically.

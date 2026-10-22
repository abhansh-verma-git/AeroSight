import os
import sys
import shutil
import argparse
from pathlib import Path
from ultralytics.data.split_dota import split_trainval, split_test

def run_split(
    data_root="P:/Projects/AeroSight/DOTAv1/DOTAv1",
    save_dir="P:/Projects/AeroSight/DOTAv1_tiled",
    crop_size=1024,
    gap=200,
    rates=(1.0,),
    create_smoke_subset=True,
    smoke_dir="P:/Projects/AeroSight/DOTAv1_smoke"
):
    print("==================================================")
    print(" AeroSight DOTA Tiling & Splitting Pipeline")
    print(f" Source Data: {data_root}")
    print(f" Output Tiled Data: {save_dir}")
    print(f" Crop Size: {crop_size} | Overlap Gap: {gap}")
    print("==================================================")

    data_root = Path(data_root)
    save_dir = Path(save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)

    print("Running Ultralytics split_trainval...")
    split_trainval(str(data_root), str(save_dir), crop_size=crop_size, gap=gap, rates=rates)
    print(f"Full tiling complete. Tiled dataset saved to: {save_dir}")

    # Create tiled YAML configuration
    tiled_yaml = Path("P:/Projects/AeroSight/ml/data_tiled.yaml")
    yaml_content = f"""path: {save_dir.as_posix()}
train: images/train
val: images/val
test: images/val

names:
  0: plane
  1: ship
  2: storage-tank
  3: baseball-diamond
  4: tennis-court
  5: basketball-court
  6: ground-track-field
  7: harbor
  8: bridge
  9: large-vehicle
  10: small-vehicle
  11: helicopter
  12: roundabout
  13: soccer-ball-field
  14: swimming-pool
"""
    with open(tiled_yaml, "w", encoding="utf-8") as f:
        f.write(yaml_content)
    print(f"Created tiled dataset config at: {tiled_yaml}")

    # Create tiny smoke subset if requested
    if create_smoke_subset:
        smoke_dir = Path(smoke_dir)
        create_subset(save_dir, smoke_dir, train_count=30, val_count=10)

def create_subset(src_dir, dst_dir, train_count=30, val_count=10):
    dst_dir = Path(dst_dir)
    print(f"\nCreating smoke test subset at: {dst_dir}")
    for split, count in [("train", train_count), ("val", val_count)]:
        src_img_dir = Path(src_dir) / "images" / split
        src_lbl_dir = Path(src_dir) / "labels" / split
        dst_img_dir = dst_dir / "images" / split
        dst_lbl_dir = dst_dir / "labels" / split
        
        dst_img_dir.mkdir(parents=True, exist_ok=True)
        dst_lbl_dir.mkdir(parents=True, exist_ok=True)

        if not src_img_dir.exists():
            continue

        images = sorted([f for f in os.listdir(src_img_dir) if f.lower().endswith(('.jpg', '.png'))])[:count]
        for img_name in images:
            shutil.copy2(src_img_dir / img_name, dst_img_dir / img_name)
            lbl_name = Path(img_name).stem + ".txt"
            if (src_lbl_dir / lbl_name).exists():
                shutil.copy2(src_lbl_dir / lbl_name, dst_lbl_dir / lbl_name)
        print(f"Copied {len(images)} images and labels to smoke {split} set.")

    smoke_yaml = Path("P:/Projects/AeroSight/ml/data_smoke.yaml")
    yaml_content = f"""path: {dst_dir.as_posix()}
train: images/train
val: images/val
test: images/val

names:
  0: plane
  1: ship
  2: storage-tank
  3: baseball-diamond
  4: tennis-court
  5: basketball-court
  6: ground-track-field
  7: harbor
  8: bridge
  9: large-vehicle
  10: small-vehicle
  11: helicopter
  12: roundabout
  13: soccer-ball-field
  14: swimming-pool
"""
    with open(smoke_yaml, "w", encoding="utf-8") as f:
        f.write(yaml_content)
    print(f"Created smoke test config at: {smoke_yaml}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Tile DOTA dataset using ultralytics.data.split_dota")
    parser.add_argument("--data-root", type=str, default="P:/Projects/AeroSight/DOTAv1/DOTAv1")
    parser.add_argument("--save-dir", type=str, default="P:/Projects/AeroSight/DOTAv1_tiled")
    parser.add_argument("--crop-size", type=int, default=1024)
    parser.add_argument("--gap", type=int, default=200)
    parser.add_argument("--smoke-only", action="store_true", help="Only create smoke subset from existing data")
    args = parser.parse_args()

    if args.smoke_only:
        create_subset("P:/Projects/AeroSight/DOTAv1/DOTAv1", "P:/Projects/AeroSight/DOTAv1_smoke", 30, 10)
    else:
        run_split(
            data_root=args.data_root,
            save_dir=args.save_dir,
            crop_size=args.crop_size,
            gap=args.gap
        )

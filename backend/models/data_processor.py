from typing import Optional, Dict, Any, List
from schemas.schemas import MeasurementData, ToothMeasurement
from PIL import Image
import io
import numpy as np
import torch
from torchvision import transforms


class DataProcessor:
    """Veri işleme ve preprocessing sınıfı"""
    
    def process_measurements(self, measurements: Dict[str, Any]) -> Dict[str, Any]:
        """
        Diş ölçüm verilerini işler ve AI modeli için hazırlar
        
        Args:
            measurements: MeasurementData dict
            
        Returns:
            İşlenmiş veri dict
        """
        processed_data = {
            "patient_info": {
                "name": measurements.get("patientName"),
                "age": measurements.get("patientAge"),
                "gender": measurements.get("patientGender")
            },
            "teeth_data": [],
            "missing_teeth": [],
            # FDI 18/28/38/48 -> frontend "simple" numbering 8/16/24/32
            "excluded_teeth": [8, 16, 24, 32],
            "statistics": {
                "total_teeth": len(measurements.get("teeth", [])),
                "missing_count": 0,
                "present_count": 0
            }
        }
        
        all_pocket_depths = []
        all_pi_values = []

        # BOP (0/1) hasta geneli: pozitif bölge sayısı / (mevcut diş sayısı * 6)
        # Notlar:
        # - 8 numaralı dişler (FDI 18/28/38/48 => simple 8/16/24/32) hesaplamalara dahil edilmez
        # - eksik dişler (isMissing=True) dahil edilmez
        bop_positive_sites = 0
        bop_denominator_teeth = 0
        
        for tooth_data in measurements.get("teeth", []):
            tooth_num = tooth_data.get("toothNumber")
            is_missing = tooth_data.get("isMissing", False)
            
            if is_missing:
                processed_data["missing_teeth"].append(tooth_num)
                processed_data["statistics"]["missing_count"] += 1
                continue
            
            processed_data["statistics"]["present_count"] += 1

            is_excluded = tooth_num in processed_data["excluded_teeth"]
            
            # Buccal ve Lingual probing depths
            buccal_pd = tooth_data.get("buccal", {}).get("probingDepth", {})
            lingual_pd = tooth_data.get("lingual", {}).get("probingDepth", {})
            
            # Tüm probing depth değerlerini topla
            if not is_excluded:
                for side in [buccal_pd, lingual_pd]:
                    for point in ["mesial", "central", "distal"]:
                        value = side.get(point)
                        if isinstance(value, (int, float)) and value > 0:
                            all_pocket_depths.append(float(value))
            
            # BOP (0/1) ve PI değerlerini topla
            # - BOP için hasta geneli hesap: (pozitif site sayısı) / (mevcut diş sayısı * 6)
            if not is_excluded:
                bop_denominator_teeth += 1
                for side_name in ["buccal", "lingual"]:
                    side_data = tooth_data.get(side_name, {})

                    # BOP: 0/1
                    bop_data = side_data.get("bop", {}) or {}
                    for point in ["mesial", "central", "distal"]:
                        value = bop_data.get(point)
                        if isinstance(value, (int, float)) and float(value) >= 1:
                            bop_positive_sites += 1

                    # PI: 0-3 (ortalama için)
                    pi_data = side_data.get("pi", {}) or {}
                    for point in ["mesial", "central", "distal"]:
                        value = pi_data.get(point)
                        if isinstance(value, (int, float)):
                            all_pi_values.append(float(value))
            
            # Diş verilerini ekle
            processed_data["teeth_data"].append({
                "tooth_number": tooth_num,
                "mobility": tooth_data.get("mobility"),
                "implantat": tooth_data.get("implantat", False),
                "furcation_buccal": tooth_data.get("buccal", {}).get("furcation"),
                "furcation_lingual": tooth_data.get("lingual", {}).get("furcation"),
                "probing_depth": {
                    "buccal": buccal_pd,
                    "lingual": lingual_pd
                },
                "gingival_margin": {
                    "buccal": tooth_data.get("buccal", {}).get("gingivalMargin", {}),
                    "lingual": tooth_data.get("lingual", {}).get("gingivalMargin", {})
                },
                "bop": {
                    "buccal": tooth_data.get("buccal", {}).get("bop", {}),
                    "lingual": tooth_data.get("lingual", {}).get("bop", {})
                },
                "pi": {
                    "buccal": tooth_data.get("buccal", {}).get("pi", {}),
                    "lingual": tooth_data.get("lingual", {}).get("pi", {})
                }
            })
        
        # İstatistikler
        processed_data["statistics"]["avg_pocket_depth"] = (
            np.mean(all_pocket_depths) if all_pocket_depths else 0
        )
        processed_data["statistics"]["max_pocket_depth"] = (
            np.max(all_pocket_depths) if all_pocket_depths else 0
        )
        processed_data["statistics"]["min_pocket_depth"] = (
            np.min(all_pocket_depths) if all_pocket_depths else 0
        )

        bop_denominator_sites = bop_denominator_teeth * 6
        bop_ratio = (bop_positive_sites / bop_denominator_sites) if bop_denominator_sites > 0 else 0
        processed_data["statistics"]["bop_value"] = bop_ratio
        processed_data["statistics"]["bop_percentage"] = bop_ratio * 100
        processed_data["statistics"]["bop_positive_sites"] = bop_positive_sites
        processed_data["statistics"]["bop_denominator_sites"] = bop_denominator_sites
        processed_data["statistics"]["avg_pi"] = (
            np.mean(all_pi_values) if all_pi_values else 0
        )
        
        return processed_data
    
    def process_xray_image(self, xray_bytes: bytes) -> Image.Image:
        """
        Röntgen görüntüsünü işler ve PIL Image olarak döndürür
        
        Args:
            xray_bytes: Görüntü dosyasının byte verisi
            
        Returns:
            PIL Image (RGB formatında)
        """
        try:
            # PIL Image'e çevir
            image = Image.open(io.BytesIO(xray_bytes))
            
            # RGB'ye çevir (eğer grayscale ise)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            return image
            
        except Exception as e:
            raise ValueError(f"Görüntü işleme hatası: {str(e)}")

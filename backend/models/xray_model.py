"""
Röntgen görüntüleri için hibrit model sınıfı
Notebook'taki SwinEfficientNetHybrid modelini backend için uyarlanmış hali
"""
import torch
import torch.nn as nn
import timm
from timm.models.swin_transformer import SwinTransformer


class SwinEfficientNetHybrid(nn.Module):
    """
    Swin Transformer + EfficientNet hibrit modeli
    Notebook'taki model ile aynı mimari
    """
    def __init__(self, num_classes=3):
        super(SwinEfficientNetHybrid, self).__init__()

        # EfficientNet backbone (b0 versiyonu kullanılacak)
        self.efficientnet = timm.create_model(
            'tf_efficientnetv2_l.in21k_ft_in1k', 
            pretrained=True, 
            features_only=True
        )
        # EfficientNet'in son katman feature haritası 640 kanallı
        self.efficientnet_adapter = nn.Conv2d(640, 768, kernel_size=1)

        # Swin Transformer backbone
        self.swin = SwinTransformer(
            img_size=224, 
            embed_dim=96, 
            depths=[2, 2, 6, 2], 
            num_heads=[3, 6, 12, 24], 
            window_size=7, 
            num_classes=num_classes
        )

        # Feature fusion
        self.fusion_layer = nn.Sequential(
            nn.Conv2d(768 + 768, 512, kernel_size=1),  # EfficientNet ve Swin'den gelen özellikleri birleştir
            nn.ReLU(),
            nn.AdaptiveAvgPool2d(1)
        )

        # Classifier
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        eff_feat = self.efficientnet(x)[-1]  # EfficientNet'in son özellik haritasını al
        swin_feat = self.swin.forward_features(x)  # Swin Transformer özellikleri
        swin_feat = swin_feat.permute(0, 3, 1, 2)

        eff_feat = self.efficientnet_adapter(eff_feat)

        # Özellikleri birleştir
        fusion = torch.cat((eff_feat, swin_feat), dim=1)
        fusion = self.fusion_layer(fusion)

        # Sınıflandırma
        out = self.classifier(fusion)
        return out

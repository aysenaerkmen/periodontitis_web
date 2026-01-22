import torch
import torch.nn as nn
import timm

class ConvNextFeatureExtractor(nn.Module):
    """
    Yöntem 1 için ConvNext tabanlı öznitelik çıkarıcı.
    Görüntüyü alır ve sınıflara ayırmak yerine bir öznitelik vektörü döndürür.
    """
    def __init__(self, model_name='convnext_tiny.fb_in22k_ft_in1k'):
        super(ConvNextFeatureExtractor, self).__init__()
        # num_classes=0 yaparak sadece feature vektörünü (768 boyut) alıyoruz
        self.model = timm.create_model(model_name, pretrained=True, num_classes=0)
        self.model.eval()

    def forward(self, x):
        with torch.no_grad():
            features = self.model(x)
        return features
import torch
from torchvision.models import mobilenet_v3_large, MobileNet_V3_Large_Weights

class MobileNetV3LargeRegressor(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.model = mobilenet_v3_large(weights=MobileNet_V3_Large_Weights.DEFAULT)
        self.model.classifier = torch.nn.Identity()  # Remove the fully connected layers
        self.gap = torch.nn.AdaptiveAvgPool2d((1, 1))  # Global Average Pooling
        self.fc1 = torch.nn.Linear(960, 512)  # Fully connected layer with 512 units
        self.relu = torch.nn.ReLU()
        self.dropout = torch.nn.Dropout(0.5)
        self.fc2 = torch.nn.Linear(512, 1)  # Final layer for regression

    def forward(self, x):
        x = self.model.features(x)
        x = self.gap(x)
        x = x.view(x.size(0), -1)  # Flatten the tensor
        x = self.fc1(x)
        x = self.relu(x)
        x = self.dropout(x)
        x = self.fc2(x)
        return x
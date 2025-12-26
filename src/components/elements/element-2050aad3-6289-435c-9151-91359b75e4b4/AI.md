---
name: circular-image-cropper
description: A component that crops images into a circular shape with a fixed center crop region, ideal for profile pictures.
keywords: image, crop, circular, profile, avatar, photo editor
---

#### Circular Image Cropper

***Purpose:***
This component allows users to crop an image into a perfect circle with a fixed center crop region, making it ideal for profile pictures and avatars.

***Features:***
- Fixed circular crop region in the center of the image
- Interactive image positioning with pan and zoom controls
- Real-time preview of the cropping result
- Built-in crop button for immediate cropping
- Outputs a circular cropped image as a data URL
- Can be triggered via an external button using actions

***Properties:***
- imageUrl: string - The URL of the image to crop. Can be a blob URL or a regular image URL.
- variableId: string - The ID of the variable containing the blob URL (overrides imageUrl if provided).
- cropSize: number - The size of the cropped image output in pixels (default: 300).
- cropQuality: 'low'|'medium'|'high' - The quality of the output image (default: 'high').

***Events:***
- crop: Triggered when the image is cropped. Payload: { value: "data:image/png;base64,..." }

***Exposed Actions:***
- `performCrop`: Crops the image and returns the data URL of the cropped image. No arguments required.

***Exposed Variables:***
- croppedImageUrl: The data URL of the cropped image. (path: variables['current_element_uid-croppedImageUrl'])

***Notes:***
- To use this component with an external button, bind the button's click action to the component's "performCrop" action.
- The cropped image is available as a data URL in the component's "croppedImageUrl" variable.
- For best results, use images with dimensions larger than the crop area.
- The component maintains aspect ratio and ensures the crop is always a perfect circle.
- You can either provide a direct image URL or bind to a variable containing a blob URL.
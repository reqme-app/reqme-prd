<template>
  <div class="circular-image-cropper">
    <div class="cropper-container" ref="cropperContainer">
      <img
        v-if="displayImageUrl"
        ref="imageRef"
        :src="displayImageUrl"
        class="cropper-image"
        @load="onImageLoad"
        alt="Image to crop"
      />
      <div v-else class="no-image">
        <div class="no-image-message">No image loaded</div>
      </div>
    </div>

    <div class="cropper-controls" v-if="displayImageUrl">
      <button class="crop-button" @click="cropImage">完了</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.min.css';

export default {
  props: {
    uid: { type: String, required: true },
    content: { type: Object, required: true },
  },
  emits: ['trigger-event'],
  setup(props, { emit }) {
    const isEditing = computed(() => {
      return false;
    });

    // Refs
    const imageRef = ref(null);
    const cropperContainer = ref(null);
    const cropperInstance = ref(null);
    const zoomLevel = ref(1);
    const imageLoaded = ref(false);
    let resizeObserver = null;

    // Get image URL from variable or direct URL
    const displayImageUrl = computed(() => {
      const variableId = props.content?.variableId;
      if (variableId) {
        try {
          const resolvedUrl = wwLib.wwVariable.getValue(variableId);
          if (resolvedUrl) return resolvedUrl;
        } catch (error) {
          console.error('Error resolving variable:', error);
        }
      }
      return props.content?.imageUrl || '';
    });

    // Internal variable for cropped image
    const { value: croppedImageUrl, setValue: setCroppedImageUrl } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: 'croppedImageUrl',
        type: 'string',
        defaultValue: '',
      });

    // --- 🔹 ヘルパー: コンポーネント幅の90%に円を合わせる
    const fitCropBoxToContainer = () => {
      if (!cropperInstance.value || !cropperContainer.value) return;

      const c = cropperInstance.value.getContainerData();
      const size = c.width * 0.9; // 直径=幅の90%
      const left = (c.width - size) / 2;
      const top = (c.height - size) / 2;

      cropperInstance.value.setCropBoxData({
        left,
        top,
        width: size,
        height: size,
      });

      // 画像が円より小さくならないように必要に応じてズーム
      const img = cropperInstance.value.getImageData();
      const canvas = cropperInstance.value.getCanvasData();
      const curRatio = canvas.width / img.naturalWidth;
      const needRatio =
        Math.max(size / img.naturalWidth, size / img.naturalHeight) * 1.02;
      if (curRatio < needRatio) cropperInstance.value.zoomTo(needRatio);
    };

    // Initialize cropper
    const onImageLoad = () => {
      if (!imageRef.value) return;
      imageLoaded.value = true;

      if (cropperInstance.value) {
        cropperInstance.value.destroy();
      }

      setTimeout(() => {
        cropperInstance.value = new Cropper(imageRef.value, {
          viewMode: 1,
          dragMode: 'move',
          aspectRatio: 1,
          autoCropArea: 1,
          restore: false,
          guides: false,
          center: true,
          cropBoxMovable: false,
          cropBoxResizable: false,
          toggleDragModeOnDblclick: false,
          ready() {
            fitCropBoxToContainer();
          },
        });
      }, 100);
    };

    // Crop the image
    const cropImage = () => {
      if (!cropperInstance.value) {
        console.warn('Cropper not initialized');
        return;
      }

      const outputSize = props.content?.cropSize || 300;
      const qualityMap = { low: 0.5, medium: 0.75, high: 0.9 };
      const quality = qualityMap[props.content?.cropQuality || 'high'] || 0.9;

      const croppedCanvas = cropperInstance.value.getCroppedCanvas({
        width: outputSize,
        height: outputSize,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });

      const circularCanvas = document.createElement('canvas');
      circularCanvas.width = outputSize;
      circularCanvas.height = outputSize;
      const ctx = circularCanvas.getContext('2d');

      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(croppedCanvas, 0, 0, outputSize, outputSize);

      const dataUrl = circularCanvas.toDataURL('image/png', quality);

      setCroppedImageUrl(dataUrl);
      emit('trigger-event', { name: 'crop', event: { value: dataUrl } });

      return dataUrl;
    };

    // Watch image URL changes
    watch(displayImageUrl, (newUrl) => {
      if (newUrl) {
        setCroppedImageUrl('');
        zoomLevel.value = 0.8;
        if (cropperInstance.value) {
          cropperInstance.value.destroy();
          cropperInstance.value = null;
        }
      }
    });

    // Clean up
    onBeforeUnmount(() => {
      if (cropperInstance.value) {
        cropperInstance.value.destroy();
        cropperInstance.value = null;
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
    });

    // Register action & resize observer
    onMounted(() => {
      if (window.wwLib) {
        window.wwLib.wwUtils.registerActionIfNotExists(
          props.uid,
          'performCrop',
          cropImage
        );
      }

      if (cropperContainer.value) {
        resizeObserver = new ResizeObserver(() => {
          fitCropBoxToContainer();
        });
        resizeObserver.observe(cropperContainer.value);
      }
    });

    return {
      imageRef,
      cropperContainer,
      displayImageUrl,
      zoomLevel,
      croppedImageUrl,
      imageLoaded,
      onImageLoad,
      cropImage,
    };
  },
};
</script>

<style lang="scss" scoped>
.circular-image-cropper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 300px;
  gap: 0px;
  padding: 16px;
  box-sizing: border-box;
  border-radius: 8px;
  overflow: hidden;

  .cropper-container {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1; /* 正方形に固定 */
    overflow: hidden;
    background-color: #f0f0f0;
    border-radius: 0;

    .cropper-image {
      display: block;
      max-width: 100%;
    }

    .no-image {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background-color: #e0e0e0;

      .no-image-message {
        font-size: 16px;
        color: #666;
      }
    }
  }

  .cropper-controls {
    padding: 12px;
    background-color: #fff;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 0px;

    .crop-button {
      padding: 10px 16px;
      background-color: #4169e1;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      text-align: center;

      &:hover {
        background-color: #3a80d2;
      }
    }
  }
}

/* Override Cropper.js styles */
:deep(.cropper-view-box) {
  outline: none;
  border-radius: 50%;
}

:deep(.cropper-face) {
  background-color: transparent;
}
</style>
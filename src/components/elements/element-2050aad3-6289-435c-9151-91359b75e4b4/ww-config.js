export default {
options: {
displayAllowedValues: ['flex', 'inline-flex'],
},
inherit: {
type: 'ww-layout',
},
editor: {
label: {
en: 'Circular Image Cropper',
},
icon: 'image',
},
properties: {
imageUrl: {
label: { en: 'Image URL' },
type: 'Text',
bindable: true,
section: 'settings',
defaultValue: '',
},
cropSize: {
label: { en: 'Crop Size (px)' },
type: 'Number',
bindable: true,
section: 'settings',
defaultValue: 300,
options: {
min: 50,
max: 1000,
step: 10
},
},
cropQuality: {
label: { en: 'Output Quality' },
type: 'TextSelect',
bindable: true,
section: 'settings',
defaultValue: 'high',
options: {
options: [
{ value: 'low', label: 'Low' },
{ value: 'medium', label: 'Medium' },
{ value: 'high', label: 'High' }
]
},
},
variableId: {
label: { en: 'Image Variable ID' },
type: 'Text',
bindable: true,
section: 'settings',
defaultValue: '7efb64a3-ec26-4d53-88dc-5cfb012ebf0f',
}
},
triggerEvents: [
{
name: 'crop',
label: { en: 'On crop' },
event: { value: '' },
description: { en: 'Triggered when the image is cropped' }
}
],
actions: [
{
action: 'performCrop',
label: { en: 'Crop image' },
description: { en: 'Crops the image and returns the data URL' }
}
]
};
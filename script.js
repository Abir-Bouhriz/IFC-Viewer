import {
  Color
} from 'three'
import { IfcViewerAPI } from 'web-ifc-viewer'

const container = document.getElementById('viewer-container')
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) })

viewer.grid.setGrid()
viewer.axes.setAxes()

let model
async function loadIfc (url) {
  model = await viewer.IFC.loadIfcUrl(url)
  await viewer.shadowDropper.renderShadow(model.modelID)
  viewer.context.renderer.postProduction.active = true
}
loadIfc('./assets/CasaRebecca5.ifc')

async function load () {
  const input = document.getElementById('file-input')

  const ifcModels = []

  input.addEventListener(
    'change',
    async () => {
      const file = input.files[0]
      const url = URL.createObjectURL(file)
      model = await viewer.IFC.loadIfcUrl(url)
      ifcModels.push(model)
      await viewer.shadowDropper.renderShadow(model.modelID)
      viewer.context.renderer.postProduction.active = true
    }
  )

  const controls = viewer.context.ifcCamera.cameraControls
  controls.setLookAt(18, 20, 18, 0, 10, 0)

  await viewer.shadowDropper.renderShadow(model.modelID)
}
load()

// Download properties in json file
const buttonExport = document.getElementById('button-export')
buttonExport.addEventListener('click',
  async function propertiesExport () {
    const properties = await viewer.IFC.properties.serializeAllProperties(model)
    const file = new File(properties, 'properties.json')
    const link = document.createElement('a')
    document.body.appendChild(link)
    link.href = URL.createObjectURL(file)
    link.download = 'properties.json'
    link.click()
    link.remove()
  }
)
// END OF download properties in json file

// Annotation/ measuring
viewer.dimensions.active = true
viewer.dimensions.previewActive = true

window.ondblclick = () => {
  viewer.dimensions.create()
}

window.onkeydown = (event) => {
  if (event.code === 'Delete') {
    viewer.dimensions.delete()
  }
}

window.addEventListener('click', async function () {
  const result = await viewer.IFC.selector.pickIfcItem()
  console.log('result', result)
  if (!result) {
    viewer.IFC.selector.unpickIfcItems()
    createPropertiesMenu(result)
  } else {
    const { modelID, id } = result
    const props = await viewer.IFC.getProperties(modelID, id, true, false)
    console.log('props: ', props)
    createPropertiesMenu(props)
  }
})

const propsGUI = document.getElementById('ifc-property-menu-root')

function createPropertiesMenu (properties) {
  removeAllChildren(propsGUI)

  delete properties.psets
  delete properties.mats
  delete properties.type

  if (properties) {
    for (const key in properties) {
      createPropertyEntry(key, properties[key])
    }
  }
}

function createPropertyEntry (key, value) {
  const propContainer = document.createElement('div')
  propContainer.classList.add('ifc-property-item')

  if (value === null || value === undefined) value = 'undefined'
  else if (value.value) value = value.value

  const keyElement = document.createElement('div')
  keyElement.textContent = key
  propContainer.appendChild(keyElement)

  const valueElement = document.createElement('div')
  valueElement.classList.add('ifc-property-value')
  valueElement.textContent = value
  propContainer.appendChild(valueElement)

  propsGUI.appendChild(propContainer)
}

function removeAllChildren (element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }
}

await viewer.IFC.applyWebIfcConfig({
  COORDINATE_TO_ORIGIN: true,
  USE_FAST_BOOLS: true
})

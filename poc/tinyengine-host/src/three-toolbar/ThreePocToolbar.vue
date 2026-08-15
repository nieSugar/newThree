<template>
  <span data-testid="tiny-three-proof">
    <toolbar-base
      content="验证 3D 常驻 Runtime"
      :icon="options.icon.default || options.icon"
      :options="options"
      @click-api="runProof"
    />
  </span>
</template>

<script>
import { onMounted, onUnmounted } from 'vue'
import { ToolbarBase } from '@opentiny/tiny-engine-common'
import { useCanvas, useMessage } from '@opentiny/tiny-engine-meta-register'

const getProof = () => {
  window.__TINY_ENGINE_THREE_POC ||= {
    toolbarMounted: false,
    runs: 0,
    commandSent: false,
    canvasReloadRequested: false,
    canvasReloadCompleted: false,
    lastInboundEvent: null,
    lastError: null
  }
  return window.__TINY_ENGINE_THREE_POC
}

export default {
  components: {
    ToolbarBase
  },
  props: {
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup() {
    const proof = getProof()
    const { publish } = useMessage()

    const onThreeEvent = (event) => {
      proof.lastInboundEvent = event.detail
      publish({ topic: 'three:poc-event', data: event.detail })
    }

    onMounted(() => {
      proof.toolbarMounted = true
      window.addEventListener('three:poc-event', onThreeEvent)
    })

    onUnmounted(() => {
      proof.toolbarMounted = false
      window.removeEventListener('three:poc-event', onThreeEvent)
    })

    const runProof = () => {
      proof.runs += 1
      proof.lastError = null

      try {
        window.__threePocBridge.command('object.highlight', { objectId: 'poc-cube' })
        proof.commandSent = true
        window.__threePocBridge.toggleWide()

        const canvasFrame = document.querySelector('iframe#canvas')
        const canvasDocument = useCanvas().canvasApi.value?.getDocument?.()

        if (!canvasFrame || !canvasDocument) {
          throw new Error('TinyEngine canvas is not ready')
        }

        canvasFrame.addEventListener(
          'load',
          () => {
            proof.canvasReloadCompleted = true
          },
          { once: true }
        )
        proof.canvasReloadRequested = true
        canvasDocument.location.reload()
      } catch (error) {
        proof.lastError = error instanceof Error ? error.message : String(error)
        throw error
      }
    }

    return {
      runProof
    }
  }
}
</script>

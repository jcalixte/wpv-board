<script setup lang="ts">
// Per-section verbatim list (C6, F5): clicking a Section/dot on the board opens
// this modal over that section's defects without leaving the board. The list is
// loaded lazily — `/api/defects?section=ID` (T6) — only when a section opens, so
// a hot section's full history isn't paid for up front.
//
// Same native <dialog> (DaisyUI `modal`) as DefectForm: Escape, focus-trap and
// backdrop come for free, and the parent-controlled `sectionId` drives open/close.
import { sections } from '~/board/definition'

interface SectionDefect {
  id: string
  sectionId: string
  projectName: string
  reporterEmail: string
  verbatim: string
  createdAt: string
}

const props = defineProps<{ sectionId: string | null }>()
const emit = defineEmits<{ close: [] }>()

const dialog = ref<HTMLDialogElement>()
const defects = ref<SectionDefect[]>([])
const loading = ref(false)

const sectionLabel = computed(
  () => sections.find((s) => s.id === props.sectionId)?.label ?? '',
)

// Lazily load the clicked section's history, bounded generously (well past the
// dot cap so the modal shows more than the map does).
async function load(sectionId: string) {
  loading.value = true
  defects.value = []
  try {
    defects.value = await $fetch<SectionDefect[]>('/api/defects', {
      query: { section: sectionId, limit: 200 },
    })
  } finally {
    loading.value = false
  }
}

// Mirror the parent-controlled section into the dialog's open state.
function sync() {
  const el = dialog.value
  if (!el) return
  if (props.sectionId !== null) {
    if (!el.open) el.showModal()
    load(props.sectionId)
  } else if (el.open) {
    el.close()
  }
}
onMounted(sync)
watch(() => props.sectionId, sync)
</script>

<template>
  <dialog ref="dialog" class="modal" @close="emit('close')">
    <div class="modal-box">
      <h3 class="text-lg font-bold">{{ sectionLabel }} — defects</h3>

      <p v-if="loading" class="mt-4 opacity-60">Loading…</p>

      <p
        v-else-if="defects.length === 0"
        class="mt-4 opacity-60"
        data-test="modal-empty"
      >
        No defects filed against this section yet.
      </p>

      <ul v-else class="mt-4 flex flex-col gap-3">
        <li
          v-for="defect in defects"
          :key="defect.id"
          class="border-base-300 flex flex-col gap-1 border-l-2 pl-3"
          data-test="modal-item"
        >
          <p class="text-sm">{{ defect.verbatim }}</p>
          <p class="flex flex-wrap gap-x-2 text-xs opacity-60">
            <span>{{ datestamp(defect.createdAt) }}</span>
            <span>· {{ defect.projectName }}</span>
            <span>· {{ defect.reporterEmail }}</span>
          </p>
        </li>
      </ul>

      <div class="modal-action">
        <button type="button" class="btn btn-ghost" @click="dialog?.close()">
          Close
        </button>
      </div>
    </div>

    <!-- Native backdrop: clicking it closes the dialog. -->
    <form method="dialog" class="modal-backdrop">
      <button aria-label="Close">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
// File a defect against a board section (C3, F2). Driven by `sectionId`: when a
// section is clicked the modal opens pre-targeted to it; pick a project, type
// what's wrong, submit. Reporter and timestamp are added server-side.
//
// Uses the native <dialog> (DaisyUI `modal`), so Escape, focus-trapping and the
// backdrop come for free; the parent-controlled `sectionId` drives open/close.
import { sections } from '~/board/definition'

interface Project {
  id: string
  name: string
}

interface Defect {
  id: string
  sectionId: string
  projectId: string
  verbatim: string
}

const props = defineProps<{ sectionId: string | null }>()
const emit = defineEmits<{ close: []; filed: [Defect] }>()

const dialog = ref<HTMLDialogElement>()
const project = ref<Project | null>(null)
const verbatim = ref('')
const busy = ref(false)
const error = ref('')

const sectionLabel = computed(
  () => sections.find((s) => s.id === props.sectionId)?.label ?? '',
)
const canSubmit = computed(
  () => project.value !== null && verbatim.value.trim().length > 0,
)

// Mirror the parent-controlled section into the dialog's open state, resetting
// the form each time a (new) section opens.
function sync() {
  const el = dialog.value
  if (!el) return
  if (props.sectionId !== null) {
    project.value = null
    verbatim.value = ''
    error.value = ''
    if (!el.open) el.showModal()
  } else if (el.open) {
    el.close()
  }
}
onMounted(sync)
watch(() => props.sectionId, sync)

async function submit() {
  if (!canSubmit.value || busy.value || !props.sectionId) return
  busy.value = true
  error.value = ''
  try {
    const defect = await $fetch<Defect>('/api/defects', {
      method: 'POST',
      body: {
        sectionId: props.sectionId,
        projectId: project.value!.id,
        verbatim: verbatim.value.trim(),
      },
    })
    emit('filed', defect)
  } catch {
    error.value = 'Could not file the defect. Please try again.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <dialog ref="dialog" class="modal" @close="emit('close')">
    <div class="modal-box">
      <h3 class="text-lg font-bold">Report a problem — {{ sectionLabel }}</h3>

      <form
        class="mt-4 flex flex-col gap-4"
        data-test="defect-form"
        @submit.prevent="submit"
      >
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Project</legend>
          <ProjectAutocomplete v-model="project" />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">What's wrong?</legend>
          <textarea
            v-model="verbatim"
            class="textarea textarea-bordered w-full"
            rows="3"
            placeholder="Describe the problem in your own words…"
            data-test="verbatim"
          />
        </fieldset>

        <p v-if="error" class="text-error text-sm" role="alert">{{ error }}</p>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="dialog?.close()">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!canSubmit || busy"
            data-test="submit"
          >
            {{ busy ? 'Filing…' : 'File defect' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Native backdrop: clicking it closes the dialog. -->
    <form method="dialog" class="modal-backdrop">
      <button aria-label="Close">close</button>
    </form>
  </dialog>
</template>

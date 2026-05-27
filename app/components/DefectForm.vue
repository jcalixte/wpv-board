<script setup lang="ts">
// File a defect against a board section (C3, F2). Driven by `sectionId`: when a
// section is clicked the modal opens pre-targeted to it; pick a project, type
// what's wrong, submit. Reporter and timestamp are added server-side.
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

// Each time a (new) section opens, start from a clean form.
watch(
  () => props.sectionId,
  () => {
    project.value = null
    verbatim.value = ''
    error.value = ''
  },
)

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
  <dialog class="modal" :class="{ 'modal-open': sectionId !== null }">
    <div class="modal-box">
      <h3 class="text-lg font-bold">Report a problem — {{ sectionLabel }}</h3>

      <form class="mt-4 flex flex-col gap-4" @submit.prevent="submit">
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
          <button type="button" class="btn btn-ghost" @click="emit('close')">
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

    <!-- Click the backdrop to dismiss. -->
    <button
      type="button"
      class="modal-backdrop"
      aria-label="Close"
      @click="emit('close')"
    />
  </dialog>
</template>

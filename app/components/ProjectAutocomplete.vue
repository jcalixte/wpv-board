<script setup lang="ts">
// Creatable autocomplete over the shared global project list (C4, F3): pick an
// existing project or persist a new one inline, deduped case-insensitively.
interface Project {
  id: string
  name: string
}

const props = defineProps<{ modelValue?: Project | null }>()
const emit = defineEmits<{ 'update:modelValue': [Project | null] }>()

const projects = ref<Project[]>([])
const query = ref(props.modelValue?.name ?? '')
const open = ref(false)
const busy = ref(false)

onMounted(async () => {
  projects.value = await $fetch<Project[]>('/api/projects')
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return projects.value
  return projects.value.filter((p) => p.name.toLowerCase().includes(q))
})

// Case-insensitive: typing "acme" when "Acme" exists is not a new project.
const exactMatch = computed(() => {
  const q = query.value.trim().toLowerCase()
  return projects.value.find((p) => p.name.toLowerCase() === q)
})

const canCreate = computed(() => query.value.trim().length > 0 && !exactMatch.value)

function select(project: Project) {
  query.value = project.name
  open.value = false
  emit('update:modelValue', project)
}

async function create() {
  const name = query.value.trim()
  if (!name || busy.value) return
  busy.value = true
  try {
    const project = await $fetch<Project>('/api/projects', {
      method: 'POST',
      body: { name },
    })
    if (!projects.value.some((p) => p.id === project.id)) {
      projects.value.push(project)
    }
    select(project)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="project-autocomplete">
    <input
      v-model="query"
      type="text"
      class="input"
      data-test="project-input"
      placeholder="Project…"
      autocomplete="off"
      @focus="open = true"
      @input="open = true"
    >
    <ul v-if="open && (filtered.length || canCreate)" class="options">
      <li v-for="project in filtered" :key="project.id">
        <button
          type="button"
          class="option"
          data-test="project-option"
          :data-project-id="project.id"
          @click="select(project)"
        >
          {{ project.name }}
        </button>
      </li>
      <li v-if="canCreate">
        <button
          type="button"
          class="option option--create"
          data-test="project-create"
          :disabled="busy"
          @click="create"
        >
          + Create “{{ query.trim() }}”
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.project-autocomplete {
  position: relative;
  font-family: 'Cutive Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.input {
  width: 100%;
  border: 1px dashed currentColor;
  background: transparent;
  font: inherit;
  padding: 0.4rem 0.5rem;
  box-sizing: border-box;
}

.options {
  position: absolute;
  z-index: 1;
  left: 0;
  right: 0;
  margin: 0.25rem 0 0;
  padding: 0;
  list-style: none;
  border: 1px solid currentColor;
  background: var(--surface, #fff);
  max-height: 12rem;
  overflow-y: auto;
}

.option {
  display: block;
  width: 100%;
  border: 0;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  padding: 0.4rem 0.5rem;
}

.option:hover,
.option:focus {
  outline: 1px solid currentColor;
}

.option--create {
  opacity: 0.85;
  font-style: italic;
}
</style>

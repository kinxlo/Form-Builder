<script setup lang="ts">
import { ref, computed } from 'vue'
import { CalendarIcon, ChevronDown, Upload, X } from 'lucide-vue-next'
import { format, subYears } from 'date-fns'
import { cn } from '../../lib/utils'
import type { FormFieldConfig, SelectOption } from '~/lib/types/form-schema'

interface Props {
  config: FormFieldConfig
  modelValue: string | File | null
  error?: string
  isRequired: boolean
  dependentOptions?: SelectOption[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string | File | null]
}>()

const { name, label, placeholder, inputType, validation, options, dependsOn } =
  props.config

// Vue template type-checking can fail to resolve global `File` in some setups.
// Use `globalThis.File` via a local ref + a type guard for reliable narrowing.
const FileCtor = (globalThis as unknown as { File?: typeof File }).File

function isFile(value: unknown): value is File {
  return Boolean(FileCtor) && value instanceof (FileCtor as typeof File)
}

const fileValue = computed(() => {
  return isFile(props.modelValue) ? props.modelValue : null
})

// For date picker
const dateOpen = ref(false)

// For file input
const fileInputRef = ref<HTMLInputElement | null>(null)

// Computed selected date for date picker
const selectedDate = computed(() => {
  if (props.modelValue && typeof props.modelValue === 'string') {
    return new Date(props.modelValue)
  }
  return undefined
})

// Calculate max date based on minAge for date picker
const maxDate = computed(() => {
  return validation.minAge ? subYears(new Date(), validation.minAge) : undefined
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null
  emit('update:modelValue', file)
}

function handleRemoveFile() {
  emit('update:modelValue', null)
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function handleDateSelect(date: Date | undefined) {
  if (date) {
    emit('update:modelValue', format(date, 'yyyy-MM-dd'))
    dateOpen.value = false
  }
}

function handleSelectChange(value: string) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="space-y-2">
    <label
      :for="name"
      :class="
        cn(
          'text-sm font-bold leading-none text-slate-900 dark:text-slate-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        )
      "
    >
      <span class="inline-flex items-center gap-1">
        <span>{{ label }}</span>
        <span
          v-if="isRequired"
          class="text-destructive font-semibold"
          aria-hidden="true"
          >*</span
        >
      </span>
    </label>

    <!-- Text, Tel, Number inputs -->
    <input
      v-if="
        inputType === 'text' || inputType === 'tel' || inputType === 'number'
      "
      :id="name"
      :name="name"
      :type="inputType"
      :placeholder="placeholder"
      :value="(modelValue as string) || ''"
      @input="handleInput"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${name}-error` : undefined"
      :class="
        cn(
          'mt-2 flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-slate-900 dark:text-slate-100 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          error && 'border-destructive',
        )
      "
    />

    <!-- Date Picker -->
    <div v-else-if="inputType === 'date'" class="relative">
      <button
        :id="name"
        type="button"
        @click="dateOpen = !dateOpen"
        :class="
          cn(
            'mt-2 flex h-12 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            modelValue
              ? 'text-slate-900 dark:text-slate-100'
              : 'text-slate-500 dark:text-slate-400',
            error && 'border-destructive',
          )
        "
        :aria-invalid="!!error"
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        <span v-if="modelValue">{{
          format(new Date(modelValue as string), 'PPP')
        }}</span>
        <span v-else>{{ placeholder || 'Pick a date' }}</span>
      </button>

      <!-- Simple date picker popover -->
      <div
        v-if="dateOpen"
        class="absolute z-50 mt-1 rounded-md border bg-popover p-4 text-popover-foreground shadow-md"
      >
        <input
          type="date"
          :value="(modelValue as string) || ''"
          :max="maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined"
          @change="
            (e) =>
              handleDateSelect(new Date((e.target as HTMLInputElement).value))
          "
          class="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2"
        />
      </div>
    </div>

    <!-- File Upload -->
    <div v-else-if="inputType === 'file'" class="space-y-2">
      <div
        :class="
          cn(
            'border border-dashed rounded-lg p-6 text-center transition-colors',
            'hover:border-primary/50 hover:bg-muted/50',
            error && 'border-destructive',
            modelValue && 'border-primary bg-primary/5',
          )
        "
      >
        <div v-if="fileValue" class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <Upload class="h-4 w-4 shrink-0 text-primary" />
            <span class="text-sm truncate">{{ fileValue.name }}</span>
            <span class="text-xs text-muted-foreground shrink-0">
              ({{ (fileValue.size / 1024).toFixed(1) }} KB)
            </span>
          </div>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-8 w-8 shrink-0"
            @click="handleRemoveFile"
          >
            <X class="h-4 w-4" />
            <span class="sr-only">Remove file</span>
          </button>
        </div>
        <label
          v-else
          :for="name"
          class="cursor-pointer flex flex-col items-center gap-2"
        >
          <Upload class="h-8 w-8 text-muted-foreground" />
          <span class="text-sm text-muted-foreground">
            {{ placeholder || 'Click to upload or drag and drop' }}
          </span>
          <span v-if="validation.accept" class="text-xs text-muted-foreground">
            Accepted formats: {{ validation.accept }}
          </span>
        </label>
        <input
          ref="fileInputRef"
          :id="name"
          :name="name"
          type="file"
          :accept="validation.accept || undefined"
          @change="handleFileChange"
          class="sr-only"
          :aria-invalid="!!error"
        />
      </div>
    </div>

    <!-- Select/Dropdown -->
    <div v-else-if="inputType === 'array'">
      <template
        v-if="dependsOn && (!dependentOptions || dependentOptions.length === 0)"
      >
        <button
          :id="name"
          type="button"
          disabled
          class="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        >
          <span class="text-muted-foreground"
            >Select parent field first...</span
          >
        </button>
      </template>
      <template v-else>
        <div class="relative mt-2">
          <select
            :id="name"
            :value="(modelValue as string) || ''"
            @change="
              (e) => handleSelectChange((e.target as HTMLSelectElement).value)
            "
            :class="
              cn(
                'flex h-12 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-10 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                modelValue
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 dark:text-slate-400',
                error && 'border-destructive',
              )
            "
            :aria-invalid="!!error"
          >
            <option value="" disabled>
              {{ placeholder || 'Select an option...' }}
            </option>
            <option
              v-for="option in dependsOn ? dependentOptions : options"
              :key="String(option.value)"
              :value="String(option.value)"
            >
              {{ option.label }}
            </option>
          </select>

          <!-- Custom chevron for consistent padding/alignment across browsers -->
          <ChevronDown
            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
          />
        </div>
      </template>
    </div>

    <!-- Default fallback -->
    <input
      v-else
      :id="name"
      :name="name"
      type="text"
      :placeholder="placeholder"
      :value="(modelValue as string) || ''"
      @input="handleInput"
      :aria-invalid="!!error"
      :class="
        cn(
          'flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-slate-900 dark:text-slate-100 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          error && 'border-destructive',
        )
      "
    />

    <p v-if="error" :id="`${name}-error`" class="text-sm text-destructive">
      {{ error }}
    </p>
  </div>
</template>

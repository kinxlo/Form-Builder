<script setup lang="ts">
import { ref, computed } from 'vue'
import { CalendarIcon, Upload, X } from 'lucide-vue-next'
import { parseDate, type DateValue } from '@internationalized/date'
import { format, subYears } from 'date-fns'
import { cn } from '~/lib/utils'
import type { FormFieldConfig, SelectOption } from '~/lib/form-builder/types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Calendar } from '../ui/calendar'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

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

const stringValue = computed(() =>
  typeof props.modelValue === 'string' ? props.modelValue : '',
)

// DateValue for Calendar (reka-ui)
const selectedDateValue = computed<DateValue | undefined>(() => {
  if (!stringValue.value) return undefined
  try {
    return parseDate(stringValue.value)
  } catch {
    return undefined
  }
})

// Calculate max date based on minAge for date picker
const maxDateValue = computed<DateValue | undefined>(() => {
  if (!validation.minAge) return undefined
  const maxDate = subYears(new Date(), validation.minAge)
  return parseDate(format(maxDate, 'yyyy-MM-dd'))
})

// If the schema doesn't provide a minimum date, keep it permissive but valid.
// This prevents some calendar implementations from treating all dates as unavailable.
const minDateValue = computed<DateValue>(() => {
  // ~120 years ago as a reasonable default
  const minDate = subYears(new Date(), 120)
  return parseDate(format(minDate, 'yyyy-MM-dd'))
})

const minDateString = computed(() => minDateValue.value.toString())
const maxDateString = computed(() => maxDateValue.value?.toString())

// Use a v-model adapter so the calendar selection reliably updates.
function commitDate(value: DateValue | undefined, opts?: { close?: boolean }) {
  if (!value) return
  emit('update:modelValue', value.toString())
  if (opts?.close) dateOpen.value = false
}

const dateModel = computed<DateValue | undefined>({
  get: () => selectedDateValue.value,
  // Calendar selection should close the popover.
  set: (value) => commitDate(value, { close: true }),
})

function handleDateInputChange(value: string | number) {
  const raw = String(value)
  if (!raw) {
    emit('update:modelValue', null)
    return
  }

  // While typing/selecting in the native <input type="date">, do NOT close the popover.
  try {
    commitDate(parseDate(raw), { close: false })
  } catch {
    // ignore invalid / partial input
  }
}

function handleTextValueChange(value: string | number) {
  emit('update:modelValue', String(value))
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

function handleDateSelect(value: DateValue | undefined) {
  // Used by non-v-model code paths (kept for readability).
  commitDate(value, { close: true })
}

function handleSelectChange(value: unknown) {
  if (value === null || value === undefined) {
    emit('update:modelValue', null)
    return
  }
  emit('update:modelValue', String(value))
}
</script>

<template>
  <div class="space-y-2">
    <Label
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
    </Label>

    <!-- Text, Tel, Number inputs -->
    <Input
      v-if="
        inputType === 'text' || inputType === 'tel' || inputType === 'number'
      "
      :id="name"
      :name="name"
      :type="inputType"
      :placeholder="placeholder"
      :model-value="stringValue"
      @update:model-value="handleTextValueChange"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${name}-error` : undefined"
      :class="
        cn(
          'mt-2 h-12 text-base px-3 py-2 shadow-none',
          error && 'border-destructive',
        )
      "
    />

    <!-- Date Picker -->
    <div v-else-if="inputType === 'date'" class="relative">
      <Popover v-model:open="dateOpen">
        <PopoverTrigger as-child>
          <Button
            :id="name"
            type="button"
            variant="outline"
            :class="
              cn(
                'mt-2 h-12 w-full justify-start px-3 text-base font-normal shadow-none',
                !stringValue && 'text-slate-500 dark:text-slate-400',
                error && 'border-destructive',
              )
            "
            :aria-invalid="!!error"
          >
            <CalendarIcon class="mr-2 h-4 w-4" />
            <span v-if="stringValue">{{
              format(new Date(stringValue), 'PPP')
            }}</span>
            <span v-else>{{ placeholder || 'Pick a date' }}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent class="w-auto p-0" align="start">
          <div class="border-b bg-muted/20 p-3">
            <div class="grid gap-2">
              <Input
                :id="`${name}-date-input`"
                type="date"
                :model-value="stringValue"
                @update:model-value="handleDateInputChange"
                @keydown.enter="dateOpen = false"
                :min="minDateString"
                :max="maxDateString"
                class="h-10"
              />
              <p class="text-[11px] text-muted-foreground">
                Range:
                <code>{{ minDateString }}</code>
                <span v-if="maxDateString">
                  → <code>{{ maxDateString }}</code></span
                >
              </p>
            </div>
          </div>
          <Calendar
            v-model="dateModel as any"
            :min-value="minDateValue as any"
            :max-value="maxDateValue as any"
          />
        </PopoverContent>
      </Popover>
    </div>

    <!-- File Upload -->
    <div v-else-if="inputType === 'file'" class="space-y-2">
      <div
        :class="
          cn(
            'border border-dashed rounded-lg p-6 text-center transition-colors',
            'hover:border-primary/50 hover:bg-primary/5',
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
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            class="shrink-0"
            @click="handleRemoveFile"
          >
            <X class="h-4 w-4" />
            <span class="sr-only">Remove file</span>
          </Button>
        </div>
        <label
          v-else
          :for="name"
          class="cursor-pointer flex flex-col items-center gap-2"
        >
          <Upload class="h-8 w-8 text-primary" />
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
        <Button
          :id="name"
          type="button"
          disabled
          variant="outline"
          class="mt-2 h-12 w-full justify-between text-base"
        >
          <span class="text-muted-foreground"
            >Select parent field first...</span
          >
        </Button>
      </template>
      <template v-else>
        <Select
          :model-value="stringValue || ''"
          @update:model-value="handleSelectChange"
        >
          <SelectTrigger
            class="mt-2 h-12! w-full shadow-none"
            :class="cn(error && 'border-destructive')"
            :aria-invalid="!!error"
          >
            <SelectValue :placeholder="placeholder || 'Select an option...'" />
          </SelectTrigger>
          <SelectContent class="shadow-none">
            <SelectGroup>
              <SelectItem
                v-for="option in dependsOn ? dependentOptions : options"
                :key="String(option.value)"
                :value="String(option.value)"
                class="hover:bg-primary/40! hover:text-white!"
              >
                {{ option.label }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </template>
    </div>

    <!-- Default fallback -->
    <Input
      v-else
      :id="name"
      :name="name"
      type="text"
      :placeholder="placeholder"
      :model-value="stringValue"
      @update:model-value="handleTextValueChange"
      :aria-invalid="!!error"
      :class="cn('h-12 text-base px-3 py-2', error && 'border-destructive')"
    />

    <p v-if="error" :id="`${name}-error`" class="text-sm text-destructive">
      {{ error }}
    </p>
  </div>
</template>

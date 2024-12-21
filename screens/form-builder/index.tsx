'use client'

import EmptyListSvg from '@/assets/oc-thinking.svg'
import SpecialComponentsNotice from '@/components/playground/special-component-notice'
import { Button } from '@/components/ui/button'
import If from '@/components/ui/if'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { defaultFieldConfig } from '@/constants'
import { useMediaQuery } from '@/hooks/use-media-query'
import { EditFieldDialog } from '@/screens/edit-field-dialog'
import { FieldSelector } from '@/screens/field-selector'
import { FormFieldList } from '@/screens/form-field-list'
import { FormPreview } from '@/screens/form-preview'
import { FormFieldType } from '@/types'
import Editor from '@monaco-editor/react'
import axios from 'axios'
import { useState } from 'react'

export type FormFieldOrGroup = FormFieldType | FormFieldType[]

// const initFieldsWithActions = initFields.map((field) => {
//   return {
//     ...field,
//     onChange: () => {},
//     onSelect: () => {},
//     setValue: () => {},
//   }
// })

export default function FormBuilder() {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const [formFields, setFormFields] = useState<FormFieldOrGroup[]>([])
  const [selectedField, setSelectedField] = useState<FormFieldType | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [interfaceCode, setInterfaceCode] = useState<string>('')

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isError, setIsError] = useState<boolean>(false)

  const addFormField = (variant: string, index: number) => {
    const newFieldName = `name_${Math.random().toString().slice(-10)}`

    const { label, description, placeholder } = defaultFieldConfig[variant] || {
      label: '',
      description: '',
      placeholder: '',
    }

    const newField: FormFieldType = {
      checked: true,
      description: description || '',
      disabled: false,
      label: label || newFieldName,
      name: newFieldName,
      placeholder: placeholder || 'Placeholder',
      required: true,
      rowIndex: index,
      onChange: () => {},
      onSelect: () => {},
      setValue: () => {},
      type: '',
      value: '',
      variant,
    }
    setFormFields([...formFields, newField])
  }

  const findFieldPath = (
    fields: FormFieldOrGroup[],
    name: string,
  ): number[] | null => {
    const search = (
      currentFields: FormFieldOrGroup[],
      currentPath: number[],
    ): number[] | null => {
      for (let i = 0; i < currentFields.length; i++) {
        const field = currentFields[i]
        if (Array.isArray(field)) {
          const result = search(field, [...currentPath, i])
          if (result) return result
        } else if (field.name === name) {
          return [...currentPath, i]
        }
      }
      return null
    }
    return search(fields, [])
  }

  const updateFormField = (path: number[], updates: Partial<FormFieldType>) => {
    const updatedFields = JSON.parse(JSON.stringify(formFields)) // Deep clone
    let current: any = updatedFields
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }
    current[path[path.length - 1]] = {
      ...current[path[path.length - 1]],
      ...updates,
    }
    setFormFields(updatedFields)
  }

  const openEditDialog = (field: FormFieldType) => {
    setSelectedField(field)
    setIsDialogOpen(true)
  }

  const handleSaveField = (updatedField: FormFieldType) => {
    if (selectedField) {
      const path = findFieldPath(formFields, selectedField.name)
      if (path) {
        updateFormField(path, updatedField)
      }
    }
    setIsDialogOpen(false)
  }

  const FieldSelectorWithSeparator = ({
    addFormField,
  }: {
    addFormField: (variant: string, index?: number) => void
  }) => (
    <div className="flex flex-col md:flex-row gap-3">
      <FieldSelector addFormField={addFormField} />
      <Separator orientation={isDesktop ? 'vertical' : 'horizontal'} />
    </div>
  )

  const handleGenerateFields = async () => {
    // const startIndex = interfaceCode.indexOf('{');
    // const endIndex = interfaceCode.lastIndexOf('}') + 1;
    // const extractedCode = interfaceCode.substring(startIndex, endIndex);
    try {
      console.log(interfaceCode)
      setIsLoading(true)
      const response = await axios.post('/api/genform', {
        interfaceDefinition: interfaceCode,
      })
      setIsLoading(false)
      setFormFields(response.data)
    } catch (error) {
      setIsLoading(false)
      setIsError(true)
      console.error('Error generating form fields:', error)
    }
  }

  return (
    <section className="md:max-h-screen space-y-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <Label>Paste your TypeScript interface here</Label>
        <Editor
          height="20vh"
          defaultLanguage="typescript"
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
          }}
          onChange={(value: string | undefined) =>
            setInterfaceCode(value || '')
          }
        />
        <Button
          type="button"
          onClick={handleGenerateFields}
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate Form Fields'}
        </Button>
        {isError && (
          <p className="text-red-500">Error generating form fields</p>
        )}
      </div>
      <If
        condition={formFields.length > 0}
        render={() => (
          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-8 md:px-5 h-full">
            <div className="w-full h-full col-span-1 md:space-x-3 md:max-h-[75vh] flex flex-col md:flex-row ">
              <FieldSelectorWithSeparator
                addFormField={(variant: string, index: number = 0) =>
                  addFormField(variant, index)
                }
              />
              <div className="overflow-y-auto flex-1 ">
                <FormFieldList
                  formFields={formFields}
                  setFormFields={setFormFields}
                  updateFormField={updateFormField}
                  openEditDialog={openEditDialog}
                />
              </div>
            </div>
            <div className="col-span-1 w-full h-full space-y-3">
              <SpecialComponentsNotice formFields={formFields} />
              <FormPreview formFields={formFields} />
            </div>
          </div>
        )}
        otherwise={() => (
          <div className="flex flex-col md:flex-row items-center gap-3 md:px-5">
            <FieldSelectorWithSeparator
              addFormField={(variant: string, index: number = 0) =>
                addFormField(variant, index)
              }
            />
            <EmptyListSvg className="mx-auto" />
          </div>
        )}
      />
      <EditFieldDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        field={selectedField}
        onSave={handleSaveField}
      />
    </section>
  )
}

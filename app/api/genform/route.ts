// pages/api/generateFields.ts
import OpenAI from 'openai'

// Define the structure of a form field
type FormFieldType = {
  type: string
  variant: string
  name: string
  label: string
  placeholder?: string
  description?: string
  disabled: boolean
  value: string | boolean | Date | number | string[]
  setValue: (value: string | boolean) => void
  checked: boolean
  onChange: (
    value: string | string[] | boolean | Date | number | number[],
  ) => void
  onSelect: (
    value: string | string[] | boolean | Date | number | number[],
  ) => void
  rowIndex: number
  required?: boolean
  min?: number
  max?: number
  step?: number
  locale?: any
  hour12?: boolean
  className?: string
}

// Variants for the form field
const variants = [
  'Checkbox',
  'Combobox',
  'Date Picker',
  'Datetime Picker',
  'File Input',
  'Input',
  'Input OTP',
  'Location Input',
  'Multi Select',
  'Select',
  'Slider',
  'Signature Input',
  'Smart Datetime Input',
  'Switch',
  'Tags Input',
  'Textarea',
  'Password',
  'Phone',
]

export const POST = async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const body = await req.json()

  const { interfaceDefinition }: { interfaceDefinition: Record<string, any> } =
    body

  if (!interfaceDefinition) {
    return Response.json(
      { error: 'Invalid input. Provide a TypeScript interface object.' },
      { status: 400 },
    )
  }

  // Configure OpenAI API
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const prompt = `
Generate form fields for the following TypeScript interface. For each field, include the following properties:
- name: Field name
- type: Data type or input type (e.g., string, number)
- label: A user-friendly label
- placeholder: A placeholder for the field
- description: ''
- variant: One of ${variants.join(', ')}. Pick the most appropriate one.
- required: Whether the field is mandatory (based on whether the field is optional in the interface)
- disabled: Set to false by default
- checked: Set to false for checkable inputs
- value: A default value

Input interface:
${JSON.stringify(interfaceDefinition, null, 2)}

For each field, return an object like this example:
{
  "name": "username",
  "type": "text",
  "variant": "Input",
  "label": "Username",
  "placeholder": "Enter your username",
  "description": "This is your unique username",
  "required": true,
  "disabled": false,
  "checked": false,
  "value": ""
}

Do not include any extra text or even backticks, only return an array of JSON objects, one for each field.
`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500, // Adjust based on the expected size of the response
    })

    // Parse the response
    const fields = JSON.parse(completion.choices[0].message.content || '[]')

    const processedFields = fields.map((field: any, index: number) => ({
      ...field,
      rowIndex: index,
      setValue: () => {},
      onChange: () => {},
      onSelect: () => {},
    }))

    return Response.json(processedFields, { status: 200 })
  } catch (error) {
    console.error('Error generating fields:', error)
    return Response.json(
      { error: 'Failed to generate fields' },
      { status: 500 },
    )
  }
}

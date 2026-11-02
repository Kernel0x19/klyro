import PropertiesPanelClient from './properties-panel/PropertiesPanelClient'

type PinState = 'HIGH' | 'LOW' | 'X' | 'Z'

interface Pin {
  number: number
  label: string
  function: string
  state: PinState
}

interface SelectedIC {
  part: string
  name: string
  package: string
  family: string
  delay: number
  datasheetUrl?: string
  pins: Pin[]
}

interface Props {
  selected?: SelectedIC | null
  onRemove?: () => void
  onDuplicate?: () => void
}

export default function PropertiesPanel({
  selected,
  onRemove,
  onDuplicate,
}: Props) {
  return <PropertiesPanelClient />
}

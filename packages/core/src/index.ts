// Klyro — Core Engine
// Public API surface for @dls/core

// Contracts
export * from './contracts/Signal'
export * from './contracts/Circuit'
export * from './contracts/Component'

// Engine
export * from './engine/EventScheduler'
export * from './engine/NetlistCompiler'

// Registry
export { componentRegistry } from './components/registry/ComponentRegistry'
export type { KlyroComponentRegistry } from './components/registry/ComponentRegistry'
export { registerAllComponents } from './components/registry/registerAllComponents'

// Bus
export { eventBus } from './bus/EventBus'
export type { KlyroEventBus } from './bus/EventBus'
export type { KlyroBusEvents, BusEventName, BusEventPayload } from './bus/EventTypes'
import { createContext, useContext } from 'react'

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export const RoutingContext = createContext<BoundingBox[]>([])
export const useObstacles = () => useContext(RoutingContext)

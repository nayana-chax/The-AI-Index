export type Tool = {
  name: string
  category: string
  tagline: string
  users: string
  rating: number
  pricing: string
  icPick: boolean
  url: string
  description: string
}

import { researchTools } from "./tools/research"
import { writingTools } from "./tools/writing"
import { designTools } from "./tools/design"
import { buildingTools } from "./tools/building"
import { productivityTools } from "./tools/productivity"
import { agentsTools } from "./tools/agents"
import { marketingTools } from "./tools/marketing"
import { videoaudioTools } from "./tools/video-audio"

export const tools: Tool[] = [
  ...researchTools,
  ...writingTools,
  ...designTools,
  ...buildingTools,
  ...productivityTools,
  ...agentsTools,
  ...marketingTools,
  ...videoaudioTools,
]

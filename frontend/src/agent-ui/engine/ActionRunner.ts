/**
 * ActionRunner — handle user gestures on a rendered UI Schema.
 *
 *  - agent_call=false → noop (caller updates local state directly via filters/sort)
 *  - agent_call=true  → confirm (if any) → bubble up to Chat.vue via callback
 *                       which will POST [UI_ACTION] tool=... params=... to /messages
 */
import { ElMessageBox } from 'element-plus'
import type { ActionDef, UIMessage } from '../types/schema'
import { buildActionParams } from './SchemaParser'

export type AgentCall = (text: string) => Promise<void> | void

export interface RunActionOpts {
  schema: UIMessage
  action: ActionDef
  ctx?: { index?: number; row?: any; form?: Record<string, any> }
  onAgentCall: AgentCall
}

export async function runAction(opts: RunActionOpts): Promise<void> {
  const { schema, action, ctx = {}, onAgentCall } = opts

  if (action.confirm) {
    try {
      await ElMessageBox.confirm(action.confirm, '确认', {
        type: 'warning',
        confirmButtonText: action.label || '确认',
        cancelButtonText: '取消',
      })
    } catch {
      return
    }
  }

  if (!action.agent_call) {
    // Local-only action. Caller is expected to mutate state directly.
    return
  }

  if (!action.tool) {
    console.warn('[ui-action] agent_call=true but no tool specified', action)
    return
  }
  const params = buildActionParams(schema, action, ctx)
  // Wire format: a single user-message that the backend recognises and routes
  // directly to the tool, skipping LLM. See chat.py [UI_ACTION] handler.
  const text = `[UI_ACTION] tool=${action.tool} params=${JSON.stringify(params ?? {})}`
  await onAgentCall(text)
}

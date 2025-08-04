import { DetermineAction, Incident } from "@prisma/client";
import {
  MappedIncidents,
  RecommendedActionResponse,
} from "../ezra-chat/ezra.types";

export class IncidentMapper {
  static mapIncidents(incident: Incident): MappedIncidents {
    return {
      createdAt: incident.createdAt,
      id: incident.id,
      description: incident.description,
      title: incident.title,
      priority: incident.priority,
    };
  }

  static mapRecommendedAction(
    actions?: RecommendedActionResponse["action"]
  ): DetermineAction[] {
    const mappedAction: Record<
      RecommendedActionResponse["action"][number],
      DetermineAction
    > = {
      lock_account: DetermineAction.LOCK_ACCOUNT,
      notify_analyst: DetermineAction.NOTIFY_ANALYST,
      quarantine: DetermineAction.QUARANTINE,
      terminate_session: DetermineAction.TERMINATE_SESSION,
    };

    return actions?.map((action) => mappedAction[action]) || [];
  }
}
